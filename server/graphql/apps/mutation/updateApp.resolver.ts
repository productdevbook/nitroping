import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/utils/define'

export const updateAppMutation = defineMutation({
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
          updatedAt: new Date().toISOString(),
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
