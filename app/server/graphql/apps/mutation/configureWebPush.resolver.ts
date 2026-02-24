import { encryptSensitiveData } from '#server/utils/crypto'
import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'
import { HTTPError } from 'nitro/h3'
import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'

export const configureWebPushMutation = defineMutation({
  configureWebPush: {
    resolve: async (_parent, { id, input }, { context }) => {
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

      // Validate subject format
      if (!input.subject.startsWith('mailto:') && !input.subject.startsWith('https://')) {
        throw new HTTPError({
          status: 400,
          message: 'Subject must be a mailto: email or https: URL',
        })
      }

      // Encrypt sensitive private key before storing
      const encryptedPrivateKey = encryptSensitiveData(input.privateKey)

      // Update app with Web Push configuration
      const updatedApp = await db
        .update(tables.app)
        .set({
          vapidSubject: input.subject,
          vapidPublicKey: input.publicKey,
          vapidPrivateKey: encryptedPrivateKey,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tables.app.id, id))
        .returning()

      return updatedApp[0]
    },
  },
})
