import type { Database, DataLoaders } from './types'
import { createApiKeyLoader, createApiKeysByAppLoader } from './apiKey.loader'
import { createAppLoader } from './app.loader'
import { createChannelLoader, createChannelsByAppLoader } from './channel.loader'
import { createContactLoader, createContactsByAppLoader, createDevicesByContactLoader } from './contact.loader'
import { createPreferencesByContactLoader } from './contactPreference.loader'
import { createDeliveryLogLoader, createDeliveryLogsByDeviceLoader, createDeliveryLogsByNotificationLoader } from './deliveryLog.loader'
import { createDeviceLoader, createDevicesByAppLoader } from './device.loader'
import { createNotificationLoader, createNotificationsByAppLoader } from './notification.loader'
import { createTemplateLoader, createTemplatesByChannelLoader } from './template.loader'
import { createStepsByWorkflowLoader, createWorkflowLoader } from './workflow.loader'

export type { DataLoaders } from './types'

export function createDataLoaders(db: Database): DataLoaders {
  return {
    // Single entity loaders (existing)
    appLoader: createAppLoader(db),
    deviceLoader: createDeviceLoader(db),
    notificationLoader: createNotificationLoader(db),
    deliveryLogLoader: createDeliveryLogLoader(db),
    apiKeyLoader: createApiKeyLoader(db),

    // Single entity loaders (new)
    contactLoader: createContactLoader(db),
    channelLoader: createChannelLoader(db),
    templateLoader: createTemplateLoader(db),
    workflowLoader: createWorkflowLoader(db),

    // Relation loaders (existing)
    devicesByAppLoader: createDevicesByAppLoader(db),
    notificationsByAppLoader: createNotificationsByAppLoader(db),
    apiKeysByAppLoader: createApiKeysByAppLoader(db),
    deliveryLogsByNotificationLoader: createDeliveryLogsByNotificationLoader(db),
    deliveryLogsByDeviceLoader: createDeliveryLogsByDeviceLoader(db),

    // Relation loaders (new)
    contactsByAppLoader: createContactsByAppLoader(db),
    devicesByContactLoader: createDevicesByContactLoader(db),
    preferencesByContactLoader: createPreferencesByContactLoader(db),
    channelsByAppLoader: createChannelsByAppLoader(db),
    templatesByChannelLoader: createTemplatesByChannelLoader(db),
    stepsByWorkflowLoader: createStepsByWorkflowLoader(db),
  }
}
