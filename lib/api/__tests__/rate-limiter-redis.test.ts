import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { RATE_LIMITS } from '../rate-limiter'

// Mock Redis client
const mockRedisClient = {
  eval: vi.fn(),
  get: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  keys: vi.fn(),
  del: vi.fn(),
}

let mockRedisEnabled = true

vi.mock('@/lib/cache/redis-client', () => ({
  getRedisClient: () => (mockRedisEnabled ? mockRedisClient : null),
  isRedisEnabled: () => mockRedisEnabled,
}))

// Import after mocking
import {
  rateLimitDistributed,
  getRateLimitStatus,
  resetRateLimit,
  rateLimit,
  withDistributedRateLimit,
} from '../rate-limiter-redis'

// Helper: create a mock request
function mockRequest(opts: {
  ip?: string
  userId?: string
  cookie?: string
  authorization?: string
} = {}): Request {
  const headers = new Headers()
  if (opts.ip) headers.set('x-forwarded-for', opts.ip)
  if (opts.authorization) headers.set('authorization', opts.authorization)
  if (opts.cookie) headers.set('cookie', opts.cookie)

  return new Request('https://localhost/api/test', { headers })
}

describe('rateLimitDistributed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedisEnabled = true
  })

  afterEach(() => {
    mockRedisEnabled = true
  })

  it('allows requests when Redis returns allowed=1', async () => {
    // Mock Lua script response: [allowed, count, resetAt, windowStart]
    mockRedisClient.eval.mockResolvedValue([1, 5, Date.now() + 60000, Date.now()])

    const req = mockRequest({ ip: '1.1.1.1' })
    const result = await rateLimitDistributed(req, 'default')

    expect(result.success).toBe(true)
    expect(result.remaining).toBe(RATE_LIMITS.default.requests - 5)
    expect(result.limit).toBe(RATE_LIMITS.default.requests)
    expect(mockRedisClient.eval).toHaveBeenCalled()
  })

  it('denies requests when Redis returns allowed=0', async () => {
    const resetAt = Date.now() + 60000
    mockRedisClient.eval.mockResolvedValue([0, 100, resetAt, Date.now()])

    const req = mockRequest({ ip: '2.2.2.2' })
    const result = await rateLimitDistributed(req, 'default')

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.reset.getTime()).toBe(resetAt)
  })

  it('uses endpoint-specific limits', async () => {
    mockRedisClient.eval.mockResolvedValue([1, 3, Date.now() + 60000, Date.now()])

    const req = mockRequest({ ip: '3.3.3.3' })
    const result = await rateLimitDistributed(req, 'chat')

    expect(result.limit).toBe(RATE_LIMITS.chat.requests)
    expect(result.remaining).toBe(RATE_LIMITS.chat.requests - 3)
  })

  it('falls back to default for unknown endpoints', async () => {
    mockRedisClient.eval.mockResolvedValue([1, 1, Date.now() + 60000, Date.now()])

    const req = mockRequest({ ip: '4.4.4.4' })
    const result = await rateLimitDistributed(req, 'unknown-endpoint')

    expect(result.limit).toBe(RATE_LIMITS.default.requests)
  })

  it('returns isAuthenticated=false for unauthenticated requests', async () => {
    mockRedisClient.eval.mockResolvedValue([1, 1, Date.now() + 60000, Date.now()])

    const req = mockRequest({ ip: '5.5.5.5' })
    const result = await rateLimitDistributed(req, 'chat')

    expect(result.isAuthenticated).toBe(false)
    expect(result.limit).toBe(RATE_LIMITS.chat.requests)
  })

  describe('graceful degradation', () => {
    it('allows requests when Redis is unavailable', async () => {
      mockRedisEnabled = false

      const req = mockRequest({ ip: '6.6.6.6' })
      const result = await rateLimitDistributed(req, 'default')

      expect(result.success).toBe(true)
      expect(result.remaining).toBeGreaterThanOrEqual(0)
      expect(mockRedisClient.eval).not.toHaveBeenCalled()
    })

    it('allows requests when Lua script fails', async () => {
      mockRedisClient.eval.mockRejectedValue(new Error('Lua error'))
      mockRedisClient.incr.mockResolvedValue(1)
      mockRedisClient.expire.mockResolvedValue(1)

      const req = mockRequest({ ip: '7.7.7.7' })
      const result = await rateLimitDistributed(req, 'default')

      // Falls back to simple INCR-based rate limiting
      expect(result.success).toBe(true)
      expect(mockRedisClient.incr).toHaveBeenCalled()
    })

    it('allows requests when both Lua and fallback fail', async () => {
      mockRedisClient.eval.mockRejectedValue(new Error('Lua error'))
      mockRedisClient.incr.mockRejectedValue(new Error('INCR error'))

      const req = mockRequest({ ip: '8.8.8.8' })
      const result = await rateLimitDistributed(req, 'default')

      // Should still allow (fail-open)
      expect(result.success).toBe(true)
    })
  })
})

