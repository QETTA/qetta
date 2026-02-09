/**
 * Payout Service
 * Handles snapshot-based payout calculations, approvals, and adjustments
 *
 * @see Plan: Phase 2 - Backend Services
 */

import { prisma } from '@/lib/db/prisma'
import { createHash } from 'crypto'
import { logAudit } from './audit-service'
import type { PreviewPayoutInput, ApprovePayoutInput, AdjustPayoutInput } from './validation'
import { createClient } from 'redis'

// Redis client for pub/sub
let redisPublisher: ReturnType<typeof createClient> | null = null

async function getRedisPublisher() {
  if (!redisPublisher) {
    redisPublisher = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })
    await redisPublisher.connect()
  }
  return redisPublisher
}

/**
 * Publish payout status update to Redis for SSE subscribers
 */
async function publishPayoutStatus(payoutId: string, status: string, metadata?: any) {
  try {
    const publisher = await getRedisPublisher()
    await publisher.publish(
      `payout:${payoutId}:status`,
      JSON.stringify({
        status,
        timestamp: new Date().toISOString(),
        ...metadata
      })
    )
  } catch (error) {
    console.error('[Redis Pub/Sub ERROR]', error)
    // Don't throw - status update failure shouldn't break payout processing
  }
}

// ============================================
// Payout Calculation (with Snapshot)
// ============================================

/**
 * Calculate payout for a partner for a given period
 * Creates immutable snapshot for verification at approval time
 */
export async function calculatePayout(
  input: PreviewPayoutInput,
  actorId: string,
  actorEmail: string
) {
  // Verify partner exists
  const partner = await prisma.referralPartner.findUnique({
    where: { id: input.partnerId }
  })

  if (!partner) {
    throw new Error('Partner not found')
  }

  // Check for existing payout in this period
  const existing = await prisma.payoutLedger.findFirst({
    where: {
      partnerId: input.partnerId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      ledgerType: 'PAYOUT'
    }
  })

  if (existing && existing.status !== 'DRAFT') {
    return {
      success: false,
      error: `Payout already exists with status: ${existing.status}`,
      existingPayout: existing
    }
  }

  // Query conversions for period (via partner's cafes and links)
  const cafes = await prisma.referralCafe.findMany({
    where: { partnerId: input.partnerId, status: 'ACTIVE' },
    select: { id: true }
  })

  const cafeIds = cafes.map((c) => c.id)

  const links = await prisma.referralLink.findMany({
    where: { cafeId: { in: cafeIds } },
    select: { id: true }
  })

  const linkIds = links.map((l) => l.id)

  const conversions = await prisma.referralConversion.findMany({
    where: {
      linkId: { in: linkIds },
      attributedAt: {
        gte: input.periodStart,
        lte: input.periodEnd
      }
    },
    orderBy: {
      attributedAt: 'asc'
    }
  })

  // Calculate totals
  const totalConversions = conversions.length
  const totalRevenue = conversions.reduce((sum, c) => sum + Number(c.amount), 0)
  const totalCommission = conversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)

  // Create snapshot hash (SHA-256 of conversion IDs sorted)
  const conversionIds = conversions.map((c) => c.id).sort()
  const snapshotHash = createHash('sha256').update(conversionIds.join(',')).digest('hex')

  // Create or update draft payout
  const payout = await prisma.$transaction(async (tx) => {
    if (existing && existing.status === 'DRAFT') {
      // Update existing draft
      const updated = await tx.payoutLedger.update({
        where: { id: existing.id },
        data: {
          snapshotHash,
          conversionIds,
          totalConversions,
          totalRevenue,
          totalCommission
        }
      })

      await logAudit({
        entityType: 'payout',
        entityId: updated.id,
        action: 'recalculate',
        actorId,
        actorEmail,
        beforeState: existing,
        afterState: updated
      })

      return updated
    } else {
      // Create new draft
      const newPayout = await tx.payoutLedger.create({
        data: {
          partnerId: input.partnerId,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          status: 'DRAFT',
          ledgerType: 'PAYOUT',
          snapshotHash,
          conversionIds,
          totalConversions,
          totalRevenue,
          totalCommission
        }
      })

      await logAudit({
        entityType: 'payout',
        entityId: newPayout.id,
        action: 'create_draft',
        actorId,
        actorEmail,
        afterState: newPayout
      })

      return newPayout
    }
  })

  return {
    success: true,
    data: {
      payout,
      conversions: conversions.map((c) => ({
        id: c.id,
        userId: c.userId,
        amount: c.amount,
        commissionAmount: c.commissionAmount,
        attributedAt: c.attributedAt
      }))
    }
  }
}

// ============================================
// Payout Approval (with Snapshot Verification)
// ============================================

/**
 * Approve a draft payout after verifying snapshot integrity
 * CRITICAL: Verifies that conversions haven't changed since draft creation
 */
