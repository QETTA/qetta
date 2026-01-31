/**
 * Download API Route
 *
 * BATCH 5 STEP 5.1: 문서 다운로드 API
 *
 * POST: 새 문서 생성 및 다운로드
 * - enginePreset: 도메인 엔진 (TMS, SMART_FACTORY, AI_VOUCHER, GLOBAL_TENDER)
 * - documentType: 문서 유형 (daily_report, settlement_report 등)
 * - format?: 포맷 강제 지정 (DOCX, XLSX, PDF)
 *
 * Response: Binary file with proper headers for download
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateDocument, getMimeType } from '@/lib/document-generator'
import type { EnginePresetType } from '@/types/inbox'
import type { DocumentFormat } from '@/lib/document-generator/types'
import { logger } from '@/lib/api/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { enginePreset, documentType, format, metadata } = body as {
      enginePreset: EnginePresetType
      documentType: string
      format?: DocumentFormat
      metadata?: {
        companyName?: string
        reportDate?: string
        period?: { start: string; end: string }
      }
    }

    // 필수 파라미터 검증
    if (!enginePreset || !documentType) {
      return NextResponse.json(
        { success: false, error: 'enginePreset and documentType are required' },
        { status: 400 }
      )
    }

    // 문서 생성
    const result = await generateDocument({
      enginePreset,
      documentType,
      data: {},
      metadata: metadata || {
        companyName: 'QETTA',
        reportDate: new Date().toISOString().split('T')[0],
      },
    })

    // 포맷 강제 지정 시 변환 (추후 구현)
    // 현재는 도메인 설정에 따른 기본 포맷 사용
    const actualFormat = format || result.format
    const mimeType = getMimeType(actualFormat)

    // Buffer를 Uint8Array로 변환 (NextResponse 호환)
    const uint8Array = new Uint8Array(result.buffer)

    // 파일 응답 생성
    const response = new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(result.filename)}"`,
        'Content-Length': result.buffer.length.toString(),
        // 해시체인 인증 정보 (BATCH 5-4)
        'X-QETTA-Hash-Chain': result.hashChain,
        'X-QETTA-Document-Id': result.id,
        'X-QETTA-Domain-Engine': enginePreset,
        'X-QETTA-Document-Type': documentType,
        'X-QETTA-Generation-Time-Ms': result.metadata.generationTimeMs.toString(),
      },
    })

    return response
  } catch (error) {
    logger.error('Document download failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Document download failed',
      },
      { status: 500 }
    )
  }
}

/**
 * GET: 다운로드 가능한 문서 유형 조회
 */
export async function GET() {
  const { getAvailableDocumentTypes } = await import('@/lib/document-generator')

  return NextResponse.json({
    success: true,
    data: getAvailableDocumentTypes(),
  })
}
