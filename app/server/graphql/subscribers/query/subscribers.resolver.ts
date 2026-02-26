import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { and, eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const subscribersQuery = defineQuery({
  contacts: {
    resolve: async (_parent, { appId, limit, offset }, _ctx) => {
      const db = useDatabase()

      return db
        .select()
        .from(tables.contact)
        .where(eq(tables.contact.appId, appId as string))
        .limit(limit as number)
        .offset(offset as number)
    },
  },

  contact: {
    resolve: async (_parent, { id }, _ctx) => {
      const db = useDatabase()
      const rows = await db
        .select()
        .from(tables.contact)
        .where(eq(tables.contact.id, id as string))
        .limit(1)
      return rows[0] || null
    },
  },

  contactByExternalId: {
    resolve: async (_parent, { appId, externalId }, _ctx) => {
      const db = useDatabase()
      const rows = await db
        .select()
        .from(tables.contact)
        .where(
          and(
            eq(tables.contact.appId, appId as string),
            eq(tables.contact.externalId, externalId as string),
          ),
        )
        .limit(1)
      return rows[0] || null
    },
  },
})
