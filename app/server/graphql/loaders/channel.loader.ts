import type { Database } from './types'
import * as tables from '#server/database/schema'
import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'

export function createChannelLoader(db: Database) {
  return new DataLoader<string, typeof tables.channel.$inferSelect | null>(
    async (ids) => {
      const rows = await db
        .select()
        .from(tables.channel)
        .where(inArray(tables.channel.id, ids as string[]))
      return ids.map(id => rows.find(r => r.id === id) || null)
    },
  )
}

export function createChannelsByAppLoader(db: Database) {
  return new DataLoader<string, (typeof tables.channel.$inferSelect)[]>(
    async (appIds) => {
      const rows = await db
        .select()
        .from(tables.channel)
        .where(inArray(tables.channel.appId, appIds as string[]))
      return appIds.map(appId => rows.filter(r => r.appId === appId))
    },
  )
}
