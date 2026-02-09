/**
 * Accounting Partner API Routes
 * Authenticated via x-api-key header
 *
 * Base: /api/qetta/v1/partners
 */

import express, { type Request, type Response } from 'express'
import {
  requireAccountingPartner,
  requirePermission,
} from '../middleware/accountingPartnerAuth.js'
import { PrismaClient } from '@prisma/client'
import { logger } from '../config/logger.js'
import {
  getCafesQuerySchema,
  getReferralLinksQuerySchema,
  getPayoutsQuerySchema,
  batchUploadPostsSchema,
} from '../../../lib/accounting/validation.js'

const router = express.Router()
const prisma = new PrismaClient()

// ============================================
// Apply authentication middleware to all routes
// ============================================
router.use(requireAccountingPartner)

// ============================================
// GET /api/qetta/v1/partners/me/cafes
// List partner's cafes with stats
// ============================================
router.get('/me/cafes', requirePermission('read:cafes'), async (req: Request, res: Response) => {
  try {
    const partnerId = req.partner!.id

    const { searchParams } = new URL(req.url, `http://${req.headers.host}`)
    const validationResult = getCafesQuerySchema.safeParse({
      partnerId,
      status: searchParams.get('status'),
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
    })

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      })
      return
    }

    const { listCafes } = await import('../../../lib/accounting/partner-service.js')
    const result = await listCafes(validationResult.data)

    res.json(result.data)
  } catch (error) {
    logger.error({ error, partnerId: req.partner!.id }, 'List cafes error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// GET /api/qetta/v1/partners/me/referral-links
// List referral links with stats
// ============================================
router.get('/me/referral-links', requirePermission('read:links'), async (req: Request, res: Response) => {
  try {
    const partnerId = req.partner!.id

    // Get all cafe IDs for this partner
    const cafes = await prisma.referralCafe.findMany({
      where: { partnerId },
      select: { id: true },
    })

    const cafeIds = cafes.map((c) => c.id)

    const { searchParams } = new URL(req.url, `http://${req.headers.host}`)
    const cafeId = searchParams.get('cafeId')
    const status = searchParams.get('status')
    const page = searchParams.get('page') || '1'
    const pageSize = searchParams.get('pageSize') || '20'

    // Validate cafeId belongs to partner
    if (cafeId && !cafeIds.includes(cafeId)) {
      res.status(403).json({ error: 'Cafe does not belong to this partner' })
      return
    }

    const validationResult = getReferralLinksQuerySchema.safeParse({
      cafeId: cafeId || undefined,
      status: status || undefined,
      page,
      pageSize,
    })

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      })
      return
    }

    const { listReferralLinks } = await import('../../../lib/accounting/partner-service.js')
    const result = await listReferralLinks(validationResult.data)

    res.json(result.data)
  } catch (error) {
    logger.error({ error, partnerId: req.partner!.id }, 'List referral links error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// GET /api/qetta/v1/partners/me/payouts
// Payout history
// ============================================
router.get('/me/payouts', requirePermission('read:payouts'), async (req: Request, res: Response) => {
  try {
    const partnerId = req.partner!.id

    const { searchParams } = new URL(req.url, `http://${req.headers.host}`)
    const validationResult = getPayoutsQuerySchema.safeParse({
      partnerId,
      status: searchParams.get('status'),
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
    })

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      })
      return
    }

    const { listPayouts } = await import('../../../lib/accounting/payout-service.js')
    const result = await listPayouts(validationResult.data)

    res.json(result.data)
  } catch (error) {
    logger.error({ error, partnerId: req.partner!.id }, 'List payouts error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// POST /api/qetta/v1/partners/me/external-posts/batch
// Batch upload external posts (blog, Instagram, YouTube)
// ============================================
router.post('/me/external-posts/batch', requirePermission('write:posts'), async (req: Request, res: Response) => {
  try {
    const partnerId = req.partner!.id

    // Validate input
    const validationResult = batchUploadPostsSchema.safeParse(req.body)

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      })
      return
    }

    const { posts } = validationResult.data

    // Verify all posts belong to partner's cafes
    const cafeIds = posts.map((p) => p.cafeId)
    const uniqueCafeIds = [...new Set(cafeIds)]

    const cafes = await prisma.referralCafe.findMany({
      where: {
        id: { in: uniqueCafeIds },
        partnerId,
      },
      select: { id: true },
    })

    if (cafes.length !== uniqueCafeIds.length) {
      res.status(403).json({ error: 'One or more cafes do not belong to this partner' })
      return
    }

    // Upsert posts (on conflict: update)
    const results = await Promise.allSettled(
      posts.map((post) =>
        prisma.externalPost.upsert({
          where: { url: post.url },
          update: {
            title: post.title,
            contentPreview: post.contentPreview,
            publishedAt: post.publishedAt,
            views: post.views,
            likes: post.likes,
            comments: post.comments,
          },
          create: {
            partnerId,
            cafeId: post.cafeId,
            postType: post.postType,
            url: post.url,
            title: post.title,
            contentPreview: post.contentPreview,
            publishedAt: post.publishedAt,
            views: post.views,
            likes: post.likes,
            comments: post.comments,
          },
        })
      )
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    res.status(201).json({
      success: true,
      data: {
        total: posts.length,
        successful,
        failed,
        ...(failed > 0 && {
          errors: results
            .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
            .map((r) => r.reason),
        }),
      },
    })
  } catch (error) {
    logger.error({ error, partnerId: req.partner!.id }, 'Batch upload posts error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// GET /api/qetta/v1/partners/me/stats
// Partner statistics (conversions, clicks, commission)
// ============================================
router.get('/me/stats', async (req: Request, res: Response) => {
  try {
    const partnerId = req.partner!.id

    const { getPartnerAttributionStats } = await import('../../../lib/accounting/referral-service.js')
    const { getPartnerPayoutStats } = await import('../../../lib/accounting/payout-service.js')

    const [attributionStats, payoutStats] = await Promise.all([
      getPartnerAttributionStats(partnerId),
      getPartnerPayoutStats(partnerId),
    ])

    res.json({
      attribution: attributionStats.data,
      payouts: payoutStats.data,
    })
  } catch (error) {
    logger.error({ error, partnerId: req.partner!.id }, 'Get stats error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
