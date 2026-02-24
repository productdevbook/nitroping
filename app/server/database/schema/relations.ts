import { defineRelations } from 'drizzle-orm'
import { apiKey } from './apiKey'
import { app } from './app'
import { channel } from './channel'
import { contact } from './contact'
import { contactDevice } from './contactDevice'
import { contactPreference } from './contactPreference'
import { deliveryLog } from './deliveryLog'
import { device } from './device'
import { hook } from './hook'
import { notification } from './notification'
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
  contact,
  contactDevice,
  channel,
  template,
  workflow,
  workflowStep,
  workflowExecution,
  contactPreference,
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
    contacts: helpers.many.contact({
      from: helpers.app.id,
      to: helpers.contact.appId,
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
    contactDevices: helpers.many.contactDevice({
      from: helpers.device.id,
      to: helpers.contactDevice.deviceId,
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
  contact: {
    app: helpers.one.app({
      from: helpers.contact.appId,
      to: helpers.app.id,
    }),
    contactDevices: helpers.many.contactDevice({
      from: helpers.contact.id,
      to: helpers.contactDevice.subscriberId,
    }),
    preferences: helpers.many.contactPreference({
      from: helpers.contact.id,
      to: helpers.contactPreference.subscriberId,
    }),
    executions: helpers.many.workflowExecution({
      from: helpers.contact.id,
      to: helpers.workflowExecution.subscriberId,
    }),
  },
  contactDevice: {
    contact: helpers.one.contact({
      from: helpers.contactDevice.subscriberId,
      to: helpers.contact.id,
    }),
    device: helpers.one.device({
      from: helpers.contactDevice.deviceId,
      to: helpers.device.id,
    }),
  },
  contactPreference: {
    contact: helpers.one.contact({
      from: helpers.contactPreference.subscriberId,
      to: helpers.contact.id,
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
    contact: helpers.one.contact({
      from: helpers.workflowExecution.subscriberId,
      to: helpers.contact.id,
    }),
  },
  hook: {
    app: helpers.one.app({
      from: helpers.hook.appId,
      to: helpers.app.id,
    }),
  },
}))
