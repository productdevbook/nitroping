import { defineRelations } from 'drizzle-orm'
import { apiKey } from './apiKey'
import { app } from './app'
import { deliveryLog } from './deliveryLog'
import { device } from './device'
import { notification } from './notification'

const schema = { app, apiKey, device, notification, deliveryLog }

export const relations = defineRelations(schema, helpers => ({
  app: {
    devices: helpers.many.device({
      from: helpers.app.id,
      to: helpers.device.appId,
    }),
    notifications: helpers.many.notification({
      from: helpers.app.id,
      to: helpers.notification.appId,
    }),
    apiKeys: helpers.many.apiKey({
      from: helpers.app.id,
      to: helpers.apiKey.appId,
    }),
  },
  apiKey: {
    app: helpers.one.app({
      from: helpers.apiKey.appId,
      to: helpers.app.id,
    }),
  },
  device: {
    app: helpers.one.app({
      from: helpers.device.appId,
      to: helpers.app.id,
    }),
    deliveryLogs: helpers.many.deliveryLog({
      from: helpers.device.id,
      to: helpers.deliveryLog.deviceId,
    }),
  },
  notification: {
    app: helpers.one.app({
      from: helpers.notification.appId,
      to: helpers.app.id,
    }),
    deliveryLogs: helpers.many.deliveryLog({
      from: helpers.notification.id,
      to: helpers.deliveryLog.notificationId,
    }),
  },
  deliveryLog: {
    notification: helpers.one.notification({
      from: helpers.deliveryLog.notificationId,
      to: helpers.notification.id,
    }),
    device: helpers.one.device({
      from: helpers.deliveryLog.deviceId,
      to: helpers.device.id,
    }),
  },
}))
