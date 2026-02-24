import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const notificationsQuery = defineQuery({
  notifications: {
    resolve: async (_parent, { appId, limit = 50, offset = 0 }, _ctx) => {
      const db = useDatabase()

      const query = db
        .select()
        .from(tables.notification)
        .orderBy(tables.notification.createdAt)
        .limit(limit)
        .offset(offset)

      if (appId) {
        return await query.where(eq(tables.notification.appId, appId))
      }

      return await query
    },
  },
})
