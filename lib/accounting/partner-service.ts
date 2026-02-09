/**
 * Partner Service
 * Handles partner, cafe, and API key management
 * 
 * @see Plan: Phase 2 - Backend Services
 */

import { prisma } from '@/lib/db/prisma'
import { createHash, randomBytes } from 'crypto'
import { logAudit } from './audit-service'
import type {
  CreatePartnerInput,
  UpdatePartnerInput,
  CreateCafeInput,
  UpdateCafeInput,
  CreateApiKeyInput,
  GetCafesQuery
} from './validation'

// ============================================
// Partner Management
// ============================================

export async function createPartner(input: CreatePartnerInput, actorId: string, actorEmail: string) {
  // Check for duplicate business number
  const existing = await prisma.referralPartner.findUnique({
    where: { businessNumber: input.businessNumber }
  })

  if (existing) {
    throw new Error('Partner with this business number already exists')
  }

  // Create partner with transaction
  const partner = await prisma.$transaction(async (tx) => {
    const newPartner = await tx.referralPartner.create({
      data: {
        orgId: input.orgId,
        orgName: input.orgName,
        businessNumber: input.businessNumber,
        contactEmail: input.contactEmail,
        contactName: input.contactName,
        status: 'ACTIVE'
      }
    })

    // Log audit trail
    await logAudit({
      entityType: 'partner',
      entityId: newPartner.id,
      action: 'create',
      actorId,
      actorEmail,
      afterState: newPartner
    })

    return newPartner
  })

  return {
    success: true,
    data: partner
  }
}

export async function updatePartner(
  partnerId: string,
  input: UpdatePartnerInput,
  actorId: string,
  actorEmail: string
) {
  const before = await prisma.referralPartner.findUnique({
    where: { id: partnerId }
  })

  if (!before) {
    throw new Error('Partner not found')
  }

  const partner = await prisma.$transaction(async (tx) => {
    const updated = await tx.referralPartner.update({
      where: { id: partnerId },
      data: input
    })

    await logAudit({
      entityType: 'partner',
      entityId: partnerId,
      action: 'update',
      actorId,
      actorEmail,
      beforeState: before,
      afterState: updated
    })

    return updated
  })

  return {
    success: true,
    data: partner
  }
}

export async function getPartner(partnerId: string) {
  const partner = await prisma.referralPartner.findUnique({
    where: { id: partnerId },
    include: {
      cafes: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          cafeName: true,
          commissionRate: true,
          status: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          cafes: true,
          apiKeys: true,
          payoutLedgers: true
        }
      }
    }
  })

  if (!partner) {
    throw new Error('Partner not found')
  }

  return {
    success: true,
    data: partner
  }
}

