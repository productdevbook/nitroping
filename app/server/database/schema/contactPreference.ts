import { boolean, index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customTimestamp, uuidv7Generator } from '../shared'
import { contact } from './contact'
import { channelTypeEnum } from './enums'

export const contactPreference = pgTable('contactPreference', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  subscriberId: uuid().notNull().references(() => contact.id, { onDelete: 'cascade' }),
  // Notification category (e.g. 'marketing', 'transactional')
  category: text().notNull(),
  channelType: channelTypeEnum().notNull(),
  enabled: boolean().default(true).notNull(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => [
  index('contactPreference_subscriber_id_idx').on(table.subscriberId),
  index('contactPreference_subscriber_category_channel_idx').on(
    table.subscriberId,
    table.category,
    table.channelType,
  ),
])

export const selectContactPreferenceSchema = createSelectSchema(contactPreference)
export const insertContactPreferenceSchema = createInsertSchema(contactPreference)
