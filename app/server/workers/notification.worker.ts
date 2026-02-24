import type { Job } from 'bullmq'
import type { ProcessScheduledJobData, RetryNotificationJobData, SendNotificationJobData } from '../queues/notification.queue'
import { Worker } from 'bullmq'
import { eq, sql } from 'drizzle-orm'
import { getDatabase } from '../database/connection'
import { deliveryLog, notification } from '../database/schema'
import { getProviderForApp } from '../providers'
import { addRetryNotificationJob } from '../queues/notification.queue'
import { getRedisConnection } from '../utils/redis'

const MAX_RETRY_ATTEMPTS = 5

async function processSendNotification(job: Job<SendNotificationJobData>) {
  const { notificationId, deviceId, appId, platform, token, webPushP256dh, webPushAuth, payload } = job.data
  const db = getDatabase()

  try {
    const provider = await getProviderForApp(appId, platform)

    // Build notification payload
    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      badge: payload.badge,
      sound: payload.sound,
      clickAction: payload.clickAction,
      imageUrl: payload.imageUrl,
    }

    // Build message based on platform
    let message
    if (platform === 'web') {
      if (!webPushP256dh || !webPushAuth) {
        throw new Error('WebPush subscription keys missing')
      }
      message = (provider as any).convertNotificationPayload(notificationPayload, {
        endpoint: token,
        keys: {
          p256dh: webPushP256dh,
          auth: webPushAuth,
        },
      })
    }
    else {
      message = (provider as any).convertNotificationPayload(
        notificationPayload,
        token,
        notificationId,
        deviceId,
      )
    }

    const result = await (provider as any).sendMessage(message)

    // Create delivery log
    await db.insert(deliveryLog).values({
      notificationId,
      deviceId,
      status: result.success ? 'SENT' : 'FAILED',
      errorMessage: result.error,
      providerResponse: { messageId: result.messageId },
      sentAt: result.success ? new Date().toISOString() : null,
    })

    // Update notification statistics
    if (result.success) {
      await db
        .update(notification)
        .set({ totalSent: sql`"totalSent" + 1`, updatedAt: new Date().toISOString() })
        .where(eq(notification.id, notificationId))
    }
    else {
      await db
        .update(notification)
        .set({ totalFailed: sql`"totalFailed" + 1`, updatedAt: new Date().toISOString() })
        .where(eq(notification.id, notificationId))

      // Queue for retry if not max attempts
      if (job.attemptsMade < MAX_RETRY_ATTEMPTS) {
        await addRetryNotificationJob({
          ...job.data,
          attemptCount: job.attemptsMade + 1,
          lastError: result.error,
        })
      }
    }

    return { success: result.success, messageId: result.messageId }
  }
  catch (error) {
    console.error(`[NotificationWorker] Error processing job ${job.id}:`, error)

    // Create failed delivery log
    await db.insert(deliveryLog).values({
      notificationId,
      deviceId,
      status: 'FAILED',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      sentAt: null,
    })

    // Update failed count
    await db
      .update(notification)
      .set({ totalFailed: sql`"totalFailed" + 1`, updatedAt: new Date().toISOString() })
      .where(eq(notification.id, notificationId))

    throw error
  }
}

async function processRetryNotification(job: Job<RetryNotificationJobData>) {
  // Same logic as send notification, just with retry context
  return processSendNotification(job as any)
}

async function processScheduledNotification(job: Job<ProcessScheduledJobData>) {
  const { notificationId } = job.data
  const db = getDatabase()

  try {
    // Get the notification
    const notificationResult = await db
      .select()
      .from(notification)
      .where(eq(notification.id, notificationId))
      .limit(1)

    if (notificationResult.length === 0) {
      console.log(`[NotificationWorker] Notification ${notificationId} not found, skipping`)
      return { success: false, reason: 'not_found' }
    }

    const notif = notificationResult[0]!

    // Check if still scheduled (not cancelled)
    if (notif.status !== 'SCHEDULED') {
      console.log(`[NotificationWorker] Notification ${notificationId} is not scheduled (${notif.status}), skipping`)
      return { success: false, reason: 'not_scheduled' }
    }

    // Update status to PENDING and mark as being processed
    await db
      .update(notification)
      .set({ status: 'PENDING', updatedAt: new Date().toISOString() })
      .where(eq(notification.id, notificationId))

    console.log(`[NotificationWorker] Processing scheduled notification ${notificationId}`)

    // The actual sending will be handled by the sendNotification resolver
    // We just need to update the status here
    return { success: true, notificationId }
  }
  catch (error) {
    console.error(`[NotificationWorker] Error processing scheduled notification ${notificationId}:`, error)
    throw error
  }
}

let worker: Worker | null = null

export function startNotificationWorker() {
  if (worker) {
    console.log('[NotificationWorker] Worker already running')
    return worker
  }

  worker = new Worker(
    'notifications',
    async (job) => {
      console.log(`[NotificationWorker] Processing job ${job.id} (${job.name})`)

      switch (job.name) {
        case 'send-notification':
          return processSendNotification(job as Job<SendNotificationJobData>)
        case 'retry-notification':
          return processRetryNotification(job as Job<RetryNotificationJobData>)
        case 'process-scheduled':
          return processScheduledNotification(job as Job<ProcessScheduledJobData>)
        default:
          console.warn(`[NotificationWorker] Unknown job name: ${job.name}`)
          return { success: false, reason: 'unknown_job' }
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 10,
      limiter: {
        max: 100,
        duration: 1000, // Max 100 jobs per second
      },
    },
  )

  worker.on('completed', (job) => {
    console.log(`[NotificationWorker] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('[NotificationWorker] Worker error:', err)
  })

  console.log('[NotificationWorker] Started')
  return worker
}

export async function stopNotificationWorker() {
  if (worker) {
    await worker.close()
    worker = null
    console.log('[NotificationWorker] Stopped')
  }
}
