import { defineField } from 'nitro-graphql/define'

export const apiKeyFieldsResolver = defineField({
  ApiKey: {
    app: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return await dataloaders.appLoader.load(parent.appId)
      },
    },
  },
})
