import { definePlugin } from 'nitro'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { resolve } from 'node:path'

export default definePlugin(async () => {
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/nitroping'
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle({ client })

  // Production: /app/migrations (copied by Dockerfile)
  // Development: server/database/migrations (relative to cwd)
  const migrationsFolder = process.env.NODE_ENV === 'production'
    ? '/app/migrations'
    : resolve(process.cwd(), 'server/database/migrations')

  console.log('[migrate] Running migrations...')
  await migrate(db, { migrationsFolder })
  console.log('[migrate] Migrations applied successfully')

  await client.end()
})
