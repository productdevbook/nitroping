import { boolean, index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customJsonb, customTimestamp, uuidv7Generator } from '../shared'
import { app } from './app'

export const hook = pgTable('hook', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  url: text().notNull(),
  // Encrypted HMAC secret
  secret: text(),
  // Array of hookEvent values (stored as JSON)
  events: customJsonb(),
  isActive: boolean().default(true).notNull(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => [
  index('hook_app_id_idx').on(table.appId),
])

export const selectHookSchema = createSelectSchema(hook)
export const insertHookSchema = createInsertSchema(hook)
