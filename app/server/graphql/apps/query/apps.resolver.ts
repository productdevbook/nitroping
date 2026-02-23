import { defineQuery } from 'nitro-graphql/define'

export const appsQuery = defineQuery({
  apps: {
    resolve: async (_parent, args, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const apps = await db
        .select()
        .from(tables.app)
        .orderBy(tables.app.createdAt)

      return apps
    },
  },
})
