import { and, count, eq, inArray } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/utils/define'

export const scheduleNotificationMutation = defineMutation({
  scheduleNotification: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      // Ensure scheduledAt is provided for scheduled notifications
      if (!input.scheduledAt) {
        throw createError({
          statusCode: 400,
          message: 'scheduledAt is required for scheduled notifications',
        })
      }

      // Create notification record
      const newNotification = await db
        .insert(tables.notification)
        .values({
          appId: input.appId,
          title: input.title,
          body: input.body,
          data: input.data,
          imageUrl: input.imageUrl,
          clickAction: input.clickAction,
          sound: input.sound,
          badge: input.badge,
          status: 'SCHEDULED',
          scheduledAt: new Date(input.scheduledAt).toISOString(),
          totalTargets: 0, // Will be calculated
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          totalClicked: 0,
        })
        .returning()

      // Get target devices count for statistics
      let targetDevicesCount = 0

      if (input.targetDevices && input.targetDevices.length > 0) {
        // Specific devices
        const devices = await db
          .select({ count: count() })
          .from(tables.device)
          .where(inArray(tables.device.token, input.targetDevices))
        targetDevicesCount = devices.length
      }
      else {
        // All devices for app (optionally filtered by platform)
        const whereConditions = [eq(tables.device.appId, input.appId)]

        if (input.platforms && input.platforms.length > 0) {
          whereConditions.push(inArray(tables.device.platform, input.platforms.map((p: string) => p.toLowerCase())))
        }

        const devices = await db
          .select({ count: count() })
          .from(tables.device)
          .where(and(...whereConditions))

        targetDevicesCount = devices.length
      }

      // Update notification with target count
      await db
        .update(tables.notification)
        .set({ totalTargets: targetDevicesCount })
        .where(eq(tables.notification.id, newNotification[0].id))

      return {
        ...newNotification[0],
        totalTargets: targetDevicesCount,
      }
    },
  },
})
