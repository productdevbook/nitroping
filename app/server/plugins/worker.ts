import type { FanoutNotificationJobData, SendNotificationJobData } from '#server/queues/notification.queue'
import type { TrackNotificationEventJobData } from '#server/queues/tracking.queue'
import type { DispatchWebhookJobData } from '#server/queues/webhook.queue'
import type { ExecuteWorkflowStepJobData, TriggerWorkflowJobData } from '#server/queues/workflow.queue'
import { getNotificationQueue } from '#server/queues/notification.queue'
import { getTrackingQueue } from '#server/queues/tracking.queue'
import { getWebhookQueue } from '#server/queues/webhook.queue'
import { getWorkflowQueue } from '#server/queues/workflow.queue'
import { useWorker } from '#server/utils/bullmq'
import { processNotificationJob } from '#server/workers/notification.worker'
import { processTrackingJob } from '#server/workers/tracking.worker'
import { processWebhookJob } from '#server/workers/webhook.worker'
import { processWorkflowJob } from '#server/workers/workflow.worker'
import { definePlugin } from 'nitro'

function isWorkerEnabled(envName: string) {
  return process.env[envName] !== 'false'
}

export default definePlugin((_nitroApp) => {
  console.log('[WorkerPlugin] Initializing...')
  if (import.meta.prerender) {
    console.log('[WorkerPlugin] Skipping (prerender)')
    return
  }

  const notificationWorkerEnabled = isWorkerEnabled('NOTIFICATION_WORKER_ENABLED')
  const trackingWorkerEnabled = isWorkerEnabled('TRACKING_WORKER_ENABLED')
  const webhookWorkerEnabled = isWorkerEnabled('WEBHOOK_WORKER_ENABLED')
  const workflowWorkerEnabled = isWorkerEnabled('WORKFLOW_WORKER_ENABLED')

  if (notificationWorkerEnabled)
    getNotificationQueue()
  if (trackingWorkerEnabled)
    getTrackingQueue()
  if (webhookWorkerEnabled)
    getWebhookQueue()
  if (workflowWorkerEnabled)
    getWorkflowQueue()

  if (notificationWorkerEnabled) {
    useWorker<SendNotificationJobData | FanoutNotificationJobData>('notifications', processNotificationJob)
  }

  if (trackingWorkerEnabled) {
    useWorker<TrackNotificationEventJobData>('tracking', processTrackingJob, {
      concurrency: 50,
    })
  }

  if (webhookWorkerEnabled) {
    useWorker<DispatchWebhookJobData>('webhooks', processWebhookJob, {
      concurrency: 20,
    })
  }

  if (workflowWorkerEnabled) {
    useWorker<TriggerWorkflowJobData | ExecuteWorkflowStepJobData>('workflows', async (job) => {
      return processWorkflowJob(job)
    }, { concurrency: 5 })
  }
})
