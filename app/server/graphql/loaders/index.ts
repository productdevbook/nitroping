import type { Database, DataLoaders } from './types'
import { createApiKeyLoader, createApiKeysByAppLoader } from './apiKey.loader'
import { createAppLoader } from './app.loader'
import { createDeliveryLogLoader, createDeliveryLogsByDeviceLoader, createDeliveryLogsByNotificationLoader } from './deliveryLog.loader'
import { createDeviceLoader, createDevicesByAppLoader } from './device.loader'
import { createNotificationLoader, createNotificationsByAppLoader } from './notification.loader'

export type { DataLoaders } from './types'

export function createDataLoaders(db: Database): DataLoaders {
  return {
    // Single entity loaders
    appLoader: createAppLoader(db),
    deviceLoader: createDeviceLoader(db),
    notificationLoader: createNotificationLoader(db),
    deliveryLogLoader: createDeliveryLogLoader(db),
    apiKeyLoader: createApiKeyLoader(db),

    // Relation loaders
    devicesByAppLoader: createDevicesByAppLoader(db),
    notificationsByAppLoader: createNotificationsByAppLoader(db),
    apiKeysByAppLoader: createApiKeysByAppLoader(db),
    deliveryLogsByNotificationLoader: createDeliveryLogsByNotificationLoader(db),
    deliveryLogsByDeviceLoader: createDeliveryLogsByDeviceLoader(db),
  }
}
