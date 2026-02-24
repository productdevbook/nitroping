import { randomBytes } from 'node:crypto'
import { getRedis } from './redis'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetAt: number
}

const DEFAULT_LIMIT = Number.parseInt(process.env.RATE_LIMIT_DEFAULT || '1000')
const DEFAULT_WINDOW = Number.parseInt(process.env.RATE_LIMIT_WINDOW || '3600') // 1 hour in seconds

// Atomic Lua script: removes stale entries, checks the count, and adds a new
// entry in a single round-trip – eliminating the check-then-act race condition
// that existed when isAllowed() and consume() were separate calls.
//
// Returns: [allowed (0|1), remaining, resetAt (ms timestamp)]
const RATE_LIMIT_SCRIPT = `
local key        = KEYS[1]
local limit      = tonumber(ARGV[1])
local window     = tonumber(ARGV[2])
local now        = tonumber(ARGV[3])
local member     = ARGV[4]
local windowStart = now - (window * 1000)

redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
local count = redis.call('ZCARD', key)

if count >= limit then
  return {0, 0, now + (window * 1000)}
end

redis.call('ZADD', key, now, member)
redis.call('EXPIRE', key, window + 60)

return {1, limit - count - 1, now + (window * 1000)}
`

export class RateLimiter {
  private keyPrefix: string

  constructor(keyPrefix = 'ratelimit:') {
    this.keyPrefix = keyPrefix
  }

  /**
   * Atomically check and consume a rate-limit token in one Redis round-trip.
   * Returns the result including whether the request is allowed.
   */
  async consume(
    key: string,
    limit: number = DEFAULT_LIMIT,
    windowSeconds: number = DEFAULT_WINDOW,
  ): Promise<RateLimitResult> {
    const redis = getRedis()
    const now = Date.now()
    const redisKey = `${this.keyPrefix}${key}`
    const member = `${now}:${randomBytes(8).toString('hex')}`

    try {
      const result = await redis.eval(
        RATE_LIMIT_SCRIPT,
        1,
        redisKey,
        limit.toString(),
        windowSeconds.toString(),
        now.toString(),
        member,
      ) as [number, number, number]

      return {
        allowed: result[0] === 1,
        remaining: result[1] ?? 0,
        limit,
        resetAt: result[2] ?? now + windowSeconds * 1000,
      }
    }
    catch (error) {
      // On Redis error, fail open with a warning
      console.warn('[RateLimiter] Redis error, allowing request:', error)
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetAt: now + windowSeconds * 1000,
      }
    }
  }

  /** Read-only status check (does not consume a token). */
  async getStatus(
    key: string,
    limit: number = DEFAULT_LIMIT,
    windowSeconds: number = DEFAULT_WINDOW,
  ): Promise<RateLimitResult> {
    const redis = getRedis()
    const now = Date.now()
    const windowStart = now - windowSeconds * 1000
    const redisKey = `${this.keyPrefix}${key}`

    try {
      await redis.zremrangebyscore(redisKey, 0, windowStart)
      const currentCount = await redis.zcard(redisKey)

      return {
        allowed: currentCount < limit,
        remaining: Math.max(0, limit - currentCount),
        limit,
        resetAt: now + windowSeconds * 1000,
      }
    }
    catch (error) {
      console.warn('[RateLimiter] Failed to get status:', error)
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetAt: now + windowSeconds * 1000,
      }
    }
  }

  async reset(key: string): Promise<void> {
    const redis = getRedis()
    try {
      await redis.del(`${this.keyPrefix}${key}`)
    }
    catch (error) {
      console.warn('[RateLimiter] Failed to reset rate limit:', error)
    }
  }
}

let rateLimiterInstance: RateLimiter | null = null

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter()
  }
  return rateLimiterInstance
}
