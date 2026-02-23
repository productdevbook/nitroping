import { defineMutation } from 'nitro-graphql/define'
import { generateApiKey } from '#server/utils/auth'

export const createAppMutation = defineMutation({
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
})
