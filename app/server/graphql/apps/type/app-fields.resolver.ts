import { and, eq, gte, sql } from 'drizzle-orm'
import { defineField } from 'nitro-graphql/define'
import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'

export const appFieldsResolver = defineField({
  App: {
    // Never return raw credential values to clients – even encrypted ones.
    fcmServiceAccount: { resolve: () => null },
    apnsPrivateKey: { resolve: () => null },
    vapidPrivateKey: { resolve: () => null },

    devices: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return await dataloaders.devicesByAppLoader.load(parent.id)
      },
    },

    notifications: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return await dataloaders.notificationsByAppLoader.load(parent.id)
      },
    },

    apiKeys: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return await dataloaders.apiKeysByAppLoader.load(parent.id)
      },
    },

    stats: {
      resolve: async (parent, _args, { context }) => {
        const db = useDatabase()

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Get total devices
        const totalDevicesResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(tables.device)
          .where(eq(tables.device.appId, parent.id))

        // Get active devices
        const activeDevicesResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(tables.device)
          .where(
            and(
              eq(tables.device.appId, parent.id),
              eq(tables.device.status, 'ACTIVE'),
            ),
          )

        // Get new devices today
        const newDevicesTodayResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(tables.device)
          .where(
            and(
              eq(tables.device.appId, parent.id),
              gte(tables.device.createdAt, today.toISOString()),
            ),
          )

        // Get sent notifications today
        const sentTodayResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(tables.notification)
          .where(
            and(
              eq(tables.notification.appId, parent.id),
              gte(tables.notification.sentAt, today.toISOString()),
            ),
          )

        // Get delivery stats for rate calculation
        const deliveryStatsResult = await db
          .select({
            totalSent: sql<number>`sum(${tables.notification.totalSent})`,
            totalDelivered: sql<number>`sum(${tables.notification.totalDelivered})`,
          })
          .from(tables.notification)
          .where(eq(tables.notification.appId, parent.id))

        const totalSent = deliveryStatsResult[0]?.totalSent || 0
        const totalDelivered = deliveryStatsResult[0]?.totalDelivered || 0
        const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0

        return {
          totalDevices: Number(totalDevicesResult[0]?.count) || 0,
          activeDevices: Number(activeDevicesResult[0]?.count) || 0,
          newDevicesToday: Number(newDevicesTodayResult[0]?.count) || 0,
          sentToday: Number(sentTodayResult[0]?.count) || 0,
          deliveryRate,
          apiCalls: 0, // TODO: Implement API call tracking
        }
      },
    },
  },
})
