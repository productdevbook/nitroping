import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var __pgClient: ReturnType<typeof postgres> | undefined
  // eslint-disable-next-line vars-on-top, no-var
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined
}

export function getDatabase() {
  if (!globalThis.__db) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/nitroping'
    const client = postgres(connectionString, { max: 5 })
    globalThis.__pgClient = client
    globalThis.__db = drizzle({ client, schema })
  }
  return globalThis.__db
}

export async function closeDatabase() {
  if (globalThis.__pgClient) {
    await globalThis.__pgClient.end()
    globalThis.__pgClient = undefined
    globalThis.__db = undefined
  }
}
