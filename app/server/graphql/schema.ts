import { selectApiKeySchema } from '#server/database/schema/apiKey'
import { selectAppSchema } from '#server/database/schema/app'
import { selectChannelSchema } from '#server/database/schema/channel'
import { selectDeliveryLogSchema } from '#server/database/schema/deliveryLog'
import { selectDeviceSchema } from '#server/database/schema/device'
import { selectHookSchema } from '#server/database/schema/hook'
import { selectNotificationSchema } from '#server/database/schema/notification'
import { selectSubscriberSchema } from '#server/database/schema/subscriber'
import { selectSubscriberDeviceSchema } from '#server/database/schema/subscriberDevice'
import { selectSubscriberPreferenceSchema } from '#server/database/schema/subscriberPreference'
import { selectTemplateSchema } from '#server/database/schema/template'
import { selectWorkflowSchema } from '#server/database/schema/workflow'
import { selectWorkflowExecutionSchema } from '#server/database/schema/workflowExecution'
import { selectWorkflowStepSchema } from '#server/database/schema/workflowStep'
import { defineSchema } from 'nitro-graphql/define'

export default defineSchema({
  App: selectAppSchema,
  Device: selectDeviceSchema,
  Notification: selectNotificationSchema,
  DeliveryLog: selectDeliveryLogSchema,
  ApiKey: selectApiKeySchema,
  Subscriber: selectSubscriberSchema,
  SubscriberDevice: selectSubscriberDeviceSchema,
  SubscriberPreference: selectSubscriberPreferenceSchema,
  Channel: selectChannelSchema,
  Template: selectTemplateSchema,
  Workflow: selectWorkflowSchema,
  WorkflowStep: selectWorkflowStepSchema,
  WorkflowExecution: selectWorkflowExecutionSchema,
  Hook: selectHookSchema,
})
