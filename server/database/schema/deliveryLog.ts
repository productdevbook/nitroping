import { relations } from 'drizzle-orm'
import { integer, jsonb, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'
import { customTimestamp, uuidv7Generator } from '../shared'
import { device } from './device'
import { deliveryStatusEnum } from './enums'
import { notification } from './notification'

export const deliveryLog = pgTable('deliveryLog', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  notificationId: uuid().notNull().references(() => notification.id, { onDelete: 'cascade' }),
  deviceId: uuid().notNull().references(() => device.id, { onDelete: 'cascade' }),
  status: deliveryStatusEnum().notNull(),
  providerResponse: jsonb(),
  errorMessage: text(),
  attemptCount: integer().default(1),
  sentAt: customTimestamp(),
  deliveredAt: customTimestamp(),
  openedAt: customTimestamp(),
  clickedAt: customTimestamp(),
  platform: text(),
  userAgent: text(),
  appVersion: text(),
  osVersion: text(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => ({
  uniqueNotificationDevice: unique().on(table.notificationId, table.deviceId),
}))

export const deliveryLogRelations = relations(deliveryLog, ({ one }) => ({
  notification: one(notification, {
    fields: [deliveryLog.notificationId],
    references: [notification.id],
  }),
  device: one(device, {
    fields: [deliveryLog.deviceId],
    references: [device.id],
  }),
}))
