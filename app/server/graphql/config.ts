import { defineGraphQLConfig } from 'nitro-graphql/define'
import * as tables from '#server/database/schema'
import { createDataLoaders } from '#server/graphql/loaders'
import { useDatabase } from '#server/utils/useDatabase'

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
