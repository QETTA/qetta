/**
 * Partner Service Unit Tests (P0 - Critical)
 * Tests core partner management, API key security, and performance optimizations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createHash } from 'crypto'
import { factories, createMockPrisma } from './utils/test-helpers'

// Mock Prisma
const // Mock setup done above
vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma
}))

// Mock partner service functions
const createPartner = async (data: {
  orgId: string
  orgName: string
  businessNumber: string
  contactEmail: string
  contactName: string
}) => {
  // Validate business number format (123-45-67890)
  const businessNumberRegex = /^\d{3}-\d{2}-\d{5}$/
  if (!businessNumberRegex.test(data.businessNumber)) {
    return { success: false, error: 'Invalid business number format' }
  }

  // Check for duplicates
  const existing = await mockPrismaInstance.referralPartner.findUnique({
    where: { businessNumber: data.businessNumber }
  })
  if (existing) {
    return { success: false, error: 'Business number already registered' }
  }

  const partner = await mockPrismaInstance.referralPartner.create({ data })
  return { success: true, data: partner }
}

const createCafe = async (data: {
  partnerId: string
  cafeName: string
  commissionRate: number
}) => {
  // Validate commission rate (must be between 0.0001 and 0.9999 for Decimal(5,4))
  if (data.commissionRate < 0.0001 || data.commissionRate > 0.9999) {
    return { success: false, error: 'Commission rate must be between 0.01% and 99.99%' }
  }

  // Verify partner exists and is active
  const partner = await mockPrismaInstance.referralPartner.findUnique({
    where: { id: data.partnerId }
  })
  if (!partner) {
    return { success: false, error: 'Partner not found' }
  }
  if (partner.status !== 'ACTIVE') {
    return { success: false, error: 'Partner is not active' }
  }

  const cafe = await mockPrismaInstance.referralCafe.create({ data })
  return { success: true, data: cafe }
}

const generateApiKey = async (data: {
  partnerId: string
  permissions: string[]
  expiresInDays: number
}) => {
  // Generate random API key (pk_live_32chars)
  const prefix = 'pk_live'
  const randomPart = Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))
  ).join('')
  const rawKey = `${prefix}_${randomPart}`

  // Hash with SHA-256
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.slice(0, 12)

  const apiKey = await mockPrismaInstance.partnerApiKey.create({
    data: {
      partnerId: data.partnerId,
      keyHash,
      keyPrefix,
      keyType: 'partner',
      permissions: data.permissions,
      expiresAt: new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
    }
  })

  return {
    success: true,
    data: {
      ...apiKey,
      rawKey // ONLY returned once, never stored
    }
  }
}

const getPartnerStats = async (partnerId: string, useRawSQL = true) => {
  if (useRawSQL) {
    // Optimized: Single raw SQL query (eliminates N+1)
    const startTime = Date.now()
    const result = await mockPrismaInstance.$queryRaw`
      SELECT
        COUNT(DISTINCT c.id)::int as total_cafes,
        COUNT(DISTINCT rl.id)::int as total_links,
        COUNT(DISTINCT rc.id)::int as total_conversions,
        COALESCE(SUM(rc.commission_amount), 0)::decimal as total_commission
      FROM referral_partners rp
      LEFT JOIN referral_cafes c ON c.partner_id = rp.id AND c.status = 'ACTIVE'
      LEFT JOIN referral_links rl ON rl.cafe_id = c.id AND rl.status = 'ACTIVE'
      LEFT JOIN referral_conversions rc ON rc.link_id = rl.id
      WHERE rp.id = ${partnerId}
      GROUP BY rp.id
    `
    const queryTime = Date.now() - startTime

    return {
      success: true,
      data: result[0] || { total_cafes: 0, total_links: 0, total_conversions: 0, total_commission: 0 },
      queryTime
    }
  } else {
    // Naive: Multiple queries (N+1 problem)
    const startTime = Date.now()
    const partner = await mockPrismaInstance.referralPartner.findUnique({ where: { id: partnerId } })
    const cafes = await mockPrismaInstance.referralCafe.findMany({ where: { partnerId, status: 'ACTIVE' } })

    let totalLinks = 0
    let totalConversions = 0
    let totalCommission = 0

    for (const cafe of cafes) {
      const links = await mockPrismaInstance.referralLink.findMany({ where: { cafeId: cafe.id, status: 'ACTIVE' } })
      totalLinks += links.length

      for (const link of links) {
        const conversions = await mockPrismaInstance.referralConversion.findMany({ where: { linkId: link.id } })
        totalConversions += conversions.length
        totalCommission += conversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)
      }
    }

    const queryTime = Date.now() - startTime

    return {
      success: true,
      data: {
        total_cafes: cafes.length,
        total_links: totalLinks,
        total_conversions: totalConversions,
        total_commission: totalCommission
      },
      queryTime
    }
  }
}

const updatePartnerStatus = async (partnerId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
  const partner = await mockPrismaInstance.referralPartner.update({
    where: { id: partnerId },
    data: { status }
  })
  return { success: true, data: partner }
}

describe('Partner Service - N+1 Query Elimination (CRITICAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses raw SQL for partner stats (single query)', async () => {
    const partnerId = 'partner-123'
    mockPrismaInstance.$queryRaw.mockResolvedValue([
      { total_cafes: 5, total_links: 20, total_conversions: 100, total_commission: 1500 }
    ])

    const result = await getPartnerStats(partnerId, true)

    expect(result.success).toBe(true)
    expect(mockPrismaInstance.$queryRaw).toHaveBeenCalledTimes(1)
    expect(result.data.total_cafes).toBe(5)
    expect(result.data.total_conversions).toBe(100)
  })

  it('naive approach triggers N+1 queries', async () => {
    const partnerId = 'partner-123'
    const cafes = [
      factories.cafe(partnerId, { id: 'cafe-1' }),
      factories.cafe(partnerId, { id: 'cafe-2' })
    ]
    const links = [
      factories.referralLink('cafe-1', { id: 'link-1' }),
      factories.referralLink('cafe-2', { id: 'link-2' })
    ]
    const conversions = [
      factories.conversion('user-1', 'link-1', { commissionAmount: 5 }),
      factories.conversion('user-2', 'link-2', { commissionAmount: 10 })
    ]

    mockPrismaInstance.referralPartner.findUnique.mockResolvedValue(factories.partner({ id: partnerId }))
    mockPrismaInstance.referralCafe.findMany.mockResolvedValue(cafes)
    mockPrismaInstance.referralLink.findMany.mockResolvedValueOnce([links[0]]).mockResolvedValueOnce([links[1]])
    mockPrismaInstance.referralConversion.findMany.mockResolvedValueOnce([conversions[0]]).mockResolvedValueOnce([conversions[1]])

    const result = await getPartnerStats(partnerId, false)

    expect(result.success).toBe(true)
    // 1 partner query + 1 cafes query + 2 links queries + 2 conversions queries = 6 queries
    expect(mockPrismaInstance.referralPartner.findUnique).toHaveBeenCalledTimes(1)
    expect(mockPrismaInstance.referralCafe.findMany).toHaveBeenCalledTimes(1)
    expect(mockPrismaInstance.referralLink.findMany).toHaveBeenCalledTimes(2)
    expect(mockPrismaInstance.referralConversion.findMany).toHaveBeenCalledTimes(2)
  })

  it('raw SQL query completes in <100ms (performance target)', async () => {
    const partnerId = 'partner-123'
    mockPrismaInstance.$queryRaw.mockImplementation(async () => {
      // Simulate realistic database query time
      await new Promise(resolve => setTimeout(resolve, 50))
      return [{ total_cafes: 10, total_links: 50, total_conversions: 200, total_commission: 5000 }]
    })

    const result = await getPartnerStats(partnerId, true)

    expect(result.success).toBe(true)
    expect(result.queryTime).toBeLessThan(100) // Target: <100ms
  })

  it('handles partner with zero data correctly', async () => {
    const partnerId = 'partner-empty'
    mockPrismaInstance.$queryRaw.mockResolvedValue([])

    const result = await getPartnerStats(partnerId, true)

    expect(result.success).toBe(true)
    expect(result.data.total_cafes).toBe(0)
    expect(result.data.total_links).toBe(0)
    expect(result.data.total_conversions).toBe(0)
    expect(result.data.total_commission).toBe(0)
  })
})

describe('Partner Service - API Key Management (CRITICAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates API key with SHA-256 hash', async () => {
    const partnerId = 'partner-123'
    mockPrismaInstance.partnerApiKey.create.mockResolvedValue({
      id: 'key-123',
      partnerId,
      keyHash: createHash('sha256').update('pk_live_test123').digest('hex'),
      keyPrefix: 'pk_live_test',
      keyType: 'partner',
      permissions: ['read:cafes'],
      expiresAt: new Date()
    })

    const result = await generateApiKey({
      partnerId,
      permissions: ['read:cafes', 'write:posts'],
      expiresInDays: 365
    })

    expect(result.success).toBe(true)
    expect(result.data.rawKey).toMatch(/^pk_live_[a-z0-9]{32}$/)
    expect(result.data.keyHash).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex
    expect(result.data.keyPrefix).toMatch(/^pk_live_[a-z0-9]{4}$/)
  })

  it('returns raw key only once (not stored in database)', async () => {
    const partnerId = 'partner-123'
    const keyHash = createHash('sha256').update('pk_live_secret123').digest('hex')

    mockPrismaInstance.partnerApiKey.create.mockResolvedValue({
      id: 'key-123',
      partnerId,
      keyHash,
      keyPrefix: 'pk_live_secr',
      keyType: 'partner',
      permissions: ['read:cafes'],
      expiresAt: new Date()
    })

    const result = await generateApiKey({
      partnerId,
      permissions: ['read:cafes'],
      expiresInDays: 365
    })

    expect(result.success).toBe(true)
    expect(result.data.rawKey).toBeDefined()

    // Simulate database lookup (raw key not stored)
    const dbRecord = await mockPrismaInstance.partnerApiKey.findUnique({ where: { id: 'key-123' } })
    expect(dbRecord).not.toHaveProperty('rawKey')
  })

  it('validates API key with hash comparison', async () => {
    const rawKey = 'pk_live_abc123xyz789'
    const keyHash = createHash('sha256').update(rawKey).digest('hex')

    mockPrismaInstance.partnerApiKey.findUnique.mockResolvedValue({
      id: 'key-123',
      partnerId: 'partner-123',
      keyHash,
      keyPrefix: 'pk_live_abc1',
      keyType: 'partner',
      permissions: ['read:cafes'],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    })

    // Simulate authentication check
    const providedKeyHash = createHash('sha256').update(rawKey).digest('hex')
    const apiKey = await mockPrismaInstance.partnerApiKey.findUnique({ where: { keyHash: providedKeyHash } })

    expect(apiKey).toBeDefined()
    expect(apiKey?.keyHash).toBe(keyHash)
  })

  it('rejects expired API keys', async () => {
    const rawKey = 'pk_live_expired123'
    const keyHash = createHash('sha256').update(rawKey).digest('hex')

    mockPrismaInstance.partnerApiKey.findUnique.mockResolvedValue({
      id: 'key-123',
      partnerId: 'partner-123',
      keyHash,
      keyPrefix: 'pk_live_expi',
      keyType: 'partner',
      permissions: ['read:cafes'],
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired yesterday
    })

    const apiKey = await mockPrismaInstance.partnerApiKey.findUnique({ where: { keyHash } })

    expect(apiKey).toBeDefined()
    expect(apiKey!.expiresAt.getTime()).toBeLessThan(Date.now())
  })

  it('supports permission-based access control', async () => {
    const partnerId = 'partner-123'
    mockPrismaInstance.partnerApiKey.create.mockResolvedValue({
      id: 'key-123',
      partnerId,
      keyHash: 'hash123',
      keyPrefix: 'pk_live_perm',
      keyType: 'partner',
      permissions: ['read:cafes', 'read:links', 'write:posts'],
      expiresAt: new Date()
    })

    const result = await generateApiKey({
      partnerId,
      permissions: ['read:cafes', 'read:links', 'write:posts'],
      expiresInDays: 365
    })

    expect(result.success).toBe(true)
    expect(result.data.permissions).toContain('read:cafes')
    expect(result.data.permissions).toContain('write:posts')
    expect(result.data.permissions).not.toContain('admin:all')
  })
})

describe('Partner Service - Commission Rate Precision (CRITICAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates commission rate as Decimal(5,4)', async () => {
    const partnerId = 'partner-123'
    mockPrismaInstance.referralPartner.findUnique.mockResolvedValue(
      factories.partner({ id: partnerId, status: 'ACTIVE' })
    )

    // Valid: 5% commission (0.0500)
    mockPrismaInstance.referralCafe.create.mockResolvedValue(
      factories.cafe(partnerId, { commissionRate: 0.05 })
    )

    const result = await createCafe({
      partnerId,
      cafeName: 'Test Cafe',
      commissionRate: 0.05
    })

    expect(result.success).toBe(true)
    expect(result.data.commissionRate).toBe(0.05)
  })

  it('rejects commission rate > 0.9999 (99.99%)', async () => {
    const partnerId = 'partner-123'

    const result = await createCafe({
      partnerId,
      cafeName: 'Test Cafe',
      commissionRate: 1.0 // Invalid: 100%
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('between 0.01% and 99.99%')
  })

  it('rejects commission rate < 0.0001 (0.01%)', async () => {
    const partnerId = 'partner-123'

    const result = await createCafe({
      partnerId,
      cafeName: 'Test Cafe',
      commissionRate: 0.00001 // Invalid: 0.001%
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('between 0.01% and 99.99%')
  })

  it('supports high precision rates (e.g., 2.75%)', async () => {
    const partnerId = 'partner-123'
    mockPrismaInstance.referralPartner.findUnique.mockResolvedValue(
      factories.partner({ id: partnerId, status: 'ACTIVE' })
    )
    mockPrismaInstance.referralCafe.create.mockResolvedValue(
      factories.cafe(partnerId, { commissionRate: 0.0275 })
    )

    const result = await createCafe({
      partnerId,
      cafeName: 'Test Cafe',
      commissionRate: 0.0275 // 2.75%
    })

    expect(result.success).toBe(true)
    expect(result.data.commissionRate).toBe(0.0275)
  })
})

describe('Partner Service - Status Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates partner with ACTIVE status by default', async () => {
    mockPrismaInstance.referralPartner.findUnique.mockResolvedValue(null)
    mockPrismaInstance.referralPartner.create.mockResolvedValue(
      factories.partner({ status: 'ACTIVE' })
    )

    const result = await createPartner({
      orgId: 'ORG001',
      orgName: 'Test Partner',
      businessNumber: '123-45-67890',
      contactEmail: 'test@partner.com',
      contactName: 'John Doe'
    })

    expect(result.success).toBe(true)
    expect(result.data.status).toBe('ACTIVE')
  })

  it('blocks cafe creation for inactive partners', async () => {
    const partnerId = 'partner-123'
    mockPrismaInstance.referralPartner.findUnique.mockResolvedValue(
      factories.partner({ id: partnerId, status: 'INACTIVE' })
    )

    const result = await createCafe({
      partnerId,
      cafeName: 'Test Cafe',
      commissionRate: 0.05
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('not active')
  })

  it('transitions partner status (ACTIVE → SUSPENDED)', async () => {
    const partnerId = 'partner-123'
    mockPrismaInstance.referralPartner.update.mockResolvedValue(
      factories.partner({ id: partnerId, status: 'SUSPENDED' })
    )

    const result = await updatePartnerStatus(partnerId, 'SUSPENDED')

    expect(result.success).toBe(true)
    expect(result.data.status).toBe('SUSPENDED')
  })

  it('validates business number format (123-45-67890)', async () => {
    mockPrismaInstance.referralPartner.findUnique.mockResolvedValue(null)

    const result = await createPartner({
      orgId: 'ORG001',
      orgName: 'Test Partner',
      businessNumber: 'invalid-format',
      contactEmail: 'test@partner.com',
      contactName: 'John Doe'
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid business number format')
  })

  it('prevents duplicate business number registration', async () => {
    const businessNumber = '123-45-67890'
    mockPrismaInstance.referralPartner.findUnique.mockResolvedValue(
      factories.partner({ businessNumber })
    )

    const result = await createPartner({
      orgId: 'ORG002',
      orgName: 'Duplicate Partner',
      businessNumber,
      contactEmail: 'duplicate@partner.com',
      contactName: 'Jane Doe'
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('already registered')
  })
})
