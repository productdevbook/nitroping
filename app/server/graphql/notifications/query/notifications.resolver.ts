import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/utils/define'

export const notificationsQuery = defineQuery({
  notifications: {
    resolve: async (_parent, { appId }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const query = db
        .select()
        .from(tables.notification)
        .orderBy(tables.notification.createdAt)

      if (appId) {
        return await query.where(eq(tables.notification.appId, appId))
      }

      return await query
    },
  },
})
