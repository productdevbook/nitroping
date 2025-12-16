import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

interface MigrationJournal {
  version: string
  dialect: string
  entries: {
    idx: number
    version: string
    when: number
    tag: string
    breakpoints: boolean
  }[]
}

export interface MigrationResult {
  success: boolean
  message: string
  applied: string[]
}

export async function runMigrations(): Promise<MigrationResult> {
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/nitroping'
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  const applied: string[] = []

  try {
    const storage = useStorage('assets:migrations')

    const journal = await storage.getItem<MigrationJournal>('meta/_journal.json')
    if (!journal || !journal.entries) {
      await client.end()
      return { success: true, message: 'No migrations found', applied: [] }
    }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `)

    const existingMigrations = await db.execute<{ hash: string }>(sql`SELECT hash FROM "__drizzle_migrations"`)
    const appliedHashes = new Set(existingMigrations.map(r => r.hash))

    for (const entry of journal.entries) {
      if (appliedHashes.has(entry.tag)) {
        continue
      }

      const sqlContent = await storage.getItem<string>(`${entry.tag}.sql`)
      if (!sqlContent) {
        applied.push(`[SKIP] ${entry.tag} - file not found`)
        continue
      }

      const statements = sqlContent.split('--> statement-breakpoint')
      for (const stmt of statements) {
        const trimmed = stmt.trim()
        if (trimmed) {
          await db.execute(sql.raw(trimmed))
        }
      }

      await db.execute(sql`
        INSERT INTO "__drizzle_migrations" (hash, created_at)
        VALUES (${entry.tag}, ${Date.now()})
      `)

      applied.push(entry.tag)
    }

    return {
      success: true,
      message: applied.length > 0 ? `Applied ${applied.length} migration(s)` : 'All migrations already applied',
      applied,
    }
  }
  catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Migration failed',
      applied,
    }
  }
  finally {
    await client.end()
  }
}
