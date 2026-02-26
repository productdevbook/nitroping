import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const hooksQuery = defineQuery({
  hooks: {
    resolve: async (_parent, { appId }, _ctx) => {
      const db = useDatabase()
      return db.select().from(tables.hook).where(eq(tables.hook.appId, appId as string))
    },
  },

  hook: {
    resolve: async (_parent, { id }, _ctx) => {
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
