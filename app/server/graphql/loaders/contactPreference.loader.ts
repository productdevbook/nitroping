import type { Database } from './types'
import * as tables from '#server/database/schema'
import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'

export function createPreferencesByContactLoader(db: Database) {
  return new DataLoader<string, (typeof tables.contactPreference.$inferSelect)[]>(
    async (contactIds) => {
      const rows = await db
        .select()
        .from(tables.contactPreference)
        .where(inArray(tables.contactPreference.subscriberId, contactIds as string[]))
      return contactIds.map(id => rows.filter(r => r.subscriberId === id))
    },
  )
}
