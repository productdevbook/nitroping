import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const appBySlugQuery = defineQuery({
  appBySlug: {
    resolve: async (_parent, { slug }, _ctx) => {
      const db = useDatabase()

      const result = await db
        .select()
        .from(tables.app)
        .where(eq(tables.app.slug, slug))
        .limit(1)

      return result[0] || null
    },
  },
})
