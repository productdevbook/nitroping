import type { HookEvent } from '#server/utils/webhookDispatcher'
import { useQueue } from '#server/utils/bullmq'

export interface DispatchWebhookJobData {
  appId: string
  event: HookEvent
  payload: Record<string, unknown>
  occurredAt?: string
}

export function getWebhookQueue() {
  return useQueue<DispatchWebhookJobData>('webhooks')
}

export async function addDispatchWebhookJob(data: DispatchWebhookJobData) {
  const queue = getWebhookQueue()
  return queue.add('dispatch-webhook', data)
}
