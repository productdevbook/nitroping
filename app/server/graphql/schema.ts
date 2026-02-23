import { selectApiKeySchema } from '#server/database/schema/apiKey'
import { selectAppSchema } from '#server/database/schema/app'
import { selectDeliveryLogSchema } from '#server/database/schema/deliveryLog'
import { selectDeviceSchema } from '#server/database/schema/device'
import { selectNotificationSchema } from '#server/database/schema/notification'
import { defineSchema } from 'nitro-graphql/define'

export default defineSchema({
  App: selectAppSchema,
  Device: selectDeviceSchema,
  Notification: selectNotificationSchema,
  DeliveryLog: selectDeliveryLogSchema,
  ApiKey: selectApiKeySchema,
})
