import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'
import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'

export const appByIdQuery = defineQuery({
  app: {
    resolve: async (_parent, { id }, { context }) => {
      const db = useDatabase()

      const result = await db
        .select()
        .from(tables.app)
        .where(eq(tables.app.id, id))
        .limit(1)

      return result[0] || null
    },
  },
})
