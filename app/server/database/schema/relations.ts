import { defineRelations } from 'drizzle-orm'
import { apiKey } from './apiKey'
import { app } from './app'
import { channel } from './channel'
import { deliveryLog } from './deliveryLog'
import { device } from './device'
import { hook } from './hook'
import { notification } from './notification'
import { subscriber } from './subscriber'
import { subscriberDevice } from './subscriberDevice'
import { subscriberPreference } from './subscriberPreference'
import { template } from './template'
import { workflow } from './workflow'
import { workflowExecution } from './workflowExecution'
import { workflowStep } from './workflowStep'

const schema = {
  app,
  apiKey,
  device,
  notification,
  deliveryLog,
  subscriber,
  subscriberDevice,
  channel,
  template,
  workflow,
  workflowStep,
  workflowExecution,
  subscriberPreference,
  hook,
}

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
    subscribers: helpers.many.subscriber({
      from: helpers.app.id,
      to: helpers.subscriber.appId,
    }),
    channels: helpers.many.channel({
      from: helpers.app.id,
      to: helpers.channel.appId,
    }),
    templates: helpers.many.template({
      from: helpers.app.id,
      to: helpers.template.appId,
    }),
    workflows: helpers.many.workflow({
      from: helpers.app.id,
      to: helpers.workflow.appId,
    }),
    hooks: helpers.many.hook({
      from: helpers.app.id,
      to: helpers.hook.appId,
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
    subscriberDevices: helpers.many.subscriberDevice({
      from: helpers.device.id,
      to: helpers.subscriberDevice.deviceId,
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
  subscriber: {
    app: helpers.one.app({
      from: helpers.subscriber.appId,
      to: helpers.app.id,
    }),
    subscriberDevices: helpers.many.subscriberDevice({
      from: helpers.subscriber.id,
      to: helpers.subscriberDevice.subscriberId,
    }),
    preferences: helpers.many.subscriberPreference({
      from: helpers.subscriber.id,
      to: helpers.subscriberPreference.subscriberId,
    }),
    executions: helpers.many.workflowExecution({
      from: helpers.subscriber.id,
      to: helpers.workflowExecution.subscriberId,
    }),
  },
  subscriberDevice: {
    subscriber: helpers.one.subscriber({
      from: helpers.subscriberDevice.subscriberId,
      to: helpers.subscriber.id,
    }),
    device: helpers.one.device({
      from: helpers.subscriberDevice.deviceId,
      to: helpers.device.id,
    }),
  },
  subscriberPreference: {
    subscriber: helpers.one.subscriber({
      from: helpers.subscriberPreference.subscriberId,
      to: helpers.subscriber.id,
    }),
  },
  channel: {
    app: helpers.one.app({
      from: helpers.channel.appId,
      to: helpers.app.id,
    }),
    templates: helpers.many.template({
      from: helpers.channel.id,
      to: helpers.template.channelId,
    }),
  },
  template: {
    app: helpers.one.app({
      from: helpers.template.appId,
      to: helpers.app.id,
    }),
    channel: helpers.one.channel({
      from: helpers.template.channelId,
      to: helpers.channel.id,
    }),
  },
  workflow: {
    app: helpers.one.app({
      from: helpers.workflow.appId,
      to: helpers.app.id,
    }),
    steps: helpers.many.workflowStep({
      from: helpers.workflow.id,
      to: helpers.workflowStep.workflowId,
    }),
    executions: helpers.many.workflowExecution({
      from: helpers.workflow.id,
      to: helpers.workflowExecution.workflowId,
    }),
  },
  workflowStep: {
    workflow: helpers.one.workflow({
      from: helpers.workflowStep.workflowId,
      to: helpers.workflow.id,
    }),
  },
  workflowExecution: {
    workflow: helpers.one.workflow({
      from: helpers.workflowExecution.workflowId,
      to: helpers.workflow.id,
    }),
    subscriber: helpers.one.subscriber({
      from: helpers.workflowExecution.subscriberId,
      to: helpers.subscriber.id,
    }),
  },
  hook: {
    app: helpers.one.app({
      from: helpers.hook.appId,
      to: helpers.app.id,
    }),
  },
}))
