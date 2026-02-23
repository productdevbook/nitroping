import type { Database } from './types'
import * as tables from '#server/database/schema'
import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'

export function createDeliveryLogLoader(db: Database) {
  return new DataLoader<string, typeof tables.deliveryLog.$inferSelect | null>(
    async (ids) => {
      const deliveryLogs = await db
        .select()
        .from(tables.deliveryLog)
        .where(inArray(tables.deliveryLog.id, ids as string[]))

      return ids.map(id => deliveryLogs.find(log => log.id === id) || null)
    },
  )
}

export function createDeliveryLogsByNotificationLoader(db: Database) {
  return new DataLoader<string, (typeof tables.deliveryLog.$inferSelect)[]>(
    async (notificationIds) => {
      const deliveryLogs = await db
        .select()
        .from(tables.deliveryLog)
        .where(inArray(tables.deliveryLog.notificationId, notificationIds as string[]))

      return notificationIds.map(notificationId =>
        deliveryLogs.filter(log => log.notificationId === notificationId),
      )
    },
  )
}

export function createDeliveryLogsByDeviceLoader(db: Database) {
  return new DataLoader<string, (typeof tables.deliveryLog.$inferSelect)[]>(
    async (deviceIds) => {
      const deliveryLogs = await db
        .select()
        .from(tables.deliveryLog)
        .where(inArray(tables.deliveryLog.deviceId, deviceIds as string[]))

      return deviceIds.map(deviceId =>
        deliveryLogs.filter(log => log.deviceId === deviceId),
      )
    },
  )
}
