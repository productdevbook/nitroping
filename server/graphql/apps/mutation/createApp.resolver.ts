import { eq } from 'drizzle-orm'
import { generateApiKey } from '~~/server/utils/auth'
// Note: For create app, we don't need auth since it's for creating new apps
// But for update/delete operations, we would use: import { requireAuth } from '~~/server/graphql/directives/auth.directive'

export const appMutations = defineMutation({
  createApp: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const apiKey = await generateApiKey()

      const newApp = await db
        .insert(tables.app)
        .values({
          name: input.name,
          slug: input.slug,
          description: input.description,
          apiKey,
          isActive: true,
        })
        .returning()

      return newApp[0]
    },
  },

  updateApp: {
    resolve: async (_parent, { id, input }, { context }) => {
      // Uncomment this line to require authentication:
      // const app = await requireAuth(context)
      // if (app.id !== id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

      const { useDatabase, tables } = context
      const db = useDatabase()

      const updatedApp = await db
        .update(tables.app)
        .set({
          ...input,
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

  deleteApp: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      await db
        .delete(tables.app)
        .where(eq(tables.app.id, id))

      return true
    },
  },

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

      // Update app with FCM configuration
      const updatedApp = await db
        .update(tables.app)
        .set({
          fcmProjectId: input.projectId,
          fcmServerKey: input.serviceAccount,
          updatedAt: new Date(),
        })
        .where(eq(tables.app.id, id))
        .returning()

      return updatedApp[0]
    },
  },

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
