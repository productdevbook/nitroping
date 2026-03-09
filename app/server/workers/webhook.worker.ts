import type { DispatchWebhookJobData } from '#server/queues/webhook.queue'
import type { Job } from 'bullmq'
import { deliverHooksForEvent } from '#server/utils/webhookDispatcher'

export async function processWebhookJob(job: Job<DispatchWebhookJobData>) {
  if (job.name !== 'dispatch-webhook') {
    return
  }

  const { appId, event, payload, occurredAt } = job.data
  await deliverHooksForEvent(appId, event, payload, occurredAt)
}
