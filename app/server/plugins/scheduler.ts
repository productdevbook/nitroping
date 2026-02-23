import { and, eq, inArray, lte } from 'drizzle-orm'
import { definePlugin } from 'nitro'
import { getDatabase } from '../database/connection'
import { device, notification } from '../database/schema'
import { addSendNotificationJob } from '../queues/notification.queue'

const SCHEDULER_INTERVAL = 60000 // 1 minute
const BATCH_SIZE = 100

let schedulerInterval: ReturnType<typeof setInterval> | null = null

async function processScheduledNotifications() {
  const db = getDatabase()

  try {
    // Find notifications that are scheduled and due
    const dueNotifications = await db
      .select()
      .from(notification)
      .where(
        and(
          eq(notification.status, 'SCHEDULED'),
          lte(notification.scheduledAt, new Date().toISOString()),
        ),
      )
      .limit(BATCH_SIZE)

    if (dueNotifications.length === 0) {
      return
    }

    console.log(`[Scheduler] Found ${dueNotifications.length} scheduled notifications to process`)

    for (const notif of dueNotifications) {
      try {
        // Mark as PENDING to prevent duplicate processing
        await db
          .update(notification)
          .set({ status: 'PENDING', updatedAt: new Date().toISOString() })
          .where(eq(notification.id, notif.id))

        // Get target devices
        let targetDevices = []

        if (notif.targetDevices && (notif.targetDevices as string[]).length > 0) {
          // Specific devices
          targetDevices = await db
            .select()
            .from(device)
            .where(inArray(device.token, notif.targetDevices as string[]))
        }
        else {
          // All devices for app (optionally filtered by platform)
          const whereConditions = [eq(device.appId, notif.appId)]

          if (notif.platforms && (notif.platforms as string[]).length > 0) {
            whereConditions.push(inArray(device.platform, notif.platforms as any))
          }

          targetDevices = await db
            .select()
            .from(device)
            .where(and(...whereConditions))
        }

        // Update target count
        await db
          .update(notification)
          .set({ totalTargets: targetDevices.length })
          .where(eq(notification.id, notif.id))

        if (targetDevices.length === 0) {
          // No devices to send to, mark as sent
          await db
            .update(notification)
            .set({
              status: 'SENT',
              sentAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(notification.id, notif.id))
          continue
        }

        // Queue jobs for each device
        for (const dev of targetDevices) {
          await addSendNotificationJob({
            notificationId: notif.id,
            deviceId: dev.id,
            appId: notif.appId,
            platform: dev.platform.toLowerCase() as 'ios' | 'android' | 'web',
            token: dev.token,
            webPushP256dh: dev.webPushP256dh || undefined,
            webPushAuth: dev.webPushAuth || undefined,
            payload: {
              title: notif.title,
              body: notif.body,
              data: notif.data as Record<string, any> | undefined,
              badge: notif.badge || undefined,
              sound: notif.sound || undefined,
              clickAction: notif.clickAction || undefined,
              imageUrl: notif.imageUrl || undefined,
            },
          })
        }

        // Update status to SENT
        await db
          .update(notification)
          .set({
            status: 'SENT',
            sentAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(notification.id, notif.id))

        console.log(`[Scheduler] Queued ${targetDevices.length} jobs for notification ${notif.id}`)
      }
      catch (error) {
        console.error(`[Scheduler] Error processing notification ${notif.id}:`, error)

        // Mark as failed
        await db
          .update(notification)
          .set({
            status: 'FAILED',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(notification.id, notif.id))
      }
    }
  }
  catch (error) {
    console.error('[Scheduler] Error in processScheduledNotifications:', error)
  }
}

function startScheduler() {
  if (schedulerInterval) {
    console.log('[Scheduler] Already running')
    return
  }

  // Run immediately on start
  processScheduledNotifications()

  // Then run every interval
  schedulerInterval = setInterval(processScheduledNotifications, SCHEDULER_INTERVAL)

  console.log(`[Scheduler] Started (interval: ${SCHEDULER_INTERVAL}ms)`)
}

function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
    console.log('[Scheduler] Stopped')
  }
}

export default definePlugin((nitroApp) => {
  // Only start scheduler if enabled
  if (process.env.SCHEDULER_ENABLED === 'false') {
    console.log('[Scheduler] Disabled via environment variable')
    return
  }

  // Only start scheduler if not in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('[Scheduler] Skipping in test environment')
    return
  }

  // Start the scheduler
  try {
    startScheduler()
  }
  catch (error) {
    console.error('[Scheduler] Failed to start:', error)
  }

  // Handle graceful shutdown
  nitroApp.hooks.hook('close', () => {
    stopScheduler()
  })
})
