import { definePlugin } from 'nitro'
import { startNotificationWorker, stopNotificationWorker } from '../workers/notification.worker'
import { startWorkflowWorker, stopWorkflowWorker } from '../workers/workflow.worker'

export default definePlugin((nitroApp) => {
  // Only start workers if not in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('[WorkerPlugin] Skipping workers in test environment')
    return
  }

  // Start the notification worker
  try {
    startNotificationWorker()
    console.log('[WorkerPlugin] Notification worker started')
  }
  catch (error) {
    console.error('[WorkerPlugin] Failed to start notification worker:', error)
  }

  // Start the workflow worker
  try {
    startWorkflowWorker()
    console.log('[WorkerPlugin] Workflow worker started')
  }
  catch (error) {
    console.error('[WorkerPlugin] Failed to start workflow worker:', error)
  }

  // Handle graceful shutdown
  nitroApp.hooks.hook('close', async () => {
    console.log('[WorkerPlugin] Shutting down workers...')
    await Promise.all([stopNotificationWorker(), stopWorkflowWorker()])
  })
})
