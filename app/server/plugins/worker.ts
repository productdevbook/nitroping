import type { SendNotificationJobData } from '#server/queues/notification.queue'
import type { ExecuteWorkflowStepJobData, TriggerWorkflowJobData } from '#server/queues/workflow.queue'
import { definePlugin } from 'nitro'
import { closeAllQueuesAndWorkers, useWorker } from '#server/utils/bullmq'
import { processNotificationJob } from '#server/workers/notification.worker'
import { processWorkflowJob } from '#server/workers/workflow.worker'

export default definePlugin((nitroApp) => {
  if (import.meta.prerender)
    return

  // Notification worker
  useWorker<SendNotificationJobData>('notifications', async (job) => {
    if (job.name === 'send-notification') {
      return processNotificationJob(job)
    }
    console.warn(`[NotificationWorker] Unknown job: ${job.name}`)
    return undefined
  })

  // Workflow worker
  useWorker<TriggerWorkflowJobData | ExecuteWorkflowStepJobData>('workflows', async (job) => {
    return processWorkflowJob(job)
  }, { concurrency: 5 })

  nitroApp.hooks.hook('close', async () => {
    console.log('[WorkerPlugin] Shutting down...')
    await closeAllQueuesAndWorkers()
  })
})
