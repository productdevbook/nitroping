export const notificationFieldsResolver = defineType({
  Notification: {
    deliveryLogs: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return await dataloaders.deliveryLogsByNotificationLoader.load(parent.id)
      },
    },

    app: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return await dataloaders.appLoader.load(parent.appId)
      },
    },
  },
})
