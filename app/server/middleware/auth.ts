import { defineEventHandler } from 'nitro/h3'
import { extractAuthFromEvent } from '../utils/auth'

export default defineEventHandler(async (event) => {
  // Skip auth for health check and public routes
  const pathname = event.url.pathname

  const publicRoutes = [
    '/api/health',
    '/api/v1/auth/login',
    '/api/v1/apps/create',
  ]

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute || !pathname.startsWith('/api/v1/')) {
    return
  }

  const auth = await extractAuthFromEvent(event)
  event.context.auth = auth
})
