import { and, eq, isNotNull } from 'drizzle-orm'

export const trackingMutations = defineMutation({
  trackNotificationDelivered: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      try {
        // Use upsert with ON CONFLICT to handle unique constraint
        await db
          .insert(tables.deliveryLog)
          .values({
            notificationId: input.notificationId,
            deviceId: input.deviceId,
            status: 'DELIVERED',
            deliveredAt: new Date().toISOString(),
            sentAt: new Date().toISOString(),
            platform: input.platform,
            userAgent: input.userAgent,
            appVersion: input.appVersion,
            osVersion: input.osVersion,
          })
          .onConflictDoUpdate({
            target: [tables.deliveryLog.notificationId, tables.deliveryLog.deviceId],
            set: {
              deliveredAt: new Date().toDateString(),
              platform: input.platform,
              userAgent: input.userAgent,
              appVersion: input.appVersion,
              osVersion: input.osVersion,
            },
          })

        // Update notification total delivered count
        const deliveredCount = await db
          .select()
          .from(tables.deliveryLog)
          .where(
            and(
              eq(tables.deliveryLog.notificationId, input.notificationId),
              isNotNull(tables.deliveryLog.deliveredAt),
            ),
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
        // Use upsert with ON CONFLICT to handle unique constraint
        await db
          .insert(tables.deliveryLog)
          .values({
            notificationId: input.notificationId,
            deviceId: input.deviceId,
            status: 'DELIVERED',
            openedAt: new Date().toISOString(),
            sentAt: new Date().toISOString(),
            platform: input.platform,
            userAgent: input.userAgent,
            appVersion: input.appVersion,
            osVersion: input.osVersion,
          })
          .onConflictDoUpdate({
            target: [tables.deliveryLog.notificationId, tables.deliveryLog.deviceId],
            set: {
              openedAt: new Date().toDateString(),
              platform: input.platform,
              userAgent: input.userAgent,
              appVersion: input.appVersion,
              osVersion: input.osVersion,
            },
          })

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
        // Use upsert with ON CONFLICT to handle unique constraint
        await db
          .insert(tables.deliveryLog)
          .values({
            notificationId: input.notificationId,
            deviceId: input.deviceId,
            status: 'DELIVERED',
            clickedAt: new Date().toISOString(),
            sentAt: new Date().toISOString(),
            platform: input.platform,
            userAgent: input.userAgent,
            appVersion: input.appVersion,
            osVersion: input.osVersion,
          })
          .onConflictDoUpdate({
            target: [tables.deliveryLog.notificationId, tables.deliveryLog.deviceId],
            set: {
              clickedAt: new Date().toISOString(),
              platform: input.platform,
              userAgent: input.userAgent,
              appVersion: input.appVersion,
              osVersion: input.osVersion,
            },
          })

        // Update notification total clicked count
        const clickedCount = await db
          .select()
          .from(tables.deliveryLog)
          .where(
            and(
              eq(tables.deliveryLog.notificationId, input.notificationId),
              isNotNull(tables.deliveryLog.clickedAt),
            ),
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
