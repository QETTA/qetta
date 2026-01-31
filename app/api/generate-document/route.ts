import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import type { EnginePresetType } from '@/types/inbox'
import { logger } from '@/lib/api/logger'
import {
  generateDocument,
  getAvailableDocumentTypes,
  getErrorResponse,
  validateGenerateRequest,
  type GenerateDocumentRequest,
  type GeneratedDocument,
} from '@/lib/document-generator'
import { cacheDocument, cleanupCache } from '@/lib/document-generator/cache'
import { withApiMiddleware } from '@/lib/api'

/**
 * DB에 Document + HashChainEntry 영속화
 * Document를 먼저 생성하고, HashChainEntry를 연결
 *
 * @param enginePreset - 도메인 엔진 타입
 * @param documentType - 문서 유형
 * @param result - 생성된 문서 결과
 * @param userId - 사용자 ID (인증된 경우), 미인증 시 'anonymous'
 */
async function persistDocumentRecord(
  enginePreset: EnginePresetType,
  documentType: string,
  result: GeneratedDocument,
  userId: string = 'anonymous'
): Promise<void> {
  const { db } = await import('@/lib/db')
  const { getHashChainEntry } = await import('@/lib/document-generator/hash-verifier')
  const { persistHashChainEntry } = await import('@/lib/document-generator/hash-chain-db')

  const docId = result.id

  // 1. Document 레코드 생성
  await db.document.create({
    data: {
      id: docId,
      userId,
      domainEngine: enginePreset as 'MANUFACTURING' | 'ENVIRONMENT' | 'DIGITAL' | 'EXPORT' | 'FINANCE' | 'STARTUP',
      documentType,
      title: result.metadata.title,
      content: {
        filename: result.filename,
        format: result.format,
        sizeBytes: result.metadata.sizeBytes,
        generationTimeMs: result.metadata.generationTimeMs,
      },
      status: 'GENERATED',
      generatedAt: result.createdAt,
    },
  })

  // 2. HashChainEntry 영속화 (Document FK 충족)
  const hashEntry = getHashChainEntry(docId)
  if (hashEntry) {
    await persistHashChainEntry(hashEntry, docId)
  }
}

/**
 * Document Generation API Route
 *
 * QETTA 도메인 엔진 기반 문서 생성 API
 *
 * 핵심 지표:
 * - 문서 생성 속도: 45초/건 (평균)
 * - 문서 작성 시간 단축: 93.8% (8시간 → 30분)
 *
 * POST /api/generate-document
 * Body: { enginePreset, documentType, data?, metadata? }
 *
 * GET /api/generate-document?domain={domain}
 * Returns: Available document types for domain
 */

interface ArtifactResult {
  id: string
  type: 'document' | 'report' | 'analysis'
  title: string
  format: 'DOCX' | 'XLSX' | 'PDF' | 'HWP'
  previewUrl: string
  downloadUrl: string
  hashChain: string
  verified: boolean
  createdAt: number
  sizeBytes: number
  metadata: {
    enginePreset: EnginePresetType
    documentType: string
    generationTimeMs: number
  }
}

export const POST = withApiMiddleware<true>(async (request: Request, session: Session | null) => {
  try {
    const body = await request.json()

    // 요청 검증 (throws DocumentGenerationError on failure)
    validateGenerateRequest(body)

    const { enginePreset, documentType, metadata } = body as GenerateDocumentRequest

    logger.debug(`[Document Generation] Starting: ${enginePreset}/${documentType}`)

    // 실제 문서 생성
    const result = await generateDocument({
      enginePreset,
      documentType,
      metadata,
    })

    // 캐시에 저장 (다운로드용)
    cacheDocument(result.id, result.buffer, result.mimeType, result.filename)

    // 주기적 캐시 정리
    cleanupCache()

    // 세션에서 userId 추출 (미인증 시 'anonymous')
    const userId = session?.user?.id || 'anonymous'

    // DB에 Document 레코드 영속화 (fire-and-forget)
    persistDocumentRecord(enginePreset, documentType, result, userId).catch((err) => {
      logger.warn('[Document Generation] DB persist skipped:', err)
    })

    // Artifact 결과 생성
    const artifact: ArtifactResult = {
      id: result.id,
      type: result.metadata.title.includes('분석')
        ? 'analysis'
        : result.metadata.title.includes('보고서')
          ? 'report'
          : 'document',
      title: result.metadata.title,
      format: result.format,
      previewUrl: `/api/generate-document/preview/${result.id}`,
      downloadUrl: `/api/generate-document/download/${result.id}`,
      hashChain: result.hashChain,
      verified: true,
      createdAt: result.createdAt.getTime(),
      sizeBytes: result.metadata.sizeBytes,
      metadata: {
        enginePreset: result.metadata.enginePreset,
        documentType: result.metadata.documentType,
        generationTimeMs: result.metadata.generationTimeMs,
      },
    }

    logger.debug(
      `[Document Generation] Completed: ${result.filename}`,
      `Format: ${result.format}`,
      `Size: ${(result.metadata.sizeBytes / 1024).toFixed(1)} KB`,
      `Time: ${result.metadata.generationTimeMs}ms`,
      `Hash: ${result.hashChain}`
    )

    return NextResponse.json({
      success: true,
      artifact,
      message: `${result.metadata.title} 생성 완료`,
    })
  } catch (error) {
    logger.error('[Document Generation Error]', error)
    // DocumentGenerationError → 적절한 HTTP 상태 코드로 변환
    return getErrorResponse(error)
  }
}, { endpoint: 'generate-document', optionalAuth: true })

// GET: 사용 가능한 문서 유형 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')

  const types = getAvailableDocumentTypes(domain || undefined)
  return NextResponse.json(types)
}

