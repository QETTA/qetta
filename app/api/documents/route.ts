/**
 * Documents API
 *
 * @description
 * 문서 목록 및 상세 정보 조회 API
 *
 * GET /api/documents - 문서 목록 조회 (쿼리 파라미터로 필터링)
 * GET /api/documents?id={id} - 특정 문서 조회
 *
 * @example
 * ```ts
 * // 전체 문서 목록 조회
 * const response = await fetch('/api/documents')
 * const { documents } = await response.json()
 *
 * // 특정 문서 조회
 * const response = await fetch('/api/documents?id=doc-1')
 * const { document } = await response.json()
 *
 * // 도메인별 필터링
 * const response = await fetch('/api/documents?domain=TMS')
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { documentsRequestSchema } from '@/lib/api/schemas'
import { createErrorResponse } from '@/lib/api/errors'
import { logger } from '@/lib/api/logger'
import {
  generateMockDocuments,
  filterDocuments,
  findDocumentById,
  calculateStats,
} from '@/lib/documents'
import type { EnginePresetType } from '@/types/inbox'
import type {
  DocumentStatus,
  DocumentType,
  DocumentsResponse,
} from '@/types/documents'

// =============================================================================
// GET - 문서 목록/상세 조회
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<DocumentsResponse>> {
  try {
    const { searchParams } = new URL(request.url)

    // Convert query params to object for validation
    const queryParams = {
      documentId: searchParams.get('id') || undefined,
      domain: searchParams.get('domain') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
    }

    // Zod validation
    const result = documentsRequestSchema.safeParse(queryParams)
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: createErrorResponse('VALIDATION_ERROR', result.error.issues[0].message).error,
        },
        { status: 400 }
      )
    }

    const { documentId: id, domain, status, type } = result.data

    // Mock 데이터 생성 (실제 구현 시 DB 조회)
    const allDocuments = generateMockDocuments()

    // 특정 문서 조회
    if (id) {
      const document = findDocumentById(allDocuments, id)

      if (!document) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DOCUMENT_NOT_FOUND',
              message: `Document not found: ${id}`,
            },
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        document,
      })
    }

    // 필터링
    const documents = filterDocuments(allDocuments, {
      domain: domain as EnginePresetType | undefined,
      status: status as DocumentStatus | undefined,
      type: type as DocumentType | undefined,
    })

    // 통계 계산
    const stats = calculateStats(documents)

    return NextResponse.json({
      success: true,
      data: {
        documents,
        total: documents.length,
        ...stats,
      },
    })
  } catch (error) {
    logger.error('[API] GET /api/documents error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    )
  }
}
