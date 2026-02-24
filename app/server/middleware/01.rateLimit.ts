import { defineEventHandler, getQuery, getRequestIP, HTTPError } from 'nitro/h3'
import { getRateLimiter } from '../utils/rateLimiter'

export default defineEventHandler(async (event) => {
  // Only apply rate limiting to GraphQL endpoint
  if (!event.url.pathname.startsWith('/api/graphql')) {
    return
  }

  // Skip rate limiting in development if disabled
  if (process.env.NODE_ENV === 'development' && process.env.RATE_LIMIT_DISABLED === 'true') {
    return
  }

  // Get API key from header or query
  const apiKey = event.req.headers.get('x-api-key')
    || getQuery(event).apiKey as string
    || null

  // If no API key, use IP address for rate limiting
  const rateLimitKey = apiKey || getRequestIP(event) || 'anonymous'

  const limiter = getRateLimiter()
  // consume() atomically checks and records the request in one Redis round-trip
  const result = await limiter.consume(rateLimitKey)

  // Set rate limit headers
  event.res.headers.set('X-RateLimit-Limit', result.limit.toString())
  event.res.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  event.res.headers.set('X-RateLimit-Reset', Math.floor(result.resetAt / 1000).toString())

  if (!result.allowed) {
    throw new HTTPError({
      status: 429,
      message: 'Rate limit exceeded. Please try again later.',
    })
  }
})
