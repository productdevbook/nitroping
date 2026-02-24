import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customJsonb, customTimestamp, uuidv7Generator } from '../shared'
import { app } from './app'

export const subscriber = pgTable('subscriber', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  externalId: text().notNull(),
  email: text(),
  phone: text(),
  locale: text(),
  metadata: customJsonb(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => [
  index('subscriber_app_id_idx').on(table.appId),
  index('subscriber_external_id_idx').on(table.externalId),
  index('subscriber_app_external_unique_idx').on(table.appId, table.externalId),
])

export const selectSubscriberSchema = createSelectSchema(subscriber)
export const insertSubscriberSchema = createInsertSchema(subscriber)
