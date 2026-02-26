import type { Database } from './types'
import * as tables from '#server/database/schema'
import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'

export function createContactLoader(db: Database) {
  return new DataLoader<string, typeof tables.contact.$inferSelect | null>(
    async (ids) => {
      const rows = await db
        .select()
        .from(tables.contact)
        .where(inArray(tables.contact.id, ids as string[]))
      return ids.map(id => rows.find(r => r.id === id) || null)
    },
  )
}

export function createContactsByAppLoader(db: Database) {
  return new DataLoader<string, (typeof tables.contact.$inferSelect)[]>(
    async (appIds) => {
      const rows = await db
        .select()
        .from(tables.contact)
        .where(inArray(tables.contact.appId, appIds as string[]))
      return appIds.map(appId => rows.filter(r => r.appId === appId))
    },
  )
}

export function createDevicesByContactLoader(db: Database) {
  return new DataLoader<string, (typeof tables.device.$inferSelect)[]>(
    async (contactIds) => {
      // Join contactDevice → device
      const links = await db
        .select()
        .from(tables.contactDevice)
        .where(inArray(tables.contactDevice.subscriberId, contactIds as string[]))

      if (links.length === 0) {
        return contactIds.map(() => [])
      }

      const deviceIds = [...new Set(links.map(l => l.deviceId))]
      const devices = await db
        .select()
        .from(tables.device)
        .where(inArray(tables.device.id, deviceIds))

      return contactIds.map((contactId) => {
        const deviceIdSet = links
          .filter(l => l.subscriberId === contactId)
          .map(l => l.deviceId)
        return devices.filter(d => deviceIdSet.includes(d.id))
      })
    },
  )
}
