import { boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customJsonb, customTimestamp, uuidv7Generator } from '../shared'
import { app } from './app'

export const apiKey = pgTable('apiKey', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  key: text().notNull().unique(),
  permissions: customJsonb(),
  isActive: boolean().default(true),
  lastUsedAt: customTimestamp(),
  expiresAt: customTimestamp(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
})

export const selectApiKeySchema = createSelectSchema(apiKey)
export const insertApiKeySchema = createInsertSchema(apiKey)
