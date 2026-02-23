import { defineEventHandler, getHeader } from 'nitro/h3'
import { getRateLimiter } from '../utils/rateLimiter'

export default defineEventHandler(async (event) => {
  // Only apply rate limiting to GraphQL endpoint
  if (!event.path.startsWith('/api/graphql')) {
    return
  }

  // Skip rate limiting in development if disabled
  if (process.env.NODE_ENV === 'development' && process.env.RATE_LIMIT_DISABLED === 'true') {
    return
  }

  // Get API key from header or query
  const apiKey = getHeader(event, 'x-api-key')
    || getQuery(event).apiKey as string
    || null

  // If no API key, use IP address for rate limiting
  const rateLimitKey = apiKey || getClientIP(event) || 'anonymous'

  const limiter = getRateLimiter()
  const result = await limiter.isAllowed(rateLimitKey)

  // Set rate limit headers
  setHeader(event, 'X-RateLimit-Limit', result.limit.toString())
  setHeader(event, 'X-RateLimit-Remaining', result.remaining.toString())
  setHeader(event, 'X-RateLimit-Reset', Math.floor(result.resetAt / 1000).toString())

  if (!result.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    })
  }

  // Consume rate limit
  await limiter.consume(rateLimitKey)
})

function getClientIP(event: any): string | null {
  // Check various headers for client IP
  const forwardedFor = getHeader(event, 'x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = getHeader(event, 'x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to remote address
  return event.node?.req?.socket?.remoteAddress || null
}
