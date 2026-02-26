import { defineField } from 'nitro-graphql/define'

export const subscriberFieldsResolver = defineField({
  Contact: {
    devices: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return dataloaders.devicesByContactLoader.load(parent.id)
      },
    },
    preferences: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return dataloaders.preferencesByContactLoader.load(parent.id)
      },
    },
  },
})
