import { and, eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const templatesQuery = defineQuery({
  templates: {
    resolve: async (_parent, { appId, channelType }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const conditions = [eq(tables.template.appId, appId as string)]
      if (channelType) {
        conditions.push(eq(tables.template.channelType, channelType as any))
      }

      return db.select().from(tables.template).where(and(...conditions))
    },
  },

  template: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
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
