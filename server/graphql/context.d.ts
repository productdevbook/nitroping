import type * as tables from '~~/server/database/schema'
import type { DataLoaders } from '~~/server/graphql/loaders'

declare module 'h3' {
  interface H3EventContext {
    useDatabase: typeof import('~~/server/utils/useDatabase').useDatabase
    tables: typeof tables
    dataloaders: DataLoaders
  }
}
