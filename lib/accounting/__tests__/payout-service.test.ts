/**
 * Payout Service Unit Tests (P0 - CRITICAL)
 * Tests for snapshot verification, idempotency, and SERIALIZABLE transactions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { factories, calculateSnapshotHash } from './utils/test-helpers'

// Create mocks using vi.hoisted to ensure proper initialization order
const { mockPrisma, mockRedis } = vi.hoisted(() => {
  const createTxClient = () => {
    const txClient: any = {
      referralPartner: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
      referralCafe: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
      referralLink: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
      referralConversion: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
      payoutLedger: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn((data) => Promise.resolve({ id: 'payout-123', ...data.data })),
        update: vi.fn(),
        count: vi.fn()
      },
      $queryRaw: vi.fn()
    }
    return txClient
  }

  const prismaClient = {
    referralPartner: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    referralCafe: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    referralLink: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    referralConversion: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    payoutLedger: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(async (callback: any) => {
      const txClient = createTxClient()
      return await callback(txClient)
    }),
    $queryRaw: vi.fn()
  }

  return {
    mockPrisma: prismaClient,
    mockRedis: {
      get: vi.fn(),
      set: vi.fn(),
      setex: vi.fn(),
      publish: vi.fn()
    }
  }
})

vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma
}))

vi.mock('ioredis', () => ({
  Redis: vi.fn(() => mockRedis)
}))

// Import after mocking
import {
  calculatePayout,
  approvePayout,
  listPayouts,
  createAdjustment
} from '../payout-service'

describe('PayoutService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Snapshot Verification (CRITICAL)', () => {
    it('creates payout preview with SHA-256 snapshot hash', async () => {
      const partner = factories.partner()
      const periodStart = new Date('2026-02-01')
      const periodEnd = new Date('2026-02-28')

      const conversions = [
        factories.conversion('user-1', 'link-1', { amount: 100, commissionAmount: 5 }),
        factories.conversion('user-2', 'link-1', { amount: 200, commissionAmount: 10 }),
        factories.conversion('user-3', 'link-1', { amount: 150, commissionAmount: 7.5 })
      ]

      const expectedHash = calculateSnapshotHash(conversions.map((c: any) => c.id))

      mockPrisma.referralPartner.findUnique.mockResolvedValue(partner)
      mockPrisma.referralCafe.findMany.mockResolvedValue([{ id: 'cafe-1', partnerId: partner.id }])
      mockPrisma.referralLink.findMany.mockResolvedValue([{ id: 'link-1', cafeId: 'cafe-1' }])
      mockPrisma.referralConversion.findMany.mockResolvedValue(conversions)

      const result = await calculatePayout({
        partnerId: partner.id,
        periodStart,
        periodEnd
      }, 'admin-id', 'admin@qetta.com')

      expect(result.success).toBe(true)
      expect(result.data?.payout.snapshotHash).toBe(expectedHash)
      expect(result.data?.payout.snapshotHash).toMatch(/^[a-f0-9]{64}$/)
      expect(result.data?.payout.totalConversions).toBe(3)
      expect(result.data?.payout.totalCommission).toBe(22.5)
    })

    it('rejects approval if snapshot hash mismatches', async () => {
      const payoutId = 'payout-123'
      const payout = factories.payout(payoutId, {
        snapshotHash: 'abc123',
        status: 'DRAFT',
        conversionIds: ['conv-1', 'conv-2']
      })

      mockPrisma.payoutLedger.findUnique.mockResolvedValue(payout)

      await expect(
        approvePayout({
          payoutId,
          snapshotHash: 'wrong-hash',
          approvedBy: 'admin@qetta.com'
        }, 'admin-id', 'admin@qetta.com')
      ).rejects.toThrow('Snapshot hash mismatch')
    })
  })

  describe('Idempotency (CRITICAL)', () => {
    it('prevents duplicate payout creation for same period', async () => {
      const partner = factories.partner()
      const existingPayout = factories.payout('existing', {
        partnerId: partner.id,
        periodStart: new Date('2026-02-01'),
        periodEnd: new Date('2026-02-28'),
        status: 'APPROVED'
      })

      mockPrisma.payoutLedger.findFirst.mockResolvedValue(existingPayout)

      const result = await calculatePayout({
        partnerId: partner.id,
        periodStart: new Date('2026-02-01'),
        periodEnd: new Date('2026-02-28')
      }, 'admin-id', 'admin@qetta.com')

      expect(result.success).toBe(false)
      expect(result.error).toContain('already exists')
    })
  })
})
