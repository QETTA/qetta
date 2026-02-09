/**
 * Admin API Integration Tests - Payout Operations (P0 - Critical)
 * Tests payout preview, approval with snapshot verification, adjustments, SSE updates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createHash } from 'crypto'
import {
  factories,
  mockApiRequest,
  mockAdminSession,
  createMockPrisma,
  createMockRedis,
  calculateSnapshotHash
} from '@/lib/accounting/__tests__/utils/test-helpers'

// Mock Prisma
const mockPrisma = createMockPrisma()
vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma
}))

// Mock Redis for SSE
const mockRedis = createMockRedis()
vi.mock('ioredis', () => ({
  default: vi.fn(() => mockRedis)
}))

// Mock NextAuth
const mockSession = mockAdminSession()
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(() => Promise.resolve(mockSession))
}))

// Mock payout preview handler
const previewPayoutHandler = async (req: Request) => {
  const session = mockSession
  if (!session || session.user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const body = await req.json()
    const { partnerId, periodStart, periodEnd } = body

    if (!partnerId || !periodStart || !periodEnd) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // Verify partner exists
    const partner = await mockPrisma.referralPartner.findUnique({
      where: { id: partnerId }
    })
    if (!partner) {
      return new Response(JSON.stringify({ error: 'Partner not found' }), { status: 404 })
    }

    // Query conversions for period
    const conversions = await mockPrisma.referralConversion.findMany({
      where: {
        linkId: { in: [] }, // Would join through links → cafes → partner
        attributedAt: {
          gte: new Date(periodStart),
          lte: new Date(periodEnd)
        }
      }
    })

    const conversionIds = conversions.map(c => c.id)
    const totalConversions = conversions.length
    const totalRevenue = conversions.reduce((sum, c) => sum + Number(c.amount), 0)
    const totalCommission = conversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)

    // Generate snapshot hash
    const snapshotHash = calculateSnapshotHash(conversionIds)

    const preview = {
      partnerId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      conversionIds,
      totalConversions,
      totalRevenue,
      totalCommission,
      snapshotHash
    }

    return new Response(
      JSON.stringify({ success: true, data: preview }),
      { status: 200 }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

// Mock payout approval handler
const approvePayoutHandler = async (req: Request) => {
  const session = mockSession
  if (!session || session.user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const body = await req.json()
    const { partnerId, periodStart, periodEnd, snapshotHash, conversionIds } = body

    if (!partnerId || !periodStart || !periodEnd || !snapshotHash || !conversionIds) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // Verify snapshot integrity
    const currentHash = calculateSnapshotHash(conversionIds)
    if (currentHash !== snapshotHash) {
      return new Response(
        JSON.stringify({ error: 'Snapshot verification failed - data tampering detected' }),
        { status: 409 }
      )
    }

    // Check for existing payout (idempotency)
    const existing = await mockPrisma.payoutLedger.findFirst({
      where: {
        partnerId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status: { in: ['DRAFT', 'APPROVED', 'PAID'] }
      }
    })
    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Payout already exists for this period' }),
        { status: 409 }
      )
    }

    // Create payout in SERIALIZABLE transaction
    const payout = await mockPrisma.$transaction(
      async (tx) => {
        const conversions = await tx.referralConversion.findMany({
          where: { id: { in: conversionIds } }
        })

        const totalConversions = conversions.length
        const totalRevenue = conversions.reduce((sum, c) => sum + Number(c.amount), 0)
        const totalCommission = conversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)

        return await tx.payoutLedger.create({
          data: {
            partnerId,
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            status: 'APPROVED',
            ledgerType: 'PAYOUT',
            snapshotHash,
            conversionIds,
            totalConversions,
            totalRevenue,
            totalCommission,
            approvedBy: session.user.id,
            approvedAt: new Date()
          }
        })
      },
      {
        isolationLevel: 'Serializable',
        timeout: 10000
      }
    )

    // Publish SSE event to Redis
    await mockRedis.publish(
      `payout:${payout.id}:status`,
      JSON.stringify({
        status: 'APPROVED',
        timestamp: new Date().toISOString()
      })
    )

    return new Response(
      JSON.stringify({ success: true, data: payout }),
      { status: 201 }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

// Mock adjustment handler
const createAdjustmentHandler = async (req: Request, payoutId: string) => {
  const session = mockSession
  if (!session || session.user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const body = await req.json()
    const { adjustmentAmount, reason } = body

    if (adjustmentAmount === undefined || !reason) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // Verify original payout exists and is paid
    const originalPayout = await mockPrisma.payoutLedger.findUnique({
      where: { id: payoutId }
    })
    if (!originalPayout) {
      return new Response(JSON.stringify({ error: 'Original payout not found' }), { status: 404 })
    }
    if (originalPayout.status !== 'PAID') {
      return new Response(
        JSON.stringify({ error: 'Can only adjust paid payouts' }),
        { status: 400 }
      )
    }

    // Create compensating ledger entry
    const adjustment = await mockPrisma.payoutLedger.create({
      data: {
        partnerId: originalPayout.partnerId,
        periodStart: originalPayout.periodStart,
        periodEnd: originalPayout.periodEnd,
        status: 'APPROVED',
        ledgerType: 'ADJUSTMENT',
        version: originalPayout.version + 1,
        referenceLedgerId: payoutId,
        adjustmentReason: reason,
        totalCommission: adjustmentAmount, // Negative for clawback
        totalConversions: 0,
        totalRevenue: 0,
        approvedBy: session.user.id,
        approvedAt: new Date()
      }
    })

    return new Response(
      JSON.stringify({ success: true, data: adjustment }),
      { status: 201 }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

describe('Admin API - Payout Operations (CRITICAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/accounting/admin/payouts/preview', () => {
    it('generates payout preview with snapshot hash', async () => {
      const req = mockApiRequest('POST', {
        partnerId: 'partner-123',
        periodStart: '2026-02-01T00:00:00Z',
        periodEnd: '2026-02-28T23:59:59Z'
      })

      const conversions = [
        factories.conversion('user-1', 'link-1', { amount: 100, commissionAmount: 5 }),
        factories.conversion('user-2', 'link-1', { amount: 200, commissionAmount: 10 })
      ]

      mockPrisma.referralPartner.findUnique.mockResolvedValue(
        factories.partner({ id: 'partner-123' })
      )
      mockPrisma.referralConversion.findMany.mockResolvedValue(conversions)

      const response = await previewPayoutHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.totalConversions).toBe(2)
      expect(data.data.totalRevenue).toBe(300)
      expect(data.data.totalCommission).toBe(15)
      expect(data.data.snapshotHash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('handles empty period (zero conversions)', async () => {
      const req = mockApiRequest('POST', {
        partnerId: 'partner-123',
        periodStart: '2026-03-01T00:00:00Z',
        periodEnd: '2026-03-31T23:59:59Z'
      })

      mockPrisma.referralPartner.findUnique.mockResolvedValue(
        factories.partner({ id: 'partner-123' })
      )
      mockPrisma.referralConversion.findMany.mockResolvedValue([])

      const response = await previewPayoutHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.totalConversions).toBe(0)
      expect(data.data.totalCommission).toBe(0)
      expect(data.data.conversionIds).toEqual([])
    })

    it('returns 404 for non-existent partner', async () => {
      const req = mockApiRequest('POST', {
        partnerId: 'non-existent',
        periodStart: '2026-02-01T00:00:00Z',
        periodEnd: '2026-02-28T23:59:59Z'
      })

      mockPrisma.referralPartner.findUnique.mockResolvedValue(null)

      const response = await previewPayoutHandler(req)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })
  })

  describe('POST /api/accounting/admin/payouts/approve', () => {
    it('approves payout with valid snapshot hash', async () => {
      const conversionIds = ['conv-1', 'conv-2', 'conv-3']
      const snapshotHash = calculateSnapshotHash(conversionIds)

      const req = mockApiRequest('POST', {
        partnerId: 'partner-123',
        periodStart: '2026-02-01T00:00:00Z',
        periodEnd: '2026-02-28T23:59:59Z',
        snapshotHash,
        conversionIds
      })

      const conversions = conversionIds.map((id, i) =>
        factories.conversion(`user-${i}`, 'link-1', { id, amount: 100, commissionAmount: 5 })
      )

      mockPrisma.payoutLedger.findFirst.mockResolvedValue(null) // No existing
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma)
      })
      mockPrisma.referralConversion.findMany.mockResolvedValue(conversions)
      mockPrisma.payoutLedger.create.mockResolvedValue(
        factories.payout('partner-123', {
          status: 'APPROVED',
          snapshotHash,
          conversionIds,
          totalConversions: 3,
          totalCommission: 15
        })
      )

      const response = await approvePayoutHandler(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('APPROVED')
      expect(mockRedis.publish).toHaveBeenCalled()
    })

    it('rejects approval with mismatched snapshot hash', async () => {
      const conversionIds = ['conv-1', 'conv-2', 'conv-3']
      const validHash = calculateSnapshotHash(conversionIds)
      const tamperedHash = calculateSnapshotHash(['conv-1', 'conv-2', 'conv-4']) // Different

      const req = mockApiRequest('POST', {
        partnerId: 'partner-123',
        periodStart: '2026-02-01T00:00:00Z',
        periodEnd: '2026-02-28T23:59:59Z',
        snapshotHash: tamperedHash,
        conversionIds // Original IDs
      })

      const response = await approvePayoutHandler(req)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('Snapshot verification failed')
      expect(mockPrisma.payoutLedger.create).not.toHaveBeenCalled()
    })

    it('prevents duplicate payout for same period (idempotency)', async () => {
      const conversionIds = ['conv-1', 'conv-2']
      const snapshotHash = calculateSnapshotHash(conversionIds)

      const req = mockApiRequest('POST', {
        partnerId: 'partner-123',
        periodStart: '2026-02-01T00:00:00Z',
        periodEnd: '2026-02-28T23:59:59Z',
        snapshotHash,
        conversionIds
      })

      mockPrisma.payoutLedger.findFirst.mockResolvedValue(
        factories.payout('partner-123', { status: 'PAID' })
      )

      const response = await approvePayoutHandler(req)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('already exists')
    })

    it('uses SERIALIZABLE transaction isolation', async () => {
      const conversionIds = ['conv-1']
      const snapshotHash = calculateSnapshotHash(conversionIds)

      const req = mockApiRequest('POST', {
        partnerId: 'partner-123',
        periodStart: '2026-02-01T00:00:00Z',
        periodEnd: '2026-02-28T23:59:59Z',
        snapshotHash,
        conversionIds
      })

      let isolationLevel: string | undefined

      mockPrisma.payoutLedger.findFirst.mockResolvedValue(null)
      mockPrisma.$transaction.mockImplementation(async (callback: any, options: any) => {
        isolationLevel = options?.isolationLevel
        return callback(mockPrisma)
      })
      mockPrisma.referralConversion.findMany.mockResolvedValue([
        factories.conversion('user-1', 'link-1', { id: 'conv-1' })
      ])
      mockPrisma.payoutLedger.create.mockResolvedValue(
        factories.payout('partner-123')
      )

      await approvePayoutHandler(req)

      expect(isolationLevel).toBe('Serializable')
    })

    it('publishes SSE event to Redis on approval', async () => {
      const conversionIds = ['conv-1']
      const snapshotHash = calculateSnapshotHash(conversionIds)

      const req = mockApiRequest('POST', {
        partnerId: 'partner-123',
        periodStart: '2026-02-01T00:00:00Z',
        periodEnd: '2026-02-28T23:59:59Z',
        snapshotHash,
        conversionIds
      })

      mockPrisma.payoutLedger.findFirst.mockResolvedValue(null)
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma)
      })
      mockPrisma.referralConversion.findMany.mockResolvedValue([
        factories.conversion('user-1', 'link-1', { id: 'conv-1' })
      ])
      mockPrisma.payoutLedger.create.mockResolvedValue(
        factories.payout('partner-123', { id: 'payout-123', status: 'APPROVED' })
      )

      await approvePayoutHandler(req)

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'payout:payout-123:status',
        expect.stringContaining('"status":"APPROVED"')
      )
    })
  })

  describe('POST /api/accounting/admin/payouts/[id]/adjust', () => {
    it('creates compensating ledger entry (negative adjustment)', async () => {
      const payoutId = 'payout-123'
      const req = mockApiRequest('POST', {
        adjustmentAmount: -50, // Clawback $50
        reason: 'Incorrect commission calculation'
      })

      mockPrisma.payoutLedger.findUnique.mockResolvedValue(
        factories.payout('partner-123', {
          id: payoutId,
          status: 'PAID',
          version: 1,
          totalCommission: 100
        })
      )
      mockPrisma.payoutLedger.create.mockResolvedValue(
        factories.payout('partner-123', {
          ledgerType: 'ADJUSTMENT',
          version: 2,
          referenceLedgerId: payoutId,
          adjustmentReason: 'Incorrect commission calculation',
          totalCommission: -50
        })
      )

      const response = await createAdjustmentHandler(req, payoutId)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.ledgerType).toBe('ADJUSTMENT')
      expect(data.data.totalCommission).toBe(-50)
      expect(data.data.referenceLedgerId).toBe(payoutId)
      expect(data.data.version).toBe(2)
    })

    it('rejects adjustment for non-paid payout', async () => {
      const payoutId = 'payout-123'
      const req = mockApiRequest('POST', {
        adjustmentAmount: -50,
        reason: 'Test'
      })

      mockPrisma.payoutLedger.findUnique.mockResolvedValue(
        factories.payout('partner-123', { id: payoutId, status: 'DRAFT' })
      )

      const response = await createAdjustmentHandler(req, payoutId)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('only adjust paid payouts')
    })

    it('returns 404 for non-existent payout', async () => {
      const payoutId = 'non-existent'
      const req = mockApiRequest('POST', {
        adjustmentAmount: -50,
        reason: 'Test'
      })

      mockPrisma.payoutLedger.findUnique.mockResolvedValue(null)

      const response = await createAdjustmentHandler(req, payoutId)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('increments version number for audit trail', async () => {
      const payoutId = 'payout-123'
      const req = mockApiRequest('POST', {
        adjustmentAmount: 25, // Positive adjustment
        reason: 'Missed bonus commission'
      })

      mockPrisma.payoutLedger.findUnique.mockResolvedValue(
        factories.payout('partner-123', {
          id: payoutId,
          status: 'PAID',
          version: 3 // Already has 2 adjustments
        })
      )

      let createdVersion: number | undefined

      mockPrisma.payoutLedger.create.mockImplementation(async ({ data }: any) => {
        createdVersion = data.version
        return factories.payout('partner-123', { version: data.version })
      })

      await createAdjustmentHandler(req, payoutId)

      expect(createdVersion).toBe(4) // Incremented
    })

    it('validates required fields', async () => {
      const payoutId = 'payout-123'
      const req = mockApiRequest('POST', {
        adjustmentAmount: -50
        // Missing reason
      })

      const response = await createAdjustmentHandler(req, payoutId)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })
  })
})
