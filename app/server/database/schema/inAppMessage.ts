import { boolean, index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { customJsonb, customTimestamp, uuidv7Generator } from '../shared'
import { app } from './app'
import { contact } from './contact'
import { notification } from './notification'

export const inAppMessage = pgTable('inAppMessage', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  contactId: uuid().notNull().references(() => contact.id, { onDelete: 'cascade' }),
  notificationId: uuid().references(() => notification.id, { onDelete: 'set null' }),
  title: text().notNull(),
  body: text().notNull(),
  data: customJsonb(),
  isRead: boolean().default(false).notNull(),
  readAt: customTimestamp(),
  createdAt: customTimestamp().defaultNow().notNull(),
}, table => [
  index('in_app_message_contact_id_idx').on(table.contactId),
  index('in_app_message_app_id_idx').on(table.appId),
  index('in_app_message_is_read_idx').on(table.contactId, table.isRead),
])
