import { boolean, index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customTimestamp, uuidv7Generator } from '../shared'
import { channelTypeEnum } from './enums'
import { subscriber } from './subscriber'

export const subscriberPreference = pgTable('subscriberPreference', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  subscriberId: uuid().notNull().references(() => subscriber.id, { onDelete: 'cascade' }),
  // Notification category (e.g. 'marketing', 'transactional')
  category: text().notNull(),
  channelType: channelTypeEnum().notNull(),
  enabled: boolean().default(true).notNull(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => [
  index('subscriberPreference_subscriber_id_idx').on(table.subscriberId),
  index('subscriberPreference_subscriber_category_channel_idx').on(
    table.subscriberId,
    table.category,
    table.channelType,
  ),
])

export const selectSubscriberPreferenceSchema = createSelectSchema(subscriberPreference)
export const insertSubscriberPreferenceSchema = createInsertSchema(subscriberPreference)
