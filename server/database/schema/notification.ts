import { relations } from 'drizzle-orm'
import { integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { customTimestamp, uuidv7Generator } from '../shared'
import { app } from './app'
import { deliveryLog } from './deliveryLog'
import { notificationStatusEnum } from './enums'

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
  imageUrl: text(),
  targetDevices: jsonb(),
  platforms: jsonb(),
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
})

export const notificationRelations = relations(notification, ({ one, many }) => ({
  app: one(app, {
    fields: [notification.appId],
    references: [app.id],
  }),
  deliveryLogs: many(deliveryLog),
}))
