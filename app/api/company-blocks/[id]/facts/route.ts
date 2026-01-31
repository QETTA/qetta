/**
 * Company Facts API - Fact Management
 *
 * GET /api/company-blocks/[id]/facts - List facts (with optional type filter)
 * POST /api/company-blocks/[id]/facts - Add new fact
 * PATCH /api/company-blocks/[id]/facts?factId=xxx - Update specific fact
 * DELETE /api/company-blocks/[id]/facts?factId=xxx - Delete specific fact
 */

import { NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/api/middleware'
import {
  createCompanyFactRequestSchema,
  updateCompanyFactRequestSchema,
} from '@/lib/api/schemas'
import {
  getCompanyFacts,
  addCompanyFact,
  updateCompanyFact,
  deleteCompanyFact,
  cleanupExpiredFacts,
  isCompanyBlockOwner,
  toInternalCompanyFact,
} from '@/lib/block-engine/company-block-db'
import {
  extractCompanyBlockId,
  extractFactId,
  parseTypeFilter,
  updateCompressionStats,
} from '@/lib/company-blocks/facts'
import type { CompanyFactType } from '@/lib/block-engine/types'

// =============================================================================
// Error Response Helpers
// =============================================================================

const errors = {
  unauthorized: () =>
    NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 }
    ),
  invalidId: () =>
    NextResponse.json(
      { success: false, error: { code: 'INVALID_ID', message: 'CompanyBlock ID가 필요합니다' } },
      { status: 400 }
    ),
  notFound: () =>
    NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'CompanyBlock을 찾을 수 없습니다' } },
      { status: 404 }
    ),
  invalidJson: () =>
    NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: '유효하지 않은 JSON입니다' } },
      { status: 400 }
    ),
  factIdRequired: () =>
    NextResponse.json(
      { success: false, error: { code: 'INVALID_ID', message: 'factId 쿼리 파라미터가 필요합니다' } },
      { status: 400 }
    ),
  factNotFound: () =>
    NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Fact를 찾을 수 없습니다' } },
      { status: 404 }
    ),
  validation: (issues: unknown) =>
    NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '요청 데이터가 유효하지 않습니다',
          details: issues,
        },
      },
      { status: 400 }
    ),
}

// =============================================================================
// GET /api/company-blocks/[id]/facts
// =============================================================================

export const GET = withApiMiddleware(
  async (request, session) => {
    const userId = session.user?.id
    if (!userId) return errors.unauthorized()

    const companyBlockId = extractCompanyBlockId(request)
    if (!companyBlockId) return errors.invalidId()

    const isOwner = await isCompanyBlockOwner(companyBlockId, userId)
    if (!isOwner) return errors.notFound()

    const url = new URL(request.url)

    // Cleanup expired facts if requested
    if (url.searchParams.get('cleanup') === 'true') {
      const removed = await cleanupExpiredFacts(companyBlockId)
      if (removed > 0) {
        await updateCompressionStats(companyBlockId)
      }
    }

    // Parse type filter
    const typeFilter = parseTypeFilter(url.searchParams.get('type'))
    const facts = await getCompanyFacts(companyBlockId, typeFilter)

    return NextResponse.json({
      success: true,
      data: facts.map(toInternalCompanyFact),
      meta: {
        total: facts.length,
        filter: typeFilter ?? null,
      },
    })
  },
  { endpoint: 'default' }
)

// =============================================================================
// POST /api/company-blocks/[id]/facts
// =============================================================================

export const POST = withApiMiddleware(
  async (request, session) => {
    const userId = session.user?.id
    if (!userId) return errors.unauthorized()

    const companyBlockId = extractCompanyBlockId(request)
    if (!companyBlockId) return errors.invalidId()

    const isOwner = await isCompanyBlockOwner(companyBlockId, userId)
    if (!isOwner) return errors.notFound()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errors.invalidJson()
    }

    const validation = createCompanyFactRequestSchema.safeParse(body)
    if (!validation.success) {
      return errors.validation(validation.error.issues)
    }

    const { type, content, confidence, source, relatedId, expiresAt } = validation.data

    const created = await addCompanyFact({
      companyBlockId,
      type: type as CompanyFactType,
      content,
      confidence,
      source: source as 'user_input' | 'document_parsed' | 'email_detected' | 'ai_inferred',
      relatedId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    })

    await updateCompressionStats(companyBlockId)

    return NextResponse.json(
      { success: true, data: toInternalCompanyFact(created) },
      { status: 201 }
    )
  },
  { endpoint: 'default' }
)

// =============================================================================
// PATCH /api/company-blocks/[id]/facts?factId=xxx
// =============================================================================

export const PATCH = withApiMiddleware(
  async (request, session) => {
    const userId = session.user?.id
    if (!userId) return errors.unauthorized()

    const companyBlockId = extractCompanyBlockId(request)
    if (!companyBlockId) return errors.invalidId()

    const isOwner = await isCompanyBlockOwner(companyBlockId, userId)
    if (!isOwner) return errors.notFound()

    const factId = extractFactId(request)
    if (!factId) return errors.factIdRequired()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errors.invalidJson()
    }

    const validation = updateCompanyFactRequestSchema.safeParse(body)
    if (!validation.success) {
      return errors.validation(validation.error.issues)
    }

    const { content, confidence, expiresAt } = validation.data

    try {
      const updated = await updateCompanyFact(factId, {
        content,
        confidence,
        expiresAt: expiresAt === null ? null : expiresAt ? new Date(expiresAt) : undefined,
      })

      await updateCompressionStats(companyBlockId)

      return NextResponse.json({
        success: true,
        data: toInternalCompanyFact(updated),
      })
    } catch {
      return errors.factNotFound()
    }
  },
  { endpoint: 'default' }
)

// =============================================================================
// DELETE /api/company-blocks/[id]/facts?factId=xxx
// =============================================================================

export const DELETE = withApiMiddleware(
  async (request, session) => {
    const userId = session.user?.id
    if (!userId) return errors.unauthorized()

    const companyBlockId = extractCompanyBlockId(request)
    if (!companyBlockId) return errors.invalidId()

    const isOwner = await isCompanyBlockOwner(companyBlockId, userId)
    if (!isOwner) return errors.notFound()

    const factId = extractFactId(request)
    if (!factId) return errors.factIdRequired()

    const deleted = await deleteCompanyFact(factId)
    if (!deleted) return errors.factNotFound()

    await updateCompressionStats(companyBlockId)

    return NextResponse.json({
      success: true,
      message: 'Fact가 삭제되었습니다',
    })
  },
  { endpoint: 'default' }
)
