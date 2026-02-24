import { defineQuery } from 'nitro-graphql/define'
import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'

export const appsQuery = defineQuery({
  apps: {
    resolve: async (_parent, args, { context }) => {
      const db = useDatabase()

      const apps = await db
        .select()
        .from(tables.app)
        .orderBy(tables.app.createdAt)

      return apps
    },
  },
})
