import type { ChannelType } from '#server/database/schema/enums'
import * as tables from '#server/database/schema'
import { countChannelTargets, countPushTargets } from '#server/utils/notificationTargeting'
import { useDatabase } from '#server/utils/useDatabase'
import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'
import { HTTPError } from 'nitro/h3'

export const scheduleNotificationMutation = defineMutation({
  scheduleNotification: {
    resolve: async (_parent, { input }, _ctx) => {
      const db = useDatabase()
      const channelType = ((input.channelType as ChannelType | undefined) || 'PUSH') as ChannelType

      // Ensure scheduledAt is provided for scheduled notifications
      if (!input.scheduledAt) {
        throw new HTTPError({
          status: 400,
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
          channelType,
          channelId: input.channelId as string | undefined,
          contactIds: input.contactIds as string[] | undefined,
          targetDevices: input.targetDevices as string[] | undefined,
          platforms: input.platforms as string[] | undefined,
          status: 'SCHEDULED',
          scheduledAt: new Date(input.scheduledAt as string).toISOString(),
          totalTargets: 0, // Will be calculated
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          totalClicked: 0,
        })
        .returning()

      const insertedNotification = newNotification[0]!

      try {
        const targetDevicesCount = channelType !== 'PUSH'
          ? await countChannelTargets(db, {
              appId: input.appId,
              channelType: channelType as 'EMAIL' | 'SMS' | 'IN_APP' | 'DISCORD' | 'TELEGRAM',
              contactIds: input.contactIds as string[] | undefined,
            })
          : await countPushTargets(db, {
              appId: input.appId,
              targetDevices: input.targetDevices as string[] | undefined,
              platforms: input.platforms as string[] | undefined,
            })

        await db
          .update(tables.notification)
          .set({ totalTargets: targetDevicesCount, updatedAt: new Date().toISOString() })
          .where(eq(tables.notification.id, insertedNotification.id))

        return {
          ...insertedNotification,
          channelType,
          channelId: input.channelId as string | undefined,
          contactIds: input.contactIds as string[] | undefined,
          targetDevices: input.targetDevices as string[] | undefined,
          platforms: input.platforms as string[] | undefined,
          totalTargets: targetDevicesCount,
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
