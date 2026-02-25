import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Use globalThis so the connection pool survives Nitro dev HMR module reloads.
// Without this, each reload creates a new pool and PostgreSQL runs out of connections.
declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined
}

export function getDatabase() {
  if (!globalThis.__db) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/nitroping'
    const client = postgres(connectionString, { max: 10 })
    globalThis.__db = drizzle({ client, schema })
  }
  return globalThis.__db
}
