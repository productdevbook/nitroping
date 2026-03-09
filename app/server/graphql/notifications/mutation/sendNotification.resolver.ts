import type { ChannelType } from '#server/database/schema/enums'
import * as tables from '#server/database/schema'
import { addFanoutNotificationJob } from '#server/queues/notification.queue'
import { countChannelTargets, countPushTargets } from '#server/utils/notificationTargeting'
import { useDatabase } from '#server/utils/useDatabase'
import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'

export const notificationMutations = defineMutation({
  sendNotification: {
    resolve: async (_parent, { input }, _ctx) => {
      const db = useDatabase()
      const channelType = ((input.channelType as ChannelType | undefined) || 'PUSH') as ChannelType

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
          channelType,
          channelId: input.channelId as string | undefined,
          contactIds: input.contactIds as string[] | undefined,
          targetDevices: input.targetDevices as string[] | undefined,
          platforms: input.platforms as string[] | undefined,
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

      try {
        // Scheduled notifications are handled by the scheduler plugin
        if (input.scheduledAt) {
          return insertedNotification
        }

        const totalTargets = channelType !== 'PUSH'
          ? await countChannelTargets(db, {
              appId: input.appId as string,
              channelType: channelType as 'EMAIL' | 'SMS' | 'IN_APP' | 'DISCORD' | 'TELEGRAM',
              contactIds: input.contactIds as string[] | undefined,
            })
          : await countPushTargets(db, {
              appId: input.appId as string,
              targetDevices: input.targetDevices as string[] | undefined,
              platforms: input.platforms as string[] | undefined,
            })

        await db
          .update(tables.notification)
          .set({
            totalTargets,
            status: 'QUEUED',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(tables.notification.id, insertedNotification.id))

        await addFanoutNotificationJob({
          notificationId: insertedNotification.id,
          appId: input.appId as string,
          channelType,
          channelId: input.channelId as string | undefined,
          contactIds: input.contactIds as string[] | undefined,
          targetDevices: input.targetDevices as string[] | undefined,
          platforms: input.platforms as string[] | undefined,
          payload: {
            title: input.title as string,
            body: input.body as string,
            data: input.data as Record<string, any> | undefined,
            badge: input.badge as number | undefined,
            sound: input.sound as string | undefined,
            clickAction: input.clickAction as string | undefined,
            imageUrl: input.imageUrl as string | undefined,
          },
        })

        return {
          ...insertedNotification,
          channelType,
          channelId: input.channelId as string | undefined,
          contactIds: input.contactIds as string[] | undefined,
          targetDevices: input.targetDevices as string[] | undefined,
          platforms: input.platforms as string[] | undefined,
          status: 'QUEUED',
          totalTargets,
        }
      }
      catch (error) {
        await db
          .update(tables.notification)
          .set({
            status: 'FAILED',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(tables.notification.id, insertedNotification.id))

        throw error
      }
    },
  },
})
