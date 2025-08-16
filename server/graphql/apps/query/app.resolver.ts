import { eq } from 'drizzle-orm'

export const appQuery = defineQuery({
  app: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const result = await db
        .select()
        .from(tables.app)
        .where(eq(tables.app.id, id))
        .limit(1)

      return result[0] || null
    },
  },

  appBySlug: {
    resolve: async (_parent, { slug }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const result = await db
        .select()
        .from(tables.app)
        .where(eq(tables.app.slug, slug))
        .limit(1)

      return result[0] || null
    },
  },

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
