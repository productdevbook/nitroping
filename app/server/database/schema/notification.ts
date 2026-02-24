import { index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customJsonb, customTimestamp, uuidv7Generator } from '../shared'
import { app } from './app'
import { notificationStatusEnum } from './enums'

export const notification = pgTable('notification', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  body: text().notNull(),
  data: customJsonb(),
  badge: integer(),
  sound: text(),
  clickAction: text(),
  icon: text(),
  image: text(),
  imageUrl: text(),
  targetDevices: customJsonb(),
  platforms: customJsonb(),
  scheduledAt: customTimestamp(),
  expiresAt: customTimestamp(),
  status: notificationStatusEnum().default('PENDING').notNull(),
  totalTargets: integer().default(0).notNull(),
  totalSent: integer().default(0).notNull(),
  totalDelivered: integer().default(0).notNull(),
  totalFailed: integer().default(0).notNull(),
  totalClicked: integer().default(0).notNull(),
  sentAt: customTimestamp(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => [
  // Scheduler polls this every minute: WHERE status='SCHEDULED' AND scheduledAt<=now
  index('notification_status_scheduled_at_idx').on(table.status, table.scheduledAt),
  // App-scoped notification list queries
  index('notification_app_id_idx').on(table.appId),
  // Analytics date-range queries
  index('notification_created_at_idx').on(table.createdAt),
])

export const selectNotificationSchema = createSelectSchema(notification)
export const insertNotificationSchema = createInsertSchema(notification)
