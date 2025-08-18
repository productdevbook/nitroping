export const deliveryLogFieldsResolver = defineType({
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
