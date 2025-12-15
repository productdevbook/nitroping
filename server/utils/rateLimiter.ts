import { getRedis } from './redis'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetAt: number
}

const DEFAULT_LIMIT = Number.parseInt(process.env.RATE_LIMIT_DEFAULT || '1000')
const DEFAULT_WINDOW = Number.parseInt(process.env.RATE_LIMIT_WINDOW || '3600') // 1 hour in seconds

export class RateLimiter {
  private keyPrefix: string

  constructor(keyPrefix = 'ratelimit:') {
    this.keyPrefix = keyPrefix
  }

  async isAllowed(
    key: string,
    limit: number = DEFAULT_LIMIT,
    windowSeconds: number = DEFAULT_WINDOW,
  ): Promise<RateLimitResult> {
    const redis = getRedis()
    const now = Date.now()
    const windowStart = now - (windowSeconds * 1000)
    const redisKey = `${this.keyPrefix}${key}`

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline()

      // Remove old entries outside the window
      pipeline.zremrangebyscore(redisKey, 0, windowStart)

      // Count current requests in window
      pipeline.zcard(redisKey)

      // Execute pipeline
      const results = await pipeline.exec()

      if (!results) {
        // Redis error, allow request but log warning
        console.warn('[RateLimiter] Pipeline returned null, allowing request')
        return {
          allowed: true,
          remaining: limit,
          limit,
          resetAt: now + (windowSeconds * 1000),
        }
      }

      const currentCount = results[1]?.[1] as number || 0

      if (currentCount >= limit) {
        // Rate limit exceeded
        return {
          allowed: false,
          remaining: 0,
          limit,
          resetAt: now + (windowSeconds * 1000),
        }
      }

      return {
        allowed: true,
        remaining: limit - currentCount - 1,
        limit,
        resetAt: now + (windowSeconds * 1000),
      }
    }
    catch (error) {
      // On Redis error, allow request but log warning
      console.warn('[RateLimiter] Redis error, allowing request:', error)
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetAt: now + (windowSeconds * 1000),
      }
    }
  }

  async consume(key: string, windowSeconds: number = DEFAULT_WINDOW): Promise<void> {
    const redis = getRedis()
    const now = Date.now()
    const redisKey = `${this.keyPrefix}${key}`

    try {
      // Add current timestamp to sorted set
      await redis.zadd(redisKey, now, `${now}:${Math.random()}`)

      // Set expiration on the key
      await redis.expire(redisKey, windowSeconds + 60) // Add buffer
    }
    catch (error) {
      console.warn('[RateLimiter] Failed to consume rate limit:', error)
    }
  }

  async reset(key: string): Promise<void> {
    const redis = getRedis()
    const redisKey = `${this.keyPrefix}${key}`

    try {
      await redis.del(redisKey)
    }
    catch (error) {
      console.warn('[RateLimiter] Failed to reset rate limit:', error)
    }
  }

  async getStatus(
    key: string,
    limit: number = DEFAULT_LIMIT,
    windowSeconds: number = DEFAULT_WINDOW,
  ): Promise<RateLimitResult> {
    const redis = getRedis()
    const now = Date.now()
    const windowStart = now - (windowSeconds * 1000)
    const redisKey = `${this.keyPrefix}${key}`

    try {
      // Remove old entries and count
      await redis.zremrangebyscore(redisKey, 0, windowStart)
      const currentCount = await redis.zcard(redisKey)

      return {
        allowed: currentCount < limit,
        remaining: Math.max(0, limit - currentCount),
        limit,
        resetAt: now + (windowSeconds * 1000),
      }
    }
    catch (error) {
      console.warn('[RateLimiter] Failed to get status:', error)
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetAt: now + (windowSeconds * 1000),
      }
    }
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter()
  }
  return rateLimiterInstance
}
