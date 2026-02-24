import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'
import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'

export const deviceQuery = defineQuery({
  device: {
    resolve: async (_parent, { id }, { context }) => {
      const db = useDatabase()

      const result = await db
        .select()
        .from(tables.device)
        .where(eq(tables.device.id, id))
        .limit(1)

      return result[0] || null
    },
  },
})
