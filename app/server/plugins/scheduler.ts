import { and, eq, lte } from 'drizzle-orm'
import { definePlugin } from 'nitro'
import { getDatabase } from '../database/connection'
import { notification } from '../database/schema'
import { addFanoutNotificationJob } from '../queues/notification.queue'

const SCHEDULER_INTERVAL = Number.parseInt(process.env.SCHEDULER_INTERVAL_MS || '5000')
const BATCH_SIZE = Number.parseInt(process.env.SCHEDULER_BATCH_SIZE || '500')

let schedulerInterval: ReturnType<typeof setInterval> | null = null
let isSchedulerRunning = false

async function processScheduledNotifications() {
  if (isSchedulerRunning) {
    return
  }

  isSchedulerRunning = true
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
      .orderBy(notification.scheduledAt, notification.id)
      .limit(BATCH_SIZE)

    if (dueNotifications.length === 0) {
      return
    }

    console.log(`[Scheduler] Found ${dueNotifications.length} scheduled notifications to process`)

    for (const notif of dueNotifications) {
      try {
        const now = new Date().toISOString()
        const claimedRows = await db
          .update(notification)
          .set({ status: 'PENDING', updatedAt: now })
          .where(and(eq(notification.id, notif.id), eq(notification.status, 'SCHEDULED')))
          .returning({ id: notification.id })

        if (!claimedRows[0]) {
          continue
        }

        await addFanoutNotificationJob({
          notificationId: notif.id,
          appId: notif.appId,
          channelType: notif.channelType || undefined,
          channelId: notif.channelId || undefined,
          contactIds: (notif.contactIds as string[] | null) || undefined,
          targetDevices: (notif.targetDevices as string[] | null) || undefined,
          platforms: (notif.platforms as string[] | null) || undefined,
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

        await db
          .update(notification)
          .set({
            status: 'QUEUED',
            updatedAt: now,
          })
          .where(eq(notification.id, notif.id))
      }
      catch (error) {
        console.error(`[Scheduler] Error processing notification ${notif.id}:`, error)

        await db
          .update(notification)
          .set({
            status: 'SCHEDULED',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(notification.id, notif.id))
      }
    }
  }
  catch (error) {
    console.error('[Scheduler] Error in processScheduledNotifications:', error)
  }
  finally {
    isSchedulerRunning = false
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
