import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from '../database/schema'

export default defineNitroPlugin(async () => {
  const shouldMigrate = process.env.AUTO_MIGRATE !== 'false'
  const isDev = process.env.NODE_ENV === 'development'

  if (!shouldMigrate) {
    console.log('[database-migrate] Auto migration disabled')
    return
  }

  // Development'ta silent mode
  const silentMode = isDev

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('[database-migrate] DATABASE_URL not found, skipping migration')
    return
  }

  let migrationClient: ReturnType<typeof postgres> | null = null

  try {
    if (!silentMode) {
      console.log('[database-migrate] Starting database migration...')
    }

    // PostgreSQL NOTICE mesajlarını bastır (silent mode için)
    migrationClient = postgres(connectionString, {
      max: 1,
      onnotice: silentMode ? () => {} : undefined, // Silent mode'da NOTICE'ları gizle
    })
    const migrationDb = drizzle(migrationClient, { schema })

    // Plugin dosyasının konumundan relative path ile migration klasörünü bul
    const currentFileUrl = import.meta.url
    const currentDir = dirname(fileURLToPath(currentFileUrl))

    const migrationsPath = isDev
      ? './server/database/migrations' // development: root'tan absolute
      : join(currentDir, '../migrations') // production: plugin konumundan relative

    if (!silentMode) {
      console.log('[database-migrate] Using migrations path:', migrationsPath)
    }

    await migrate(migrationDb, {
      migrationsFolder: migrationsPath,
    })

    if (!silentMode) {
      console.log('[database-migrate] ✅ Database migration completed successfully')
    }
  }
  catch (error: any) {
    console.error('[database-migrate] Error details:', {
      message: error?.message,
      cause: error?.cause,
      code: error?.cause?.code,
    })
  }
  finally {
    if (migrationClient) {
      await migrationClient.end()
      if (!silentMode) {
        console.log('[database-migrate] Migration client connection closed')
      }
    }
  }
})
