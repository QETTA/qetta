import { describe, it, expect, beforeEach } from 'vitest'
import {
  rateLimit,
  clearRateLimitStore,
  getRateLimitHeaders,
  createRateLimitResponse,
  withRateLimit,
  RATE_LIMITS,
} from '../rate-limiter'

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
  // Use x-user-id for simpler testing (bypasses JWT)
  if (opts.userId) headers.set('x-user-id', opts.userId)

  return new Request('https://localhost/api/test', { headers })
}

describe('rateLimit', () => {
  beforeEach(() => {
    clearRateLimitStore()
  })

  it('allows requests within the limit', async () => {
    const req = mockRequest({ ip: '1.1.1.1' })
    const result = await rateLimit(req, 'default')

    expect(result.success).toBe(true)
    expect(result.remaining).toBeGreaterThan(0)
    expect(result.limit).toBe(RATE_LIMITS.default.requests)
  })

  it('returns 429 when limit exceeded', async () => {
    const req = mockRequest({ ip: '2.2.2.2' })

    // Exhaust the default limit (100)
    for (let i = 0; i < RATE_LIMITS.default.requests; i++) {
      await rateLimit(req, 'default')
    }

    const result = await rateLimit(req, 'default')
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('uses endpoint-specific limits', async () => {
    const req = mockRequest({ ip: '3.3.3.3' })
    const result = await rateLimit(req, 'chat')

    expect(result.limit).toBe(RATE_LIMITS.chat.requests)
  })

  it('falls back to default for unknown endpoints', async () => {
    const req = mockRequest({ ip: '4.4.4.4' })
    const result = await rateLimit(req, 'nonexistent-endpoint')

    expect(result.limit).toBe(RATE_LIMITS.default.requests)
  })

  it('uses higher limit for authenticated users (x-user-id)', async () => {
    const req = mockRequest({ userId: 'user-123' })
    const result = await rateLimit(req, 'chat')

    expect(result.isAuthenticated).toBe(true)
    expect(result.limit).toBe(RATE_LIMITS.chat.authenticatedRequests)
  })

  it('isolates different IPs', async () => {
    const req1 = mockRequest({ ip: '10.0.0.1' })
    const req2 = mockRequest({ ip: '10.0.0.2' })

    // Exhaust limit for IP 1
    for (let i = 0; i < RATE_LIMITS.default.requests; i++) {
      await rateLimit(req1, 'default')
    }

    // IP 2 should still be allowed
    const result = await rateLimit(req2, 'default')
    expect(result.success).toBe(true)
  })

  it('provides a valid reset time in the future', async () => {
    const req = mockRequest({ ip: '5.5.5.5' })
    const result = await rateLimit(req, 'default')

    expect(result.reset.getTime()).toBeGreaterThan(Date.now())
  })

  it('returns remaining as 0 when exceeded (not negative)', async () => {
    const req = mockRequest({ ip: '6.6.6.6' })

    // Go way over the limit
    for (let i = 0; i < RATE_LIMITS.default.requests + 5; i++) {
      await rateLimit(req, 'default')
    }

    const result = await rateLimit(req, 'default')
    expect(result.remaining).toBe(0)
  })
})

describe('getRateLimitHeaders', () => {
  it('returns correct header keys', async () => {
    const req = mockRequest({ ip: '7.7.7.7' })
    const result = await rateLimit(req, 'default')
    const headers = getRateLimitHeaders(result)

    expect(headers).toHaveProperty('X-RateLimit-Limit')
    expect(headers).toHaveProperty('X-RateLimit-Remaining')
    expect(headers).toHaveProperty('X-RateLimit-Reset')
  })
})

describe('createRateLimitResponse', () => {
  it('returns a 429 Response', async () => {
    const req = mockRequest({ ip: '8.8.8.8' })

    // Exhaust the limit
    for (let i = 0; i <= RATE_LIMITS.default.requests; i++) {
      await rateLimit(req, 'default')
    }

    const result = await rateLimit(req, 'default')
    const response = createRateLimitResponse(result)

    expect(response.status).toBe(429)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()

    const body = await response.json()
    expect(body.error).toBe('Too Many Requests')
    expect(body.retryAfter).toBeGreaterThan(0)
  })
})

describe('RATE_LIMITS config', () => {
  it('defines limits for known endpoints', () => {
    expect(RATE_LIMITS.chat).toBeDefined()
    expect(RATE_LIMITS['generate-document']).toBeDefined()
    expect(RATE_LIMITS['analyze-rejection']).toBeDefined()
    expect(RATE_LIMITS.default).toBeDefined()
  })

  it('all configs have valid window and requests', () => {
    for (const [, config] of Object.entries(RATE_LIMITS)) {
      expect(config.requests).toBeGreaterThan(0)
      expect(config.window).toBeGreaterThan(0)
    }
  })
})

describe('withRateLimit middleware', () => {
  beforeEach(() => {
    clearRateLimitStore()
  })

  it('allows requests within limit and adds headers', async () => {
    const handler = async () => Response.json({ success: true })
    const wrappedHandler = withRateLimit(handler, 'default')

    const req = mockRequest({ ip: '20.20.20.1' })
    const response = await wrappedHandler(req)

    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBe(RATE_LIMITS.default.requests.toString())
    expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()

    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('returns 429 when limit exceeded', async () => {
    const handler = async () => Response.json({ success: true })
    const wrappedHandler = withRateLimit(handler, 'default')

    const req = mockRequest({ ip: '20.20.20.2' })

    // Exhaust the limit
    for (let i = 0; i < RATE_LIMITS.default.requests; i++) {
      await wrappedHandler(req)
    }

    // Next request should be rate limited
    const response = await wrappedHandler(req)
    expect(response.status).toBe(429)

    const body = await response.json()
    expect(body.error).toBe('Too Many Requests')
  })

  it('preserves original response status code', async () => {
    const handler = async () => new Response(null, { status: 201 })
    const wrappedHandler = withRateLimit(handler, 'default')

    const req = mockRequest({ ip: '20.20.20.3' })
    const response = await wrappedHandler(req)

    expect(response.status).toBe(201)
  })

  it('preserves original response headers', async () => {
    const handler = async () =>
      new Response('OK', {
        headers: { 'X-Custom-Header': 'custom-value' },
      })
    const wrappedHandler = withRateLimit(handler, 'default')

    const req = mockRequest({ ip: '20.20.20.4' })
    const response = await wrappedHandler(req)

    expect(response.headers.get('X-Custom-Header')).toBe('custom-value')
    expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
  })

  it('uses authenticated limits for authenticated users', async () => {
    const handler = async () => Response.json({ success: true })
    const wrappedHandler = withRateLimit(handler, 'chat')

    const req = mockRequest({ userId: 'test-user-middleware' })
    const response = await wrappedHandler(req)

    expect(response.headers.get('X-RateLimit-Limit')).toBe(
      RATE_LIMITS.chat.authenticatedRequests?.toString()
    )
  })
})

describe('IP extraction', () => {
  beforeEach(() => {
    clearRateLimitStore()
  })

  it('extracts IP from x-real-ip header', async () => {
    const headers = new Headers()
    headers.set('x-real-ip', '100.100.100.1')
    const req = new Request('https://localhost/api/test', { headers })

    const result = await rateLimit(req, 'default')
    expect(result.success).toBe(true)
  })

  it('extracts IP from cf-connecting-ip header (Cloudflare)', async () => {
    const headers = new Headers()
    headers.set('cf-connecting-ip', '100.100.100.2')
    const req = new Request('https://localhost/api/test', { headers })

    const result = await rateLimit(req, 'default')
    expect(result.success).toBe(true)
  })

  it('extracts IP from x-vercel-forwarded-for header', async () => {
    const headers = new Headers()
    headers.set('x-vercel-forwarded-for', '100.100.100.3')
    const req = new Request('https://localhost/api/test', { headers })

    const result = await rateLimit(req, 'default')
    expect(result.success).toBe(true)
  })

  it('uses unknown when no IP headers present', async () => {
    const req = new Request('https://localhost/api/test')
    const result = await rateLimit(req, 'default')

    // Should still work but use 'unknown' as identifier
    expect(result.success).toBe(true)
  })
})

describe('Cookie-based authentication', () => {
  beforeEach(() => {
    clearRateLimitStore()
  })

  it('parses authjs.session-token cookie format', async () => {
    const headers = new Headers()
    // Invalid JWT will fail verification and fall back to IP
    headers.set('cookie', 'authjs.session-token=invalid-token; other=value')
    const req = new Request('https://localhost/api/test', { headers })

    // Should fall back to IP-based rate limiting (not authenticated)
    const result = await rateLimit(req, 'chat')
    expect(result.isAuthenticated).toBe(false)
    expect(result.success).toBe(true)
  })

  it('parses next-auth.session-token cookie format', async () => {
    const headers = new Headers()
    headers.set('cookie', 'next-auth.session-token=some-token')
    const req = new Request('https://localhost/api/test', { headers })

    // Invalid token falls back to IP
    const result = await rateLimit(req, 'chat')
    expect(result.isAuthenticated).toBe(false)
    expect(result.success).toBe(true)
  })

  it('parses qetta-session cookie format', async () => {
    const headers = new Headers()
    headers.set('cookie', 'qetta-session=custom-token')
    const req = new Request('https://localhost/api/test', { headers })

    const result = await rateLimit(req, 'chat')
    expect(result.isAuthenticated).toBe(false)
    expect(result.success).toBe(true)
  })
})

describe('Bearer token authentication', () => {
  beforeEach(() => {
    clearRateLimitStore()
  })

  it('extracts token from Authorization Bearer header', async () => {
    const headers = new Headers()
    headers.set('authorization', 'Bearer invalid-jwt-token')
    const req = new Request('https://localhost/api/test', { headers })

    // Invalid token verification fails, falls back to IP
    const result = await rateLimit(req, 'chat')
    expect(result.isAuthenticated).toBe(false)
    expect(result.success).toBe(true)
  })

  it('ignores non-Bearer authorization headers', async () => {
    const headers = new Headers()
    headers.set('authorization', 'Basic dXNlcjpwYXNz')
    headers.set('x-forwarded-for', '50.50.50.1')
    const req = new Request('https://localhost/api/test', { headers })

    const result = await rateLimit(req, 'chat')
    expect(result.isAuthenticated).toBe(false)
    expect(result.success).toBe(true)
  })
})

describe('endpoint-specific configs', () => {
  beforeEach(() => {
    clearRateLimitStore()
  })

  it('uses skill-engine config', async () => {
    const req = mockRequest({ ip: '30.30.30.1' })
    const result = await rateLimit(req, 'skill-engine')

    expect(result.limit).toBe(RATE_LIMITS['skill-engine'].requests)
    expect(result.success).toBe(true)
  })

  it('uses templates config', async () => {
    const req = mockRequest({ ip: '30.30.30.2' })
    const result = await rateLimit(req, 'templates')

    expect(result.limit).toBe(RATE_LIMITS.templates.requests)
    expect(result.success).toBe(true)
  })

  it('uses apply-tenders config', async () => {
    const req = mockRequest({ ip: '30.30.30.3' })
    const result = await rateLimit(req, 'apply-tenders')

    expect(result.limit).toBe(RATE_LIMITS['apply-tenders'].requests)
    expect(result.success).toBe(true)
  })
})

describe('JWT verification edge cases', () => {
  beforeEach(() => {
    clearRateLimitStore()
  })

  it('falls back to IP when no NEXTAUTH_SECRET is set', async () => {
    const originalSecret = process.env.NEXTAUTH_SECRET
    const originalAuth = process.env.AUTH_SECRET
    delete process.env.NEXTAUTH_SECRET
    delete process.env.AUTH_SECRET

    try {
      const headers = new Headers()
      headers.set('authorization', 'Bearer some-token')
      headers.set('x-forwarded-for', '40.40.40.5')
      const req = new Request('https://localhost/api/test', { headers })

      const result = await rateLimit(req, 'chat')
      expect(result.isAuthenticated).toBe(false)
    } finally {
      if (originalSecret) process.env.NEXTAUTH_SECRET = originalSecret
      if (originalAuth) process.env.AUTH_SECRET = originalAuth
    }
  })

  it('handles empty Authorization Bearer value', async () => {
    const headers = new Headers()
    headers.set('authorization', 'Bearer ')
    headers.set('x-forwarded-for', '40.40.40.3')
    const req = new Request('https://localhost/api/test', { headers })

    const result = await rateLimit(req, 'chat')
    expect(result.isAuthenticated).toBe(false)
    expect(result.success).toBe(true)
  })

  it('handles malformed JWT token in Authorization header', async () => {
    const headers = new Headers()
    headers.set('authorization', 'Bearer not.a.valid.jwt.token')
    headers.set('x-forwarded-for', '40.40.40.6')
    const req = new Request('https://localhost/api/test', { headers })

    const result = await rateLimit(req, 'chat')
    // Invalid JWT falls back to IP-based rate limiting
    expect(result.isAuthenticated).toBe(false)
    expect(result.success).toBe(true)
  })

  it('handles malformed JWT token in cookie', async () => {
    const headers = new Headers()
    headers.set('cookie', 'authjs.session-token=broken.jwt')
    headers.set('x-forwarded-for', '40.40.40.7')
    const req = new Request('https://localhost/api/test', { headers })

    const result = await rateLimit(req, 'chat')
    expect(result.isAuthenticated).toBe(false)
    expect(result.success).toBe(true)
  })
})

describe('x-forwarded-for parsing', () => {
  beforeEach(() => {
    clearRateLimitStore()
  })

  it('extracts first IP from comma-separated list', async () => {
    const headers = new Headers()
    headers.set('x-forwarded-for', '50.50.50.1, 50.50.50.2, 50.50.50.3')
    const req = new Request('https://localhost/api/test', { headers })

    const result1 = await rateLimit(req, 'default')
    expect(result1.success).toBe(true)

    // Different first IP should be isolated
    const headers2 = new Headers()
    headers2.set('x-forwarded-for', '50.50.50.4, 50.50.50.2, 50.50.50.3')
    const req2 = new Request('https://localhost/api/test', { headers: headers2 })

    const result2 = await rateLimit(req2, 'default')
    expect(result2.success).toBe(true)
    // They should have independent counters
    expect(result2.remaining).toBe(result1.remaining)
  })
})
