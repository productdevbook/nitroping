import type { Database } from './types'
import * as tables from '#server/database/schema'
import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'

export function createPreferencesBySubscriberLoader(db: Database) {
  return new DataLoader<string, (typeof tables.subscriberPreference.$inferSelect)[]>(
    async (subscriberIds) => {
      const rows = await db
        .select()
        .from(tables.subscriberPreference)
        .where(inArray(tables.subscriberPreference.subscriberId, subscriberIds as string[]))
      return subscriberIds.map(id => rows.filter(r => r.subscriberId === id))
    },
  )
}
