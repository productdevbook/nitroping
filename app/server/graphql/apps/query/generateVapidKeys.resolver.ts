import { defineQuery } from 'nitro-graphql/utils/define'
import { WebPushProvider } from '#server/providers/webpush'

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
