import { eq } from 'drizzle-orm'

export const configureWebPushMutation = defineMutation({
  configureWebPush: {
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

      // Validate subject format
      if (!input.subject.startsWith('mailto:') && !input.subject.startsWith('https://')) {
        throw createError({
          statusCode: 400,
          message: 'Subject must be a mailto: email or https: URL',
        })
      }

      // Update app with Web Push configuration
      const updatedApp = await db
        .update(tables.app)
        .set({
          vapidSubject: input.subject,
          vapidPublicKey: input.publicKey,
          vapidPrivateKey: input.privateKey,
          updatedAt: new Date(),
        })
        .where(eq(tables.app.id, id))
        .returning()

      return updatedApp[0]
    },
  },
})
