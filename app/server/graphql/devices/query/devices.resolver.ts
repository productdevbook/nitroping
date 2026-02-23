import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const devicesQuery = defineQuery({
  devices: {
    resolve: async (_parent, { appId }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const query = db.select().from(tables.device)

      if (appId) {
        return await query.where(eq(tables.device.appId, appId))
      }

      return await query
    },
  },
})
