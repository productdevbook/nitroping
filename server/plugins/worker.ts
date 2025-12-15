import { startNotificationWorker, stopNotificationWorker } from '../workers/notification.worker'

export default defineNitroPlugin((nitroApp) => {
  // Only start worker if not in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('[WorkerPlugin] Skipping worker in test environment')
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

  // Handle graceful shutdown
  nitroApp.hooks.hook('close', async () => {
    console.log('[WorkerPlugin] Shutting down worker...')
    await stopNotificationWorker()
  })
})
