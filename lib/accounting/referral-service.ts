/**
 * Referral Service
 * Handles click tracking, attribution, and conversion logic
 *
 * @see Plan: Phase 2 - Backend Services
 */

import { prisma } from '@/lib/db/prisma'
import { createHash } from 'crypto'
import { logAudit } from './audit-service'
import type { CreateReferralLinkInput } from './validation'

// ============================================
// Referral Link Management
// ============================================

export async function createReferralLink(
  input: CreateReferralLinkInput,
  actorId: string,
  actorEmail: string
) {
  // Verify cafe exists
  const cafe = await prisma.referralCafe.findUnique({
    where: { id: input.cafeId }
  })

  if (!cafe) {
    throw new Error('Cafe not found')
  }

  // Generate unique short code (retry on collision)
  let shortCode: string
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    shortCode = generateShortCode()
    const existing = await prisma.referralLink.findUnique({
      where: { shortCode }
    })

    if (!existing) break
    attempts++
  }

  if (attempts === maxAttempts) {
    throw new Error('Failed to generate unique short code')
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + input.expiresInDays)

  const baseUrl = process.env.BASE_URL || 'https://qetta.com'
  const fullUrl = `${baseUrl}/r/${shortCode!}`

  const link = await prisma.$transaction(async (tx) => {
    const newLink = await tx.referralLink.create({
      data: {
        cafeId: input.cafeId,
        shortCode: shortCode!,
        fullUrl,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        expiresAt,
        status: 'ACTIVE'
      }
    })

    await logAudit({
      entityType: 'referral_link',
      entityId: newLink.id,
      action: 'create',
      actorId,
      actorEmail,
      afterState: newLink
    })

    return newLink
  })

  return {
    success: true,
    data: link
  }
}

/**
 * Generate 8-character alphanumeric short code
 * Format: ABCD1234 (uppercase letters + numbers)
 */
function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function getReferralLink(shortCode: string) {
  const link = await prisma.referralLink.findUnique({
    where: { shortCode },
    include: {
      cafe: {
        include: {
          partner: true
        }
      }
    }
  })

  if (!link) {
    return { success: false, error: 'Link not found' }
  }

  if (link.status !== 'ACTIVE') {
    return { success: false, error: 'Link is no longer active' }
  }

  if (link.expiresAt < new Date()) {
    return { success: false, error: 'Link has expired' }
  }

  return {
    success: true,
    data: link
  }
}

