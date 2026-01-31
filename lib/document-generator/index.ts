/**
 * QETTA Document Generator
 *
 * 도메인 엔진 기반 문서 자동 생성 시스템
 *
 * 핵심 지표:
 * - 문서 작성 시간 단축: 93.8% (8시간 → 30분)
 * - 문서 생성 속도: 45초/건
 * - 용어 매핑 정확도: 99.2%
 *
 * 지원 형식:
 * - DOCX: Microsoft Word (보고서, 제안서)
 * - XLSX: Microsoft Excel (측정기록, 정산서)
 * - PDF: Portable Document Format (분석 보고서)
 *
 * @module document-generator
 */

// Types
export * from './types'

// Generators
export { generateDocx } from './docx-generator'
export { generateXlsx } from './xlsx-generator'
export { generatePdf } from './pdf-generator'

// Hash Verification
export {
  generateSHA256,
  generateSHA256FromString,
  createHashChainEntry,
  verifyDocumentHash,
  verifyHashChain,
  formatHashChainId,
  addToHashChain,
  getHashChainEntry,
  getAllHashChainEntries,
  clearHashChain,
  type HashChainEntry,
  type HashVerificationResult,
} from './hash-verifier'

// Hash Chain DB (server-only — API routes에서만 직접 import)
// persistHashChainEntry, getHashChainEntryFromDB, getAllHashChainEntriesFromDB
// → import from '@/lib/document-generator/hash-chain-db'

// Cache (KidsMap LRU Optimization)
export {
  // 기본 캐시 함수
  cacheDocument,
  getDocumentFromCache,
  deleteFromCache,
  cleanupCache,
  getCacheStats,
  clearCache,
  // KidsMap 확장 함수
  createContentHash,
  getCacheKeyByContentHash,
  getDocumentWithSWR,
  getDocumentByContentHash,
  cleanupCacheStrict,
  getCacheStatsExtended,
  resetCacheStats,
  // KidsMap 핵심 래퍼
  getOrGenerateDocument,
  refreshCacheInBackground,
  // 상수
  SEMANTIC_CACHE_TTL_MS,
  STALE_TTL_MS,
  MAX_CACHE_ENTRIES,
  // 타입
  type CacheResult,
  type CacheStatsExtended,
  type CacheDocumentOptions,
  type GetOrGenerateOptions,
  type GetOrGenerateResult,
} from './cache'

// HTML Preview (BATCH 3: In-Web-View Preview)
export {
  generateHtmlPreview,
  getCachedPreview,
  cachePreview,
  clearExpiredPreviews,
} from './html-preview-generator'

export { PREVIEW_CACHE_TTL_MS } from './types'

// Domain Engine Adapter (Template → Document bridge)
export {
  adaptTemplateToDocumentRequest,
  type AdaptedDocumentRequest,
  type TemplateSectionData,
} from './domain-engine-adapter'

// Redis Semantic Cache (P2-2: L2 Cache Layer)
export {
  RedisSemanticCache,
  getRedisSemanticCache,
  createRedisSemanticCache,
  cachedDocumentToBuffer,
  createSemanticCacheKey,
  REDIS_SEMANTIC_CACHE_TTL,
  type RedisCachedDocument,
  type RedisCacheResult,
  type RedisCacheOptions,
  type RedisCacheStats,
} from './redis-semantic-cache'

// Hybrid Cache (P2-2: L1 Memory + L2 Redis)
export {
  HybridCache,
  getHybridCache,
  createHybridCache,
  type HybridCacheResult,
  type HybridCachedDocument,
  type HybridCacheSetOptions,
  type HybridGetOrGenerateOptions,
  type HybridGetOrGenerateResult,
  type HybridCacheStats,
} from './hybrid-cache'

// ============================================
// 통합 문서 생성 함수
// ============================================

import type {
  GenerateDocumentRequest,
  GeneratedDocument,
  DocumentFormat,
} from './types'
import { DOCUMENT_CONFIGS, FORMAT_MIME_TYPES, FORMAT_EXTENSIONS, DocumentGenerationError, DOC_ERROR_CODES } from './types'
import { generateDocx } from './docx-generator'
import { generateXlsx } from './xlsx-generator'
import { generatePdf } from './pdf-generator'
import { addToHashChain, formatHashChainId } from './hash-verifier'

