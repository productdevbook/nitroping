import { index, pgTable, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customTimestamp, uuidv7Generator } from '../shared'
import { device } from './device'
import { subscriber } from './subscriber'

export const subscriberDevice = pgTable('subscriberDevice', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  subscriberId: uuid().notNull().references(() => subscriber.id, { onDelete: 'cascade' }),
  deviceId: uuid().notNull().references(() => device.id, { onDelete: 'cascade' }),
  createdAt: customTimestamp().defaultNow().notNull(),
}, table => [
  index('subscriberDevice_subscriber_id_idx').on(table.subscriberId),
  index('subscriberDevice_device_id_idx').on(table.deviceId),
])

export const selectSubscriberDeviceSchema = createSelectSchema(subscriberDevice)
export const insertSubscriberDeviceSchema = createInsertSchema(subscriberDevice)
