import * as tables from '~~/server/database/schema'
import { useDatabase } from '~~/server/utils/useDatabase'
import { createDataLoaders } from '~~/server/utils/dataloaders'

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
