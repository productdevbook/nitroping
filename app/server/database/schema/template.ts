import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customTimestamp, uuidv7Generator } from '../shared'
import { app } from './app'
import { channel } from './channel'
import { channelTypeEnum } from './enums'

export const template = pgTable('template', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  channelId: uuid().references(() => channel.id, { onDelete: 'set null' }),
  name: text().notNull(),
  channelType: channelTypeEnum().notNull(),
  subject: text(),
  body: text().notNull(),
  htmlBody: text(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => [
  index('template_app_id_idx').on(table.appId),
  index('template_channel_id_idx').on(table.channelId),
  index('template_channel_type_idx').on(table.channelType),
])

export const selectTemplateSchema = createSelectSchema(template)
export const insertTemplateSchema = createInsertSchema(template)
