import type { getDatabase } from '#server/database/connection'
import type * as tables from '#server/database/schema'
import type DataLoader from 'dataloader'

export type Database = ReturnType<typeof getDatabase>

export interface DataLoaders {
  // Single entity loaders
  appLoader: DataLoader<string, typeof tables.app.$inferSelect | null>
  deviceLoader: DataLoader<string, typeof tables.device.$inferSelect | null>
  notificationLoader: DataLoader<string, typeof tables.notification.$inferSelect | null>
  deliveryLogLoader: DataLoader<string, typeof tables.deliveryLog.$inferSelect | null>
  apiKeyLoader: DataLoader<string, typeof tables.apiKey.$inferSelect | null>

  // Relation loaders
  devicesByAppLoader: DataLoader<string, (typeof tables.device.$inferSelect)[]>
  notificationsByAppLoader: DataLoader<string, (typeof tables.notification.$inferSelect)[]>
  apiKeysByAppLoader: DataLoader<string, (typeof tables.apiKey.$inferSelect)[]>
  deliveryLogsByNotificationLoader: DataLoader<string, (typeof tables.deliveryLog.$inferSelect)[]>
  deliveryLogsByDeviceLoader: DataLoader<string, (typeof tables.deliveryLog.$inferSelect)[]>
}
