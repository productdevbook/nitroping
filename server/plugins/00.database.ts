import { runMigrations } from '../utils/migrate'

export default defineNitroPlugin(async () => {
  // Skip in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('[Database] Skipping migrations in test environment')
    return
  }

  // Skip if AUTO_MIGRATE is explicitly disabled
  if (process.env.AUTO_MIGRATE === 'false') {
    console.log('[Database] Auto-migration disabled')
    return
  }

  const result = await runMigrations()

  if (result.success) {
    if (result.applied.length > 0) {
      for (const migration of result.applied) {
        console.log(`[Database] Applied migration: ${migration}`)
      }
      console.log(`[Database] ${result.applied.length} migration(s) applied successfully`)
    }
    else {
      console.log('[Database] All migrations already applied')
    }
  }
  else {
    console.error('[Database] Migration failed:', result.message)
  }
})
