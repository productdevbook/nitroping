import type { Job } from 'bullmq'
import type { FanoutNotificationJobData, SendNotificationJobData } from '../queues/notification.queue'
import { eq, sql } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { getChannelById } from '../channels'
import { getDatabase } from '../database/connection'
import { deliveryLog, notification } from '../database/schema'
import { getProviderForApp } from '../providers'
import { addSendNotificationJobs } from '../queues/notification.queue'
import { chunkArray } from '../utils/batching'
import { getNotificationTerminalStatus } from '../utils/notificationStatus'
import {
  countChannelTargets,
  countPushTargets,
  loadChannelTargetBatch,
  loadPushTargetBatch,
  resolveActiveChannelId,
} from '../utils/notificationTargeting'
import { dispatchHooks } from '../utils/webhookDispatcher'

const TRACKING_BASE_URL = process.env.APP_URL || 'http://localhost:3412'
const ENQUEUE_CHUNK_SIZE = Number.parseInt(process.env.NOTIFICATION_ENQUEUE_CHUNK_SIZE || '500')

async function processFanoutJob(job: Job<FanoutNotificationJobData>) {
  const db = getDatabase()
  const now = new Date().toISOString()
  const channelType = job.data.channelType
  await db
    .update(notification)
    .set({
      status: 'PROCESSING',
      updatedAt: now,
    })
    .where(eq(notification.id, job.data.notificationId))

  try {
    if (channelType && channelType !== 'PUSH') {
      const resolvedChannelId = job.data.channelId ?? await resolveActiveChannelId(db, job.data.appId, channelType)
      const payload = {
        title: job.data.payload.title,
        body: job.data.payload.body,
        data: job.data.payload.data,
      }

      if (channelType === 'DISCORD' || channelType === 'TELEGRAM') {
        await addSendNotificationJobs([{
          deliveryMode: 'channel',
          notificationId: job.data.notificationId,
          appId: job.data.appId,
          channelId: resolvedChannelId,
          to: '',
          channelType,
          payload,
        }])

        await db
          .update(notification)
          .set({
            totalTargets: 1,
            status: 'PROCESSING',
            updatedAt: now,
          })
          .where(eq(notification.id, job.data.notificationId))

        return
      }

      const totalTargets = await countChannelTargets(db, {
        appId: job.data.appId,
        channelType,
        contactIds: job.data.contactIds,
      })

      let queued = 0
      let cursor: string | undefined
      while (queued < totalTargets) {
        const contacts = await loadChannelTargetBatch(db, {
          appId: job.data.appId,
          channelType,
          contactIds: job.data.contactIds,
        }, cursor)

        if (contacts.length === 0) {
          break
        }

        const jobs = contacts.flatMap((contact) => {
          const to = channelType === 'EMAIL'
            ? contact.email
            : channelType === 'SMS'
              ? contact.phone
              : contact.id

          if (!to) {
            return []
          }

          return [{
            deliveryMode: 'channel' as const,
            notificationId: job.data.notificationId,
            appId: job.data.appId,
            channelId: resolvedChannelId,
            to,
            channelType,
            payload,
          }]
        })

        for (const batch of chunkArray(jobs, ENQUEUE_CHUNK_SIZE)) {
          await addSendNotificationJobs(batch)
        }

        queued += jobs.length
        cursor = contacts.at(-1)?.id
      }

      await db
        .update(notification)
        .set({
          totalTargets: queued,
          status: queued === 0 ? 'SENT' : 'PROCESSING',
          sentAt: queued === 0 ? now : undefined,
          updatedAt: now,
        })
        .where(eq(notification.id, job.data.notificationId))

      return
    }

    const totalTargets = await countPushTargets(db, {
      appId: job.data.appId,
      targetDevices: job.data.targetDevices,
      platforms: job.data.platforms,
    })

    let queued = 0
    let cursor: string | undefined
    while (queued < totalTargets) {
      const devices = await loadPushTargetBatch(db, {
        appId: job.data.appId,
        targetDevices: job.data.targetDevices,
        platforms: job.data.platforms,
      }, cursor)

      if (devices.length === 0) {
        break
      }

      const jobs = devices.map(device => ({
        deliveryMode: 'device' as const,
        notificationId: job.data.notificationId,
        deviceId: device.id,
        appId: job.data.appId,
        platform: device.platform.toLowerCase() as 'ios' | 'android' | 'web',
        token: device.token,
        webPushP256dh: device.webPushP256dh ?? undefined,
        webPushAuth: device.webPushAuth ?? undefined,
        payload: job.data.payload,
      }))

      for (const batch of chunkArray(jobs, ENQUEUE_CHUNK_SIZE)) {
        await addSendNotificationJobs(batch)
      }

      queued += jobs.length
      cursor = devices.at(-1)?.id
    }

    await db
      .update(notification)
      .set({
        totalTargets: queued,
        status: queued === 0 ? 'SENT' : 'PROCESSING',
        sentAt: queued === 0 ? now : undefined,
        updatedAt: now,
      })
      .where(eq(notification.id, job.data.notificationId))
  }
  catch (error) {
    await db
      .update(notification)
      .set({
        status: 'FAILED',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(notification.id, job.data.notificationId))

    throw error
  }
}

async function updateNotificationDeliveryProgress(
  notificationId: string,
  sentDelta: number,
  failedDelta: number,
) {
  const db = getDatabase()
  const now = new Date().toISOString()
  const [updated] = await db
    .update(notification)
    .set({
      totalSent: sentDelta > 0 ? sql`"totalSent" + ${sentDelta}` : sql`"totalSent"`,
      totalFailed: failedDelta > 0 ? sql`"totalFailed" + ${failedDelta}` : sql`"totalFailed"`,
      status: 'PROCESSING',
      sentAt: sentDelta > 0 ? sql`coalesce("sentAt", ${now})` : undefined,
      updatedAt: now,
    })
    .where(eq(notification.id, notificationId))
    .returning({
      totalTargets: notification.totalTargets,
      totalSent: notification.totalSent,
      totalFailed: notification.totalFailed,
    })

  if (!updated) {
    return
  }

  const terminalStatus = getNotificationTerminalStatus(
    updated.totalTargets,
    updated.totalSent,
    updated.totalFailed,
  )

  if (!terminalStatus || terminalStatus === 'PROCESSING') {
    return
  }

  await db
    .update(notification)
    .set({
      status: terminalStatus,
      sentAt: sql`coalesce("sentAt", ${now})`,
      updatedAt: now,
    })
    .where(eq(notification.id, notificationId))
}

async function processChannelDelivery(job: Job<SendNotificationJobData>) {
  if (job.data.deliveryMode !== 'channel')
    return

  const { notificationId, appId, channelId, to, payload } = job.data
  const db = getDatabase()

  // Pre-generate the deliveryLog ID so it can be embedded in tracking URLs
  const deliveryLogId = uuidv7()

  try {
    console.log(`[NotificationWorker] Channel job ${job.id}: ${job.data.channelType} → ${to || '(no recipient)'}`)
    const channel = await getChannelById(channelId)
    const result = await channel.send({
      to,
      subject: payload.title,
      body: payload.body,
      data: payload.data,
      trackingId: deliveryLogId,
      trackingBaseUrl: TRACKING_BASE_URL,
    })

    if (result.success) {
      console.log(`[NotificationWorker] Channel job ${job.id}: sent OK (msgId=${result.messageId})`)
    }
    else {
      console.error(`[NotificationWorker] Channel job ${job.id}: provider error — ${result.error}`)
    }

    await db.insert(deliveryLog).values({
      id: deliveryLogId,
      notificationId,
      to,
      status: result.success ? 'SENT' : 'FAILED',
      errorMessage: result.error,
      providerResponse: result.messageId ? { messageId: result.messageId } : null,
      sentAt: result.success ? new Date().toISOString() : null,
    })

    if (result.success) {
      await updateNotificationDeliveryProgress(notificationId, 1, 0)

      await dispatchHooks(appId, 'NOTIFICATION_SENT', {
        notificationId,
        channelId,
        messageId: result.messageId,
      })
    }
    else {
      await updateNotificationDeliveryProgress(notificationId, 0, 1)

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
  if (job.data.deliveryMode !== 'device')
    return

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
      await updateNotificationDeliveryProgress(notificationId, 1, 0)

      await dispatchHooks(appId, 'NOTIFICATION_SENT', {
        notificationId,
        deviceId,
        messageId: result.messageId,
      })
    }
    else {
      await updateNotificationDeliveryProgress(notificationId, 0, 1)

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
        await updateNotificationDeliveryProgress(notificationId, 0, 1)
      }
      catch (dbError) {
        console.error('[NotificationWorker] Failed to write delivery log:', dbError)
      }
    }

    throw error
  }
}

export async function processNotificationJob(job: Job<SendNotificationJobData | FanoutNotificationJobData>) {
  if (job.name === 'fanout-notification') {
    return processFanoutJob(job as Job<FanoutNotificationJobData>)
  }

  if (job.name !== 'send-notification') {
    return
  }

  const sendJob = job as Job<SendNotificationJobData>

  if (sendJob.data.deliveryMode === 'channel') {
    return processChannelDelivery(sendJob)
  }
  return processDeviceDelivery(sendJob)
}
