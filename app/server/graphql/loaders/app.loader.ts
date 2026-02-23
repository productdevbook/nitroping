import type { Database } from './types'
import * as tables from '#server/database/schema'
import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'

export function createAppLoader(db: Database) {
  return new DataLoader<string, typeof tables.app.$inferSelect | null>(
    async (ids) => {
      const apps = await db
        .select()
        .from(tables.app)
        .where(inArray(tables.app.id, ids as string[]))

      return ids.map(id => apps.find(app => app.id === id) || null)
    },
  )
}