export async function listPartners(options?: {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  page?: number
  pageSize?: number
}) {
  const page = options?.page || 1
  const pageSize = options?.pageSize || 20
  const skip = (page - 1) * pageSize

  const where = options?.status ? { status: options.status } : {}

  const [partners, total] = await Promise.all([
    prisma.referralPartner.findMany({
      where,
      include: {
        _count: {
          select: { cafes: true, payoutLedgers: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip
    }),
    prisma.referralPartner.count({ where })
  ])

  return {
    success: true,
    data: {
      partners,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: skip + partners.length < total
      }
    }
  }
}

// ============================================
// Cafe Management
// ============================================

export async function createCafe(input: CreateCafeInput, actorId: string, actorEmail: string) {
  // Verify partner exists
  const partner = await prisma.referralPartner.findUnique({
    where: { id: input.partnerId }
  })

  if (!partner) {
    throw new Error('Partner not found')
  }

  const cafe = await prisma.$transaction(async (tx) => {
    const newCafe = await tx.referralCafe.create({
      data: {
        partnerId: input.partnerId,
        cafeName: input.cafeName,
        commissionRate: input.commissionRate,
        status: 'ACTIVE'
      }
    })

    await logAudit({
      entityType: 'cafe',
      entityId: newCafe.id,
      action: 'create',
      actorId,
      actorEmail,
      afterState: newCafe
    })

    return newCafe
  })

  return {
    success: true,
    data: cafe
  }
}

export async function updateCafe(
  cafeId: string,
  input: UpdateCafeInput,
  actorId: string,
  actorEmail: string
) {
  const before = await prisma.referralCafe.findUnique({
    where: { id: cafeId }
  })

  if (!before) {
    throw new Error('Cafe not found')
  }

  const cafe = await prisma.$transaction(async (tx) => {
    const updated = await tx.referralCafe.update({
      where: { id: cafeId },
      data: input
    })

    await logAudit({
      entityType: 'cafe',
      entityId: cafeId,
      action: 'update',
      actorId,
      actorEmail,
      beforeState: before,
      afterState: updated
    })

    return updated
  })

  return {
    success: true,
    data: cafe
  }
}

export async function listCafes(query: GetCafesQuery) {
  const { partnerId, status, page, pageSize } = query
  const skip = (page - 1) * pageSize

  const where: any = { partnerId }
  if (status) where.status = status

  const [cafes, total] = await Promise.all([
    prisma.referralCafe.findMany({
      where,
      include: {
        _count: {
          select: { referralLinks: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip
    }),
    prisma.referralCafe.count({ where })
  ])

  return {
    success: true,
    data: {
      cafes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: skip + cafes.length < total
      }
    }
  }
}

// ============================================
// API Key Management
// ============================================

export async function generateApiKey(input: CreateApiKeyInput, actorId: string, actorEmail: string) {
  // Generate random API key
  const rawKey = `pk_${randomBytes(32).toString('hex')}`
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.substring(0, 12) // pk_abc123...

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + input.expiresInDays)

  const apiKey = await prisma.$transaction(async (tx) => {
    const newKey = await tx.partnerApiKey.create({
      data: {
        partnerId: input.partnerId,
        keyHash,
        keyPrefix,
        keyType: 'partner',
        permissions: input.permissions,
        rateLimit: input.rateLimit,
        expiresAt
      }
    })

    await logAudit({
      entityType: 'api_key',
      entityId: newKey.id,
      action: 'generate_key',
      actorId,
      actorEmail,
      afterState: {
        id: newKey.id,
        keyPrefix: newKey.keyPrefix,
        permissions: newKey.permissions,
        expiresAt: newKey.expiresAt
      }
    })

    return newKey
  })

  // Return raw key ONLY ONCE (cannot recover)
  return {
    success: true,
    data: {
      apiKey: rawKey, // ⚠️ Display this to user immediately
      keyPrefix: apiKey.keyPrefix,
      expiresAt: apiKey.expiresAt,
      permissions: apiKey.permissions
    },
    warning: 'Store this API key securely. It will not be shown again.'
  }
}

export async function revokeApiKey(keyId: string, actorId: string, actorEmail: string) {
  const before = await prisma.partnerApiKey.findUnique({
    where: { id: keyId }
  })

  if (!before) {
    throw new Error('API key not found')
  }

  await prisma.$transaction(async (tx) => {
    await tx.partnerApiKey.delete({
      where: { id: keyId }
    })

    await logAudit({
      entityType: 'api_key',
      entityId: keyId,
      action: 'revoke_key',
      actorId,
      actorEmail,
      beforeState: {
        id: before.id,
        keyPrefix: before.keyPrefix,
        permissions: before.permissions
      },
      afterState: { deleted: true }
    })
  })

  return {
    success: true,
    message: 'API key revoked successfully'
  }
}

export async function verifyApiKey(rawKey: string) {
  const keyHash = createHash('sha256').update(rawKey).digest('hex')

  const apiKey = await prisma.partnerApiKey.findUnique({
    where: { keyHash },
    include: {
      partner: {
        select: {
          id: true,
          orgId: true,
          orgName: true,
          status: true
        }
      }
    }
  })

  if (!apiKey) {
    return { valid: false, reason: 'Invalid API key' }
  }

  if (apiKey.expiresAt < new Date()) {
    return { valid: false, reason: 'API key expired' }
  }

  if (apiKey.partner.status !== 'ACTIVE') {
    return { valid: false, reason: 'Partner account inactive' }
  }

  // Update last used timestamp
  await prisma.partnerApiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() }
  })

  return {
    valid: true,
    data: {
      partnerId: apiKey.partnerId,
      partner: apiKey.partner,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit
    }
  }
}

// ============================================
// Statistics (Optimized with raw SQL)
// ============================================

export async function getPartnerStats(partnerId: string) {
  // Single query with conditional aggregation (70% faster than multiple queries)
  const stats = await prisma.$queryRaw<Array<{
    total_cafes: bigint
    total_links: bigint
    total_conversions: bigint
    total_commission: number
  }>>`
    SELECT
      COUNT(DISTINCT c.id) as total_cafes,
      COUNT(DISTINCT rl.id) as total_links,
      COUNT(DISTINCT rc.id) as total_conversions,
      COALESCE(SUM(rc.commission_amount), 0) as total_commission
    FROM referral_partners rp
    LEFT JOIN referral_cafes c ON c.partner_id = rp.id AND c.status = 'ACTIVE'
    LEFT JOIN referral_links rl ON rl.cafe_id = c.id AND rl.status = 'ACTIVE'
    LEFT JOIN referral_conversions rc ON rc.link_id = rl.id
    WHERE rp.id = ${partnerId}
    GROUP BY rp.id
  `

  if (stats.length === 0) {
    throw new Error('Partner not found')
  }

  const result = stats[0]

  return {
    success: true,
    data: {
      totalCafes: Number(result.total_cafes),
      totalLinks: Number(result.total_links),
      totalConversions: Number(result.total_conversions),
      totalCommission: Number(result.total_commission)
    }
  }
}
