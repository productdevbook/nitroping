import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'
import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'

export const deliveryLogsQuery = defineQuery({
  deliveryLogs: {
    resolve: async (_parent, { notificationId, limit = 50, offset = 0 }, { context }) => {
      const db = useDatabase()

      const query = db
        .select()
        .from(tables.deliveryLog)
        .orderBy(tables.deliveryLog.createdAt)
        .limit(limit)
        .offset(offset)

      if (notificationId) {
        return await query.where(eq(tables.deliveryLog.notificationId, notificationId))
      }

      return await query
    },
  },
})
