import { eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'
import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'

export const deviceByTokenQuery = defineQuery({
  deviceByToken: {
    resolve: async (_parent, { token }, { context }) => {
      const db = useDatabase()

      const result = await db
        .select()
        .from(tables.device)
        .where(eq(tables.device.token, token))
        .limit(1)

      return result[0] || null
    },
  },
})
