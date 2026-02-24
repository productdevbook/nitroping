import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'
import { HTTPError } from 'nitro/h3'
import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'

export const updateAppMutation = defineMutation({
  updateApp: {
    resolve: async (_parent, { id, input }, { context }) => {
      // Uncomment this line to require authentication:
      // const app = await requireAuth(context)
      // if (app.id !== id) throw new HTTPError({ status: 403, message: 'Forbidden' })

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
        throw new HTTPError({
          status: 404,
          message: 'App not found',
        })
      }

      return updatedApp[0]
    },
  },
})
