import { and, eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const subscribersQuery = defineQuery({
  subscribers: {
    resolve: async (_parent, { appId, limit, offset }, { context }) => {
      const { useDatabase, tables } = context
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
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
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
    resolve: async (_parent, { appId, externalId }, { context }) => {
      const { useDatabase, tables } = context
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
