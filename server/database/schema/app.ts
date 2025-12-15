import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { customTimestamp, uuidv7Generator } from '../shared'
import { device } from './device'
import { notification } from './notification'
import { apiKey } from './apiKey'

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
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
})

export const appRelations = relations(app, ({ many }) => ({
  devices: many(device),
  notifications: many(notification),
  apiKeys: many(apiKey),
}))
