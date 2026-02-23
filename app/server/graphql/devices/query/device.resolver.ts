import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/utils/define'

export const deviceQuery = defineQuery({
  device: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
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
