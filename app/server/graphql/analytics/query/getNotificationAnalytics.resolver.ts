import * as tables from '#server/database/schema'
import { aggregateNotificationMetrics } from '#server/utils/notificationTargeting'
import { useDatabase } from '#server/utils/useDatabase'
import { eq, sql } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'
import { HTTPError } from 'nitro/h3'

export const getNotificationAnalyticsQuery = defineQuery({
  getNotificationAnalytics: {
    resolve: async (_parent, { notificationId }, _ctx) => {
      const db = useDatabase()

      try {
        // Get notification basic info
        const notification = await db
          .select()
          .from(tables.notification)
          .where(eq(tables.notification.id, notificationId))
          .limit(1)

        if (!notification.length) {
          throw new HTTPError({
            status: 404,
            message: 'Notification not found',
          })
        }

        const notif = notification[0]!

        const metrics = await aggregateNotificationMetrics(db, notificationId)

        const platformBreakdownRows = await db
          .select({
            platform: sql<string>`coalesce(${tables.deliveryLog.platform}, 'unknown')`,
            sent: sql<number>`count(*)`,
            delivered: sql<number>`count(*) filter (where ${tables.deliveryLog.deliveredAt} is not null)`,
            opened: sql<number>`count(*) filter (where ${tables.deliveryLog.openedAt} is not null)`,
            clicked: sql<number>`count(*) filter (where ${tables.deliveryLog.clickedAt} is not null)`,
            avgDeliveryTime: sql<number | null>`avg(extract(epoch from (${tables.deliveryLog.deliveredAt} - ${tables.deliveryLog.sentAt})))`,
            avgOpenTime: sql<number | null>`avg(extract(epoch from (${tables.deliveryLog.openedAt} - ${tables.deliveryLog.deliveredAt})))`,
          })
          .from(tables.deliveryLog)
          .where(eq(tables.deliveryLog.notificationId, notificationId))
          .groupBy(sql`coalesce(${tables.deliveryLog.platform}, 'unknown')`)

        const sentCount = notif.totalSent ?? metrics.sentCount
        const deliveredCount = metrics.deliveredCount
        const openedCount = metrics.openedCount
        const clickedCount = metrics.clickedCount

        const platformBreakdown = platformBreakdownRows.map(row => ({
          platform: row.platform,
          sent: Number(row.sent ?? 0),
          delivered: Number(row.delivered ?? 0),
          opened: Number(row.opened ?? 0),
          clicked: Number(row.clicked ?? 0),
          avgDeliveryTime: row.avgDeliveryTime === null ? null : Number(row.avgDeliveryTime),
          avgOpenTime: row.avgOpenTime === null ? null : Number(row.avgOpenTime),
        }))

        return {
          notificationId,
          sentCount: sentCount ?? 0,
          deliveredCount,
          openedCount,
          clickedCount,
          deliveryRate: (sentCount ?? 0) > 0 ? (deliveredCount / (sentCount ?? 0)) * 100 : 0,
          openRate: deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0,
          clickRate: openedCount > 0 ? (clickedCount / openedCount) * 100 : 0,
          platformBreakdown,
        }
      }
      catch (error) {
        console.error('[Analytics] Failed to get notification analytics:', error)
        throw error
      }
    },
  },
})
