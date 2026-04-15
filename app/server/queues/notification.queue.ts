import type { ChannelType } from '#server/database/schema/enums'
import { useQueue } from '#server/utils/bullmq'
import { getSendNotificationJobId } from '#server/utils/notificationJobId'

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
  channelType: ChannelType
}

export interface FanoutNotificationJobData extends BaseJobData {
  channelType?: ChannelType
  channelId?: string
  contactIds?: string[]
  targetDevices?: string[]
  platforms?: string[]
}

export type SendNotificationJobData = DeviceJobData | ChannelJobData

export function getNotificationQueue() {
  return useQueue<SendNotificationJobData | FanoutNotificationJobData>('notifications')
}

export async function addSendNotificationJob(data: SendNotificationJobData) {
  const queue = getNotificationQueue()
  return queue.add('send-notification', data, {
    jobId: getSendNotificationJobId(data),
  })
}

export async function addSendNotificationJobs(data: SendNotificationJobData[]) {
  if (data.length === 0) {
    return []
  }

  const queue = getNotificationQueue()
  return queue.addBulk(
    data.map(job => ({
      name: 'send-notification',
      data: job,
      opts: {
        jobId: getSendNotificationJobId(job),
      },
    })),
  )
}

export async function addFanoutNotificationJob(data: FanoutNotificationJobData) {
  const queue = getNotificationQueue()
  return queue.add('fanout-notification', data, {
    jobId: `fanout-${data.notificationId}`,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 10_000,
    },
  })
}

export async function closeNotificationQueue() {
  // handled by closeAllQueuesAndWorkers in plugin shutdown
}
