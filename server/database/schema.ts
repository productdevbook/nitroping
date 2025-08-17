import { relations } from 'drizzle-orm'
import { boolean, integer, jsonb, pgEnum, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'
import { customTimestamp, uuidv7Generator } from './shared'

// Enums
export const platformEnum = pgEnum('platform', ['IOS', 'ANDROID', 'WEB'])
export const notificationStatusEnum = pgEnum('notification_status', ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SCHEDULED'])
export const deviceStatusEnum = pgEnum('device_status', ['ACTIVE', 'INACTIVE', 'EXPIRED'])

// App table
export const app = pgTable('app', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  apiKey: text().notNull().unique(),
  fcmServerKey: text(),
  fcmProjectId: text(),
  apnsCertificate: text(),
  apnsKeyId: text(),
  apnsTeamId: text(),
  bundleId: text(),
  vapidPublicKey: text(),
  vapidPrivateKey: text(),
  vapidSubject: text(),
  isActive: boolean().default(true).notNull(),
  createdAt: customTimestamp('created_at').defaultNow().notNull(),
  updatedAt: customTimestamp('updated_at').defaultNow().notNull(),
})

// Device table
export const device = pgTable('device', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  token: text().notNull(),
  platform: platformEnum().notNull(),
  userId: text(),
  status: deviceStatusEnum().default('ACTIVE'),
  metadata: jsonb(),
  lastSeenAt: customTimestamp('last_seen_at'),
  createdAt: customTimestamp('created_at').defaultNow().notNull(),
  updatedAt: customTimestamp('updated_at').defaultNow().notNull(),
})

// Notification table
export const notification = pgTable('notification', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  body: text().notNull(),
  data: jsonb(),
  badge: integer(),
  sound: text(),
  clickAction: text(),
  icon: text(),
  image: text(),
  targetDevices: jsonb(), // Array of device IDs or filters
  platforms: jsonb(), // Array of platforms to target
  scheduledAt: customTimestamp('scheduled_at'),
  expiresAt: customTimestamp('expires_at'),
  status: notificationStatusEnum().default('PENDING'),
  totalTargets: integer().default(0),
  totalSent: integer().default(0),
  totalDelivered: integer().default(0),
  totalFailed: integer().default(0),
  totalClicked: integer().default(0),
  createdAt: customTimestamp('created_at').defaultNow().notNull(),
  updatedAt: customTimestamp('updated_at').defaultNow().notNull(),
})

// Delivery log table
export const deliveryLog = pgTable('deliveryLog', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  notificationId: uuid().notNull().references(() => notification.id, { onDelete: 'cascade' }),
  deviceId: uuid().notNull().references(() => device.id, { onDelete: 'cascade' }),
  status: notificationStatusEnum().notNull(),
  providerResponse: jsonb(),
  errorMessage: text(),
  attemptCount: integer().default(1),
  sentAt: customTimestamp('sent_at'),
  deliveredAt: customTimestamp('delivered_at'),
  openedAt: customTimestamp('opened_at'),
  clickedAt: customTimestamp('clicked_at'),
  platform: text(),
  userAgent: text(),
  appVersion: text(),
  osVersion: text(),
  createdAt: customTimestamp('created_at').defaultNow().notNull(),
}, table => ({
  // Unique constraint: one delivery log per notification per device
  uniqueNotificationDevice: unique().on(table.notificationId, table.deviceId),
}))

// API Key table (for authentication)
export const apiKey = pgTable('apiKey', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  key: text().notNull().unique(),
  permissions: jsonb(), // Array of permissions
  isActive: boolean().default(true),
  lastUsedAt: customTimestamp('last_used_at'),
  expiresAt: customTimestamp('expires_at'),
  createdAt: customTimestamp('created_at').defaultNow().notNull(),
  updatedAt: customTimestamp('updated_at').defaultNow().notNull(),
})

// Relations
export const appRelations = relations(app, ({ many }) => ({
  devices: many(device),
  notifications: many(notification),
  apiKeys: many(apiKey),
}))

export const deviceRelations = relations(device, ({ one, many }) => ({
  app: one(app, {
    fields: [device.appId],
    references: [app.id],
  }),
  deliveryLogs: many(deliveryLog),
}))

export const notificationRelations = relations(notification, ({ one, many }) => ({
  app: one(app, {
    fields: [notification.appId],
    references: [app.id],
  }),
  deliveryLogs: many(deliveryLog),
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

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  app: one(app, {
    fields: [apiKey.appId],
    references: [app.id],
  }),
}))
