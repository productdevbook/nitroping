import { verifyApiKey } from '~~/server/utils/auth'

export function createAuthDirective() {
  return {
    name: 'auth',
    // This will be a simple programmatic auth check in resolvers
    // since nitro-graphql may not support schema directives yet
    check: async (context: any) => {
      const apiKey = context.event?.node?.req?.headers?.authorization?.replace('Bearer ', '')
        || context.event?.node?.req?.headers?.['x-api-key']

      if (!apiKey) {
        throw createError({
          statusCode: 401,
          statusMessage: 'API key required',
        })
      }

      const app = await verifyApiKey(apiKey)
      if (!app) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Invalid API key',
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
