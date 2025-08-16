import * as tables from '~~/server/database/schema'
import { createDataLoaders } from '~~/server/utils/dataloaders'
import { useDatabase } from '~~/server/utils/useDatabase'

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
