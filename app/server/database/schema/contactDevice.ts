import { index, pgTable, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customTimestamp, uuidv7Generator } from '../shared'
import { device } from './device'
import { contact } from './contact'

export const contactDevice = pgTable('contactDevice', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  subscriberId: uuid().notNull().references(() => contact.id, { onDelete: 'cascade' }),
  deviceId: uuid().notNull().references(() => device.id, { onDelete: 'cascade' }),
  createdAt: customTimestamp().defaultNow().notNull(),
}, table => [
  index('contactDevice_subscriber_id_idx').on(table.subscriberId),
  index('contactDevice_device_id_idx').on(table.deviceId),
])

export const selectContactDeviceSchema = createSelectSchema(contactDevice)
export const insertContactDeviceSchema = createInsertSchema(contactDevice)
