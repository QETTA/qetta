/**
 * Company Block Compression API
 *
 * POST /api/company-blocks/[id]/compress - Trigger token compression
 *
 * Recalculates compression stats using the Mem0 pattern.
 * Returns the compressed context string and updated stats.
 */

import { NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/api/middleware'
import {
  getCompanyBlockById,
  updateCompanyBlock,
  isCompanyBlockOwner,
  toInternalCompanyBlock,
} from '@/lib/block-engine/company-block-db'
import { CompanyBlockManager, getCompanyBlockManager } from '@/lib/block-engine/company-block'
import { DEFAULT_COMPANY_TOKENS } from '@/lib/block-engine/types'

/**
 * Extract companyBlockId from request URL
 */
function extractCompanyBlockId(request: Request): string | null {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  // URL: /api/company-blocks/[id]/compress
  const companyBlocksIndex = pathParts.indexOf('company-blocks')
  if (companyBlocksIndex !== -1 && pathParts[companyBlocksIndex + 1]) {
    return pathParts[companyBlocksIndex + 1]
  }
  return null
}

/**
 * POST /api/company-blocks/[id]/compress
 *
 * Triggers token compression for the CompanyBlock.
 * Useful after bulk fact updates or profile changes.
 *
 * Query params:
 * - maxTokens: Target token budget (default: 1500)
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

    const companyBlockId = extractCompanyBlockId(request)
    if (!companyBlockId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'CompanyBlock ID가 필요합니다' } },
        { status: 400 }
      )
    }

    // Check ownership
    const isOwner = await isCompanyBlockOwner(companyBlockId, userId)
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'CompanyBlock을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    const url = new URL(request.url)
    const maxTokensParam = url.searchParams.get('maxTokens')
    const maxTokens = maxTokensParam
      ? Math.max(100, Math.min(8000, parseInt(maxTokensParam, 10)))
      : DEFAULT_COMPANY_TOKENS

    // Get current block from DB
    const block = await getCompanyBlockById(companyBlockId)
    if (!block) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'CompanyBlock을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // Use CompanyBlockManager to calculate compression
    const manager = new CompanyBlockManager()
    const tempBlock = manager.create(block.profile)

    // Add all facts to temp block
    const internalBlock = toInternalCompanyBlock(block)
    for (const fact of internalBlock.facts) {
      manager.addFact(tempBlock.companyId, {
        type: fact.type,
        content: fact.content,
        confidence: fact.confidence,
        source: fact.source,
        relatedId: fact.relatedId,
        expiresAt: fact.expiresAt,
      })
    }

    // Get updated block with compression stats
    const updatedTempBlock = manager.get(tempBlock.companyId)
    if (!updatedTempBlock) {
      return NextResponse.json(
        { success: false, error: { code: 'COMPRESSION_ERROR', message: '압축 처리 중 오류가 발생했습니다' } },
        { status: 500 }
      )
    }

    // Get compressed context string
    const compressedContext = manager.getCompressedContext(tempBlock.companyId, maxTokens)

    // Update DB with new compression stats
    await updateCompanyBlock(companyBlockId, {
      compression: updatedTempBlock.compression,
    })

    return NextResponse.json({
      success: true,
      data: {
        compressedContext,
        compression: updatedTempBlock.compression,
        tokenBudget: maxTokens,
        meetsTarget: updatedTempBlock.compression.compressedTokens <= maxTokens,
      },
      meta: {
        factCount: internalBlock.facts.length,
        compressionRatio: `${updatedTempBlock.compression.ratio}%`,
        savedTokens: updatedTempBlock.compression.originalTokens - updatedTempBlock.compression.compressedTokens,
      },
    })
  },
  { endpoint: 'default' }
)

/**
 * GET /api/company-blocks/[id]/compress
 *
 * Get current compressed context without recalculating.
 * Useful for quick access to the compressed representation.
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

    const companyBlockId = extractCompanyBlockId(request)
    if (!companyBlockId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'CompanyBlock ID가 필요합니다' } },
        { status: 400 }
      )
    }

    // Check ownership
    const isOwner = await isCompanyBlockOwner(companyBlockId, userId)
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'CompanyBlock을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    const url = new URL(request.url)
    const maxTokensParam = url.searchParams.get('maxTokens')
    const maxTokens = maxTokensParam
      ? Math.max(100, Math.min(8000, parseInt(maxTokensParam, 10)))
      : DEFAULT_COMPANY_TOKENS

    // Get current block from DB
    const block = await getCompanyBlockById(companyBlockId)
    if (!block) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'CompanyBlock을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // Use CompanyBlockManager to generate compressed context
    const manager = new CompanyBlockManager()
    const tempBlock = manager.create(block.profile)

    // Add all facts
    const internalBlock = toInternalCompanyBlock(block)
    for (const fact of internalBlock.facts) {
      manager.addFact(tempBlock.companyId, {
        type: fact.type,
        content: fact.content,
        confidence: fact.confidence,
        source: fact.source,
        relatedId: fact.relatedId,
        expiresAt: fact.expiresAt,
      })
    }

    const compressedContext = manager.getCompressedContext(tempBlock.companyId, maxTokens)

    return NextResponse.json({
      success: true,
      data: {
        compressedContext,
        compression: {
          originalTokens: block.originalTokens,
          compressedTokens: block.compressedTokens,
          ratio: block.compressionRatio,
        },
        lastCompressedAt: block.lastCompressedAt?.toISOString() ?? null,
      },
    })
  },
  { endpoint: 'default' }
)
