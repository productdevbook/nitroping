import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/utils/define'
import { encryptSensitiveData } from '~~/server/utils/crypto'

export const configureFCMMutation = defineMutation({
  configureFCM: {
    resolve: async (_parent, { id, input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      // Check if app exists
      const app = await db
        .select()
        .from(tables.app)
        .where(eq(tables.app.id, id))
        .limit(1)

      if (app.length === 0) {
        throw createError({
          statusCode: 404,
          message: 'App not found',
        })
      }

      // Validate service account JSON
      try {
        JSON.parse(input.serviceAccount)
      }
      catch {
        throw createError({
          statusCode: 400,
          message: 'Invalid service account JSON format',
        })
      }

      // Encrypt sensitive service account JSON before storing
      const encryptedServiceAccount = encryptSensitiveData(input.serviceAccount)

      // Update app with FCM configuration
      const updatedApp = await db
        .update(tables.app)
        .set({
          fcmProjectId: input.projectId,
          fcmServerKey: encryptedServiceAccount,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tables.app.id, id))
        .returning()

      return updatedApp[0]
    },
  },
})
