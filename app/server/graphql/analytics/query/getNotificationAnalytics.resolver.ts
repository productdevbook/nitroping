import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const getNotificationAnalyticsQuery = defineQuery({
  getNotificationAnalytics: {
    resolve: async (_parent, { notificationId }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      try {
        // Get notification basic info
        const notification = await db
          .select()
          .from(tables.notification)
          .where(eq(tables.notification.id, notificationId))
          .limit(1)

        if (!notification.length) {
          throw createError({
            statusCode: 404,
            message: 'Notification not found',
          })
        }

        const notif = notification[0]

        // Get delivery logs for this notification
        const deliveryLogs = await db
          .select()
          .from(tables.deliveryLog)
          .where(eq(tables.deliveryLog.notificationId, notificationId))

        const sentCount = notif.totalSent
        const deliveredCount = deliveryLogs.filter((log: any) => log.deliveredAt !== null).length
        const openedCount = deliveryLogs.filter((log: any) => log.openedAt !== null).length
        const clickedCount = deliveryLogs.filter((log: any) => log.clickedAt !== null).length

        // Calculate platform breakdown
        const platformStats = new Map<string, any>()

        deliveryLogs.forEach((log: any) => {
          const platform = log.platform || 'unknown'
          if (!platformStats.has(platform)) {
            platformStats.set(platform, {
              platform,
              sent: 0,
              delivered: 0,
              opened: 0,
              clicked: 0,
              deliveryTimes: [],
              openTimes: [],
            })
          }

          const stats = platformStats.get(platform)
          stats.sent++

          if (log.deliveredAt) {
            stats.delivered++
            if (log.sentAt) {
              stats.deliveryTimes.push(new Date(log.deliveredAt).getTime() - new Date(log.sentAt).getTime())
            }
          }

          if (log.openedAt) {
            stats.opened++
            if (log.deliveredAt) {
              stats.openTimes.push(new Date(log.openedAt).getTime() - new Date(log.deliveredAt).getTime())
            }
          }

          if (log.clickedAt) {
            stats.clicked++
          }
        })

        const platformBreakdown = Array.from(platformStats.values()).map(stats => ({
          platform: stats.platform,
          sent: stats.sent,
          delivered: stats.delivered,
          opened: stats.opened,
          clicked: stats.clicked,
          avgDeliveryTime: stats.deliveryTimes.length > 0
            ? stats.deliveryTimes.reduce((a: number, b: number) => a + b, 0) / stats.deliveryTimes.length / 1000
            : null,
          avgOpenTime: stats.openTimes.length > 0
            ? stats.openTimes.reduce((a: number, b: number) => a + b, 0) / stats.openTimes.length / 1000
            : null,
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
