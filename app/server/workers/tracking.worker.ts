import type { TrackNotificationEventJobData } from '#server/queues/tracking.queue'
import type { Job } from 'bullmq'
import { getDatabase } from '#server/database/connection'
import { deliveryLog, notification } from '#server/database/schema'
import { dispatchHooks } from '#server/utils/webhookDispatcher'
import { and, eq, isNull, sql } from 'drizzle-orm'

async function processOpenEvent(deliveryLogId: string) {
  const db = getDatabase()
  const now = new Date().toISOString()

  const updatedRows = await db
    .update(deliveryLog)
    .set({ openedAt: now, updatedAt: now })
    .where(and(eq(deliveryLog.id, deliveryLogId), isNull(deliveryLog.openedAt)))
    .returning({
      id: deliveryLog.id,
      notificationId: deliveryLog.notificationId,
    })

  const updated = updatedRows[0]
  if (!updated) {
    return
  }

  const notificationRows = await db
    .update(notification)
    .set({ totalOpened: sql`"totalOpened" + 1`, updatedAt: now })
    .where(eq(notification.id, updated.notificationId))
    .returning({
      appId: notification.appId,
    })

  const notificationRow = notificationRows[0]
  if (!notificationRow) {
    return
  }

  await dispatchHooks(notificationRow.appId, 'NOTIFICATION_OPENED', {
    notificationId: updated.notificationId,
    deliveryLogId,
    openedAt: now,
  })
}

async function processClickEvent(deliveryLogId: string, destination: string) {
  const db = getDatabase()
  const now = new Date().toISOString()

  const updatedRows = await db
    .update(deliveryLog)
    .set({ clickedAt: now, updatedAt: now })
    .where(and(eq(deliveryLog.id, deliveryLogId), isNull(deliveryLog.clickedAt)))
    .returning({
      id: deliveryLog.id,
      notificationId: deliveryLog.notificationId,
    })

  const updated = updatedRows[0]
  if (!updated) {
    return
  }

  const notificationRows = await db
    .update(notification)
    .set({ totalClicked: sql`"totalClicked" + 1`, updatedAt: now })
    .where(eq(notification.id, updated.notificationId))
    .returning({
      appId: notification.appId,
    })

  const notificationRow = notificationRows[0]
  if (!notificationRow) {
    return
  }

  await dispatchHooks(notificationRow.appId, 'NOTIFICATION_CLICKED', {
    notificationId: updated.notificationId,
    deliveryLogId,
    clickedAt: now,
    destination,
  })
}

export async function processTrackingJob(job: Job<TrackNotificationEventJobData>) {
  if (job.name !== 'track-notification-event') {
    return
  }

  if (job.data.type === 'open') {
    await processOpenEvent(job.data.deliveryLogId)
    return
  }

  await processClickEvent(job.data.deliveryLogId, job.data.destination || '/')
}
