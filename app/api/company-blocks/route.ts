/**
 * Company Blocks API - List & Create
 *
 * POST /api/company-blocks - Create new CompanyBlock
 * GET /api/company-blocks - List user's CompanyBlocks
 */

import { NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/api/middleware'
import { createCompanyBlockRequestSchema } from '@/lib/api/schemas'
import {
  createCompanyBlock,
  getCompanyBlocksByUserId,
  toInternalCompanyBlock,
} from '@/lib/block-engine/company-block-db'
import { CompanyBlockManager } from '@/lib/block-engine/company-block'
import type { IndustryBlock } from '@prisma/client'
import type { CompanyProfile } from '@/lib/skill-engine/types'

/**
 * GET /api/company-blocks
 * List all CompanyBlocks for the authenticated user
 */
export const GET = withApiMiddleware(
  async (_request, session) => {
    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
      )
    }

    const blocks = await getCompanyBlocksByUserId(userId)

    return NextResponse.json({
      success: true,
      data: blocks.map(block => ({
        id: block.id,
        companyName: block.companyName,
        businessNumber: block.businessNumber,
        industryBlock: block.industryBlock,
        compression: {
          originalTokens: block.originalTokens,
          compressedTokens: block.compressedTokens,
          ratio: block.compressionRatio,
        },
        factCount: block.facts.length,
        createdAt: block.createdAt.toISOString(),
        updatedAt: block.updatedAt.toISOString(),
      })),
      meta: {
        total: blocks.length,
      },
    })
  },
  { endpoint: 'default' }
)

/**
 * POST /api/company-blocks
 * Create a new CompanyBlock
 *
 * P0-FIX-4: 활성 구독 필수
 */
export const POST = withApiMiddleware(
  async (request, session) => {
    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
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

    const validation = createCompanyBlockRequestSchema.safeParse(body)
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
    // Zod schema validates the structure - cast is safe since schema mirrors CompanyProfile
    // The schema enforces FundingSource and ProgramType enums for type safety
    const profile = profileData as CompanyProfile

    // Calculate compression using the manager
    const manager = new CompanyBlockManager()
    const tempBlock = manager.create(profile)
    const compression = tempBlock.compression

    // Create in database
    const created = await createCompanyBlock({
      userId,
      companyName,
      businessNumber,
      industryBlock: industryBlock as IndustryBlock,
      profile,
      compression,
    })

    // Extract initial facts from profile and store them
    const internalBlock = toInternalCompanyBlock(created)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: created.id,
          companyName: created.companyName,
          businessNumber: created.businessNumber,
          industryBlock: created.industryBlock,
          compression: {
            originalTokens: created.originalTokens,
            compressedTokens: created.compressedTokens,
            ratio: created.compressionRatio,
          },
          profile: created.profile,
          facts: internalBlock.facts,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  },
  { endpoint: 'default', requireActiveSubscription: true }
)
