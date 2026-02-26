import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { and, eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const templatesQuery = defineQuery({
  templates: {
    resolve: async (_parent, { appId, channelType }, _ctx) => {
      const db = useDatabase()

      const conditions = [eq(tables.template.appId, appId as string)]
      if (channelType) {
        conditions.push(eq(tables.template.channelType, channelType as any))
      }

      return db.select().from(tables.template).where(and(...conditions))
    },
  },

  template: {
    resolve: async (_parent, { id }, _ctx) => {
      const db = useDatabase()
      const rows = await db
        .select()
        .from(tables.template)
        .where(eq(tables.template.id, id as string))
        .limit(1)
      return rows[0] || null
    },
  },
})
