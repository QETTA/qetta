/**
 * Validation Schemas for Accounting Module
 * Using Zod for type-safe runtime validation
 * 
 * @see Plan: Phase 2 - Backend Services & Authentication
 */

import { z } from 'zod'

// ============================================
// Partner Schemas
// ============================================

export const createPartnerSchema = z.object({
  orgId: z.string().min(1, 'Organization ID is required'),
  orgName: z.string().min(1, 'Organization name is required'),
  businessNumber: z.string().regex(/^\d{3}-\d{2}-\d{5}$/, 'Invalid business number format (xxx-xx-xxxxx)'),
  contactEmail: z.string().email('Invalid email address'),
  contactName: z.string().min(1, 'Contact name is required')
})

export const updatePartnerSchema = z.object({
  orgName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactName: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional()
})

// ============================================
// Cafe Schemas
// ============================================

export const createCafeSchema = z.object({
  partnerId: z.string().cuid('Invalid partner ID'),
  cafeName: z.string().min(1, 'Cafe name is required'),
  commissionRate: z.number()
    .min(0, 'Commission rate must be positive')
    .max(1, 'Commission rate must be <= 100%')
    .transform(val => val > 1 ? val / 100 : val) // Convert percentage if needed
})

export const updateCafeSchema = z.object({
  cafeName: z.string().min(1).optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
})

// ============================================
// API Key Schemas
// ============================================

export const createApiKeySchema = z.object({
  partnerId: z.string().cuid(),
  permissions: z.array(z.enum([
    'read:cafes',
    'read:links',
    'read:payouts',
    'write:posts'
  ])).min(1, 'At least one permission required'),
  rateLimit: z.number().int().min(10).max(10000).default(100),
  expiresInDays: z.number().int().min(1).max(365).default(365)
})

// ============================================
// Referral Link Schemas
// ============================================

export const createReferralLinkSchema = z.object({
  cafeId: z.string().cuid(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  expiresInDays: z.number().int().min(1).max(365).default(365)
})

// ============================================
// Payout Schemas
// ============================================

export const previewPayoutSchema = z.object({
  partnerId: z.string().cuid(),
  periodStart: z.string().datetime().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  periodEnd: z.string().datetime().or(z.date()).transform(val =>
    typeof val === 'string' ? new Date(val) : val
  )
}).refine(
  data => data.periodEnd > data.periodStart,
  { message: 'Period end must be after period start' }
)

export const approvePayoutSchema = z.object({
  payoutId: z.string().cuid(),
  snapshotHash: z.string().min(1, 'Snapshot hash required for verification'),
  approvedBy: z.string().email(),
  reason: z.string().optional()
})

export const adjustPayoutSchema = z.object({
  originalPayoutId: z.string().cuid(),
  adjustmentAmount: z.number().refine(val => val !== 0, {
    message: 'Adjustment amount cannot be zero'
  }),
  reason: z.string().min(10, 'Adjustment reason must be at least 10 characters'),
  approvedBy: z.string().email()
})

// ============================================
// External Post Schemas
// ============================================

export const batchUploadPostsSchema = z.object({
  posts: z.array(z.object({
    cafeId: z.string().cuid(),
    postType: z.enum(['BLOG', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK']),
    url: z.string().url(),
    title: z.string().min(1),
    contentPreview: z.string().max(500).optional(),
    publishedAt: z.string().datetime().or(z.date()).transform(val =>
      typeof val === 'string' ? new Date(val) : val
    ),
    views: z.number().int().nonnegative().optional(),
    likes: z.number().int().nonnegative().optional(),
    comments: z.number().int().nonnegative().optional()
  })).min(1, 'At least one post required').max(100, 'Maximum 100 posts per batch')
})

// ============================================
// Query Parameter Schemas
// ============================================

export const getCafesQuerySchema = z.object({
  partnerId: z.string().cuid(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  pageSize: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20')
})

export const getReferralLinksQuerySchema = z.object({
  cafeId: z.string().cuid().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'REVOKED']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  pageSize: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20')
})

export const getPayoutsQuerySchema = z.object({
  partnerId: z.string().cuid(),
  status: z.enum(['DRAFT', 'APPROVED', 'PROCESSING', 'PAID', 'ADJUSTMENT_PENDING', 'ADJUSTED', 'FAILED']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  pageSize: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20')
})

// ============================================
// Type Exports (inferred from schemas)
// ============================================

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>
export type CreateCafeInput = z.infer<typeof createCafeSchema>
export type UpdateCafeInput = z.infer<typeof updateCafeSchema>
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
export type CreateReferralLinkInput = z.infer<typeof createReferralLinkSchema>
export type PreviewPayoutInput = z.infer<typeof previewPayoutSchema>
export type ApprovePayoutInput = z.infer<typeof approvePayoutSchema>
export type AdjustPayoutInput = z.infer<typeof adjustPayoutSchema>
export type BatchUploadPostsInput = z.infer<typeof batchUploadPostsSchema>
export type GetCafesQuery = z.infer<typeof getCafesQuerySchema>
export type GetReferralLinksQuery = z.infer<typeof getReferralLinksQuerySchema>
export type GetPayoutsQuery = z.infer<typeof getPayoutsQuerySchema>