export async function listReferralLinks(options: {
  cafeId?: string
  status?: 'ACTIVE' | 'EXPIRED' | 'REVOKED'
  page?: number
  pageSize?: number
}) {
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const skip = (page - 1) * pageSize

  const where: any = {}
  if (options.cafeId) where.cafeId = options.cafeId
  if (options.status) where.status = options.status

  const [links, total] = await Promise.all([
    prisma.referralLink.findMany({
      where,
      include: {
        cafe: {
          select: {
            cafeName: true,
            partner: {
              select: {
                orgName: true
              }
            }
          }
        },
        _count: {
          select: {
            conversions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip
    }),
    prisma.referralLink.count({ where })
  ])

  return {
    success: true,
    data: {
      links,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: skip + links.length < total
      }
    }
  }
}

// ============================================
// Click Tracking
// ============================================

export async function trackClick(
  shortCode: string,
  metadata: {
    ipAddress: string
    userAgent: string
    referer?: string
  }
) {
  const link = await prisma.referralLink.findUnique({
    where: { shortCode }
  })

  if (!link) {
    throw new Error('Link not found')
  }

  // Increment click counter
  await prisma.referralLink.update({
    where: { id: link.id },
    data: {
      clicks: { increment: 1 }
    }
  })

  // Create tracking event (for analytics)
  const ipHash = createHash('sha256').update(metadata.ipAddress).digest('hex')
  const userAgentHash = createHash('sha256').update(metadata.userAgent).digest('hex')

  // Note: This could be stored in a separate tracking table if needed
  // For now, we just increment the counter and hash metadata for attribution

  return {
    success: true,
    data: {
      linkId: link.id,
      shortCode: link.shortCode,
      redirectUrl: link.fullUrl,
      ipHash, // Return for cookie/attribution
      userAgentHash
    }
  }
}

// ============================================
// Attribution & Conversion
// ============================================

/**
 * First-touch attribution: Create conversion if user doesn't already have one
 *
 * @param userId - User ID from User table
 * @param linkId - Referral link ID
 * @param subscriptionData - Payment/subscription metadata
 */
export async function attributeConversion(params: {
  userId: string
  linkId: string
  ipAddress: string
  userAgent: string
  subscriptionId?: string
  planType?: string
  amount: number
}) {
  // Check if user already has attribution (first-touch rule)
  const existing = await prisma.referralConversion.findUnique({
    where: { userId: params.userId }
  })

  if (existing) {
    return {
      success: false,
      error: 'User already has an attribution (first-touch rule)',
      existingAttribution: existing
    }
  }

  // Get link and cafe to calculate commission
  const link = await prisma.referralLink.findUnique({
    where: { id: params.linkId },
    include: {
      cafe: true
    }
  })

  if (!link) {
    throw new Error('Referral link not found')
  }

  const ipHash = createHash('sha256').update(params.ipAddress).digest('hex')
  const userAgentHash = createHash('sha256').update(params.userAgent).digest('hex')

  const commissionRate = link.cafe.commissionRate
  const commissionAmount = params.amount * Number(commissionRate)

  const conversion = await prisma.$transaction(async (tx) => {
    const newConversion = await tx.referralConversion.create({
      data: {
        userId: params.userId,
        linkId: params.linkId,
        ipHash,
        userAgentHash,
        attributedAt: new Date(),
        subscriptionId: params.subscriptionId,
        planType: params.planType,
        amount: params.amount,
        commissionRate,
        commissionAmount
      }
    })

    await logAudit({
      entityType: 'conversion',
      entityId: newConversion.id,
      action: 'create',
      actorId: params.userId,
      actorEmail: 'system', // System-triggered
      afterState: {
        userId: params.userId,
        linkId: params.linkId,
        amount: params.amount,
        commissionAmount
      }
    })

    return newConversion
  })

  return {
    success: true,
    data: conversion
  }
}

/**
 * Fallback attribution: Check ipHash + userAgentHash if cookie missing
 * Used when user clears cookies but same device/browser
 */
export async function findAttributionFallback(params: {
  ipAddress: string
  userAgent: string
  withinDays?: number
}) {
  const ipHash = createHash('sha256').update(params.ipAddress).digest('hex')
  const userAgentHash = createHash('sha256').update(params.userAgent).digest('hex')

  const withinDays = params.withinDays || 7
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - withinDays)

  // Find recent click with matching IP + User Agent
  const conversion = await prisma.referralConversion.findFirst({
    where: {
      ipHash,
      userAgentHash,
      attributedAt: {
        gte: cutoffDate
      }
    },
    orderBy: {
      attributedAt: 'desc'
    },
    include: {
      link: {
        include: {
          cafe: {
            include: {
              partner: true
            }
          }
        }
      }
    }
  })

  if (!conversion) {
    return {
      success: false,
      error: 'No attribution found for this device'
    }
  }

  return {
    success: true,
    data: conversion
  }
}

// ============================================
// Statistics & Analytics
// ============================================

export async function getLinkStats(linkId: string) {
  const [link, conversions] = await Promise.all([
    prisma.referralLink.findUnique({
      where: { id: linkId },
      include: {
        cafe: {
          include: {
            partner: true
          }
        }
      }
    }),
    prisma.referralConversion.findMany({
      where: { linkId },
      select: {
        amount: true,
        commissionAmount: true,
        attributedAt: true
      }
    })
  ])

  if (!link) {
    throw new Error('Link not found')
  }

  const totalConversions = conversions.length
  const totalRevenue = conversions.reduce((sum, c) => sum + Number(c.amount), 0)
  const totalCommission = conversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)
  const conversionRate = link.clicks > 0 ? (totalConversions / link.clicks) * 100 : 0

  return {
    success: true,
    data: {
      link: {
        id: link.id,
        shortCode: link.shortCode,
        fullUrl: link.fullUrl,
        clicks: link.clicks,
        status: link.status,
        expiresAt: link.expiresAt
      },
      cafe: {
        name: link.cafe.cafeName,
        partner: link.cafe.partner.orgName
      },
      stats: {
        clicks: link.clicks,
        conversions: totalConversions,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        totalRevenue,
        totalCommission
      },
      recentConversions: conversions
        .sort((a, b) => b.attributedAt.getTime() - a.attributedAt.getTime())
        .slice(0, 10)
    }
  }
}

/**
 * Get conversion trends over time (for charts)
 */
export async function getConversionTrends(params: {
  linkId?: string
  cafeId?: string
  partnerId?: string
  startDate: Date
  endDate: Date
  granularity?: 'day' | 'week' | 'month'
}) {
  const granularity = params.granularity || 'day'

  // Build where clause based on hierarchy
  let linkIds: string[] | undefined
  if (params.linkId) {
    linkIds = [params.linkId]
  } else if (params.cafeId) {
    const links = await prisma.referralLink.findMany({
      where: { cafeId: params.cafeId },
      select: { id: true }
    })
    linkIds = links.map((l) => l.id)
  } else if (params.partnerId) {
    const cafes = await prisma.referralCafe.findMany({
      where: { partnerId: params.partnerId },
      select: { id: true }
    })
    const cafeIds = cafes.map((c) => c.id)
    const links = await prisma.referralLink.findMany({
      where: { cafeId: { in: cafeIds } },
      select: { id: true }
    })
    linkIds = links.map((l) => l.id)
  }

  const conversions = await prisma.referralConversion.findMany({
    where: {
      linkId: linkIds ? { in: linkIds } : undefined,
      attributedAt: {
        gte: params.startDate,
        lte: params.endDate
      }
    },
    select: {
      attributedAt: true,
      amount: true,
      commissionAmount: true
    },
    orderBy: {
      attributedAt: 'asc'
    }
  })

  // Group by granularity
  const trends = conversions.reduce((acc, c) => {
    const key = formatDateKey(c.attributedAt, granularity)
    if (!acc[key]) {
      acc[key] = {
        date: key,
        conversions: 0,
        revenue: 0,
        commission: 0
      }
    }
    acc[key].conversions++
    acc[key].revenue += Number(c.amount)
    acc[key].commission += Number(c.commissionAmount)
    return acc
  }, {} as Record<string, any>)

  return {
    success: true,
    data: Object.values(trends)
  }
}

function formatDateKey(date: Date, granularity: 'day' | 'week' | 'month'): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  if (granularity === 'day') {
    return `${year}-${month}-${day}`
  } else if (granularity === 'week') {
    const weekNum = Math.ceil(d.getDate() / 7)
    return `${year}-${month}-W${weekNum}`
  } else {
    return `${year}-${month}`
  }
}
