import { eq } from 'drizzle-orm'

export const notificationsQuery = defineQuery({
  notifications: {
    resolve: async (_parent, { appId }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      let query = db
        .select()
        .from(tables.notification)
        .orderBy(tables.notification.createdAt)

      if (appId) {
        query = query.where(eq(tables.notification.appId, appId))
      }

      return await query
    },
  },
})
