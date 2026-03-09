import { useQueue } from '#server/utils/bullmq'

export interface TrackNotificationEventJobData {
  type: 'open' | 'click'
  deliveryLogId: string
  destination?: string
}

export function getTrackingQueue() {
  return useQueue<TrackNotificationEventJobData>('tracking')
}

export async function addTrackNotificationEventJob(data: TrackNotificationEventJobData) {
  const queue = getTrackingQueue()
  return queue.add('track-notification-event', data)
}
