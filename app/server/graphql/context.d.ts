import type { DataLoaders } from '#server/graphql/loaders'

declare module 'nitro/h3' {
  interface H3EventContext {
    dataloaders: DataLoaders
  }
}
