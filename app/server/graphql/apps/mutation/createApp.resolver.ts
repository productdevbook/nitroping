import * as tables from '#server/database/schema'
import { generateApiKey } from '#server/utils/auth'
import { useDatabase } from '#server/utils/useDatabase'
import { defineMutation } from 'nitro-graphql/define'

export const createAppMutation = defineMutation({
  createApp: {
    resolve: async (_parent, { input }, _ctx) => {
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
})
