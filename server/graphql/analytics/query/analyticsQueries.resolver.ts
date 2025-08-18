import { and, eq, sql } from 'drizzle-orm'

export const analyticsQueries = defineQuery({
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

  getEngagementMetrics: {
    resolve: async (_parent, { appId, timeRange = '7d' }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      try {
        // Calculate date range
        const now = new Date()
        const days = Number.parseInt(timeRange.replace('d', ''))
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

        // Get notifications for this app in the time range
        const notifications = await db
          .select()
          .from(tables.notification)
          .where(
            and(
              eq(tables.notification.appId, appId),
              sql`${tables.notification.createdAt} >= ${startDate.toISOString()}`,
            ),
          )

        if (!notifications.length) {
          return {
            totalNotifications: 0,
            totalSent: 0,
            totalDelivered: 0,
            totalOpened: 0,
            totalClicked: 0,
            overallDeliveryRate: 0,
            overallOpenRate: 0,
            overallClickRate: 0,
            platformBreakdown: [],
          }
        }

        const notificationIds = notifications.map((n: any) => n.id)

        // Get all delivery logs for these notifications
        const deliveryLogs = await db
          .select()
          .from(tables.deliveryLog)
          .where(sql`${tables.deliveryLog.notificationId} IN (${sql.join(notificationIds.map((id: any) => sql`${id}`), sql`, `)})`)

        const totalNotifications = notifications.length
        const totalSent = notifications.reduce((sum: number, n: any) => sum + n.totalSent, 0)
        const totalDelivered = deliveryLogs.filter((log: any) => log.deliveredAt !== null).length
        const totalOpened = deliveryLogs.filter((log: any) => log.openedAt !== null).length
        const totalClicked = deliveryLogs.filter((log: any) => log.clickedAt !== null).length

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
          totalNotifications,
          totalSent,
          totalDelivered,
          totalOpened,
          totalClicked,
          overallDeliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
          overallOpenRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
          overallClickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
          platformBreakdown,
        }
      }
      catch (error) {
        console.error('[Analytics] Failed to get engagement metrics:', error)
        throw error
      }
    },
  },
})
