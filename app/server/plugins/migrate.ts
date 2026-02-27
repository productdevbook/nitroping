import { resolve } from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { definePlugin } from 'nitro'
import postgres from 'postgres'

const MAX_RETRIES = 10
const RETRY_DELAY_MS = 3000

export default definePlugin(async () => {
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/nitroping'

  // Production: /app/migrations (copied by Dockerfile)
  // Development: server/database/migrations (relative to cwd)
  const migrationsFolder = process.env.NODE_ENV === 'production'
    ? '/app/migrations'
    : resolve(process.cwd(), 'server/database/migrations')

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const client = postgres(connectionString, { max: 1, connect_timeout: 10 })
    try {
      console.log(`[migrate] Running migrations (attempt ${attempt}/${MAX_RETRIES})...`)
      await migrate(drizzle({ client }), { migrationsFolder })
      console.log('[migrate] Migrations applied successfully')
      return
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (attempt === MAX_RETRIES) {
        console.error(`[migrate] Failed after ${MAX_RETRIES} attempts:`, message)
        throw err
      }
      console.warn(`[migrate] Attempt ${attempt} failed (${message}), retrying in ${RETRY_DELAY_MS / 1000}s...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
    }
    finally {
      await client.end()
    }
  }
})
