import { defineField } from 'nitro-graphql/define'

export const notificationFieldsResolver = defineField({
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
