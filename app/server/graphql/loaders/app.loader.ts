import type { Database } from './types'
import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'
import * as tables from '#server/database/schema'

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
