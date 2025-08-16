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
})
