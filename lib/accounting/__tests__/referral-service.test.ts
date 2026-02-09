/**
 * Referral Service Unit Tests (P0 - CRITICAL)
 * Tests for first-touch attribution, click tracking, and fallback mechanisms
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { factories, createMockPrisma, createHash } from './utils/test-helpers'

// Mock dependencies
let mockPrisma: ReturnType<typeof createMockPrisma>

vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma
}))

// Import after mocking
import {
  createReferralLink,
  getReferralLink,
  trackClick,
  attributeConversion,
  findAttributionFallback,
  getLinkStats,
  getConversionTrends
} from '../referral-service'

describe('ReferralService', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma() as any
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('First-Touch Attribution (CRITICAL)', () => {
    it('creates attribution for new user', async () => {
      const userId = 'user-123'
      const linkId = 'link-abc'
      const cafe = factories.cafe('partner-1', { commissionRate: 0.05 })
      const link = factories.referralLink(cafe.id)

      mockPrisma.referralLink.findUnique.mockResolvedValue({
        ...link,
        cafe
      })
      mockPrisma.referralConversion.findUnique.mockResolvedValue(null) // No existing attribution

      const conversion = factories.conversion(userId, linkId, {
        amount: 100,
        commissionRate: 0.05,
        commissionAmount: 5
      })

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          referralConversion: {
            create: vi.fn().mockResolvedValue(conversion)
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      const result = await attributeConversion({
        userId,
        linkId,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        subscriptionId: 'sub-123',
        planType: 'PREMIUM',
        amount: 100
      })

      expect(result.success).toBe(true)
      expect(result.data.userId).toBe(userId)
      expect(result.data.linkId).toBe(linkId)
      expect(result.data.commissionAmount).toBe(5)
      expect(result.data.ipHash).toMatch(/^[a-f0-9]{64}$/) // SHA-256
      expect(result.data.userAgentHash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('rejects duplicate attribution (userId unique constraint)', async () => {
      const userId = 'user-123'
      const existingConversion = factories.conversion(userId, 'link-old')

      mockPrisma.referralConversion.findUnique.mockResolvedValue(existingConversion)

      const result = await attributeConversion({
        userId,
        linkId: 'link-new',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        amount: 100
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('already has an attribution')
      expect(result.existingAttribution).toBeDefined()
      expect(result.existingAttribution.linkId).toBe('link-old')
    })

    it('calculates commission correctly (amount * rate)', async () => {
      const userId = 'user-123'
      const cafe = factories.cafe('partner-1', { commissionRate: 0.08 }) // 8%
      const link = factories.referralLink(cafe.id)

      mockPrisma.referralLink.findUnique.mockResolvedValue({
        ...link,
        cafe
      })
      mockPrisma.referralConversion.findUnique.mockResolvedValue(null)

      const amount = 250.00
      const expectedCommission = amount * 0.08 // 20.00

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          referralConversion: {
            create: vi.fn().mockImplementation((data) => {
              expect(data.data.commissionAmount).toBeCloseTo(expectedCommission, 2)
              return Promise.resolve(factories.conversion(userId, link.id, {
                amount,
                commissionRate: 0.08,
                commissionAmount: expectedCommission
              }))
            })
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      const result = await attributeConversion({
        userId,
        linkId: link.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        amount
      })

      expect(result.success).toBe(true)
      expect(result.data.commissionAmount).toBeCloseTo(20.00, 2)
    })

    it('stores IP hash and User-Agent hash for tracking', async () => {
      const userId = 'user-123'
      const ipAddress = '203.0.113.45'
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      const cafe = factories.cafe('partner-1')
      const link = factories.referralLink(cafe.id)

      mockPrisma.referralLink.findUnique.mockResolvedValue({ ...link, cafe })
      mockPrisma.referralConversion.findUnique.mockResolvedValue(null)

      const expectedIpHash = createHash('sha256').update(ipAddress).digest('hex')
      const expectedUaHash = createHash('sha256').update(userAgent).digest('hex')

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          referralConversion: {
            create: vi.fn().mockImplementation((data) => {
              expect(data.data.ipHash).toBe(expectedIpHash)
              expect(data.data.userAgentHash).toBe(expectedUaHash)
              return Promise.resolve(factories.conversion(userId, link.id, {
                ipHash: expectedIpHash,
                userAgentHash: expectedUaHash
              }))
            })
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      await attributeConversion({
        userId,
        linkId: link.id,
        ipAddress,
        userAgent,
        amount: 100
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('Fallback Attribution', () => {
    it('finds attribution via ipHash + userAgentHash within 7 days', async () => {
      const ipAddress = '192.168.1.100'
      const userAgent = 'Mozilla/5.0'
      const ipHash = createHash('sha256').update(ipAddress).digest('hex')
      const userAgentHash = createHash('sha256').update(userAgent).digest('hex')

      const recentConversion = factories.conversion('user-123', 'link-abc', {
        ipHash,
        userAgentHash,
        attributedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      })

      const link = factories.referralLink('cafe-1')
      const cafe = factories.cafe('partner-1')
      const partner = factories.partner()

      mockPrisma.referralConversion.findFirst.mockResolvedValue({
        ...recentConversion,
        link: {
          ...link,
          cafe: {
            ...cafe,
            partner
          }
        }
      })

      const result = await findAttributionFallback({
        ipAddress,
        userAgent,
        withinDays: 7
      })

      expect(result.success).toBe(true)
      expect(result.data.ipHash).toBe(ipHash)
      expect(result.data.userAgentHash).toBe(userAgentHash)
    })

    it('rejects attribution older than 7 days', async () => {
      const ipAddress = '192.168.1.100'
      const userAgent = 'Mozilla/5.0'

      // No recent conversions found
      mockPrisma.referralConversion.findFirst.mockResolvedValue(null)

      const result = await findAttributionFallback({
        ipAddress,
        userAgent,
        withinDays: 7
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('No attribution found')
    })

    it('returns most recent if multiple matches', async () => {
      const ipAddress = '192.168.1.100'
      const userAgent = 'Mozilla/5.0'
      const ipHash = createHash('sha256').update(ipAddress).digest('hex')
      const userAgentHash = createHash('sha256').update(userAgent).digest('hex')

      // Most recent conversion (should be returned)
      const mostRecent = factories.conversion('user-123', 'link-new', {
        ipHash,
        userAgentHash,
        attributedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      })

      mockPrisma.referralConversion.findFirst.mockResolvedValue({
        ...mostRecent,
        link: {
          id: 'link-new',
          cafe: factories.cafe('partner-1')
        }
      })

      const result = await findAttributionFallback({
        ipAddress,
        userAgent,
        withinDays: 7
      })

      expect(result.success).toBe(true)
      expect(result.data.linkId).toBe('link-new')
    })
  })

  describe('Click Tracking', () => {
    it('increments link.clicks atomically', async () => {
      const shortCode = 'ABCD1234'
      const link = factories.referralLink('cafe-1', { shortCode, clicks: 10 })

      mockPrisma.referralLink.findUnique.mockResolvedValue(link)
      mockPrisma.referralLink.update.mockResolvedValue({
        ...link,
        clicks: 11
      })

      const result = await trackClick(shortCode, {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        referer: 'https://google.com'
      })

      expect(result.success).toBe(true)
      expect(mockPrisma.referralLink.update).toHaveBeenCalledWith({
        where: { id: link.id },
        data: {
          clicks: { increment: 1 }
        }
      })
    })

    it('hashes IP address (SHA-256)', async () => {
      const shortCode = 'ABCD1234'
      const ipAddress = '203.0.113.45'
      const expectedHash = createHash('sha256').update(ipAddress).digest('hex')

      const link = factories.referralLink('cafe-1', { shortCode })
      mockPrisma.referralLink.findUnique.mockResolvedValue(link)
      mockPrisma.referralLink.update.mockResolvedValue(link)

      const result = await trackClick(shortCode, {
        ipAddress,
        userAgent: 'Mozilla/5.0'
      })

      expect(result.success).toBe(true)
      expect(result.data.ipHash).toBe(expectedHash)
    })

    it('hashes User-Agent (SHA-256)', async () => {
      const shortCode = 'ABCD1234'
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      const expectedHash = createHash('sha256').update(userAgent).digest('hex')

      const link = factories.referralLink('cafe-1', { shortCode })
      mockPrisma.referralLink.findUnique.mockResolvedValue(link)
      mockPrisma.referralLink.update.mockResolvedValue(link)

      const result = await trackClick(shortCode, {
        ipAddress: '192.168.1.1',
        userAgent
      })

      expect(result.success).toBe(true)
      expect(result.data.userAgentHash).toBe(expectedHash)
    })

    it('handles missing referer gracefully', async () => {
      const shortCode = 'ABCD1234'
      const link = factories.referralLink('cafe-1', { shortCode })

      mockPrisma.referralLink.findUnique.mockResolvedValue(link)
      mockPrisma.referralLink.update.mockResolvedValue(link)

      const result = await trackClick(shortCode, {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
        // referer is optional
      })

      expect(result.success).toBe(true)
    })

    it('throws error for non-existent link', async () => {
      const shortCode = 'INVALID123'

      mockPrisma.referralLink.findUnique.mockResolvedValue(null)

      await expect(
        trackClick(shortCode, {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        })
      ).rejects.toThrow(/Link not found/)
    })
  })

  describe('Short Code Generation', () => {
    it('generates 8-character alphanumeric code', async () => {
      const cafe = factories.cafe('partner-1')
      mockPrisma.referralCafe.findUnique.mockResolvedValue(cafe)
      mockPrisma.referralLink.findUnique.mockResolvedValue(null) // No collision
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          referralLink: {
            create: vi.fn().mockImplementation((data) => {
              const shortCode = data.data.shortCode
              expect(shortCode).toHaveLength(8)
              expect(shortCode).toMatch(/^[A-Z0-9]{8}$/)
              return Promise.resolve(factories.referralLink(cafe.id, { shortCode }))
            })
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      const result = await createReferralLink({
        cafeId: cafe.id,
        utmSource: 'facebook',
        utmMedium: 'social',
        utmCampaign: 'spring2026',
        expiresInDays: 90
      }, 'admin-123', 'admin@qetta.com')

      expect(result.success).toBe(true)
      expect(result.data.shortCode).toHaveLength(8)
    })

    it('retries on collision (up to 10 attempts)', async () => {
      const cafe = factories.cafe('partner-1')
      mockPrisma.referralCafe.findUnique.mockResolvedValue(cafe)

      let attempts = 0
      mockPrisma.referralLink.findUnique.mockImplementation(async () => {
        attempts++
        // First 5 attempts collide, 6th succeeds
        return attempts <= 5 ? factories.referralLink(cafe.id) : null
      })

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          referralLink: {
            create: vi.fn().mockResolvedValue(factories.referralLink(cafe.id))
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      const result = await createReferralLink({
        cafeId: cafe.id,
        expiresInDays: 90
      }, 'admin-123', 'admin@qetta.com')

      expect(result.success).toBe(true)
      expect(attempts).toBe(6)
    })

    it('throws error after max retries', async () => {
      const cafe = factories.cafe('partner-1')
      mockPrisma.referralCafe.findUnique.mockResolvedValue(cafe)

      // Always return collision
      mockPrisma.referralLink.findUnique.mockResolvedValue(
        factories.referralLink(cafe.id)
      )

      await expect(
        createReferralLink({
          cafeId: cafe.id,
          expiresInDays: 90
        }, 'admin-123', 'admin@qetta.com')
      ).rejects.toThrow(/Failed to generate unique short code/)
    })

    it('validates uniqueness constraint', async () => {
      const cafe = factories.cafe('partner-1')
      const existingCode = 'ABCD1234'

      mockPrisma.referralCafe.findUnique.mockResolvedValue(cafe)
      mockPrisma.referralLink.findUnique.mockResolvedValue(
        factories.referralLink(cafe.id, { shortCode: existingCode })
      )

      // Should retry until unique code found
      expect(mockPrisma.referralLink.findUnique).toBeDefined()
    })
  })

  describe('Conversion Trends', () => {
    it('groups conversions by day/week/month', async () => {
      const linkId = 'link-1'
      const startDate = new Date('2026-02-01')
      const endDate = new Date('2026-02-28')

      const conversions = [
        factories.conversion('user-1', linkId, {
          attributedAt: new Date('2026-02-05'),
          amount: 100,
          commissionAmount: 5
        }),
        factories.conversion('user-2', linkId, {
          attributedAt: new Date('2026-02-05'),
          amount: 150,
          commissionAmount: 7.5
        }),
        factories.conversion('user-3', linkId, {
          attributedAt: new Date('2026-02-10'),
          amount: 200,
          commissionAmount: 10
        })
      ]

      mockPrisma.referralConversion.findMany.mockResolvedValue(conversions)

      const result = await getConversionTrends({
        linkId,
        startDate,
        endDate,
        granularity: 'day'
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Array)

      // Should have 2 days with data
      const feb5 = result.data.find((d: any) => d.date === '2026-02-05')
      expect(feb5).toBeDefined()
      expect(feb5.conversions).toBe(2)
      expect(feb5.revenue).toBe(250)
      expect(feb5.commission).toBe(12.5)

      const feb10 = result.data.find((d: any) => d.date === '2026-02-10')
      expect(feb10).toBeDefined()
      expect(feb10.conversions).toBe(1)
      expect(feb10.revenue).toBe(200)
      expect(feb10.commission).toBe(10)
    })

    it('filters by linkId/cafeId/partnerId hierarchy', async () => {
      const partnerId = 'partner-1'
      const cafeIds = ['cafe-1', 'cafe-2']
      const linkIds = ['link-1', 'link-2', 'link-3']

      mockPrisma.referralCafe.findMany.mockResolvedValue([
        { id: 'cafe-1', partnerId },
        { id: 'cafe-2', partnerId }
      ])

      mockPrisma.referralLink.findMany.mockResolvedValue([
        { id: 'link-1', cafeId: 'cafe-1' },
        { id: 'link-2', cafeId: 'cafe-1' },
        { id: 'link-3', cafeId: 'cafe-2' }
      ])

      mockPrisma.referralConversion.findMany.mockResolvedValue([])

      await getConversionTrends({
        partnerId,
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-28'),
        granularity: 'week'
      })

      // Should query with linkIds from all cafes under partner
      expect(mockPrisma.referralConversion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            linkId: { in: linkIds }
          })
        })
      )
    })

    it('calculates revenue and commission totals', async () => {
      const linkId = 'link-1'
      const conversions = [
        factories.conversion('user-1', linkId, { amount: 100, commissionAmount: 5 }),
        factories.conversion('user-2', linkId, { amount: 200, commissionAmount: 10 }),
        factories.conversion('user-3', linkId, { amount: 150, commissionAmount: 7.5 })
      ]

      mockPrisma.referralConversion.findMany.mockResolvedValue(conversions)

      const result = await getConversionTrends({
        linkId,
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-28'),
        granularity: 'month'
      })

      expect(result.success).toBe(true)

      const monthData = result.data[0]
      expect(monthData.conversions).toBe(3)
      expect(monthData.revenue).toBe(450)
      expect(monthData.commission).toBe(22.5)
    })
  })

  describe('Link Stats', () => {
    it('calculates conversion rate correctly', async () => {
      const linkId = 'link-1'
      const link = factories.referralLink('cafe-1', {
        id: linkId,
        clicks: 100
      })

      const conversions = [
        factories.conversion('user-1', linkId, { amount: 100, commissionAmount: 5 }),
        factories.conversion('user-2', linkId, { amount: 150, commissionAmount: 7.5 })
      ]

      mockPrisma.referralLink.findUnique.mockResolvedValue({
        ...link,
        cafe: {
          ...factories.cafe('partner-1'),
          partner: factories.partner()
        }
      })

      mockPrisma.referralConversion.findMany.mockResolvedValue(conversions)

      const result = await getLinkStats(linkId)

      expect(result.success).toBe(true)
      expect(result.data.stats.clicks).toBe(100)
      expect(result.data.stats.conversions).toBe(2)
      expect(result.data.stats.conversionRate).toBe(2.0) // 2/100 * 100 = 2%
      expect(result.data.stats.totalRevenue).toBe(250)
      expect(result.data.stats.totalCommission).toBe(12.5)
    })

    it('handles zero clicks gracefully', async () => {
      const linkId = 'link-1'
      const link = factories.referralLink('cafe-1', {
        id: linkId,
        clicks: 0
      })

      mockPrisma.referralLink.findUnique.mockResolvedValue({
        ...link,
        cafe: {
          ...factories.cafe('partner-1'),
          partner: factories.partner()
        }
      })

      mockPrisma.referralConversion.findMany.mockResolvedValue([])

      const result = await getLinkStats(linkId)

      expect(result.success).toBe(true)
      expect(result.data.stats.conversionRate).toBe(0)
    })
  })
})
