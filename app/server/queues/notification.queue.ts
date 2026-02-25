import { useQueue } from '#server/utils/bullmq'

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

export function getNotificationQueue() {
  return useQueue<SendNotificationJobData>('notifications')
}

export async function addSendNotificationJob(data: SendNotificationJobData) {
  const queue = getNotificationQueue()
  const job = await queue.add('send-notification', data)
  console.log(`[NotificationQueue] Job ${job.id} added (${data.deliveryMode})`)
  return job
}

export async function closeNotificationQueue() {
  // handled by closeAllQueuesAndWorkers in plugin shutdown
}
