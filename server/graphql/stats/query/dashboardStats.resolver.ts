import { count, eq, gte, sql } from 'drizzle-orm'

export const statsQuery = defineQuery({
  dashboardStats: {
    resolve: async (_parent, args, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      // Total apps
      const totalAppsResult = await db
        .select({ count: count() })
        .from(tables.app)

      // Active devices
      const activeDevicesResult = await db
        .select({ count: count() })
        .from(tables.device)
        .where(eq(tables.device.status, 'active'))

      // Notifications sent in last 24h
      const notificationsSentResult = await db
        .select({ count: count() })
        .from(tables.notification)
        .where(gte(tables.notification.createdAt, yesterday))

      // Calculate delivery rate
      const deliveryRateResult = await db
        .select({
          delivered: sql<number>`count(case when ${tables.deliveryLog.status} = 'delivered' then 1 end)`,
          total: count(),
        })
        .from(tables.deliveryLog)
        .where(gte(tables.deliveryLog.createdAt, yesterday))

      const deliveryRate = deliveryRateResult[0]?.total > 0
        ? (deliveryRateResult[0].delivered / deliveryRateResult[0].total) * 100
        : 0

      return {
        totalApps: totalAppsResult[0]?.count || 0,
        activeDevices: activeDevicesResult[0]?.count || 0,
        notificationsSent: notificationsSentResult[0]?.count || 0,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
      }
    },
  },
})
