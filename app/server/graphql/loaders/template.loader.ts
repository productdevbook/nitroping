import type { Database } from './types'
import * as tables from '#server/database/schema'
import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'

export function createTemplateLoader(db: Database) {
  return new DataLoader<string, typeof tables.template.$inferSelect | null>(
    async (ids) => {
      const rows = await db
        .select()
        .from(tables.template)
        .where(inArray(tables.template.id, ids as string[]))
      return ids.map(id => rows.find(r => r.id === id) || null)
    },
  )
}

export function createTemplatesByChannelLoader(db: Database) {
  return new DataLoader<string, (typeof tables.template.$inferSelect)[]>(
    async (channelIds) => {
      const rows = await db
        .select()
        .from(tables.template)
        .where(inArray(tables.template.channelId, channelIds as string[]))
      return channelIds.map(id => rows.filter(r => r.channelId === id))
    },
  )
}
