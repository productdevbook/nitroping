import { boolean, index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customJsonb, customTimestamp, uuidv7Generator } from '../shared'
import { app } from './app'
import { channelTypeEnum } from './enums'

export const channel = pgTable('channel', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  type: channelTypeEnum().notNull(),
  // Encrypted provider config (SMTP credentials, API keys, etc.)
  config: customJsonb(),
  isActive: boolean().default(true).notNull(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => [
  index('channel_app_id_idx').on(table.appId),
  index('channel_app_type_idx').on(table.appId, table.type),
])

export const selectChannelSchema = createSelectSchema(channel)
export const insertChannelSchema = createInsertSchema(channel)