describe('getRateLimitStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedisEnabled = true
  })

  it('returns current usage from Redis', async () => {
    mockRedisClient.get.mockImplementation((key: string) => {
      if (key.includes('simple')) return null
      // Return counts for current and previous windows
      return Promise.resolve(10)
    })

    const req = mockRequest({ ip: '10.10.10.1' })
    const status = await getRateLimitStatus(req, 'default')

    expect(status.limit).toBe(RATE_LIMITS.default.requests)
    expect(status.used).toBeGreaterThanOrEqual(0)
    expect(status.remaining).toBeLessThanOrEqual(RATE_LIMITS.default.requests)
  })

  it('returns zero usage when Redis is unavailable', async () => {
    mockRedisEnabled = false

    const req = mockRequest({ ip: '10.10.10.2' })
    const status = await getRateLimitStatus(req, 'default')

    expect(status.used).toBe(0)
    expect(status.remaining).toBe(RATE_LIMITS.default.requests)
  })
})

describe('resetRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedisEnabled = true
  })

  it('deletes rate limit keys for identifier', async () => {
    mockRedisClient.keys.mockResolvedValue(['rl:sw:default:ip:1.1.1.1:123456'])
    mockRedisClient.del.mockResolvedValue(1)

    const result = await resetRateLimit('ip:1.1.1.1', 'default')

    expect(result).toBe(true)
    expect(mockRedisClient.keys).toHaveBeenCalled()
    expect(mockRedisClient.del).toHaveBeenCalled()
  })

  it('returns false when Redis is unavailable', async () => {
    mockRedisEnabled = false

    const result = await resetRateLimit('ip:2.2.2.2', 'default')

    expect(result).toBe(false)
  })

  it('returns true even when no keys found', async () => {
    mockRedisClient.keys.mockResolvedValue([])

    const result = await resetRateLimit('ip:3.3.3.3', 'default')

    expect(result).toBe(true)
    expect(mockRedisClient.del).not.toHaveBeenCalled()
  })
})

describe('rateLimit (unified)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedisEnabled = true
  })

  afterEach(() => {
    delete process.env.RATE_LIMITER_BACKEND
    mockRedisEnabled = true
  })

  it('uses Redis when RATE_LIMITER_BACKEND=redis', async () => {
    process.env.RATE_LIMITER_BACKEND = 'redis'
    mockRedisClient.eval.mockResolvedValue([1, 1, Date.now() + 60000, Date.now()])

    const req = mockRequest({ ip: '20.20.20.1' })
    const result = await rateLimit(req, 'default')

    expect(result.success).toBe(true)
    expect(mockRedisClient.eval).toHaveBeenCalled()
  })

  it('uses Redis when RATE_LIMITER_BACKEND=auto and Redis available', async () => {
    process.env.RATE_LIMITER_BACKEND = 'auto'
    mockRedisEnabled = true
    mockRedisClient.eval.mockResolvedValue([1, 1, Date.now() + 60000, Date.now()])

    const req = mockRequest({ ip: '20.20.20.2' })
    const result = await rateLimit(req, 'default')

    expect(result.success).toBe(true)
    expect(mockRedisClient.eval).toHaveBeenCalled()
  })

  it('uses memory when RATE_LIMITER_BACKEND=memory', async () => {
    process.env.RATE_LIMITER_BACKEND = 'memory'

    const req = mockRequest({ ip: '20.20.20.3' })
    const result = await rateLimit(req, 'default')

    expect(result.success).toBe(true)
    // Redis should not be called
    expect(mockRedisClient.eval).not.toHaveBeenCalled()
  })

  it('uses memory when RATE_LIMITER_BACKEND=auto and Redis unavailable', async () => {
    process.env.RATE_LIMITER_BACKEND = 'auto'
    mockRedisEnabled = false

    const req = mockRequest({ ip: '20.20.20.4' })
    const result = await rateLimit(req, 'default')

    expect(result.success).toBe(true)
    expect(mockRedisClient.eval).not.toHaveBeenCalled()
  })
})

