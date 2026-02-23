import { WebPushProvider } from '#server/providers/webpush'
import { defineQuery } from 'nitro-graphql/define'

export const generateVapidKeysQuery = defineQuery({
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
