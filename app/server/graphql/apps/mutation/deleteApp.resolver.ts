import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'
import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'

export const deleteAppMutation = defineMutation({
  deleteApp: {
    resolve: async (_parent, { id }, { context }) => {
      const db = useDatabase()

      await db
        .delete(tables.app)
        .where(eq(tables.app.id, id))

      return true
    },
  },
})