// Error Handler
export {
  getErrorResponse,
  validateGenerateRequest,
  createInvalidDomainError,
  createInvalidTypeError,
  createGenerationError,
  createHashError,
  type DocumentErrorResponse,
} from './error-handler'

/**
 * 통합 문서 생성 함수
 *
 * 도메인 엔진과 문서 유형에 따라 적절한 형식으로 문서를 생성합니다.
 *
 * @example
 * ```ts
 * const result = await generateDocument({
 *   enginePreset: 'ENVIRONMENT',
 *   documentType: 'daily_report',
 *   metadata: {
 *     companyName: '주식회사 샘플',
 *     reportDate: '2026-01-22',
 *   },
 * })
 *
 * // 파일 저장 또는 응답 반환
 * fs.writeFileSync(result.filename, result.buffer)
 * ```
 */
export async function generateDocument(
  request: GenerateDocumentRequest
): Promise<GeneratedDocument> {
  const startTime = Date.now()
  const { enginePreset, documentType } = request

  // 도메인 검증
  const domainConfigs = DOCUMENT_CONFIGS[enginePreset]
  if (!domainConfigs) {
    throw new DocumentGenerationError(
      `Unknown domain engine: ${enginePreset}`,
      DOC_ERROR_CODES.INVALID_DOMAIN,
      enginePreset
    )
  }

  // 문서 유형 검증
  const docConfig = domainConfigs[documentType]
  if (!docConfig) {
    throw new DocumentGenerationError(
      `Unknown document type: ${documentType} for ${enginePreset}`,
      DOC_ERROR_CODES.INVALID_TYPE,
      enginePreset,
      documentType
    )
  }

  const format = docConfig.format
  let buffer: Buffer

  // 형식에 따른 생성
  switch (format) {
    case 'DOCX':
    case 'HWP': // HWP는 DOCX로 대체 (한글 전용 형식)
      buffer = await generateDocx(request)
      break

    case 'XLSX':
      buffer = await generateXlsx(request)
      break

    case 'PDF':
      buffer = await generatePdf(request)
      break

    default:
      throw new DocumentGenerationError(
        `Unsupported document format: ${format}`,
        DOC_ERROR_CODES.GENERATION_FAILED,
        enginePreset,
        documentType
      )
  }

  const generationTimeMs = Date.now() - startTime

  // 파일명 생성
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const filename = `${enginePreset}_${documentType}_${dateStr}${FORMAT_EXTENSIONS[format]}`

  // 해시체인 생성
  const hashEntry = addToHashChain(buffer, {
    documentId: `doc-${Date.now()}`,
    documentType,
    enginePreset,
    filename,
  })

  return {
    id: hashEntry.id,
    buffer,
    filename,
    mimeType: FORMAT_MIME_TYPES[format],
    format,
    hashChain: formatHashChainId(hashEntry),
    createdAt: new Date(),
    metadata: {
      enginePreset,
      documentType,
      title: docConfig.title,
      generationTimeMs,
      sizeBytes: buffer.length,
    },
  }
}

/**
 * 사용 가능한 문서 유형 조회
 */
export function getAvailableDocumentTypes(enginePreset?: string): Record<string, unknown> {
  if (enginePreset && DOCUMENT_CONFIGS[enginePreset as keyof typeof DOCUMENT_CONFIGS]) {
    return {
      domain: enginePreset,
      documentTypes: Object.entries(
        DOCUMENT_CONFIGS[enginePreset as keyof typeof DOCUMENT_CONFIGS]
      ).map(([key, config]) => ({
        key,
        ...config,
      })),
    }
  }

  return {
    domains: Object.entries(DOCUMENT_CONFIGS).map(([domain, types]) => ({
      domain,
      documentTypes: Object.entries(types).map(([key, config]) => ({
        key,
        ...config,
      })),
    })),
  }
}

/**
 * 문서 형식 MIME 타입 조회
 */
export function getMimeType(format: DocumentFormat): string {
  return FORMAT_MIME_TYPES[format]
}

/**
 * 문서 형식 확장자 조회
 */
export function getExtension(format: DocumentFormat): string {
  return FORMAT_EXTENSIONS[format]
}