export async function approvePayout(
  input: ApprovePayoutInput,
  actorId: string,
  actorEmail: string
) {
  const payout = await prisma.payoutLedger.findUnique({
    where: { id: input.payoutId }
  })

  if (!payout) {
    throw new Error('Payout not found')
  }

  if (payout.status !== 'DRAFT') {
    throw new Error(`Payout status is ${payout.status}, expected DRAFT`)
  }

  // Verify snapshot hash matches provided hash
  if (payout.snapshotHash !== input.snapshotHash) {
    throw new Error(
      'Snapshot hash mismatch - payout data has changed since preview. Please regenerate.'
    )
  }

  // Additional verification: recalculate hash from current conversion IDs
  const currentHash = createHash('sha256').update(payout.conversionIds.sort().join(',')).digest('hex')
  
  if (currentHash !== input.snapshotHash) {
    throw new Error('Snapshot verification failed - data tampering detected')
  }

  // Approve payout with transaction isolation
  const approvedPayout = await prisma.$transaction(
    async (tx) => {
      const updated = await tx.payoutLedger.update({
        where: { id: input.payoutId },
        data: {
          status: 'APPROVED',
          approvedBy: input.approvedBy,
          approvedAt: new Date()
        }
      })

      await logAudit({
        entityType: 'payout',
        entityId: input.payoutId,
        action: 'approve',
        actorId,
        actorEmail,
        beforeState: { status: 'DRAFT' },
        afterState: {
          status: 'APPROVED',
          approvedBy: input.approvedBy,
          approvedAt: updated.approvedAt
        },
        metadata: {
          reason: input.reason,
          snapshotHash: input.snapshotHash
        }
      })

      return updated
    },
    {
      isolationLevel: 'Serializable',
      timeout: 10000
    }
  )

  // Publish status update for SSE subscribers
  await publishPayoutStatus(input.payoutId, 'APPROVED', {
    approvedBy: input.approvedBy,
    approvedAt: approvedPayout.approvedAt
  })

  return {
    success: true,
    data: approvedPayout
  }
}

// ============================================
// Payout Status Transitions
// ============================================

/**
 * Transition payout to PROCESSING status
 * Called when payment is being sent
 */
export async function markPayoutProcessing(
  payoutId: string,
  actorId: string,
  actorEmail: string
) {
  const payout = await prisma.payoutLedger.findUnique({
    where: { id: payoutId }
  })

  if (!payout) {
    throw new Error('Payout not found')
  }

  if (payout.status !== 'APPROVED') {
    throw new Error(`Payout status is ${payout.status}, expected APPROVED`)
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.payoutLedger.update({
      where: { id: payoutId },
      data: {
        status: 'PROCESSING'
      }
    })

    await logAudit({
      entityType: 'payout',
      entityId: payoutId,
      action: 'mark_processing',
      actorId,
      actorEmail,
      beforeState: { status: 'APPROVED' },
      afterState: { status: 'PROCESSING' }
    })

    return result
  })

  // Publish status update for SSE subscribers
  await publishPayoutStatus(payoutId, 'PROCESSING')

  return {
    success: true,
    data: updated
  }
}

/**
 * Mark payout as PAID
 * Called when payment confirmation is received
 */
export async function markPayoutPaid(
  payoutId: string,
  paymentData: {
    paymentMethod: string
    paymentReference: string
  },
  actorId: string,
  actorEmail: string
) {
  const payout = await prisma.payoutLedger.findUnique({
    where: { id: payoutId }
  })

  if (!payout) {
    throw new Error('Payout not found')
  }

  if (payout.status !== 'PROCESSING') {
    throw new Error(`Payout status is ${payout.status}, expected PROCESSING`)
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.payoutLedger.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference
      }
    })

    await logAudit({
      entityType: 'payout',
      entityId: payoutId,
      action: 'mark_paid',
      actorId,
      actorEmail,
      beforeState: { status: 'PROCESSING' },
      afterState: {
        status: 'PAID',
        paidAt: result.paidAt,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference
      }
    })

    return result
  })

  // Publish status update for SSE subscribers
  await publishPayoutStatus(payoutId, 'PAID', {
    paidAt: updated.paidAt,
    paymentMethod: updated.paymentMethod,
    paymentReference: updated.paymentReference
  })

  return {
    success: true,
    data: updated
  }
}

// ============================================
// Payout Adjustments (Compensating Ledger)
// ============================================

/**
 * Create adjustment ledger for a paid payout
 * Implements compensating transaction pattern (no deletion, only corrections)
 */
