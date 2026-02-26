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

// Multi-channel platform enums
export const CHANNEL_TYPES = ['PUSH', 'EMAIL', 'SMS', 'IN_APP', 'DISCORD', 'TELEGRAM'] as const
export type ChannelType = typeof CHANNEL_TYPES[number]
export const channelTypeEnum = pgEnum('channelType', CHANNEL_TYPES)

export const workflowStatusEnum = pgEnum('workflowStatus', ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'])

export const workflowStepTypeEnum = pgEnum('workflowStepType', ['SEND', 'DELAY', 'FILTER', 'DIGEST', 'BRANCH'])

export const workflowTriggerTypeEnum = pgEnum('workflowTriggerType', ['EVENT', 'SCHEDULED', 'MANUAL'])

export const workflowExecutionStatusEnum = pgEnum('workflowExecutionStatus', ['RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'])

export const hookEventEnum = pgEnum('hookEvent', [
  'NOTIFICATION_SENT',
  'NOTIFICATION_DELIVERED',
  'NOTIFICATION_FAILED',
  'NOTIFICATION_CLICKED',
  'WORKFLOW_COMPLETED',
  'WORKFLOW_FAILED',
])
