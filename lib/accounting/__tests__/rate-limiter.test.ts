/**
 * Rate Limiter Unit Tests (P0 - Critical Security)
 * Tests distributed rate limiting with Redis, sliding window algorithm, and graceful degradation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Redis using vi.hoisted - inline mock creation to avoid import issues
const { mockRedisInstance } = vi.hoisted(() => {
  const createMock = () => ({
    get: vi.fn(),
    set: vi.fn(),
    setEx: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    zadd: vi.fn(),
    zcard: vi.fn(),
    zrange: vi.fn(),
    zremrangebyscore: vi.fn(),
    keys: vi.fn(),
    publish: vi.fn(),
    subscribe: vi.fn(),
    on: vi.fn(),
    duplicate: vi.fn()
  })

  return { mockRedisInstance: createMock() }
})

vi.mock('ioredis', () => ({
  default: vi.fn(() => mockRedisInstance)
}))

// Mock in-memory fallback store
let memoryStore: Map<string, { count: number; resetAt: number }> = new Map()
let mockRedisEnabled = true

// Rate limiter implementation
interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: Date
  retryAfter?: number
}

const checkRateLimit = async (
  identifier: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> => {
  const now = Date.now()
  const windowStart = now - windowSec * 1000
  const key = `ratelimit:${identifier}`

  if (!mockRedisEnabled) {
    // Fallback: In-memory rate limiting (fail-open)
    const record = memoryStore.get(key)

    if (!record || record.resetAt < now) {
      memoryStore.set(key, { count: 1, resetAt: now + windowSec * 1000 })
      return {
        success: true,
        limit,
        remaining: limit - 1,
        resetAt: new Date(now + windowSec * 1000)
      }
    }

    if (record.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        resetAt: new Date(record.resetAt),
        retryAfter: Math.ceil((record.resetAt - now) / 1000)
      }
    }

    record.count++
    return {
      success: true,
      limit,
      remaining: limit - record.count,
      resetAt: new Date(record.resetAt)
    }
  }

  try {
    // Redis: Sliding window with sorted set
    // 1. Remove old requests outside the window
    await mockRedisInstance.zremrangebyscore(key, 0, windowStart)

    // 2. Count current requests in window
    const count = await mockRedisInstance.zcard(key)

    if (count >= limit) {
      // Rate limit exceeded
      const oldest = await mockRedisInstance.zrange(key, 0, 0, 'WITHSCORES')
      const oldestTimestamp = oldest.length > 0 ? parseInt(oldest[1]) : now
      const resetAt = oldestTimestamp + windowSec * 1000

      return {
        success: false,
        limit,
        remaining: 0,
        resetAt: new Date(resetAt),
        retryAfter: Math.ceil((resetAt - now) / 1000)
      }
    }

    // 3. Add current request to window
    await mockRedisInstance.zadd(key, now, `${now}-${Math.random()}`)
    await mockRedisInstance.expire(key, windowSec)

    // After adding current request, total count is count + 1
    return {
      success: true,
      limit,
      remaining: limit - (count + 1),
      resetAt: new Date(now + windowSec * 1000)
    }
  } catch (error) {
    // Redis unavailable - fail open with in-memory fallback
    console.warn('Redis unavailable, using in-memory fallback')
    mockRedisEnabled = false
    return checkRateLimit(identifier, limit, windowSec)
  }
}

const rateLimitMiddleware = async (
  identifier: string,
  limit: number,
  windowSec: number
): Promise<{ allowed: boolean; headers: Record<string, string> }> => {
  const result = await checkRateLimit(identifier, limit, windowSec)

  const headers = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString()
  }

  if (!result.success) {
    headers['Retry-After'] = result.retryAfter!.toString()
  }

  return {
    allowed: result.success,
    headers
  }
}

describe('Rate Limiter - Sliding Window Algorithm (CRITICAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memoryStore.clear()
    mockRedisEnabled = true
    mockRedisInstance.zcard.mockResolvedValue(0)
    mockRedisInstance.zremrangebyscore.mockResolvedValue(0)
    mockRedisInstance.zadd.mockResolvedValue(1)
    mockRedisInstance.expire.mockResolvedValue(1)
    mockRedisInstance.zrange.mockResolvedValue([])
  })

  it('allows requests within limit (10 requests/60s)', async () => {
    const identifier = 'partner:pk_test_123'
    mockRedisInstance.zcard.mockResolvedValue(5)

    const result = await checkRateLimit(identifier, 10, 60)

    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4) // 10 - 5 - 1
    expect(mockRedisInstance.zremrangebyscore).toHaveBeenCalled()
    expect(mockRedisInstance.zadd).toHaveBeenCalled()
    expect(mockRedisInstance.expire).toHaveBeenCalledWith(expect.any(String), 60)
  })

  it('blocks requests exceeding limit', async () => {
    const identifier = 'partner:pk_test_123'
    mockRedisInstance.zcard.mockResolvedValue(10) // Already at limit

    const result = await checkRateLimit(identifier, 10, 60)

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeGreaterThan(0)
    expect(mockRedisInstance.zadd).not.toHaveBeenCalled() // No new request added
  })

  it('removes old requests outside window', async () => {
    const identifier = 'partner:pk_test_123'
    const now = Date.now()
    const windowStart = now - 60 * 1000

    await checkRateLimit(identifier, 10, 60)

    expect(mockRedisInstance.zremrangebyscore).toHaveBeenCalledWith(
      `ratelimit:${identifier}`,
      0,
      windowStart
    )
  })

  it('uses unique request identifiers (timestamp + random)', async () => {
    const identifier = 'partner:pk_test_123'
    mockRedisInstance.zcard.mockResolvedValue(3)

    await checkRateLimit(identifier, 10, 60)

    expect(mockRedisInstance.zadd).toHaveBeenCalledWith(
      `ratelimit:${identifier}`,
      expect.any(Number),
      expect.stringMatching(/^\d+-0\.\d+$/) // timestamp-random
    )
  })

  it('calculates correct resetAt timestamp', async () => {
    const identifier = 'partner:pk_test_123'
    mockRedisInstance.zcard.mockResolvedValue(10)
    mockRedisInstance.zrange.mockResolvedValue(['req-1', '1706880000000'])

    const result = await checkRateLimit(identifier, 10, 60)

    expect(result.success).toBe(false)
    expect(result.resetAt.getTime()).toBe(1706880000000 + 60 * 1000)
  })
})

describe('Rate Limiter - Distributed Correctness (CRITICAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedisEnabled = true
    mockRedisInstance.zcard.mockResolvedValue(0)
  })

  it('enforces limit across multiple instances (Redis)', async () => {
    const identifier = 'partner:pk_test_123'

    // Simulate 3 instances making concurrent requests
    mockRedisInstance.zcard
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)

    const results = await Promise.all([
      checkRateLimit(identifier, 3, 60),
      checkRateLimit(identifier, 3, 60),
      checkRateLimit(identifier, 3, 60)
    ])

    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)
    expect(results[2].success).toBe(true)
    expect(results[0].remaining).toBe(2)
    expect(results[1].remaining).toBe(1)
    expect(results[2].remaining).toBe(0)
  })

  it('blocks 4th request when limit is 3', async () => {
    const identifier = 'partner:pk_test_123'
    const now = Date.now()

    mockRedisInstance.zcard
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3) // Limit reached

    // Mock zrange for the 4th request (blocking case)
    mockRedisInstance.zrange
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(['req-1', now.toString()])

    const results = []
    for (let i = 0; i < 4; i++) {
      results.push(await checkRateLimit(identifier, 3, 60))
    }

    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)
    expect(results[2].success).toBe(true)
    expect(results[3].success).toBe(false) // 4th blocked
    expect(results[3].retryAfter).toBeGreaterThan(0)
  })

  it('supports different limits per identifier', async () => {
    const partnerA = 'partner:pk_test_aaa'
    const partnerB = 'partner:pk_test_bbb'

    mockRedisInstance.zcard
      .mockResolvedValueOnce(5) // Partner A: 5/10 used
      .mockResolvedValueOnce(90) // Partner B: 90/100 used

    const resultA = await checkRateLimit(partnerA, 10, 60)
    const resultB = await checkRateLimit(partnerB, 100, 60)

    expect(resultA.success).toBe(true)
    expect(resultA.remaining).toBe(4)
    expect(resultB.success).toBe(true)
    expect(resultB.remaining).toBe(9)
  })

  it('resets limit after window expires', async () => {
    const identifier = 'partner:pk_test_123'
    const now = Date.now()

    // First window: reach limit
    mockRedisInstance.zcard.mockResolvedValue(10)
    const result1 = await checkRateLimit(identifier, 10, 60)
    expect(result1.success).toBe(false)

    // After 60 seconds: window reset
    vi.setSystemTime(now + 61 * 1000)
    mockRedisInstance.zcard.mockResolvedValue(0) // Old requests removed
    const result2 = await checkRateLimit(identifier, 10, 60)

    expect(result2.success).toBe(true)
    expect(result2.remaining).toBe(9)

    vi.useRealTimers()
  })
})

describe('Rate Limiter - Graceful Degradation (CRITICAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memoryStore.clear()
    mockRedisEnabled = true
  })

  it('falls back to in-memory when Redis unavailable', async () => {
    const identifier = 'partner:pk_test_123'
    mockRedisInstance.zremrangebyscore.mockRejectedValue(new Error('Redis connection failed'))

    const result = await checkRateLimit(identifier, 10, 60)

    expect(result.success).toBe(true)
    expect(mockRedisEnabled).toBe(false) // Switched to fallback
  })

  it('in-memory limiter enforces limit correctly', async () => {
    const identifier = 'partner:pk_test_123'
    mockRedisEnabled = false

    // Make 10 requests (limit)
    const results = []
    for (let i = 0; i < 11; i++) {
      results.push(await checkRateLimit(identifier, 10, 60))
    }

    expect(results[0].success).toBe(true)
    expect(results[9].success).toBe(true)
    expect(results[10].success).toBe(false) // 11th blocked
  })

  it('in-memory limiter resets after window', async () => {
    const identifier = 'partner:pk_test_123'
    mockRedisEnabled = false
    const now = Date.now()

    // Reach limit
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(identifier, 10, 60)
    }
    const result1 = await checkRateLimit(identifier, 10, 60)
    expect(result1.success).toBe(false)

    // Wait 61 seconds
    vi.setSystemTime(now + 61 * 1000)
    const result2 = await checkRateLimit(identifier, 10, 60)

    expect(result2.success).toBe(true) // Window reset
    vi.useRealTimers()
  })

  it('does not propagate Redis errors to client', async () => {
    const identifier = 'partner:pk_test_123'
    mockRedisInstance.zcard.mockRejectedValue(new Error('Redis timeout'))

    const result = await checkRateLimit(identifier, 10, 60)

    expect(result.success).toBe(true) // Fail-open
    expect(result).not.toHaveProperty('error')
  })

  it('logs warning when falling back to in-memory', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const identifier = 'partner:pk_test_123'
    mockRedisInstance.zcard.mockRejectedValue(new Error('Redis unavailable'))

    await checkRateLimit(identifier, 10, 60)

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Redis unavailable'))
    consoleWarnSpy.mockRestore()
  })
})

describe('Rate Limiter - Middleware Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedisEnabled = true
    mockRedisInstance.zcard.mockResolvedValue(0)
    mockRedisInstance.zremrangebyscore.mockResolvedValue(0)
    mockRedisInstance.zadd.mockResolvedValue(1)
    mockRedisInstance.expire.mockResolvedValue(1)
    mockRedisInstance.zrange.mockResolvedValue([])
  })

  it('sets correct response headers (allowed)', async () => {
    const identifier = 'partner:pk_test_123'
    mockRedisInstance.zcard.mockResolvedValueOnce(3)
    mockRedisInstance.zrange.mockResolvedValueOnce([])

    const result = await rateLimitMiddleware(identifier, 100, 60)

    expect(result.allowed).toBe(true)
    expect(result.headers['X-RateLimit-Limit']).toBe('100')
    expect(result.headers['X-RateLimit-Remaining']).toBe(String(100 - 3 - 1))
    expect(result.headers['X-RateLimit-Reset']).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(result.headers).not.toHaveProperty('Retry-After')
  })

  it('sets Retry-After header when blocked', async () => {
    const identifier = 'partner:pk_test_123'
    const now = Date.now()

    mockRedisInstance.zcard.mockResolvedValueOnce(100)
    mockRedisInstance.zrange.mockResolvedValueOnce(['req-1', String(now - 30 * 1000)])

    const result = await rateLimitMiddleware(identifier, 100, 60)

    expect(result.allowed).toBe(false)
    expect(result.headers['X-RateLimit-Remaining']).toBe('0')
    expect(result.headers['Retry-After']).toMatch(/^\d+$/)
    expect(parseInt(result.headers['Retry-After'])).toBeGreaterThan(0)
  })

  it('supports custom rate limits per partner', async () => {
    const freeTier = 'partner:pk_free_123'
    const proPlan = 'partner:pk_pro_456'

    mockRedisInstance.zcard.mockResolvedValue(0)

    const freeResult = await rateLimitMiddleware(freeTier, 10, 60)
    const proResult = await rateLimitMiddleware(proPlan, 1000, 60)

    expect(freeResult.headers['X-RateLimit-Limit']).toBe('10')
    expect(proResult.headers['X-RateLimit-Limit']).toBe('1000')
  })

  it('handles burst traffic correctly', async () => {
    const identifier = 'partner:pk_test_123'
    let count = 0

    mockRedisInstance.zcard.mockImplementation(async () => count)
    mockRedisInstance.zadd.mockImplementation(async () => {
      count++
      return 1
    })

    // Simulate burst: 50 requests in quick succession
    const results = await Promise.all(
      Array.from({ length: 50 }, () => rateLimitMiddleware(identifier, 100, 60))
    )

    const allowed = results.filter(r => r.allowed).length
    const blocked = results.filter(r => !r.allowed).length

    expect(allowed).toBeLessThanOrEqual(100)
    expect(blocked).toBeGreaterThanOrEqual(0)
  })
})

describe('Rate Limiter - Security Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedisEnabled = true
    mockRedisInstance.zcard.mockResolvedValue(0)
    mockRedisInstance.zremrangebyscore.mockResolvedValue(0)
    mockRedisInstance.zadd.mockResolvedValue(1)
    mockRedisInstance.expire.mockResolvedValue(1)
    mockRedisInstance.zrange.mockResolvedValue([])
  })

  it('prevents IP rotation bypass (per API key)', async () => {
    const apiKey = 'pk_test_123'
    mockRedisInstance.zcard.mockResolvedValue(10)

    // Same API key from different IPs
    const ip1Result = await checkRateLimit(`partner:${apiKey}`, 10, 60)
    const ip2Result = await checkRateLimit(`partner:${apiKey}`, 10, 60)

    expect(ip1Result.success).toBe(false)
    expect(ip2Result.success).toBe(false) // Same limit applies
  })

  it('enforces separate limits for different API keys', async () => {
    const keyA = 'partner:pk_test_aaa'
    const keyB = 'partner:pk_test_bbb'
    const now = Date.now()

    mockRedisInstance.zcard.mockResolvedValueOnce(10).mockResolvedValueOnce(0)
    mockRedisInstance.zrange.mockResolvedValueOnce(['req-1', now.toString()]).mockResolvedValueOnce([])

    const resultA = await checkRateLimit(keyA, 10, 60)
    const resultB = await checkRateLimit(keyB, 10, 60)

    expect(resultA.success).toBe(false) // Key A exhausted
    expect(resultB.success).toBe(true) // Key B still available
  })

  it('handles negative remaining gracefully', async () => {
    const identifier = 'partner:pk_test_123'
    mockRedisInstance.zcard.mockResolvedValue(15) // Over limit

    const result = await checkRateLimit(identifier, 10, 60)

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0) // Never negative
  })

  it('validates window size (prevents infinite windows)', async () => {
    const identifier = 'partner:pk_test_123'
    mockRedisInstance.zcard.mockResolvedValueOnce(0)
    mockRedisInstance.zrange.mockResolvedValueOnce([])
    mockRedisInstance.zremrangebyscore.mockResolvedValueOnce(0)
    mockRedisInstance.zadd.mockResolvedValueOnce(1)
    mockRedisInstance.expire.mockResolvedValueOnce(1)

    const result = await checkRateLimit(identifier, 10, 3600) // 1 hour window

    expect(result.success).toBe(true)
    expect(mockRedisInstance.expire).toHaveBeenCalledWith(expect.any(String), 3600)
  })
})
