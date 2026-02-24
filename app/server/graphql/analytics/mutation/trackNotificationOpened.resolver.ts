import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { defineMutation } from 'nitro-graphql/define'

export const trackNotificationOpenedMutation = defineMutation({
  trackNotificationOpened: {
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
})
