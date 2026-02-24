import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const hooksQuery = defineQuery({
  hooks: {
    resolve: async (_parent, { appId }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      return db.select().from(tables.hook).where(eq(tables.hook.appId, appId as string))
    },
  },

  hook: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      const rows = await db
        .select()
        .from(tables.hook)
        .where(eq(tables.hook.id, id as string))
        .limit(1)
      return rows[0] ? { ...rows[0], secret: null } : null
    },
  },
})
