import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let pgClient: ReturnType<typeof postgres> | undefined
let db: ReturnType<typeof drizzle<typeof schema>> | undefined

export function getDatabase() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/nitroping'
    pgClient = postgres(connectionString, { max: 3, idle_timeout: 30 })
    db = drizzle({ client: pgClient, schema })
  }
  return db
}

export async function closeDatabase() {
  if (pgClient) {
    await pgClient.end()
    pgClient = undefined
    db = undefined
  }
}
