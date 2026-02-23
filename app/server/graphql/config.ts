import * as tables from '#server/database/schema'
import { createDataLoaders } from '#server/graphql/loaders'
import { useDatabase } from '#server/utils/useDatabase'
import { defineGraphQLConfig } from 'nitro-graphql/define'

export default defineGraphQLConfig({
  context: () => {
    const db = useDatabase()
    const dataloaders = createDataLoaders(db)

    return {
      context: {
        useDatabase,
        tables,
        dataloaders,
      },
    }
  },
})
