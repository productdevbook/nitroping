import { pgEnum } from 'drizzle-orm/pg-core'

export const categoryEnum = pgEnum('category', [
  'CHROME',
  'FIREFOX',
  'SAFARI',
  'EDGE',
  'OPERA',
])

export const platformEnum = pgEnum('platform', ['IOS', 'ANDROID', 'WEB'])

export const notificationStatusEnum = pgEnum('notification_status', ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SCHEDULED'])

export const deviceStatusEnum = pgEnum('device_status', ['ACTIVE', 'INACTIVE', 'EXPIRED'])

export const deliveryStatusEnum = pgEnum('delivery_status', ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CLICKED'])
