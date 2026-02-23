import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const deliveryLogsQuery = defineQuery({
  deliveryLogs: {
    resolve: async (_parent, { notificationId }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const query = db
        .select()
        .from(tables.deliveryLog)
        .orderBy(tables.deliveryLog.createdAt)

      if (notificationId) {
        return await query.where(eq(tables.deliveryLog.notificationId, notificationId))
      }

      return await query
    },
  },
})
