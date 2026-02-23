import type { Database } from './types'
import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'
import * as tables from '~~/server/database/schema'

export function createNotificationLoader(db: Database) {
  return new DataLoader<string, typeof tables.notification.$inferSelect | null>(
    async (ids) => {
      const notifications = await db
        .select()
        .from(tables.notification)
        .where(inArray(tables.notification.id, ids as string[]))

      return ids.map(id => notifications.find(notification => notification.id === id) || null)
    },
  )
}

export function createNotificationsByAppLoader(db: Database) {
  return new DataLoader<string, (typeof tables.notification.$inferSelect)[]>(
    async (appIds) => {
      const notifications = await db
        .select()
        .from(tables.notification)
        .where(inArray(tables.notification.appId, appIds as string[]))

      return appIds.map(appId =>
        notifications.filter(notification => notification.appId === appId),
      )
    },
  )
}
