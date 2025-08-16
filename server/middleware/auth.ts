import { extractAuthFromEvent } from '../utils/auth'

export default defineEventHandler(async (event) => {
  // Skip auth for health check and public routes
  const url = getRouterParam(event, '_') || event.node.req.url || ''

  const publicRoutes = [
    '/api/health',
    '/api/v1/auth/login',
    '/api/v1/apps/create',
  ]

  const isPublicRoute = publicRoutes.some(route => url.startsWith(route))

  if (isPublicRoute || !url.startsWith('/api/v1/')) {
    return
  }

  const auth = await extractAuthFromEvent(event)
  event.context.auth = auth
})
