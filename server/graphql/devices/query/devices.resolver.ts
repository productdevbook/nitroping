import { eq } from 'drizzle-orm'

export const devicesQuery = defineQuery({
  devices: {
    resolve: async (_parent, { appId }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      let query = db.select().from(tables.device)

      if (appId) {
        query = query.where(eq(tables.device.appId, appId))
      }

      return await query
    },
  },
})
