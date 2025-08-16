import { eq } from 'drizzle-orm'
import { generateApiKey } from '~~/server/utils/auth'

export const regenerateApiKeyMutation = defineMutation({
  regenerateApiKey: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const newApiKey = await generateApiKey()

      const updatedApp = await db
        .update(tables.app)
        .set({
          apiKey: newApiKey,
          updatedAt: new Date(),
        })
        .where(eq(tables.app.id, id))
        .returning()

      if (updatedApp.length === 0) {
        throw createError({
          statusCode: 404,
          message: 'App not found',
        })
      }

      return updatedApp[0]
    },
  },
})
