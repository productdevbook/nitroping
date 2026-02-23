import type { Database } from './types'
import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'
import * as tables from '#server/database/schema'

export function createDeviceLoader(db: Database) {
  return new DataLoader<string, typeof tables.device.$inferSelect | null>(
    async (ids) => {
      const devices = await db
        .select()
        .from(tables.device)
        .where(inArray(tables.device.id, ids as string[]))

      return ids.map(id => devices.find(device => device.id === id) || null)
    },
  )
}

export function createDevicesByAppLoader(db: Database) {
  return new DataLoader<string, (typeof tables.device.$inferSelect)[]>(
    async (appIds) => {
      const devices = await db
        .select()
        .from(tables.device)
        .where(inArray(tables.device.appId, appIds as string[]))

      return appIds.map(appId =>
        devices.filter(device => device.appId === appId),
      )
    },
  )
}
