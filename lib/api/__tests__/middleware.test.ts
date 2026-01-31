import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auth before importing middleware
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock rate-limiter
vi.mock('../rate-limiter', async (importOriginal) => {
  const original = await importOriginal<typeof import('../rate-limiter')>()
  return {
    ...original,
    rateLimit: vi.fn().mockResolvedValue({
      success: true,
      remaining: 99,
      reset: new Date(Date.now() + 60000),
      limit: 100,
      isAuthenticated: false,
    }),
  }
})

import { withApiMiddleware } from '../middleware'
import { auth } from '@/lib/auth'
import { rateLimit } from '../rate-limiter'

const mockAuth = vi.mocked(auth)
const mockRateLimit = vi.mocked(rateLimit)

function mockRequest(): Request {
  return new Request('https://localhost/api/test', { method: 'POST' })
}

describe('withApiMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockResolvedValue({
      success: true,
      remaining: 99,
      reset: new Date(Date.now() + 60000),
      limit: 100,
      isAuthenticated: false,
    })
  })

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null as never)

      const handler = vi.fn()
      const wrapped = withApiMiddleware(handler)
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(401)
      expect(handler).not.toHaveBeenCalled()
    })

    it('calls handler when authenticated', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'Test', email: 'test@test.com', role: 'user' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }))
      const wrapped = withApiMiddleware(handler)
      const response = await wrapped(mockRequest())

      expect(handler).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('allows unauthenticated requests with skipAuth', async () => {
      mockAuth.mockResolvedValue(null as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ public: true }))
      const wrapped = withApiMiddleware(handler, { skipAuth: true })
      const response = await wrapped(mockRequest())

      expect(handler).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('passes null session with optionalAuth', async () => {
      mockAuth.mockResolvedValue(null as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ optional: true }))
      const wrapped = withApiMiddleware(handler, { optionalAuth: true })
      await wrapped(mockRequest())

      expect(handler).toHaveBeenCalledWith(
        expect.any(Request),
        null
      )
    })
  })

  describe('RBAC', () => {
    it('returns 403 when role does not match requiredRole', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'Test', email: 'test@test.com', role: 'user' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn()
      const wrapped = withApiMiddleware(handler, { requiredRole: 'admin' })
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(403)
      expect(handler).not.toHaveBeenCalled()
    })

    it('allows access when role matches requiredRole', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }))
      const wrapped = withApiMiddleware(handler, { requiredRole: 'admin' })
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(200)
      expect(handler).toHaveBeenCalled()
    })

    it('returns 403 when role not in allowedRoles', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'User', email: 'user@test.com', role: 'user' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn()
      const wrapped = withApiMiddleware(handler, { allowedRoles: ['admin', 'partner'] })
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(403)
    })

    it('allows when role in allowedRoles', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'Partner', email: 'p@test.com', role: 'partner' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }))
      const wrapped = withApiMiddleware(handler, { allowedRoles: ['admin', 'partner'] })
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(200)
    })
  })

  describe('rate limiting', () => {
    it('returns 429 when rate limited', async () => {
      mockRateLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        reset: new Date(Date.now() + 60000),
        limit: 100,
        isAuthenticated: false,
      })

      const handler = vi.fn()
      const wrapped = withApiMiddleware(handler, { skipAuth: true })
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(429)
      expect(handler).not.toHaveBeenCalled()
    })

    it('skips rate limit when skipRateLimit is true', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'Test', email: 'test@test.com', role: 'user' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }))
      const wrapped = withApiMiddleware(handler, { skipRateLimit: true })
      await wrapped(mockRequest())

      expect(mockRateLimit).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('returns 500 on unexpected handler error', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'Test', email: 'test@test.com', role: 'user' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockRejectedValue(new Error('boom'))
      const wrapped = withApiMiddleware(handler)
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error.code).toBe('INTERNAL_ERROR')
    })

    it('returns 401 on auth error (non-optional)', async () => {
      mockAuth.mockRejectedValue(new Error('AUTH_session_expired'))

      const handler = vi.fn()
      const wrapped = withApiMiddleware(handler)
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(401)
    })
  })
})

// Import shorthand helpers after mocks are set up
import { adminApi, partnerApi, adminOrPartnerApi, publicApi } from '../middleware'

describe('Shorthand API Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockResolvedValue({
      success: true,
      remaining: 99,
      reset: new Date(Date.now() + 60000),
      limit: 100,
      isAuthenticated: false,
    })
  })

  describe('adminApi', () => {
    it('requires admin role', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'User', email: 'user@test.com', role: 'user' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }))
      const wrapped = adminApi(handler)
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(403)
      expect(handler).not.toHaveBeenCalled()
    })

    it('allows admin access', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }))
      const wrapped = adminApi(handler)
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(200)
      expect(handler).toHaveBeenCalled()
    })

    it('accepts custom endpoint', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }))
      const wrapped = adminApi(handler, 'chat')
      await wrapped(mockRequest())

      expect(mockRateLimit).toHaveBeenCalledWith(expect.any(Request), 'chat')
    })
  })

  describe('partnerApi', () => {
    it('requires partner role', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'User', email: 'user@test.com', role: 'user' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }))
      const wrapped = partnerApi(handler)
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(403)
    })

    it('allows partner access', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'Partner', email: 'partner@test.com', role: 'partner' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }))
      const wrapped = partnerApi(handler)
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(200)
    })
  })

  describe('adminOrPartnerApi', () => {
    it('rejects user role', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'User', email: 'user@test.com', role: 'user' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }))
      const wrapped = adminOrPartnerApi(handler)
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(403)
    })

    it('allows admin access', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }))
      const wrapped = adminOrPartnerApi(handler)
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(200)
    })

    it('allows partner access', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', name: 'Partner', email: 'partner@test.com', role: 'partner' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }))
      const wrapped = adminOrPartnerApi(handler)
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(200)
    })
  })

  describe('publicApi', () => {
    it('allows unauthenticated access', async () => {
      mockAuth.mockResolvedValue(null as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ public: true }))
      const wrapped = publicApi(handler)
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(200)
      expect(handler).toHaveBeenCalled()
    })

    it('still applies rate limiting', async () => {
      mockRateLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        reset: new Date(Date.now() + 60000),
        limit: 100,
        isAuthenticated: false,
      })

      const handler = vi.fn().mockResolvedValue(Response.json({ public: true }))
      const wrapped = publicApi(handler)
      const response = await wrapped(mockRequest())

      expect(response.status).toBe(429)
      expect(handler).not.toHaveBeenCalled()
    })

    it('accepts custom endpoint', async () => {
      mockAuth.mockResolvedValue(null as never)

      const handler = vi.fn().mockResolvedValue(Response.json({ public: true }))
      const wrapped = publicApi(handler, 'templates')
      await wrapped(mockRequest())

      expect(mockRateLimit).toHaveBeenCalledWith(expect.any(Request), 'templates')
    })
  })
})
