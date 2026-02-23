import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let db: ReturnType<typeof drizzle<typeof schema>>

export function getDatabase() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/nitroping'
    const client = postgres(connectionString)
    db = drizzle({ client, schema })
  }
  return db
}