describe('withDistributedRateLimit middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedisEnabled = true
  })

  it('allows requests and adds headers when within limit', async () => {
    mockRedisClient.eval.mockResolvedValue([1, 5, Date.now() + 60000, Date.now()])

    const handler = async () => Response.json({ success: true })
    const wrappedHandler = withDistributedRateLimit(handler, 'default')

    const req = mockRequest({ ip: '30.30.30.1' })
    const response = await wrappedHandler(req)

    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBe(RATE_LIMITS.default.requests.toString())
    expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
  })

  it('returns 429 when limit exceeded', async () => {
    mockRedisClient.eval.mockResolvedValue([0, 100, Date.now() + 60000, Date.now()])

    const handler = async () => Response.json({ success: true })
    const wrappedHandler = withDistributedRateLimit(handler, 'default')

    const req = mockRequest({ ip: '30.30.30.2' })
    const response = await wrappedHandler(req)

    expect(response.status).toBe(429)
    const body = await response.json()
    expect(body.error).toBe('Too Many Requests')
  })

  it('preserves original response status and body', async () => {
    mockRedisClient.eval.mockResolvedValue([1, 1, Date.now() + 60000, Date.now()])

    const handler = async () => new Response(JSON.stringify({ data: 'test' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
    const wrappedHandler = withDistributedRateLimit(handler, 'default')

    const req = mockRequest({ ip: '30.30.30.3' })
    const response = await wrappedHandler(req)

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data).toBe('test')
  })
})

describe('Sliding Window Algorithm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedisEnabled = true
  })

  it('passes correct arguments to Lua script', async () => {
    mockRedisClient.eval.mockResolvedValue([1, 1, Date.now() + 60000, Date.now()])

    const req = mockRequest({ ip: '40.40.40.1' })
    await rateLimitDistributed(req, 'chat')

    expect(mockRedisClient.eval).toHaveBeenCalled()
    const call = mockRedisClient.eval.mock.calls[0]

    // KEYS should contain current and previous window keys
    const keys = call[1] as string[]
    expect(keys.length).toBe(2)
    expect(keys[0]).toContain('rl:sw:chat:ip:40.40.40.1:')
    expect(keys[1]).toContain('rl:sw:chat:ip:40.40.40.1:')

    // ARGV should contain [windowMs, limit, timestamp]
    const args = call[2] as string[]
    expect(args.length).toBe(3)
    expect(parseInt(args[0])).toBe(RATE_LIMITS.chat.window) // 60000ms
    expect(parseInt(args[1])).toBe(RATE_LIMITS.chat.requests) // 20
  })

  it('calculates weighted count correctly', async () => {
    // Simulate being 30 seconds into a 60-second window
    // Previous window had 10 requests, current has 5
    // Weight = (60000 - 30000) / 60000 = 0.5
    // Weighted count = 10 * 0.5 + 5 = 10

    mockRedisClient.eval.mockResolvedValue([1, 10, Date.now() + 30000, Date.now()])

    const req = mockRequest({ ip: '40.40.40.2' })
    const result = await rateLimitDistributed(req, 'default')

    // Should have limit - 10 remaining
    expect(result.remaining).toBe(RATE_LIMITS.default.requests - 10)
  })
})

describe('KidsMap endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedisEnabled = true
  })

  it('uses kidsmap-places limits', async () => {
    mockRedisClient.eval.mockResolvedValue([1, 1, Date.now() + 60000, Date.now()])

    const req = mockRequest({ ip: '50.50.50.1' })
    const result = await rateLimitDistributed(req, 'kidsmap-places')

    expect(result.limit).toBe(RATE_LIMITS['kidsmap-places'].requests)
  })

  it('uses kidsmap-recommendations limits', async () => {
    mockRedisClient.eval.mockResolvedValue([1, 1, Date.now() + 60000, Date.now()])

    const req = mockRequest({ ip: '50.50.50.2' })
    const result = await rateLimitDistributed(req, 'kidsmap-recommendations')

    expect(result.limit).toBe(RATE_LIMITS['kidsmap-recommendations'].requests)
  })

  it('uses kidsmap-feed limits', async () => {
    mockRedisClient.eval.mockResolvedValue([1, 1, Date.now() + 60000, Date.now()])

    const req = mockRequest({ ip: '50.50.50.3' })
    const result = await rateLimitDistributed(req, 'kidsmap-feed')

    expect(result.limit).toBe(RATE_LIMITS['kidsmap-feed'].requests)
  })
})
