import { defineField } from 'nitro-graphql/define'

export const subscriberFieldsResolver = defineField({
  Subscriber: {
    devices: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return dataloaders.devicesBySubscriberLoader.load(parent.id)
      },
    },
    preferences: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return dataloaders.preferencesBySubscriberLoader.load(parent.id)
      },
    },
  },
})
