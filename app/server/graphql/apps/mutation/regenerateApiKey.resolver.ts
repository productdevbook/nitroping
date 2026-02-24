import { generateApiKey } from '#server/utils/auth'
import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'
import { HTTPError } from 'nitro/h3'
import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'

export const regenerateApiKeyMutation = defineMutation({
  regenerateApiKey: {
    resolve: async (_parent, { id }, { context }) => {
      const db = useDatabase()

      const newApiKey = await generateApiKey()

      const updatedApp = await db
        .update(tables.app)
        .set({
          apiKey: newApiKey,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tables.app.id, id))
        .returning()

      if (updatedApp.length === 0) {
        throw new HTTPError({
          status: 404,
          message: 'App not found',
        })
      }

      return updatedApp[0]
    },
  },
})
