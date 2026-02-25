import type { SendNotificationJobData } from '#server/queues/notification.queue'
import type { ExecuteWorkflowStepJobData, TriggerWorkflowJobData } from '#server/queues/workflow.queue'
import { definePlugin } from 'nitro'
import { closeDatabase } from '#server/database/connection'
import { getNotificationQueue } from '#server/queues/notification.queue'
import { getWorkflowQueue } from '#server/queues/workflow.queue'
import { closeAllQueuesAndWorkers, useWorker } from '#server/utils/bullmq'
import { processNotificationJob } from '#server/workers/notification.worker'
import { processWorkflowJob } from '#server/workers/workflow.worker'

export default definePlugin((nitroApp) => {
  console.log('[WorkerPlugin] Initializing...')
  if (import.meta.prerender) {
    console.log('[WorkerPlugin] Skipping (prerender)')
    return
  }

  // Eagerly initialize queues so BullMQ metadata exists in Redis before workers start
  getNotificationQueue()
  getWorkflowQueue()

  // Notification worker
  useWorker<SendNotificationJobData>('notifications', async (job) => {
    console.log(`[WorkerPlugin] Processor called for job ${job.id} (${job.name})`)
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
    await closeDatabase()
  })
})
