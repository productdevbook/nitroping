import type { getDatabase } from '~~/server/database/connection'
import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'
import * as tables from '~~/server/database/schema'

type Database = ReturnType<typeof getDatabase>

export interface DataLoaders {
  appLoader: DataLoader<string, typeof tables.app.$inferSelect | null>
  deviceLoader: DataLoader<string, typeof tables.device.$inferSelect | null>
  notificationLoader: DataLoader<string, typeof tables.notification.$inferSelect | null>
  devicesByAppLoader: DataLoader<string, (typeof tables.device.$inferSelect)[]>
  notificationsByAppLoader: DataLoader<string, (typeof tables.notification.$inferSelect)[]>
}

export function createDataLoaders(db: Database): DataLoaders {
  const appLoader = new DataLoader<string, typeof tables.app.$inferSelect | null>(
    async (ids) => {
      const apps = await db
        .select()
        .from(tables.app)
        .where(inArray(tables.app.id, ids as string[]))

      return ids.map(id => apps.find(app => app.id === id) || null)
    },
  )

  const deviceLoader = new DataLoader<string, typeof tables.device.$inferSelect | null>(
    async (ids) => {
      const devices = await db
        .select()
        .from(tables.device)
        .where(inArray(tables.device.id, ids as string[]))

      return ids.map(id => devices.find(device => device.id === id) || null)
    },
  )

  const notificationLoader = new DataLoader<string, typeof tables.notification.$inferSelect | null>(
    async (ids) => {
      const notifications = await db
        .select()
        .from(tables.notification)
        .where(inArray(tables.notification.id, ids as string[]))

      return ids.map(id => notifications.find(notification => notification.id === id) || null)
    },
  )

  const devicesByAppLoader = new DataLoader<string, (typeof tables.device.$inferSelect)[]>(
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

  const notificationsByAppLoader = new DataLoader<string, (typeof tables.notification.$inferSelect)[]>(
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

  return {
    appLoader,
    deviceLoader,
    notificationLoader,
    devicesByAppLoader,
    notificationsByAppLoader,
  }
}
