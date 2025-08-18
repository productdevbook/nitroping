import { eq } from 'drizzle-orm'
import { encryptSensitiveData } from '~~/server/utils/crypto'

export const configureAPNsMutation = defineMutation({
  configureAPNs: {
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

      // Encrypt sensitive private key before storing
      const encryptedPrivateKey = encryptSensitiveData(input.privateKey)

      // Update app with APNs configuration
      const updatedApp = await db
        .update(tables.app)
        .set({
          apnsKeyId: input.keyId,
          apnsTeamId: input.teamId,
          apnsCertificate: encryptedPrivateKey,
          bundleId: input.bundleId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tables.app.id, id))
        .returning()

      return updatedApp[0]
    },
  },
})
