import { relations } from 'drizzle-orm'
import { jsonb, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'
import { customTimestamp, uuidv7Generator } from '../shared'
import { app } from './app'
import { deliveryLog } from './deliveryLog'
import { categoryEnum, deviceStatusEnum, platformEnum } from './enums'

export const device = pgTable('device', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  token: text().notNull(),
  category: categoryEnum(),
  platform: platformEnum().notNull(),
  userId: text(),
  status: deviceStatusEnum().default('ACTIVE').notNull(),
  metadata: jsonb(),
  lastSeenAt: customTimestamp(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => ({
  uniqueAppTokenUser: unique().on(table.appId, table.token, table.userId),
}))

export const deviceRelations = relations(device, ({ one, many }) => ({
  app: one(app, {
    fields: [device.appId],
    references: [app.id],
  }),
  deliveryLogs: many(deliveryLog),
}))
