import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customJsonb, customTimestamp, uuidv7Generator } from '../shared'
import { app } from './app'

export const contact = pgTable('contact', {
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
  index('contact_app_id_idx').on(table.appId),
  index('contact_external_id_idx').on(table.externalId),
  index('contact_app_external_unique_idx').on(table.appId, table.externalId),
])

export const selectContactSchema = createSelectSchema(contact)
export const insertContactSchema = createInsertSchema(contact)
