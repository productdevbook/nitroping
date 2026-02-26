import { eq, sql } from 'drizzle-orm'
import { defineEventHandler, getRouterParam } from 'nitro/h3'
import { getDatabase } from '#server/database/connection'
import { deliveryLog, notification } from '#server/database/schema'
import { dispatchHooks } from '#server/utils/webhookDispatcher'

// 1×1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  event.res.headers.set('Content-Type', 'image/gif')
  event.res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  event.res.headers.set('Pragma', 'no-cache')
  event.res.headers.set('Expires', '0')

  if (!id) {
    return PIXEL
  }

  try {
    const db = getDatabase()

    // Fetch delivery log — only update on first open
    const rows = await db
      .select({
        id: deliveryLog.id,
        notificationId: deliveryLog.notificationId,
        openedAt: deliveryLog.openedAt,
      })
      .from(deliveryLog)
      .where(eq(deliveryLog.id, id))
      .limit(1)

    const log = rows[0]
    if (!log || log.openedAt) {
      // Unknown ID or already tracked — return pixel silently
      return PIXEL
    }

    const now = new Date().toISOString()

    await db
      .update(deliveryLog)
      .set({ openedAt: now, updatedAt: now })
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
        .set({ totalOpened: sql`"totalOpened" + 1`, updatedAt: now })
        .where(eq(notification.id, log.notificationId))

      await dispatchHooks(appId, 'NOTIFICATION_OPENED', {
        notificationId: log.notificationId,
        deliveryLogId: id,
        openedAt: now,
      })
    }
  }
  catch (err) {
    // Never break pixel delivery on tracking errors
    console.error('[TrackOpen] Error recording open for', id, err)
  }

  return PIXEL
})
