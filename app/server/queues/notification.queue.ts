import { Queue } from 'bullmq'
import { getRedisConnection } from '../utils/redis'

interface BaseJobData {
  notificationId: string
  appId: string
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

interface DeviceJobData extends BaseJobData {
  deliveryMode: 'device'
  deviceId: string
  platform: 'ios' | 'android' | 'web'
  token: string
  webPushP256dh?: string
  webPushAuth?: string
}

interface ChannelJobData extends BaseJobData {
  deliveryMode: 'channel'
  channelId: string
  to: string
  channelType: 'EMAIL' | 'SMS' | 'IN_APP' | 'DISCORD'
}

export type SendNotificationJobData = DeviceJobData | ChannelJobData

let notificationQueue: Queue<SendNotificationJobData> | null = null

export function getNotificationQueue() {
  if (!notificationQueue) {
    notificationQueue = new Queue('notifications', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        // BullMQ owns retry – no manual re-queuing needed in the worker
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 60_000, // 1 min → 2 → 4 → 8 → 16 min
        },
        removeOnComplete: {
          count: 1000,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 5000,
          age: 7 * 24 * 3600,
        },
      },
    })
  }
  return notificationQueue
}

export async function addSendNotificationJob(data: SendNotificationJobData) {
  const queue = getNotificationQueue()
  return queue.add('send-notification', data, { priority: 1 })
}

export async function closeNotificationQueue() {
  if (notificationQueue) {
    await notificationQueue.close()
    notificationQueue = null
  }
}
