import { Buffer } from 'node:buffer'
import { getDatabase } from '#server/database/connection'
import { deliveryLog, notification } from '#server/database/schema'
import { dispatchHooks } from '#server/utils/webhookDispatcher'
import { eq, sql } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRouterParam, sendRedirect } from 'nitro/h3'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { url: encodedUrl } = getQuery(event)

  // Decode the original destination URL
  let destination = '/'
  if (typeof encodedUrl === 'string') {
    try {
      destination = Buffer.from(encodedUrl, 'base64url').toString('utf8')
      // Basic safety check — only allow http(s)
      const parsed = new URL(destination)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        destination = '/'
      }
    }
    catch {
      destination = '/'
    }
  }

  if (id) {
    try {
      const db = getDatabase()

      const rows = await db
        .select({
          id: deliveryLog.id,
          notificationId: deliveryLog.notificationId,
          clickedAt: deliveryLog.clickedAt,
        })
        .from(deliveryLog)
        .where(eq(deliveryLog.id, id))
        .limit(1)

      const log = rows[0]
      if (log && !log.clickedAt) {
        const now = new Date().toISOString()

        await db
          .update(deliveryLog)
          .set({ clickedAt: now, updatedAt: now })
          .where(eq(deliveryLog.id, id))

        const notifRows = await db
          .select({ appId: notification.appId })
          .from(notification)
          .where(eq(notification.id, log.notificationId))
          .limit(1)

        if (notifRows[0]) {
          const { appId } = notifRows[0]

          await db
            .update(notification)
            .set({ totalClicked: sql`"totalClicked" + 1`, updatedAt: now })
            .where(eq(notification.id, log.notificationId))

          await dispatchHooks(appId, 'NOTIFICATION_CLICKED', {
            notificationId: log.notificationId,
            deliveryLogId: id,
            clickedAt: now,
            destination,
          })
        }
      }
    }
    catch (err) {
      // Never block the redirect on tracking errors
      console.error('[TrackClick] Error recording click for', id, err)
    }
  }

  return sendRedirect(event, destination, 302)
})
