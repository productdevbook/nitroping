import { index, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customJsonb, customTimestamp, uuidv7Generator } from '../shared'
import { app } from './app'
import { categoryEnum, deviceStatusEnum, platformEnum } from './enums'

export const device = pgTable('device', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  token: text().notNull(),
  category: categoryEnum(),
  platform: platformEnum().notNull(),
  userId: text(),
  status: deviceStatusEnum().default('ACTIVE').notNull(),
  metadata: customJsonb(),
  // WebPush subscription keys (required for Web Push encryption)
  webPushP256dh: text(),
  webPushAuth: text(),
  lastSeenAt: customTimestamp(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => [
  unique('device_app_token_user_unique').on(table.appId, table.token, table.userId),
  // Device list by app (most common query pattern)
  index('device_app_id_idx').on(table.appId),
  // Active device count per app
  index('device_app_id_status_idx').on(table.appId, table.status),
  // Token lookup for sendNotification targetDevices
  index('device_token_idx').on(table.token),
])

export const selectDeviceSchema = createSelectSchema(device)
export const insertDeviceSchema = createInsertSchema(device)
