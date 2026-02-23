import { verifyApiKey } from '#server/utils/auth'
import { HTTPError } from 'nitro/h3'

export function createAuthDirective() {
  return {
    name: 'auth',
    // This will be a simple programmatic auth check in resolvers
    // since nitro-graphql may not support schema directives yet
    check: async (context: any) => {
      const apiKey = context.event?.node?.req?.headers?.authorization?.replace('Bearer ', '')
        || context.event?.node?.req?.headers?.['x-api-key']

      if (!apiKey) {
        throw new HTTPError({
          status: 401,
          message: 'API key required',
        })
      }

      const app = await verifyApiKey(apiKey)
      if (!app) {
        throw new HTTPError({
          status: 401,
          message: 'Invalid API key',
        })
      }

      return app
    },
  }
}

// Helper function to use in resolvers
export async function requireAuth(context: any) {
  const authDirective = createAuthDirective()
  return await authDirective.check(context)
}
