import { definePlugin } from 'nitro'
import { closeDatabase } from '#server/database/connection'
import { closeAllQueuesAndWorkers } from '#server/utils/bullmq'
import { closeRedis } from '#server/utils/redis'

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('close', async () => {
    console.log('[Shutdown] Closing workers and queues...')
    await closeAllQueuesAndWorkers()

    console.log('[Shutdown] Closing Redis...')
    await closeRedis()

    console.log('[Shutdown] Closing database...')
    await closeDatabase()

    console.log('[Shutdown] Done.')
  })
})
