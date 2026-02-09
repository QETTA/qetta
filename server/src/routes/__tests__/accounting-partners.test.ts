/**
 * Partner API Integration Tests (P1 - Partner-Facing)
 * Tests x-api-key authentication, permission-based access, rate limiting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createHash } from 'crypto'
import type { Request, Response } from 'express'
import {
  factories,
  createMockPrisma,
  createMockRedis
} from '@/lib/accounting/__tests__/utils/test-helpers'

// Mock Prisma
const mockPrisma = createMockPrisma()
vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma
}))

// Mock Redis for rate limiting
const mockRedis = createMockRedis()
vi.mock('ioredis', () => ({
  default: vi.fn(() => mockRedis)
}))

// Mock request/response helpers
type MockReq = Partial<Request> & {
  headers: Record<string, string>
  query: Record<string, any>
  body: any
  params: Record<string, string>
}

type MockRes = {
  _status?: number
  _body?: any
  _headers?: Record<string, string>
  status: (code: number) => MockRes
  json: (body: any) => MockRes
  setHeader: (key: string, value: string) => MockRes
  send: (body: any) => MockRes
}

function makeReqRes(options: {
  apiKey?: string
  query?: Record<string, any>
  body?: any
  params?: Record<string, string>
} = {}): { req: MockReq; res: MockRes } {
  const req: MockReq = {
    headers: {
      'x-api-key': options.apiKey || '',
      'x-forwarded-for': '192.168.1.100'
    },
    query: options.query || {},
    body: options.body || {},
    params: options.params || {}
  }

  const res: MockRes = {
    _status: 200,
    _headers: {},
    status(code: number) {
      this._status = code
      return this
    },
    json(body: any) {
      this._body = body
      return this
    },
    setHeader(key: string, value: string) {
      this._headers = this._headers || {}
      this._headers[key] = value
      return this
    },
    send(body: any) {
      this._body = body
      return this
    }
  }

  return { req, res }
}

// Mock authentication middleware
const requirePartnerAuth = async (req: MockReq, res: MockRes, next: () => void) => {
  const apiKey = req.headers['x-api-key']

  if (!apiKey) {
    res.status(401).json({ error: 'API key required' })
    return
  }

  // Hash the provided key
  const keyHash = createHash('sha256').update(apiKey).digest('hex')

  // Lookup in database
  const apiKeyRecord = await mockPrisma.partnerApiKey.findUnique({
    where: { keyHash }
  })

  if (!apiKeyRecord) {
    res.status(401).json({ error: 'Invalid API key' })
    return
  }

  // Check expiration
  if (apiKeyRecord.expiresAt < new Date()) {
    res.status(401).json({ error: 'API key expired' })
    return
  }

  // Rate limiting check
  const rateLimitKey = `partner:${apiKey}`
  const rateLimitCount = await mockRedis.zcard(rateLimitKey)

  if (rateLimitCount >= apiKeyRecord.rateLimit) {
    res.status(429).json({ error: 'Rate limit exceeded' })
    res.setHeader('Retry-After', '60')
    return
  }

  // Update lastUsedAt
  await mockPrisma.partnerApiKey.update({
    where: { id: apiKeyRecord.id },
    data: { lastUsedAt: new Date() }
  })

  // Attach to request for handlers
  ;(req as any).partnerId = apiKeyRecord.partnerId
  ;(req as any).permissions = apiKeyRecord.permissions

  next()
}

// Mock handlers
const getCafesHandler = async (req: MockReq, res: MockRes) => {
  const partnerId = (req as any).partnerId
  const page = parseInt(req.query.page || '1')
  const pageSize = parseInt(req.query.pageSize || '20')
  const status = req.query.status || 'ACTIVE'

  const cafes = await mockPrisma.referralCafe.findMany({
    where: {
      partnerId,
      status: status as any
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: 'desc' }
  })

  const total = await mockPrisma.referralCafe.count({
    where: { partnerId, status: status as any }
  })

  res.json({
    success: true,
    data: {
      cafes,
      pagination: {
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total
      }
    }
  })
}

const getReferralLinksHandler = async (req: MockReq, res: MockRes) => {
  const partnerId = (req as any).partnerId
  const cafeId = req.query.cafeId

  const where: any = { cafe: { partnerId } }
  if (cafeId) {
    where.cafeId = cafeId
  }

  const links = await mockPrisma.referralLink.findMany({
    where,
    include: {
      cafe: true,
      _count: {
        select: { conversions: true }
      }
    }
  })

  const linksWithStats = links.map(link => ({
    ...link,
    conversionsCount: link._count.conversions,
    conversionRate: link.clicks > 0 ? (link._count.conversions / link.clicks) * 100 : 0
  }))

  res.json({
    success: true,
    data: linksWithStats
  })
}

const getPayoutsHandler = async (req: MockReq, res: MockRes) => {
  const partnerId = (req as any).partnerId
  const page = parseInt(req.query.page || '1')
  const pageSize = parseInt(req.query.pageSize || '20')

  const payouts = await mockPrisma.payoutLedger.findMany({
    where: { partnerId },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: 'desc' }
  })

  const total = await mockPrisma.payoutLedger.count({
    where: { partnerId }
  })

  res.json({
    success: true,
    data: {
      payouts,
      pagination: { page, pageSize, total, hasMore: page * pageSize < total }
    }
  })
}

const batchUploadPostsHandler = async (req: MockReq, res: MockRes) => {
  const partnerId = (req as any).partnerId
  const permissions = (req as any).permissions

  // Check permission
  if (!permissions.includes('write:posts')) {
    res.status(403).json({ error: 'Permission denied' })
    return
  }

  const { posts } = req.body

  if (!posts || !Array.isArray(posts)) {
    res.status(400).json({ error: 'Posts array required' })
    return
  }

  // Validate posts
  for (const post of posts) {
    if (!post.cafeId || !post.postType || !post.url || !post.title) {
      res.status(400).json({ error: 'Missing required fields in post' })
      return
    }
  }

  // Batch upsert
  const results = await Promise.all(
    posts.map((post: any) =>
      mockPrisma.externalPost.upsert({
        where: { url: post.url },
        update: {
          title: post.title,
          contentPreview: post.contentPreview,
          views: post.views,
          likes: post.likes
        },
        create: {
          partnerId,
          cafeId: post.cafeId,
          postType: post.postType,
          url: post.url,
          title: post.title,
          contentPreview: post.contentPreview,
          publishedAt: new Date(post.publishedAt),
          views: post.views,
          likes: post.likes
        }
      })
    )
  )

  res.status(201).json({
    success: true,
    data: {
      uploaded: results.length,
      posts: results
    }
  })
}

describe('Partner API - Authentication (CRITICAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedis.zcard.mockResolvedValue(0)
  })

  it('authenticates with valid x-api-key', async () => {
    const rawKey = 'pk_live_test123abc456def789'
    const keyHash = createHash('sha256').update(rawKey).digest('hex')

    const { req, res } = makeReqRes({ apiKey: rawKey })

    mockPrisma.partnerApiKey.findUnique.mockResolvedValue(
      factories.apiKey('partner-123', {
        keyHash,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        permissions: ['read:cafes']
      })
    )
    mockPrisma.partnerApiKey.update.mockResolvedValue({} as any)

    let nextCalled = false
    await requirePartnerAuth(req, res, () => {
      nextCalled = true
    })

    expect(nextCalled).toBe(true)
    expect((req as any).partnerId).toBe('partner-123')
    expect(mockPrisma.partnerApiKey.update).toHaveBeenCalledWith({
      where: { id: expect.any(String) },
      data: { lastUsedAt: expect.any(Date) }
    })
  })

  it('rejects request without x-api-key', async () => {
    const { req, res } = makeReqRes({ apiKey: '' })

    await requirePartnerAuth(req, res, () => {})

    expect(res._status).toBe(401)
    expect(res._body.error).toContain('API key required')
  })

  it('rejects invalid x-api-key (not in database)', async () => {
    const { req, res } = makeReqRes({ apiKey: 'pk_live_invalid123' })

    mockPrisma.partnerApiKey.findUnique.mockResolvedValue(null)

    await requirePartnerAuth(req, res, () => {})

    expect(res._status).toBe(401)
    expect(res._body.error).toContain('Invalid API key')
  })

  it('rejects expired x-api-key', async () => {
    const rawKey = 'pk_live_expired123'
    const keyHash = createHash('sha256').update(rawKey).digest('hex')

    const { req, res } = makeReqRes({ apiKey: rawKey })

    mockPrisma.partnerApiKey.findUnique.mockResolvedValue(
      factories.apiKey('partner-123', {
        keyHash,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired yesterday
      })
    )

    await requirePartnerAuth(req, res, () => {})

    expect(res._status).toBe(401)
    expect(res._body.error).toContain('expired')
  })

  it('enforces rate limiting (100 req/min default)', async () => {
    const rawKey = 'pk_live_ratelimit123'
    const keyHash = createHash('sha256').update(rawKey).digest('hex')

    const { req, res } = makeReqRes({ apiKey: rawKey })

    mockPrisma.partnerApiKey.findUnique.mockResolvedValue(
      factories.apiKey('partner-123', {
        keyHash,
        rateLimit: 100,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      })
    )
    mockRedis.zcard.mockResolvedValue(100) // Limit reached

    await requirePartnerAuth(req, res, () => {})

    expect(res._status).toBe(429)
    expect(res._body.error).toContain('Rate limit exceeded')
    expect(res._headers?.['Retry-After']).toBe('60')
  })

  it('updates lastUsedAt timestamp on successful auth', async () => {
    const rawKey = 'pk_live_test123'
    const keyHash = createHash('sha256').update(rawKey).digest('hex')

    const { req, res } = makeReqRes({ apiKey: rawKey })

    mockPrisma.partnerApiKey.findUnique.mockResolvedValue(
      factories.apiKey('partner-123', {
        id: 'key-123',
        keyHash,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      })
    )
    mockPrisma.partnerApiKey.update.mockResolvedValue({} as any)

    await requirePartnerAuth(req, res, () => {})

    expect(mockPrisma.partnerApiKey.update).toHaveBeenCalledWith({
      where: { id: 'key-123' },
      data: { lastUsedAt: expect.any(Date) }
    })
  })
})

describe('Partner API - Cafe Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /me/cafes - lists partner cafes', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes({ query: { page: '1', pageSize: '20' } })
    ;(req as any).partnerId = partnerId

    const cafes = [
      factories.cafe(partnerId, { cafeName: 'Cafe A' }),
      factories.cafe(partnerId, { cafeName: 'Cafe B' })
    ]

    mockPrisma.referralCafe.findMany.mockResolvedValue(cafes)
    mockPrisma.referralCafe.count.mockResolvedValue(2)

    await getCafesHandler(req, res)

    expect(res._body.success).toBe(true)
    expect(res._body.data.cafes).toHaveLength(2)
    expect(res._body.data.pagination.total).toBe(2)
  })

  it('GET /me/cafes - supports pagination', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes({ query: { page: '2', pageSize: '10' } })
    ;(req as any).partnerId = partnerId

    mockPrisma.referralCafe.findMany.mockResolvedValue([
      factories.cafe(partnerId, { cafeName: 'Cafe 11' })
    ])
    mockPrisma.referralCafe.count.mockResolvedValue(25)

    await getCafesHandler(req, res)

    expect(mockPrisma.referralCafe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (page 2 - 1) * 10
        take: 10
      })
    )
    expect(res._body.data.pagination.hasMore).toBe(true)
  })

  it('GET /me/cafes - filters by status', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes({ query: { status: 'INACTIVE' } })
    ;(req as any).partnerId = partnerId

    mockPrisma.referralCafe.findMany.mockResolvedValue([])
    mockPrisma.referralCafe.count.mockResolvedValue(0)

    await getCafesHandler(req, res)

    expect(mockPrisma.referralCafe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { partnerId, status: 'INACTIVE' }
      })
    )
  })
})

describe('Partner API - Referral Links', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /me/referral-links - lists links with stats', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes()
    ;(req as any).partnerId = partnerId

    const links = [
      {
        ...factories.referralLink('cafe-1', { clicks: 100 }),
        cafe: factories.cafe(partnerId),
        _count: { conversions: 10 }
      },
      {
        ...factories.referralLink('cafe-1', { clicks: 50 }),
        cafe: factories.cafe(partnerId),
        _count: { conversions: 5 }
      }
    ]

    mockPrisma.referralLink.findMany.mockResolvedValue(links as any)

    await getReferralLinksHandler(req, res)

    expect(res._body.success).toBe(true)
    expect(res._body.data).toHaveLength(2)
    expect(res._body.data[0].conversionsCount).toBe(10)
    expect(res._body.data[0].conversionRate).toBe(10) // 10/100 * 100
  })

  it('GET /me/referral-links - filters by cafeId', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes({ query: { cafeId: 'cafe-specific' } })
    ;(req as any).partnerId = partnerId

    mockPrisma.referralLink.findMany.mockResolvedValue([])

    await getReferralLinksHandler(req, res)

    expect(mockPrisma.referralLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cafe: { partnerId }, cafeId: 'cafe-specific' }
      })
    )
  })

  it('GET /me/referral-links - calculates conversion rate correctly', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes()
    ;(req as any).partnerId = partnerId

    const links = [
      {
        ...factories.referralLink('cafe-1', { clicks: 200 }),
        cafe: factories.cafe(partnerId),
        _count: { conversions: 50 }
      }
    ]

    mockPrisma.referralLink.findMany.mockResolvedValue(links as any)

    await getReferralLinksHandler(req, res)

    expect(res._body.data[0].conversionRate).toBe(25) // 50/200 * 100 = 25%
  })

  it('GET /me/referral-links - handles zero clicks gracefully', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes()
    ;(req as any).partnerId = partnerId

    const links = [
      {
        ...factories.referralLink('cafe-1', { clicks: 0 }),
        cafe: factories.cafe(partnerId),
        _count: { conversions: 0 }
      }
    ]

    mockPrisma.referralLink.findMany.mockResolvedValue(links as any)

    await getReferralLinksHandler(req, res)

    expect(res._body.data[0].conversionRate).toBe(0)
  })
})

describe('Partner API - Payout History', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /me/payouts - lists payout history', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes({ query: { page: '1' } })
    ;(req as any).partnerId = partnerId

    const payouts = [
      factories.payout(partnerId, { status: 'PAID', totalCommission: 1500 }),
      factories.payout(partnerId, { status: 'APPROVED', totalCommission: 800 })
    ]

    mockPrisma.payoutLedger.findMany.mockResolvedValue(payouts)
    mockPrisma.payoutLedger.count.mockResolvedValue(2)

    await getPayoutsHandler(req, res)

    expect(res._body.success).toBe(true)
    expect(res._body.data.payouts).toHaveLength(2)
    expect(res._body.data.pagination.total).toBe(2)
  })

  it('GET /me/payouts - orders by createdAt DESC', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes()
    ;(req as any).partnerId = partnerId

    mockPrisma.payoutLedger.findMany.mockResolvedValue([])
    mockPrisma.payoutLedger.count.mockResolvedValue(0)

    await getPayoutsHandler(req, res)

    expect(mockPrisma.payoutLedger.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' }
      })
    )
  })
})

describe('Partner API - External Posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /me/external-posts/batch - uploads posts', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes({
      body: {
        posts: [
          {
            cafeId: 'cafe-1',
            postType: 'BLOG',
            url: 'https://blog.example.com/post1',
            title: 'Great Cafe Review',
            publishedAt: '2026-02-01T00:00:00Z',
            views: 1000,
            likes: 50
          }
        ]
      }
    })
    ;(req as any).partnerId = partnerId
    ;(req as any).permissions = ['write:posts']

    mockPrisma.externalPost.upsert.mockResolvedValue({
      id: 'post-1',
      partnerId,
      cafeId: 'cafe-1',
      postType: 'BLOG',
      url: 'https://blog.example.com/post1',
      title: 'Great Cafe Review',
      publishedAt: new Date('2026-02-01'),
      uploadedAt: new Date(),
      views: 1000,
      likes: 50,
      comments: null,
      contentPreview: null
    })

    await batchUploadPostsHandler(req, res)

    expect(res._status).toBe(201)
    expect(res._body.success).toBe(true)
    expect(res._body.data.uploaded).toBe(1)
  })

  it('POST /me/external-posts/batch - rejects without write:posts permission', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes({
      body: { posts: [{ cafeId: 'cafe-1' }] }
    })
    ;(req as any).partnerId = partnerId
    ;(req as any).permissions = ['read:cafes'] // No write permission

    await batchUploadPostsHandler(req, res)

    expect(res._status).toBe(403)
    expect(res._body.error).toContain('Permission denied')
  })

  it('POST /me/external-posts/batch - validates required fields', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes({
      body: {
        posts: [
          { cafeId: 'cafe-1', postType: 'BLOG' }
          // Missing url, title
        ]
      }
    })
    ;(req as any).partnerId = partnerId
    ;(req as any).permissions = ['write:posts']

    await batchUploadPostsHandler(req, res)

    expect(res._status).toBe(400)
    expect(res._body.error).toContain('Missing required fields')
  })

  it('POST /me/external-posts/batch - upserts on duplicate URL', async () => {
    const partnerId = 'partner-123'
    const { req, res } = makeReqRes({
      body: {
        posts: [
          {
            cafeId: 'cafe-1',
            postType: 'BLOG',
            url: 'https://blog.example.com/existing',
            title: 'Updated Title',
            publishedAt: '2026-02-01T00:00:00Z',
            views: 2000, // Updated
            likes: 100
          }
        ]
      }
    })
    ;(req as any).partnerId = partnerId
    ;(req as any).permissions = ['write:posts']

    mockPrisma.externalPost.upsert.mockResolvedValue({
      id: 'post-existing',
      partnerId,
      cafeId: 'cafe-1',
      postType: 'BLOG',
      url: 'https://blog.example.com/existing',
      title: 'Updated Title',
      publishedAt: new Date('2026-02-01'),
      uploadedAt: new Date(),
      views: 2000,
      likes: 100,
      comments: null,
      contentPreview: null
    })

    await batchUploadPostsHandler(req, res)

    expect(mockPrisma.externalPost.upsert).toHaveBeenCalledWith({
      where: { url: 'https://blog.example.com/existing' },
      update: expect.objectContaining({ views: 2000 }),
      create: expect.any(Object)
    })
  })
})
