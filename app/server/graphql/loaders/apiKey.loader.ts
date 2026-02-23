import type { Database } from './types'
import * as tables from '#server/database/schema'
import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'

export function createApiKeyLoader(db: Database) {
  return new DataLoader<string, typeof tables.apiKey.$inferSelect | null>(
    async (ids) => {
      const apiKeys = await db
        .select()
        .from(tables.apiKey)
        .where(inArray(tables.apiKey.id, ids as string[]))

      return ids.map(id => apiKeys.find(key => key.id === id) || null)
    },
  )
}

export function createApiKeysByAppLoader(db: Database) {
  return new DataLoader<string, (typeof tables.apiKey.$inferSelect)[]>(
    async (appIds) => {
      const apiKeys = await db
        .select()
        .from(tables.apiKey)
        .where(inArray(tables.apiKey.appId, appIds as string[]))

      return appIds.map(appId =>
        apiKeys.filter(key => key.appId === appId),
      )
    },
  )
}
