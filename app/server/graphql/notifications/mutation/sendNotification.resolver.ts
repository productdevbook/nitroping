import { addSendNotificationJob } from '#server/queues/notification.queue'
import { and, eq, inArray } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'

export const notificationMutations = defineMutation({
  sendNotification: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      // Create notification record immediately so the caller has an ID to track
      const [insertedNotification] = await db
        .insert(tables.notification)
        .values({
          appId: input.appId as string,
          title: input.title as string,
          body: input.body as string,
          data: input.data as any,
          imageUrl: input.imageUrl as string | undefined,
          clickAction: input.clickAction as string | undefined,
          sound: input.sound as string | undefined,
          badge: input.badge as number | undefined,
          status: (input.scheduledAt ? 'SCHEDULED' : 'PENDING') as 'SCHEDULED' | 'PENDING',
          scheduledAt: input.scheduledAt as string | undefined,
          totalTargets: 0,
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          totalClicked: 0,
        })
        .returning()

      if (!insertedNotification) {
        throw new Error('Failed to create notification record')
      }

      // Scheduled notifications are handled by the scheduler plugin
      if (input.scheduledAt) {
        return insertedNotification
      }

      // Resolve target devices
      let targetDevices: Array<{ id: string, appId: string, token: string, platform: string, webPushP256dh: string | null, webPushAuth: string | null }>

      if (input.targetDevices && (input.targetDevices as string[]).length > 0) {
        targetDevices = await db
          .select()
          .from(tables.device)
          .where(inArray(tables.device.token, input.targetDevices as string[]))
      }
      else {
        const conditions = [eq(tables.device.appId, input.appId as string)]

        if (input.platforms && (input.platforms as string[]).length > 0) {
          conditions.push(inArray(tables.device.platform, input.platforms as any))
        }

        targetDevices = await db
          .select()
          .from(tables.device)
          .where(and(...conditions))
      }

      // Update target count before queuing
      await db
        .update(tables.notification)
        .set({ totalTargets: targetDevices.length })
        .where(eq(tables.notification.id, insertedNotification.id))

      // Enqueue one job per device – the worker handles actual delivery,
      // retries, and stat updates asynchronously
      await Promise.all(
        targetDevices.map(device =>
          addSendNotificationJob({
            notificationId: insertedNotification.id,
            deviceId: device.id,
            appId: input.appId as string,
            platform: device.platform.toLowerCase() as 'ios' | 'android' | 'web',
            token: device.token,
            webPushP256dh: device.webPushP256dh ?? undefined,
            webPushAuth: device.webPushAuth ?? undefined,
            payload: {
              title: input.title as string,
              body: input.body as string,
              data: input.data as Record<string, any> | undefined,
              badge: input.badge as number | undefined,
              sound: input.sound as string | undefined,
              clickAction: input.clickAction as string | undefined,
              imageUrl: input.imageUrl as string | undefined,
            },
          }),
        ),
      )

      return {
        ...insertedNotification,
        totalTargets: targetDevices.length,
      }
    },
  },
})
