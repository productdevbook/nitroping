import { defineField } from 'nitro-graphql/utils/define'

export const deviceFieldsResolver = defineField({
  Device: {
    app: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return await dataloaders.appLoader.load(parent.appId)
      },
    },

    deliveryLogs: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return await dataloaders.deliveryLogsByDeviceLoader.load(parent.id)
      },
    },
  },
})
