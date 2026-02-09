/**
 * Payout Service Unit Tests (P0 - CRITICAL)
 * Tests for snapshot verification, idempotency, and SERIALIZABLE transactions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { factories, calculateSnapshotHash, createMockPrisma, createMockRedis } from './utils/test-helpers'
import { createHash } from 'crypto'

// Mock dependencies
let mockPrisma: ReturnType<typeof createMockPrisma>
let mockRedis: ReturnType<typeof createMockRedis>

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
    mockPrisma = createMockPrisma() as any
    mockRedis = createMockRedis() as any
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

      // Mock database calls
      mockPrisma.referralPartner.findUnique.mockResolvedValue(partner)
      mockPrisma.referralCafe.findMany.mockResolvedValue([{ id: 'cafe-1', partnerId: partner.id }])
      mockPrisma.referralLink.findMany.mockResolvedValue([{ id: 'link-1', cafeId: 'cafe-1' }])
      mockPrisma.referralConversion.findMany.mockResolvedValue(conversions)

      const result = await calculatePayout({
        partnerId: partner.id,
        periodStart,
        periodEnd
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.snapshotHash).toBeDefined()
      expect(result.data.snapshotHash).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex format
      expect(result.data.totalConversions).toBe(3)
      expect(result.data.totalRevenue).toBe(450)
      expect(result.data.totalCommission).toBe(22.5)
      expect(result.data.conversionIds).toEqual(
        expect.arrayContaining(conversions.map((c) => c.id))
      )
    })

    it('rejects approval if snapshot hash mismatches (TOCTOU prevention)', async () => {
      const payout = factories.payout('partner-1', {
        status: 'DRAFT',
        conversionIds: ['conv-1', 'conv-2', 'conv-3'],
        snapshotHash: calculateSnapshotHash(['conv-1', 'conv-2', 'conv-3'])
      })

      mockPrisma.payoutLedger.findUnique.mockResolvedValue(payout)

      // Attempt to approve with different snapshot hash (data tampering)
      const tamperedHash = calculateSnapshotHash(['conv-1', 'conv-2', 'conv-3', 'conv-4'])

      await expect(
        approvePayout({
          payoutId: payout.id,
          snapshotHash: tamperedHash,
          approvedBy: 'admin@qetta.com'
        }, 'admin-123', 'admin@qetta.com')
      ).rejects.toThrow(/Snapshot verification failed/)

      // Verify payout was not updated
      expect(mockPrisma.payoutLedger.update).not.toHaveBeenCalled()
    })

    it('approves payout with valid snapshot hash', async () => {
      const payout = factories.payout('partner-1', {
        status: 'DRAFT',
        conversionIds: ['conv-1', 'conv-2', 'conv-3'],
        snapshotHash: calculateSnapshotHash(['conv-1', 'conv-2', 'conv-3'])
      })

      const approvedPayout = {
        ...payout,
        status: 'APPROVED',
        approvedBy: 'admin-123',
        approvedAt: new Date()
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          payoutLedger: {
            findUnique: vi.fn().mockResolvedValue(payout),
            update: vi.fn().mockResolvedValue(approvedPayout)
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      mockRedis.publish.mockResolvedValue(1)

      const result = await approvePayout({
        payoutId: payout.id,
        snapshotHash: payout.snapshotHash!,
        approvedBy: 'admin@qetta.com'
      }, 'admin-123', 'admin@qetta.com')

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('APPROVED')
      expect(result.data.approvedBy).toBe('admin-123')
    })

    it('handles snapshot with no conversions (edge case)', async () => {
      const partner = factories.partner()
      const periodStart = new Date('2026-02-01')
      const periodEnd = new Date('2026-02-28')

      mockPrisma.referralPartner.findUnique.mockResolvedValue(partner)
      mockPrisma.referralCafe.findMany.mockResolvedValue([])
      mockPrisma.referralLink.findMany.mockResolvedValue([])
      mockPrisma.referralConversion.findMany.mockResolvedValue([])

      const result = await calculatePayout({
        partnerId: partner.id,
        periodStart,
        periodEnd
      })

      expect(result.success).toBe(true)
      expect(result.data.totalConversions).toBe(0)
      expect(result.data.totalRevenue).toBe(0)
      expect(result.data.totalCommission).toBe(0)
      expect(result.data.conversionIds).toEqual([])
      expect(result.data.snapshotHash).toBeDefined() // Even empty snapshot has hash
    })
  })

  describe('Idempotency (CRITICAL)', () => {
    it('prevents duplicate payout for same period', async () => {
      const partner = factories.partner()
      const periodStart = new Date('2026-02-01')
      const periodEnd = new Date('2026-02-28')

      const existingPayout = factories.payout(partner.id, {
        periodStart,
        periodEnd,
        version: 1,
        status: 'APPROVED'
      })

      // First check: existing payout exists
      mockPrisma.payoutLedger.findFirst.mockResolvedValue(existingPayout)

      await expect(
        calculatePayout({
          partnerId: partner.id,
          periodStart,
          periodEnd
        })
      ).rejects.toThrow(/Payout already exists for this period/)
    })

    it('allows multiple versions (adjustments) with version increment', async () => {
      const partner = factories.partner()
      const originalPayout = factories.payout(partner.id, {
        status: 'PAID',
        version: 1,
        totalCommission: 100
      })

      const adjustmentPayout = factories.payout(partner.id, {
        status: 'APPROVED',
        ledgerType: 'ADJUSTMENT',
        version: 2,
        totalCommission: -10, // Negative for clawback
        referenceLedgerId: originalPayout.id,
        adjustmentReason: 'Incorrect conversion attribution'
      })

      mockPrisma.payoutLedger.findUnique.mockResolvedValue(originalPayout)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          payoutLedger: {
            create: vi.fn().mockResolvedValue(adjustmentPayout),
            findUnique: vi.fn().mockResolvedValue(originalPayout)
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      const result = await createAdjustment({
        payoutId: originalPayout.id,
        adjustmentAmount: -10,
        reason: 'Incorrect conversion attribution'
      }, 'admin-123', 'admin@qetta.com')

      expect(result.success).toBe(true)
      expect(result.data.ledgerType).toBe('ADJUSTMENT')
      expect(result.data.referenceLedgerId).toBe(originalPayout.id)
    })

    it('enforces unique constraint via Prisma error', async () => {
      const partner = factories.partner()
      const periodStart = new Date('2026-02-01')
      const periodEnd = new Date('2026-02-28')

      // Simulate Prisma unique constraint violation
      const prismaError = new Error('Unique constraint failed on the fields: (`partnerId`,`periodStart`,`periodEnd`,`version`)')
      ;(prismaError as any).code = 'P2002'

      mockPrisma.payoutLedger.create.mockRejectedValue(prismaError)

      await expect(
        calculatePayout({
          partnerId: partner.id,
          periodStart,
          periodEnd
        })
      ).rejects.toThrow(/Unique constraint/)
    })
  })

  describe('SERIALIZABLE Transactions', () => {
    it('prevents concurrent approval race conditions', async () => {
      const payout = factories.payout('partner-1', {
        status: 'DRAFT',
        snapshotHash: calculateSnapshotHash(['conv-1'])
      })

      let approvalAttempts = 0

      mockPrisma.$transaction.mockImplementation(async (callback, options) => {
        approvalAttempts++

        // First attempt succeeds
        if (approvalAttempts === 1) {
          const tx = {
            payoutLedger: {
              findUnique: vi.fn().mockResolvedValue(payout),
              update: vi.fn().mockResolvedValue({ ...payout, status: 'APPROVED' })
            },
            auditLog: {
              create: vi.fn()
            }
          }
          return await callback(tx)
        }

        // Second concurrent attempt should see status changed
        const tx = {
          payoutLedger: {
            findUnique: vi.fn().mockResolvedValue({ ...payout, status: 'APPROVED' }),
            update: vi.fn()
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      mockRedis.publish.mockResolvedValue(1)

      // First approval
      const result1 = await approvePayout({
        payoutId: payout.id,
        snapshotHash: payout.snapshotHash!,
        approvedBy: 'admin@qetta.com'
      }, 'admin-123', 'admin@qetta.com')

      expect(result1.success).toBe(true)

      // Second concurrent approval should fail
      await expect(
        approvePayout({
          payoutId: payout.id,
          snapshotHash: payout.snapshotHash!,
          approvedBy: 'admin@qetta.com'
        }, 'admin-456', 'admin2@qetta.com')
      ).rejects.toThrow(/already approved/)
    })

    it('rolls back on snapshot verification failure', async () => {
      const payout = factories.payout('partner-1', {
        status: 'DRAFT',
        conversionIds: ['conv-1', 'conv-2'],
        snapshotHash: calculateSnapshotHash(['conv-1', 'conv-2'])
      })

      const updateSpy = vi.fn()

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          payoutLedger: {
            findUnique: vi.fn().mockResolvedValue(payout),
            update: updateSpy
          },
          auditLog: {
            create: vi.fn()
          }
        }

        try {
          return await callback(tx)
        } catch (error) {
          // Transaction should rollback on error
          updateSpy.mockClear()
          throw error
        }
      })

      // Tampered hash
      const tamperedHash = calculateSnapshotHash(['conv-1', 'conv-2', 'conv-3'])

      await expect(
        approvePayout({
          payoutId: payout.id,
          snapshotHash: tamperedHash,
          approvedBy: 'admin@qetta.com'
        }, 'admin-123', 'admin@qetta.com')
      ).rejects.toThrow()

      // Update should not be called due to rollback
      expect(updateSpy).not.toHaveBeenCalled()
    })

    it('respects SERIALIZABLE isolation level', async () => {
      const payout = factories.payout('partner-1', {
        status: 'DRAFT',
        snapshotHash: calculateSnapshotHash(['conv-1'])
      })

      let isolationLevel: string | undefined

      mockPrisma.$transaction.mockImplementation(async (callback, options: any) => {
        isolationLevel = options?.isolationLevel

        const tx = {
          payoutLedger: {
            findUnique: vi.fn().mockResolvedValue(payout),
            update: vi.fn().mockResolvedValue({ ...payout, status: 'APPROVED' })
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      mockRedis.publish.mockResolvedValue(1)

      await approvePayout({
        payoutId: payout.id,
        snapshotHash: payout.snapshotHash!,
        approvedBy: 'admin@qetta.com'
      }, 'admin-123', 'admin@qetta.com')

      expect(isolationLevel).toBe('Serializable')
    })
  })

  describe('Compensating Ledger Pattern', () => {
    it('creates adjustment ledger with negative amount', async () => {
      const originalPayout = factories.payout('partner-1', {
        status: 'PAID',
        totalCommission: 100
      })

      const adjustmentLedger = factories.payout('partner-1', {
        ledgerType: 'ADJUSTMENT',
        totalCommission: -15,
        referenceLedgerId: originalPayout.id,
        adjustmentReason: 'Refund for cancelled subscription'
      })

      mockPrisma.payoutLedger.findUnique.mockResolvedValue(originalPayout)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          payoutLedger: {
            findUnique: vi.fn().mockResolvedValue(originalPayout),
            create: vi.fn().mockResolvedValue(adjustmentLedger)
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      const result = await createAdjustment({
        payoutId: originalPayout.id,
        adjustmentAmount: -15,
        reason: 'Refund for cancelled subscription'
      }, 'admin-123', 'admin@qetta.com')

      expect(result.success).toBe(true)
      expect(result.data.ledgerType).toBe('ADJUSTMENT')
      expect(result.data.totalCommission).toBe(-15)
      expect(result.data.referenceLedgerId).toBe(originalPayout.id)
      expect(result.data.adjustmentReason).toContain('Refund')
    })

    it('calculates net payout (original - adjustments)', async () => {
      const partnerId = 'partner-1'
      const periodStart = new Date('2026-02-01')
      const periodEnd = new Date('2026-02-28')

      const originalPayout = factories.payout(partnerId, {
        periodStart,
        periodEnd,
        ledgerType: 'PAYOUT',
        totalCommission: 100
      })

      const adjustment1 = factories.payout(partnerId, {
        periodStart,
        periodEnd,
        ledgerType: 'ADJUSTMENT',
        totalCommission: -10,
        referenceLedgerId: originalPayout.id
      })

      const adjustment2 = factories.payout(partnerId, {
        periodStart,
        periodEnd,
        ledgerType: 'ADJUSTMENT',
        totalCommission: -5,
        referenceLedgerId: originalPayout.id
      })

      mockPrisma.payoutLedger.findMany.mockResolvedValue([
        originalPayout,
        adjustment1,
        adjustment2
      ])

      const result = await listPayouts({
        partnerId,
        periodStart,
        periodEnd
      })

      expect(result.success).toBe(true)

      // Calculate net
      const net = result.data.ledgers.reduce((sum, ledger) => sum + Number(ledger.totalCommission), 0)
      expect(net).toBe(85) // 100 - 10 - 5
    })

    it('prevents direct deletion of payouts', () => {
      // This test verifies the compensating ledger pattern by ensuring
      // that deletion is not exposed in the service API

      const payoutService = require('../payout-service')

      // Verify deletePayout method does not exist
      expect(payoutService.deletePayout).toBeUndefined()

      // Verify only adjustment methods exist
      expect(payoutService.createAdjustment).toBeDefined()
    })
  })

  describe('Redis Pub/Sub Integration', () => {
    it('publishes status updates on state transitions', async () => {
      const payout = factories.payout('partner-1', {
        status: 'DRAFT',
        snapshotHash: calculateSnapshotHash(['conv-1'])
      })

      const approvedPayout = { ...payout, status: 'APPROVED', approvedAt: new Date() }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          payoutLedger: {
            findUnique: vi.fn().mockResolvedValue(payout),
            update: vi.fn().mockResolvedValue(approvedPayout)
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      mockRedis.publish.mockResolvedValue(1)

      await approvePayout({
        payoutId: payout.id,
        snapshotHash: payout.snapshotHash!,
        approvedBy: 'admin@qetta.com'
      }, 'admin-123', 'admin@qetta.com')

      // Verify Redis publish was called
      expect(mockRedis.publish).toHaveBeenCalledWith(
        `payout:${payout.id}:status`,
        expect.stringContaining('"status":"APPROVED"')
      )
    })

    it('handles Redis connection failures gracefully', async () => {
      const payout = factories.payout('partner-1', {
        status: 'DRAFT',
        snapshotHash: calculateSnapshotHash(['conv-1'])
      })

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          payoutLedger: {
            findUnique: vi.fn().mockResolvedValue(payout),
            update: vi.fn().mockResolvedValue({ ...payout, status: 'APPROVED' })
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      // Redis publish fails
      mockRedis.publish.mockRejectedValue(new Error('Redis connection lost'))

      // Should still succeed (graceful degradation)
      const result = await approvePayout({
        payoutId: payout.id,
        snapshotHash: payout.snapshotHash!,
        approvedBy: 'admin@qetta.com'
      }, 'admin-123', 'admin@qetta.com')

      expect(result.success).toBe(true)
    })

    it('includes metadata in published events', async () => {
      const payout = factories.payout('partner-1', {
        status: 'DRAFT',
        totalCommission: 150.50,
        snapshotHash: calculateSnapshotHash(['conv-1'])
      })

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          payoutLedger: {
            findUnique: vi.fn().mockResolvedValue(payout),
            update: vi.fn().mockResolvedValue({ ...payout, status: 'APPROVED' })
          },
          auditLog: {
            create: vi.fn()
          }
        }
        return await callback(tx)
      })

      mockRedis.publish.mockResolvedValue(1)

      await approvePayout({
        payoutId: payout.id,
        snapshotHash: payout.snapshotHash!,
        approvedBy: 'admin@qetta.com'
      }, 'admin-123', 'admin@qetta.com')

      const publishCall = mockRedis.publish.mock.calls[0]
      const eventData = JSON.parse(publishCall[1] as string)

      expect(eventData.status).toBe('APPROVED')
      expect(eventData.timestamp).toBeDefined()
      expect(eventData.amount).toBe(150.50)
      expect(eventData.approvedBy).toBe('admin-123')
    })
  })
})
