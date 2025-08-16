import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const platformEnum = pgEnum('platform', ['ios', 'android', 'web'])
export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'sent', 'delivered', 'failed', 'expired'])
export const deviceStatusEnum = pgEnum('device_status', ['active', 'inactive', 'invalid'])

// App table
export const app = pgTable('app', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  apiKey: text().notNull().unique(),
  fcmServerKey: text(),
  fcmProjectId: text(),
  apnsCertificate: text(),
  apnsKeyId: text(),
  apnsTeamId: text(),
  vapidPublicKey: text(),
  vapidPrivateKey: text(),
  vapidSubject: text(),
  isActive: boolean().default(true),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow()
})

// Device table
export const device = pgTable('device', {
  id: uuid().primaryKey().defaultRandom(),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  token: text().notNull(),
  platform: platformEnum().notNull(),
  userId: text(),
  status: deviceStatusEnum().default('active'),
  metadata: jsonb(),
  lastSeenAt: timestamp(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow()
})

// Notification table
export const notification = pgTable('notification', {
  id: uuid().primaryKey().defaultRandom(),
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
  scheduledAt: timestamp(),
  expiresAt: timestamp(),
  status: notificationStatusEnum().default('pending'),
  totalTargets: integer().default(0),
  totalSent: integer().default(0),
  totalDelivered: integer().default(0),
  totalFailed: integer().default(0),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow()
})

// Delivery log table
export const deliveryLog = pgTable('deliveryLog', {
  id: uuid().primaryKey().defaultRandom(),
  notificationId: uuid().notNull().references(() => notification.id, { onDelete: 'cascade' }),
  deviceId: uuid().notNull().references(() => device.id, { onDelete: 'cascade' }),
  status: notificationStatusEnum().notNull(),
  providerResponse: jsonb(),
  errorMessage: text(),
  attemptCount: integer().default(1),
  sentAt: timestamp(),
  deliveredAt: timestamp(),
  createdAt: timestamp().defaultNow()
})

// API Key table (for authentication)
export const apiKey = pgTable('apiKey', {
  id: uuid().primaryKey().defaultRandom(),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  key: text().notNull().unique(),
  permissions: jsonb(), // Array of permissions
  isActive: boolean().default(true),
  lastUsedAt: timestamp(),
  expiresAt: timestamp(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow()
})

// Relations
export const appRelations = relations(app, ({ many }) => ({
  devices: many(device),
  notifications: many(notification),
  apiKeys: many(apiKey)
}))

export const deviceRelations = relations(device, ({ one, many }) => ({
  app: one(app, {
    fields: [device.appId],
    references: [app.id]
  }),
  deliveryLogs: many(deliveryLog)
}))

export const notificationRelations = relations(notification, ({ one, many }) => ({
  app: one(app, {
    fields: [notification.appId],
    references: [app.id]
  }),
  deliveryLogs: many(deliveryLog)
}))

export const deliveryLogRelations = relations(deliveryLog, ({ one }) => ({
  notification: one(notification, {
    fields: [deliveryLog.notificationId],
    references: [notification.id]
  }),
  device: one(device, {
    fields: [deliveryLog.deviceId],
    references: [device.id]
  })
}))

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  app: one(app, {
    fields: [apiKey.appId],
    references: [app.id]
  })
}))