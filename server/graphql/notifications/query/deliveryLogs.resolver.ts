import { eq } from 'drizzle-orm'

export const deliveryLogsQuery = defineQuery({
  deliveryLogs: {
    resolve: async (_parent, { notificationId }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      let query = db
        .select()
        .from(tables.deliveryLog)
        .orderBy(tables.deliveryLog.createdAt)

      if (notificationId) {
        query = query.where(eq(tables.deliveryLog.notificationId, notificationId))
      }

      return await query
    },
  },
})
