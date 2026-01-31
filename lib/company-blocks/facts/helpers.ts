/**
 * Company Facts Helpers
 *
 * CompanyBlock Fact 관리를 위한 유틸리티 함수
 *
 * @module lib/company-blocks/facts/helpers
 */

import { companyFactTypeEnum } from '@/lib/api/schemas'
import {
  getCompanyBlockById,
  toInternalCompanyFact,
  updateCompanyBlock,
} from '@/lib/block-engine/company-block-db'
import { CompanyBlockManager } from '@/lib/block-engine/company-block'
import type { CompanyFactType } from '@/lib/block-engine/types'

// =============================================================================
// URL Parsing
// =============================================================================

/**
 * Request URL에서 companyBlockId 추출
 *
 * URL 형식: /api/company-blocks/[id]/facts
 */
export function extractCompanyBlockId(request: Request): string | null {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const companyBlocksIndex = pathParts.indexOf('company-blocks')

  if (companyBlocksIndex !== -1 && pathParts[companyBlocksIndex + 1]) {
    return pathParts[companyBlocksIndex + 1]
  }

  return null
}

/**
 * URL에서 factId 쿼리 파라미터 추출
 */
export function extractFactId(request: Request): string | null {
  const url = new URL(request.url)
  return url.searchParams.get('factId')
}

// =============================================================================
// Type Filter Parsing
// =============================================================================

/**
 * type 쿼리 파라미터 파싱
 *
 * @param typeParam - 쉼표로 구분된 타입 문자열 (e.g., "rejection_pattern,success_pattern")
 * @returns 유효한 타입 배열 또는 undefined
 */
export function parseTypeFilter(typeParam: string | null): CompanyFactType[] | undefined {
  if (!typeParam) {
    return undefined
  }

  const types = typeParam.split(',').map((t) => t.trim())
  const validTypes = types.filter((t) =>
    companyFactTypeEnum.safeParse(t).success
  ) as CompanyFactType[]

  return validTypes.length > 0 ? validTypes : undefined
}

// =============================================================================
// Compression Stats
// =============================================================================

/**
 * CompanyBlock의 압축 통계 재계산 및 업데이트
 *
 * Fact 추가/수정/삭제 후 호출하여 compression 필드 갱신
 */
export async function updateCompressionStats(companyBlockId: string): Promise<void> {
  const block = await getCompanyBlockById(companyBlockId)
  if (!block) return

  const manager = new CompanyBlockManager()
  const tempBlock = manager.create(block.profile)

  // 모든 fact를 임시 블록에 추가하여 정확한 압축률 계산
  for (const fact of block.facts) {
    manager.addFact(tempBlock.companyId, {
      type: toInternalCompanyFact(fact).type,
      content: fact.content,
      confidence: fact.confidence,
      source: toInternalCompanyFact(fact).source,
      relatedId: fact.relatedId ?? undefined,
      expiresAt: fact.expiresAt?.toISOString(),
    })
  }

  const updatedBlock = manager.get(tempBlock.companyId)
  if (updatedBlock) {
    await updateCompanyBlock(companyBlockId, {
      compression: updatedBlock.compression,
    })
  }
}
