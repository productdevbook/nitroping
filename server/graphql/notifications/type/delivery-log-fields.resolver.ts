import { defineField } from 'nitro-graphql/utils/define'

export const deliveryLogFieldsResolver = defineField({
  DeliveryLog: {
    notification: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return await dataloaders.notificationLoader.load(parent.notificationId)
      },
    },

    device: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return await dataloaders.deviceLoader.load(parent.deviceId)
      },
    },
  },
})
