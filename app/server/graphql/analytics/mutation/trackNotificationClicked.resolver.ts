import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { and, eq, isNotNull } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'

export const trackNotificationClickedMutation = defineMutation({
  trackNotificationClicked: {
    resolve: async (_parent, { input }, _ctx) => {
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
