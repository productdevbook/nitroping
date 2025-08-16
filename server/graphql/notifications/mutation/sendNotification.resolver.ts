import { eq, inArray } from 'drizzle-orm'

export const notificationMutations = defineMutation({
  sendNotification: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
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
          status: input.scheduledAt ? 'scheduled' : 'pending',
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          totalTargets: 0, // Will be calculated
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          totalClicked: 0,
        })
        .returning()

      // Get target devices
      let targetDevices = []

      if (input.targetDevices && input.targetDevices.length > 0) {
        // Specific devices
        targetDevices = await db
          .select()
          .from(tables.device)
          .where(inArray(tables.device.token, input.targetDevices))
      }
      else {
        // All devices for app (optionally filtered by platform)
        let query = db
          .select()
          .from(tables.device)
          .where(eq(tables.device.appId, input.appId))

        if (input.platforms && input.platforms.length > 0) {
          query = query.where(inArray(tables.device.platform, input.platforms.map(p => p.toLowerCase())))
        }

        targetDevices = await query
      }

      // Update notification with target count
      await db
        .update(tables.notification)
        .set({ totalTargets: targetDevices.length })
        .where(eq(tables.notification.id, newNotification[0].id))

      // TODO: Queue notification for sending

      return {
        ...newNotification[0],
        totalTargets: targetDevices.length,
      }
    },
  },
})
