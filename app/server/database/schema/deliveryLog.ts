import { index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customJsonb, customTimestamp, uuidv7Generator } from '../shared'
import { device } from './device'
import { deliveryStatusEnum } from './enums'
import { notification } from './notification'

export const deliveryLog = pgTable('deliveryLog', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  notificationId: uuid().notNull().references(() => notification.id, { onDelete: 'cascade' }),
  deviceId: uuid().references(() => device.id, { onDelete: 'cascade' }),
  to: text(), // channel recipient: email address, phone number, etc.
  status: deliveryStatusEnum().notNull(),
  providerResponse: customJsonb(),
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
}, table => [
  // Most frequent: look up all logs for a notification
  index('delivery_log_notification_id_idx').on(table.notificationId),
  // Analytics date-range queries
  index('delivery_log_created_at_idx').on(table.createdAt),
  // Status-based analytics (delivery rate calculations)
  index('delivery_log_status_idx').on(table.status),
  // Composite: notification + device (non-unique – allows multiple retry rows)
  index('delivery_log_notification_device_idx').on(table.notificationId, table.deviceId),
])

export const selectDeliveryLogSchema = createSelectSchema(deliveryLog)
export const insertDeliveryLogSchema = createInsertSchema(deliveryLog)
