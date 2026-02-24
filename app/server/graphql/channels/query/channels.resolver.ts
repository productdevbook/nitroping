import { and, eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const channelsQuery = defineQuery({
  channels: {
    resolve: async (_parent, { appId, type }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const conditions = [eq(tables.channel.appId, appId as string)]
      if (type) {
        conditions.push(eq(tables.channel.type, type as any))
      }

      return db.select().from(tables.channel).where(and(...conditions))
    },
  },

  channel: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      const rows = await db
        .select()
        .from(tables.channel)
        .where(eq(tables.channel.id, id as string))
        .limit(1)
      return rows[0] || null
    },
  },
})
