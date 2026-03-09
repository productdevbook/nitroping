import { describe, expect, it } from 'vitest'
import { ApiKeyCache } from '../server/utils/apiKeyCache'

describe('ApiKeyCache', () => {
  it('returns cached values until ttl expires', () => {
    const cache = new ApiKeyCache(100, 1_000)
    cache.set('key', {
      id: 'k1',
      appId: 'a1',
      permissions: ['send'],
      appName: 'NitroPing',
    }, 1_000)

    expect(cache.get('key', 1_050)?.id).toBe('k1')
    expect(cache.get('key', 1_101)).toBeNull()
  })

  it('throttles usage writes per key', () => {
    const cache = new ApiKeyCache(1_000, 5_000)

    expect(cache.shouldWriteUsage('k1', 1_000)).toBe(true)
    expect(cache.shouldWriteUsage('k1', 2_000)).toBe(false)
    expect(cache.shouldWriteUsage('k1', 6_001)).toBe(true)
  })
})
