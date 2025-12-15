import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/utils/define'

export const appExistsQuery = defineQuery({
  appExists: {
    resolve: async (_parent, { slug }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const result = await db
        .select({ id: tables.app.id })
        .from(tables.app)
        .where(eq(tables.app.slug, slug))
        .limit(1)

      return result.length > 0
    },
  },
})
