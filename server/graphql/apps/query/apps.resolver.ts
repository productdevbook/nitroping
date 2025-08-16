import { WebPushProvider } from '~~/server/providers/webpush'

export const appsQuery = defineQuery({
  apps: {
    resolve: async (_parent, args, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const apps = await db
        .select()
        .from(tables.app)
        .orderBy(tables.app.createdAt)

      return apps
    },
  },

  generateVapidKeys: {
    resolve: async () => {
      // Generate new VAPID keys
      const keys = await WebPushProvider.generateVapidKeys()

      return {
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
      }
    },
  },
})
