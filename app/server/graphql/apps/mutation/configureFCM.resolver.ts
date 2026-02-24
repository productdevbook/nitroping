import * as tables from '#server/database/schema'
import { encryptSensitiveData } from '#server/utils/crypto'
import { useDatabase } from '#server/utils/useDatabase'
import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'
import { HTTPError } from 'nitro/h3'

export const configureFCMMutation = defineMutation({
  configureFCM: {
    resolve: async (_parent, { id, input }, _ctx) => {
      const db = useDatabase()

      // Check if app exists
      const app = await db
        .select()
        .from(tables.app)
        .where(eq(tables.app.id, id))
        .limit(1)

      if (app.length === 0) {
        throw new HTTPError({
          status: 404,
          message: 'App not found',
        })
      }

      // Validate service account JSON
      try {
        JSON.parse(input.serviceAccount)
      }
      catch {
        throw new HTTPError({
          status: 400,
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
