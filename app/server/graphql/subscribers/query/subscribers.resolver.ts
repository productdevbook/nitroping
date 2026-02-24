import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { and, eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const subscribersQuery = defineQuery({
  subscribers: {
    resolve: async (_parent, { appId, limit, offset }, _ctx) => {
      const db = useDatabase()

      return db
        .select()
        .from(tables.subscriber)
        .where(eq(tables.subscriber.appId, appId as string))
        .limit(limit as number)
        .offset(offset as number)
    },
  },

  subscriber: {
    resolve: async (_parent, { id }, _ctx) => {
      const db = useDatabase()
      const rows = await db
        .select()
        .from(tables.subscriber)
        .where(eq(tables.subscriber.id, id as string))
        .limit(1)
      return rows[0] || null
    },
  },

  subscriberByExternalId: {
    resolve: async (_parent, { appId, externalId }, _ctx) => {
      const db = useDatabase()
      const rows = await db
        .select()
        .from(tables.subscriber)
        .where(
          and(
            eq(tables.subscriber.appId, appId as string),
            eq(tables.subscriber.externalId, externalId as string),
          ),
        )
        .limit(1)
      return rows[0] || null
    },
  },
})
