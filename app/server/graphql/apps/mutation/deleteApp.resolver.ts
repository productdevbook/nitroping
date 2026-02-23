import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/utils/define'

export const deleteAppMutation = defineMutation({
  deleteApp: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      await db
        .delete(tables.app)
        .where(eq(tables.app.id, id))

      return true
    },
  },
})