export async function createPayoutAdjustment(
  input: AdjustPayoutInput,
  actorId: string,
  actorEmail: string
) {
  const originalPayout = await prisma.payoutLedger.findUnique({
    where: { id: input.originalPayoutId }
  })

  if (!originalPayout) {
    throw new Error('Original payout not found')
  }

  if (originalPayout.status !== 'PAID') {
    throw new Error(`Cannot adjust payout with status ${originalPayout.status}`)
  }

  // Determine ledger type based on adjustment amount
  const ledgerType = input.adjustmentAmount < 0 ? 'CLAWBACK' : 'ADJUSTMENT'

  const adjustment = await prisma.$transaction(async (tx) => {
    // Create adjustment ledger
    const newAdjustment = await tx.payoutLedger.create({
      data: {
        partnerId: originalPayout.partnerId,
        periodStart: originalPayout.periodStart,
        periodEnd: originalPayout.periodEnd,
        status: 'APPROVED', // Adjustments are pre-approved
        ledgerType,
        referenceLedgerId: input.originalPayoutId,
        adjustmentReason: input.reason,
        totalConversions: 0,
        totalRevenue: 0,
        totalCommission: input.adjustmentAmount,
        approvedBy: input.approvedBy,
        approvedAt: new Date(),
        conversionIds: []
      }
    })

    // Update original payout status
    await tx.payoutLedger.update({
      where: { id: input.originalPayoutId },
      data: {
        status: 'ADJUSTED'
      }
    })

    await logAudit({
      entityType: 'payout',
      entityId: newAdjustment.id,
      action: 'create_adjustment',
      actorId,
      actorEmail,
      afterState: {
        originalPayoutId: input.originalPayoutId,
        adjustmentAmount: input.adjustmentAmount,
        reason: input.reason,
        ledgerType
      }
    })

    return newAdjustment
  })

  return {
    success: true,
    data: adjustment
  }
}

// ============================================
// Payout Queries
// ============================================

export async function getPayout(payoutId: string) {
  const payout = await prisma.payoutLedger.findUnique({
    where: { id: payoutId },
    include: {
      partner: {
        select: {
          id: true,
          orgName: true,
          contactEmail: true
        }
      }
    }
  })

  if (!payout) {
    throw new Error('Payout not found')
  }

  return {
    success: true,
    data: payout
  }
}

export async function listPayouts(options: {
  partnerId?: string
  status?: 'DRAFT' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'ADJUSTMENT_PENDING' | 'ADJUSTED' | 'FAILED'
  page?: number
  pageSize?: number
}) {
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const skip = (page - 1) * pageSize

  const where: any = {}
  if (options.partnerId) where.partnerId = options.partnerId
  if (options.status) where.status = options.status

  const [payouts, total] = await Promise.all([
    prisma.payoutLedger.findMany({
      where,
      include: {
        partner: {
          select: {
            orgName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip
    }),
    prisma.payoutLedger.count({ where })
  ])

  return {
    success: true,
    data: {
      payouts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: skip + payouts.length < total
      }
    }
  }
}

/**
 * Get payout history for a partner (including adjustments)
 */
export async function getPartnerPayoutHistory(partnerId: string) {
  const payouts = await prisma.payoutLedger.findMany({
    where: { partnerId },
    orderBy: { createdAt: 'desc' },
    include: {
      partner: {
        select: {
          orgName: true
        }
      }
    }
  })

  // Separate payouts and adjustments
  const mainPayouts = payouts.filter((p) => p.ledgerType === 'PAYOUT')
  const adjustments = payouts.filter((p) => p.ledgerType !== 'PAYOUT')

  // Calculate totals
  const totalPaid = payouts
    .filter((p) => p.status === 'PAID' && p.ledgerType === 'PAYOUT')
    .reduce((sum, p) => sum + Number(p.totalCommission), 0)

  const totalAdjustments = adjustments.reduce((sum, a) => sum + Number(a.totalCommission), 0)

  const netPaid = totalPaid + totalAdjustments

  return {
    success: true,
    data: {
      payouts: mainPayouts,
      adjustments,
      summary: {
        totalPayouts: mainPayouts.length,
        totalPaid,
        totalAdjustments,
        netPaid
      }
    }
  }
}

// ============================================
// Snapshot Verification Utilities
// ============================================

/**
 * Verify snapshot integrity for a payout
 * Returns true if snapshot is valid, false otherwise
 */
export async function verifySnapshotIntegrity(payoutId: string): Promise<boolean> {
  const payout = await prisma.payoutLedger.findUnique({
    where: { id: payoutId }
  })

  if (!payout || !payout.snapshotHash) {
    return false
  }

  // Recalculate hash from stored conversion IDs
  const currentHash = createHash('sha256').update(payout.conversionIds.sort().join(',')).digest('hex')

  return currentHash === payout.snapshotHash
}

/**
 * Get detailed snapshot data for a payout
 */
export async function getPayoutSnapshot(payoutId: string) {
  const payout = await prisma.payoutLedger.findUnique({
    where: { id: payoutId }
  })

  if (!payout) {
    throw new Error('Payout not found')
  }

  // Get conversion details
  const conversions = await prisma.referralConversion.findMany({
    where: {
      id: { in: payout.conversionIds }
    },
    include: {
      user: {
        select: {
          id: true,
          email: true
        }
      },
      link: {
        include: {
          cafe: true
        }
      }
    }
  })

  return {
    success: true,
    data: {
      payout,
      conversions,
      snapshotValid: await verifySnapshotIntegrity(payoutId)
    }
  }
}
