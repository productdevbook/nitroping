import { eq } from 'drizzle-orm'

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

      // TODO: Encrypt sensitive data before storing
      // Update app with APNs configuration
      const updatedApp = await db
        .update(tables.app)
        .set({
          apnsKeyId: input.keyId,
          apnsTeamId: input.teamId,
          apnsCertificate: input.privateKey,
          updatedAt: new Date(),
        })
        .where(eq(tables.app.id, id))
        .returning()

      return updatedApp[0]
    },
  },
})
