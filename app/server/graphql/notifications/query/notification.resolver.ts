import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const notificationQuery = defineQuery({
  notification: {
    resolve: async (_parent, { id }, _ctx) => {
      const db = useDatabase()

      const result = await db
        .select()
        .from(tables.notification)
        .where(eq(tables.notification.id, id))
        .limit(1)

      return result[0] || null
    },
  },
})
