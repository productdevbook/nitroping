import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { sql } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const statsQuery = defineQuery({
  dashboardStats: {
    resolve: async (_parent, _args, _ctx) => {
      const db = useDatabase()

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayIso = yesterday.toISOString()

      const totalAppsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tables.app)

      const activeDevicesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tables.device)
        .where(sql`${tables.device.status} = 'ACTIVE'`)

      const notificationsSentResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tables.notification)
        .where(sql`${tables.notification.createdAt} >= ${yesterdayIso}`)

      const deliveryRateResult = await db
        .select({
          delivered: sql<number>`count(case when ${tables.deliveryLog.status} = 'DELIVERED' then 1 end)`,
          total: sql<number>`count(*)`,
        })
        .from(tables.deliveryLog)
        .where(sql`${tables.deliveryLog.createdAt} >= ${yesterdayIso}`)

      const deliveryRate = (deliveryRateResult[0]?.total ?? 0) > 0
        ? (deliveryRateResult[0]!.delivered / deliveryRateResult[0]!.total) * 100
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
