import type { Job } from 'bullmq'
import type { SendNotificationJobData } from '../queues/notification.queue'
import { Worker } from 'bullmq'
import { eq, sql } from 'drizzle-orm'
import { getChannelById } from '../channels'
import { getDatabase } from '../database/connection'
import { deliveryLog, notification } from '../database/schema'
import { getProviderForApp } from '../providers'
import { getRedisConnection } from '../utils/redis'
import { dispatchHooks } from '../utils/webhookDispatcher'

async function processChannelDelivery(job: Job<SendNotificationJobData>) {
  if (job.data.deliveryMode !== 'channel') return

  const { notificationId, appId, channelId, to, payload } = job.data
  const db = getDatabase()

  try {
    const channel = await getChannelById(channelId)
    const result = await channel.send({
      to,
      subject: payload.title,
      body: payload.body,
      data: payload.data,
    })

    await db.insert(deliveryLog).values({
      notificationId,
      deviceId: '00000000-0000-0000-0000-000000000000', // placeholder for channel delivery
      status: result.success ? 'SENT' : 'FAILED',
      errorMessage: result.error,
      providerResponse: result.messageId ? { messageId: result.messageId } : null,
      sentAt: result.success ? new Date().toISOString() : null,
    })

    if (result.success) {
      await db
        .update(notification)
        .set({ totalSent: sql`"totalSent" + 1`, updatedAt: new Date().toISOString() })
        .where(eq(notification.id, notificationId))

      await dispatchHooks(appId, 'NOTIFICATION_SENT', {
        notificationId,
        channelId,
        messageId: result.messageId,
      })
    }
    else {
      await db
        .update(notification)
        .set({ totalFailed: sql`"totalFailed" + 1`, updatedAt: new Date().toISOString() })
        .where(eq(notification.id, notificationId))

      await dispatchHooks(appId, 'NOTIFICATION_FAILED', {
        notificationId,
        channelId,
        error: result.error,
      })

      throw new Error(result.error ?? 'Channel delivery failed')
    }

    return { success: true, messageId: result.messageId }
  }
  catch (error) {
    console.error(`[NotificationWorker] Channel delivery error for job ${job.id}:`, error)
    throw error
  }
}

async function processDeviceDelivery(job: Job<SendNotificationJobData>) {
  if (job.data.deliveryMode !== 'device') return

  const { notificationId, deviceId, appId, platform, token, webPushP256dh, webPushAuth, payload } = job.data
  const db = getDatabase()

  try {
    const provider = await getProviderForApp(appId, platform)

    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      badge: payload.badge,
      sound: payload.sound,
      clickAction: payload.clickAction,
      imageUrl: payload.imageUrl,
    }

    let message
    if (platform === 'web') {
      if (!webPushP256dh || !webPushAuth) {
        throw new Error('WebPush subscription keys missing')
      }
      message = (provider as any).convertNotificationPayload(notificationPayload, {
        endpoint: token,
        keys: { p256dh: webPushP256dh, auth: webPushAuth },
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

    await db.insert(deliveryLog).values({
      notificationId,
      deviceId,
      status: result.success ? 'SENT' : 'FAILED',
      errorMessage: result.error,
      providerResponse: { messageId: result.messageId },
      sentAt: result.success ? new Date().toISOString() : null,
    })

    if (result.success) {
      await db
        .update(notification)
        .set({ totalSent: sql`"totalSent" + 1`, updatedAt: new Date().toISOString() })
        .where(eq(notification.id, notificationId))

      await dispatchHooks(appId, 'NOTIFICATION_SENT', {
        notificationId,
        deviceId,
        messageId: result.messageId,
      })
    }
    else {
      await db
        .update(notification)
        .set({ totalFailed: sql`"totalFailed" + 1`, updatedAt: new Date().toISOString() })
        .where(eq(notification.id, notificationId))

      await dispatchHooks(appId, 'NOTIFICATION_FAILED', {
        notificationId,
        deviceId,
        error: result.error,
      })

      if (!result.success) {
        throw new Error(result.error ?? 'Provider returned failure')
      }
    }

    return { success: true, messageId: result.messageId }
  }
  catch (error) {
    console.error(`[NotificationWorker] Error processing job ${job.id}:`, error)

    const alreadyLogged = error instanceof Error
      && error.message === (job.data as any)?.lastProviderError
    if (!alreadyLogged) {
      try {
        await db.insert(deliveryLog).values({
          notificationId,
          deviceId,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          sentAt: null,
        })
        await db
          .update(notification)
          .set({ totalFailed: sql`"totalFailed" + 1`, updatedAt: new Date().toISOString() })
          .where(eq(notification.id, notificationId))
      }
      catch (dbError) {
        console.error('[NotificationWorker] Failed to write delivery log:', dbError)
      }
    }

    throw error
  }
}

async function processSendNotification(job: Job<SendNotificationJobData>) {
  if (job.data.deliveryMode === 'channel') {
    return processChannelDelivery(job)
  }
  return processDeviceDelivery(job)
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

      if (job.name === 'send-notification') {
        return processSendNotification(job as Job<SendNotificationJobData>)
      }

      console.warn(`[NotificationWorker] Unknown job name: ${job.name}`)
      return { success: false, reason: 'unknown_job' }
    },
    {
      connection: getRedisConnection(),
      concurrency: 10,
      limiter: {
        max: 100,
        duration: 1000,
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
