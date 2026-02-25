import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'
import { HTTPError } from 'nitro/h3'

export const cancelNotificationMutation = defineMutation({
  cancelNotification: {
    resolve: async (_parent, { id }, ctx) => {
      const db = useDatabase()

      // Check if notification exists and is in a cancellable state
      const notification = await db
        .select()
        .from(tables.notification)
        .where(eq(tables.notification.id, id))
        .limit(1)

      if (!notification[0]) {
        throw new HTTPError({
          status: 404,
          message: 'Notification not found',
        })
      }

      // Only scheduled or pending notifications can be cancelled
      if (!['scheduled', 'pending'].includes(notification[0].status)) {
        throw new HTTPError({
          status: 400,
          message: 'Only scheduled or pending notifications can be cancelled',
        })
      }

      // Update notification status to failed (cancelled)
      await db
        .update(tables.notification)
        .set({
          status: 'FAILED',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tables.notification.id, id))

      return true
    },
  },
})
