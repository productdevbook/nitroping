import { eq, and } from 'drizzle-orm'

export const trackingMutations = defineMutation({
  trackNotificationDelivered: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      try {
        await db
          .update(tables.deliveryLog)
          .set({
            deliveredAt: new Date(),
            platform: input.platform,
            userAgent: input.userAgent,
            appVersion: input.appVersion,
            osVersion: input.osVersion,
          })
          .where(
            and(
              eq(tables.deliveryLog.notificationId, input.notificationId),
              eq(tables.deliveryLog.deviceId, input.deviceId)
            )
          )

        // Update notification total delivered count
        const deliveredCount = await db
          .select()
          .from(tables.deliveryLog)
          .where(
            and(
              eq(tables.deliveryLog.notificationId, input.notificationId),
              eq(tables.deliveryLog.deliveredAt, null).not()
            )
          )

        await db
          .update(tables.notification)
          .set({ totalDelivered: deliveredCount.length })
          .where(eq(tables.notification.id, input.notificationId))

        return {
          success: true,
          message: 'Delivery tracked successfully',
        }
      }
      catch (error) {
        console.error('[Analytics] Failed to track delivery:', error)
        return {
          success: false,
          message: 'Failed to track delivery',
        }
      }
    },
  },

  trackNotificationOpened: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      try {
        await db
          .update(tables.deliveryLog)
          .set({
            openedAt: new Date(),
            platform: input.platform,
            userAgent: input.userAgent,
            appVersion: input.appVersion,
            osVersion: input.osVersion,
          })
          .where(
            and(
              eq(tables.deliveryLog.notificationId, input.notificationId),
              eq(tables.deliveryLog.deviceId, input.deviceId)
            )
          )

        return {
          success: true,
          message: 'Open tracked successfully',
        }
      }
      catch (error) {
        console.error('[Analytics] Failed to track open:', error)
        return {
          success: false,
          message: 'Failed to track open',
        }
      }
    },
  },

  trackNotificationClicked: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      try {
        await db
          .update(tables.deliveryLog)
          .set({
            clickedAt: new Date(),
            platform: input.platform,
            userAgent: input.userAgent,
            appVersion: input.appVersion,
            osVersion: input.osVersion,
          })
          .where(
            and(
              eq(tables.deliveryLog.notificationId, input.notificationId),
              eq(tables.deliveryLog.deviceId, input.deviceId)
            )
          )

        // Update notification total clicked count
        const clickedCount = await db
          .select()
          .from(tables.deliveryLog)
          .where(
            and(
              eq(tables.deliveryLog.notificationId, input.notificationId),
              eq(tables.deliveryLog.clickedAt, null).not()
            )
          )

        await db
          .update(tables.notification)
          .set({ totalClicked: clickedCount.length })
          .where(eq(tables.notification.id, input.notificationId))

        return {
          success: true,
          message: 'Click tracked successfully',
        }
      }
      catch (error) {
        console.error('[Analytics] Failed to track click:', error)
        return {
          success: false,
          message: 'Failed to track click',
        }
      }
    },
  },
})