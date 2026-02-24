import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { defineQuery } from 'nitro-graphql/define'

export const appsQuery = defineQuery({
  apps: {
    resolve: async (_parent, _args, _ctx) => {
      const db = useDatabase()

      const apps = await db
        .select()
        .from(tables.app)
        .orderBy(tables.app.createdAt)

      return apps
    },
  },
})
