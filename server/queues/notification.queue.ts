import { Queue } from 'bullmq'
import { getRedisConnection } from '../utils/redis'

export interface SendNotificationJobData {
  notificationId: string
  deviceId: string
  appId: string
  platform: 'ios' | 'android' | 'web'
  token: string
  webPushP256dh?: string
  webPushAuth?: string
  payload: {
    title: string
    body: string
    data?: Record<string, any>
    badge?: number
    sound?: string
    clickAction?: string
    imageUrl?: string
  }
}

export interface RetryNotificationJobData {
  notificationId: string
  deviceId: string
  appId: string
  platform: 'ios' | 'android' | 'web'
  token: string
  webPushP256dh?: string
  webPushAuth?: string
  payload: {
    title: string
    body: string
    data?: Record<string, any>
    badge?: number
    sound?: string
    clickAction?: string
    imageUrl?: string
  }
  attemptCount: number
  lastError?: string
}

export interface ProcessScheduledJobData {
  notificationId: string
}

let notificationQueue: Queue<SendNotificationJobData | RetryNotificationJobData | ProcessScheduledJobData> | null = null

export function getNotificationQueue() {
  if (!notificationQueue) {
    notificationQueue = new Queue('notifications', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 60000, // Start with 1 minute, then 2, 4, 8, 16 minutes
        },
        removeOnComplete: {
          count: 1000, // Keep last 1000 completed jobs
          age: 24 * 3600, // Keep for 24 hours
        },
        removeOnFail: {
          count: 5000, // Keep last 5000 failed jobs
          age: 7 * 24 * 3600, // Keep for 7 days
        },
      },
    })
  }
  return notificationQueue
}

export async function addSendNotificationJob(data: SendNotificationJobData) {
  const queue = getNotificationQueue()
  return queue.add('send-notification', data, {
    priority: 1,
  })
}

export async function addRetryNotificationJob(data: RetryNotificationJobData) {
  const queue = getNotificationQueue()
  return queue.add('retry-notification', data, {
    priority: 2,
    delay: 2 ** data.attemptCount * 60000, // Exponential backoff
  })
}

export async function addProcessScheduledJob(data: ProcessScheduledJobData, runAt: Date) {
  const queue = getNotificationQueue()
  const delay = Math.max(0, runAt.getTime() - Date.now())
  return queue.add('process-scheduled', data, {
    delay,
    priority: 3,
  })
}

export async function closeNotificationQueue() {
  if (notificationQueue) {
    await notificationQueue.close()
    notificationQueue = null
  }
}
