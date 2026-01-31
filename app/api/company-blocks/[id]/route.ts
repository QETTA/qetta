/**
 * Company Block API - Single Resource Operations
 *
 * GET /api/company-blocks/[id] - Get CompanyBlock details
 * PUT /api/company-blocks/[id] - Update CompanyBlock
 * DELETE /api/company-blocks/[id] - Delete CompanyBlock
 */

import { NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/api/middleware'
import { updateCompanyBlockRequestSchema } from '@/lib/api/schemas'
import {
  getCompanyBlockById,
  updateCompanyBlock,
  deleteCompanyBlock,
  isCompanyBlockOwner,
  toInternalCompanyBlock,
} from '@/lib/block-engine/company-block-db'
import { CompanyBlockManager } from '@/lib/block-engine/company-block'
import type { IndustryBlock } from '@prisma/client'
import type { CompanyProfile } from '@/lib/skill-engine/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/company-blocks/[id]
 * Get a single CompanyBlock with all facts
 */
export const GET = withApiMiddleware(
  async (request, session) => {
    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
      )
    }

    // Extract ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'ID가 필요합니다' } },
        { status: 400 }
      )
    }

    // Check ownership
    const isOwner = await isCompanyBlockOwner(id, userId)
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'CompanyBlock을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    const block = await getCompanyBlockById(id)
    if (!block) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'CompanyBlock을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    const internal = toInternalCompanyBlock(block)

    return NextResponse.json({
      success: true,
      data: {
        id: block.id,
        companyName: block.companyName,
        businessNumber: block.businessNumber,
        industryBlock: block.industryBlock,
        profile: block.profile,
        facts: internal.facts,
        compression: internal.compression,
        createdAt: block.createdAt.toISOString(),
        updatedAt: block.updatedAt.toISOString(),
      },
    })
  },
  { endpoint: 'default' }
)

/**
 * PUT /api/company-blocks/[id]
 * Update a CompanyBlock
 */
export const PUT = withApiMiddleware(
  async (request, session) => {
    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
      )
    }

    // Extract ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'ID가 필요합니다' } },
        { status: 400 }
      )
    }

    // Check ownership
    const isOwner = await isCompanyBlockOwner(id, userId)
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'CompanyBlock을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: '유효하지 않은 JSON입니다' } },
        { status: 400 }
      )
    }

    const validation = updateCompanyBlockRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '요청 데이터가 유효하지 않습니다',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { companyName, businessNumber, industryBlock, profile: profileData } = validation.data
    // Cast validated data to CompanyProfile if present
    const profile = profileData ? (profileData as unknown as CompanyProfile) : undefined

    // Recalculate compression if profile is updated
    let compression = undefined
    if (profile) {
      const manager = new CompanyBlockManager()
      const tempBlock = manager.create(profile)
      compression = tempBlock.compression
    }

    const updated = await updateCompanyBlock(id, {
      companyName,
      businessNumber,
      industryBlock: industryBlock as IndustryBlock | undefined,
      profile,
      compression,
    })

    const internal = toInternalCompanyBlock(updated)

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        companyName: updated.companyName,
        businessNumber: updated.businessNumber,
        industryBlock: updated.industryBlock,
        profile: updated.profile,
        facts: internal.facts,
        compression: internal.compression,
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  },
  { endpoint: 'default' }
)

/**
 * DELETE /api/company-blocks/[id]
 * Delete a CompanyBlock (cascades to facts)
 */
export const DELETE = withApiMiddleware(
  async (request, session) => {
    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
      )
    }

    // Extract ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'ID가 필요합니다' } },
        { status: 400 }
      )
    }

    // Check ownership
    const isOwner = await isCompanyBlockOwner(id, userId)
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'CompanyBlock을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    const deleted = await deleteCompanyBlock(id)
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: { code: 'DELETE_FAILED', message: '삭제에 실패했습니다' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'CompanyBlock이 삭제되었습니다',
    })
  },
  { endpoint: 'default' }
)
