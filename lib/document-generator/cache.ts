/**
 * Document Cache - KidsMap LRU Optimization Pattern
 *
 * 생성된 문서를 임시 저장하는 메모리 캐시
 * KidsMap getOrGenerateDocument 패턴 적용:
 * - contentHash + programId 기반 캐시 키
 * - LRU 방출 전략 (max 100 entries, TTL 7일)
 * - Stale-While-Revalidate 패턴
 *
 * 예상 효과: API 비용 70% 절감 (중복 요청 제거)
 *
 * 프로덕션에서는 Redis 또는 S3 사용 권장
 *
 * @module document-generator/cache
 */

import { createHash } from 'crypto'

interface CachedDocument {
  buffer: Buffer
  mimeType: string
  filename: string
  expiresAt: number
  /** KidsMap: 마지막 접근 시간 (LRU 구현) */
  lastAccessedAt: number
  /** KidsMap: 콘텐츠 해시 (중복 감지) */
  contentHash?: string
  /** KidsMap: 생성 요청 메타데이터 */
  requestMeta?: {
    enginePreset: string
    documentType: string
    programId?: string
  }
}

/**
 * KidsMap: 캐시 조회 결과 (SWR 패턴)
 */
export interface CacheResult<T> {
  data: T | null
  isStale: boolean
  hitType: 'hit' | 'stale' | 'miss'
}

/**
 * KidsMap: 캐시 통계 확장
 */
export interface CacheStatsExtended {
  count: number
  totalSizeBytes: number
  hitCount: number
  missCount: number
  staleHitCount: number
  hitRate: number
}

// 메모리 캐시
const documentCache = new Map<string, CachedDocument>()

// KidsMap: 콘텐츠 해시 → 캐시 키 역참조 (중복 요청 감지)
const contentHashIndex = new Map<string, string>()

// 캐시 TTL: 1시간 (기본 - 버퍼 캐시용)
const CACHE_TTL_MS = 60 * 60 * 1000

// KidsMap: 시맨틱 캐시 TTL: 7일 (동일 콘텐츠 = 동일 출력)
export const SEMANTIC_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

// KidsMap: Stale 허용 시간 (TTL 후 추가 1시간)
export const STALE_TTL_MS = 60 * 60 * 1000

// 최대 캐시 엔트리 수 (메모리 보호)
export const MAX_CACHE_ENTRIES = 100

// KidsMap: 캐시 통계
let cacheHitCount = 0
let cacheMissCount = 0
let cacheStaleHitCount = 0

// ============================================
// KidsMap: 콘텐츠 해시 생성
// ============================================

/**
 * KidsMap: 요청 내용 기반 해시 키 생성
 *
 * 동일한 요청은 동일한 해시 → 중복 생성 방지
 *
 * @param enginePreset - 도메인 엔진 프리셋 (예: DIGITAL, BIOTECH)
 * @param documentType - 문서 유형 (예: performance_report, proposal)
 * @param metadata - 요청 메타데이터 (회사명, 프로그램 ID 등)
 * @returns SHA-256 해시 (첫 16자)
 */
export function createContentHash(
  enginePreset: string,
  documentType: string,
  metadata?: Record<string, unknown>
): string {
  // 정렬된 키로 일관된 해시 생성
  const normalizedMeta = metadata
    ? JSON.stringify(
        Object.keys(metadata)
          .sort()
          .reduce((acc, key) => {
            acc[key] = metadata[key]
            return acc
          }, {} as Record<string, unknown>)
      )
    : ''

  const content = `${enginePreset}:${documentType}:${normalizedMeta}`
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

/**
 * KidsMap: 콘텐츠 해시로 캐시 키 조회
 *
 * 중복 요청 감지용 역참조
 */
export function getCacheKeyByContentHash(contentHash: string): string | undefined {
  return contentHashIndex.get(contentHash)
}

// ============================================
// LRU 퇴거 (KidsMap 패턴: 마지막 접근 기준)
// ============================================

/**
 * LRU 퇴거: 가장 오래 접근되지 않은 엔트리 제거
 *
 * KidsMap 패턴: lastAccessedAt 기준 (기존: expiresAt 기준)
 */
function evictLRU(): void {
  if (documentCache.size < MAX_CACHE_ENTRIES) return

  let oldestKey: string | null = null
  let oldestAccess = Infinity

  for (const [key, entry] of documentCache.entries()) {
    if (entry.lastAccessedAt < oldestAccess) {
      oldestAccess = entry.lastAccessedAt
      oldestKey = key
    }
  }

  if (oldestKey) {
    const entry = documentCache.get(oldestKey)
    if (entry?.contentHash) {
      contentHashIndex.delete(entry.contentHash)
    }
    documentCache.delete(oldestKey)
  }
}

/**
 * LRU 퇴거: 가장 오래된 엔트리 제거 (기존 API 호환)
 * @deprecated Use evictLRU() instead
 */
function evictOldest(): void {
  evictLRU()
}

/**
 * KidsMap: 시맨틱 캐시 저장 옵션
 */
export interface CacheDocumentOptions {
  /** 시맨틱 캐시 TTL 사용 (7일) - 기본 false */
  useSemanticTTL?: boolean
  /** 콘텐츠 해시 (중복 감지용) */
  contentHash?: string
  /** 요청 메타데이터 */
  requestMeta?: {
    enginePreset: string
    documentType: string
    programId?: string
  }
}

/**
 * 캐시에 문서 저장
 *
 * @param id - 캐시 키
 * @param buffer - 문서 버퍼
 * @param mimeType - MIME 타입
 * @param filename - 파일명
 * @param options - KidsMap 캐싱 옵션
 */
export function cacheDocument(
  id: string,
  buffer: Buffer,
  mimeType: string,
  filename: string,
  options?: CacheDocumentOptions
): void {
  const now = Date.now()
  const ttl = options?.useSemanticTTL ? SEMANTIC_CACHE_TTL_MS : CACHE_TTL_MS

  // 크기 제한 초과 시 LRU 퇴거
  if (documentCache.size >= MAX_CACHE_ENTRIES && !documentCache.has(id)) {
    evictLRU()
  }

  // 기존 엔트리의 contentHash 인덱스 정리
  const existing = documentCache.get(id)
  if (existing?.contentHash) {
    contentHashIndex.delete(existing.contentHash)
  }

  documentCache.set(id, {
    buffer,
    mimeType,
    filename,
    expiresAt: now + ttl,
    lastAccessedAt: now,
    contentHash: options?.contentHash,
    requestMeta: options?.requestMeta,
  })

  // KidsMap: 콘텐츠 해시 역참조 등록
  if (options?.contentHash) {
    contentHashIndex.set(options.contentHash, id)
  }
}

/**
 * 캐시에서 문서 조회
 *
 * @param id - 캐시 키
 * @returns 캐시된 문서 또는 null
 */
export function getDocumentFromCache(id: string): CachedDocument | null {
  const entry = documentCache.get(id)
  if (!entry) {
    cacheMissCount++
    return null
  }

  const now = Date.now()
  if (entry.expiresAt < now) {
    // 기존 동작: 만료 시 삭제
    if (entry.contentHash) {
      contentHashIndex.delete(entry.contentHash)
    }
    documentCache.delete(id)
    cacheMissCount++
    return null
  }

  // KidsMap: LRU 업데이트
  entry.lastAccessedAt = now
  cacheHitCount++
  return entry
}

/**
 * KidsMap: Stale-While-Revalidate 캐시 조회
 *
 * 만료된 데이터도 stale로 반환 (백그라운드 갱신 트리거용)
 *
 * @param id - 캐시 키
 * @returns 캐시 결과 (hit/stale/miss 구분)
 */
export function getDocumentWithSWR(id: string): CacheResult<CachedDocument> {
  const entry = documentCache.get(id)
  if (!entry) {
    cacheMissCount++
    return { data: null, isStale: false, hitType: 'miss' }
  }

  const now = Date.now()
  entry.lastAccessedAt = now

  // Fresh: TTL 내
  if (entry.expiresAt > now) {
    cacheHitCount++
    return { data: entry, isStale: false, hitType: 'hit' }
  }

  // Stale: TTL 초과 but STALE_TTL 내 → 사용 가능하지만 갱신 필요
  if (entry.expiresAt + STALE_TTL_MS > now) {
    cacheStaleHitCount++
    return { data: entry, isStale: true, hitType: 'stale' }
  }

  // Expired: STALE_TTL도 초과 → 삭제
  if (entry.contentHash) {
    contentHashIndex.delete(entry.contentHash)
  }
  documentCache.delete(id)
  cacheMissCount++
  return { data: null, isStale: false, hitType: 'miss' }
}

/**
 * KidsMap: 콘텐츠 해시로 캐시 조회 (SWR)
 *
 * 동일 요청의 캐시 히트를 최대화
 */
export function getDocumentByContentHash(contentHash: string): CacheResult<CachedDocument> {
  const cacheKey = contentHashIndex.get(contentHash)
  if (!cacheKey) {
    cacheMissCount++
    return { data: null, isStale: false, hitType: 'miss' }
  }
  return getDocumentWithSWR(cacheKey)
}

/**
 * 캐시에서 문서 삭제
 */
export function deleteFromCache(id: string): boolean {
  const entry = documentCache.get(id)
  if (entry?.contentHash) {
    contentHashIndex.delete(entry.contentHash)
  }
  return documentCache.delete(id)
}

/**
 * 만료된 캐시 정리
 *
 * KidsMap: STALE_TTL까지 초과한 엔트리만 삭제
 */
export function cleanupCache(): void {
  const now = Date.now()
  for (const [id, entry] of documentCache.entries()) {
    // STALE_TTL까지 허용 (SWR 지원)
    if (entry.expiresAt + STALE_TTL_MS < now) {
      if (entry.contentHash) {
        contentHashIndex.delete(entry.contentHash)
      }
      documentCache.delete(id)
    }
  }
}

/**
 * KidsMap: 강제 만료 정리 (STALE 무시)
 *
 * 메모리 압박 시 사용
 */
export function cleanupCacheStrict(): void {
  const now = Date.now()
  for (const [id, entry] of documentCache.entries()) {
    if (entry.expiresAt < now) {
      if (entry.contentHash) {
        contentHashIndex.delete(entry.contentHash)
      }
      documentCache.delete(id)
    }
  }
}

/**
 * 캐시 통계 (기본)
 */
export function getCacheStats(): {
  count: number
  totalSizeBytes: number
} {
  let totalSize = 0
  for (const entry of documentCache.values()) {
    totalSize += entry.buffer.length
  }
  return {
    count: documentCache.size,
    totalSizeBytes: totalSize,
  }
}

/**
 * KidsMap: 캐시 통계 확장
 *
 * 히트율 모니터링으로 캐시 효율 측정
 */
export function getCacheStatsExtended(): CacheStatsExtended {
  let totalSize = 0
  for (const entry of documentCache.values()) {
    totalSize += entry.buffer.length
  }

  const totalRequests = cacheHitCount + cacheMissCount + cacheStaleHitCount
  const hitRate = totalRequests > 0 ? (cacheHitCount + cacheStaleHitCount) / totalRequests : 0

  return {
    count: documentCache.size,
    totalSizeBytes: totalSize,
    hitCount: cacheHitCount,
    missCount: cacheMissCount,
    staleHitCount: cacheStaleHitCount,
    hitRate: Math.round(hitRate * 1000) / 10, // 소수점 1자리 퍼센트
  }
}

/**
 * KidsMap: 캐시 통계 초기화
 */
export function resetCacheStats(): void {
  cacheHitCount = 0
  cacheMissCount = 0
  cacheStaleHitCount = 0
}

/**
 * 캐시 전체 삭제 (테스트용)
 */
export function clearCache(): void {
  documentCache.clear()
  contentHashIndex.clear()
  resetCacheStats()
}

// ============================================
// KidsMap: getOrGenerateDocument 래퍼
// ============================================

import type { GenerateDocumentRequest, GeneratedDocument, EnginePresetType } from './types'

/**
 * KidsMap: 캐시 우선 문서 생성 옵션
 */
export interface GetOrGenerateOptions {
  /** 캐시 우회 (항상 새로 생성) */
  bypassCache?: boolean
  /** Stale 데이터 사용 허용 (SWR) */
  allowStale?: boolean
  /** 프로그램 ID (추가 캐시 키) */
  programId?: string
}

/**
 * KidsMap: 캐시 우선 문서 생성 결과
 */
export interface GetOrGenerateResult {
  document: GeneratedDocument
  fromCache: boolean
  wasStale: boolean
  contentHash: string
}

/**
 * KidsMap: 캐시 우선 문서 생성 (Cache-Through Pattern)
 *
 * 핵심 로직:
 * 1. 요청 내용 기반 contentHash 생성
 * 2. 캐시에서 조회 (SWR 지원)
 * 3. 캐시 히트 → 즉시 반환
 * 4. 캐시 미스 → 생성 후 캐시 저장
 *
 * 예상 효과: API 비용 70% 절감 (중복 요청 제거)
 *
 * @param request - 문서 생성 요청
 * @param generateFn - 실제 문서 생성 함수
 * @param options - 캐싱 옵션
 * @returns 생성된 문서 + 캐시 정보
 *
 * @example
 * ```ts
 * const result = await getOrGenerateDocument(
 *   { enginePreset: 'DIGITAL', documentType: 'proposal', metadata: {...} },
 *   generateDocument,
 *   { programId: 'AI001' }
 * )
 *
 * console.log(`From cache: ${result.fromCache}, Hit rate: ${getCacheStatsExtended().hitRate}%`)
 * ```
 */
export async function getOrGenerateDocument(
  request: GenerateDocumentRequest,
  generateFn: (req: GenerateDocumentRequest) => Promise<GeneratedDocument>,
  options: GetOrGenerateOptions = {}
): Promise<GetOrGenerateResult> {
  const { bypassCache = false, allowStale = true, programId } = options
  const { enginePreset, documentType, metadata } = request

  // 1. 콘텐츠 해시 생성
  const contentHash = createContentHash(
    enginePreset,
    documentType,
    { ...metadata, programId } // programId도 캐시 키에 포함
  )

  // 2. 캐시 우회 옵션 확인
  if (!bypassCache) {
    const cached = getDocumentByContentHash(contentHash)

    // 캐시 히트 (fresh)
    if (cached.hitType === 'hit' && cached.data) {
      return {
        document: {
          id: cached.data.requestMeta?.programId || 'cached',
          buffer: cached.data.buffer,
          filename: cached.data.filename,
          mimeType: cached.data.mimeType,
          format: cached.data.filename.endsWith('.xlsx') ? 'XLSX'
            : cached.data.filename.endsWith('.pdf') ? 'PDF' : 'DOCX',
          hashChain: contentHash, // 캐시된 해시 사용
          createdAt: new Date(cached.data.expiresAt - SEMANTIC_CACHE_TTL_MS),
          metadata: {
            enginePreset: (cached.data.requestMeta?.enginePreset || enginePreset) as EnginePresetType,
            documentType: cached.data.requestMeta?.documentType || documentType,
            title: 'Cached Document',
            generationTimeMs: 0, // 캐시 히트는 생성 시간 0
            sizeBytes: cached.data.buffer.length,
          },
        },
        fromCache: true,
        wasStale: false,
        contentHash,
      }
    }

    // Stale 히트 (SWR)
    if (allowStale && cached.hitType === 'stale' && cached.data) {
      // 백그라운드 갱신은 호출자가 처리 (wasStale=true로 알림)
      return {
        document: {
          id: cached.data.requestMeta?.programId || 'cached-stale',
          buffer: cached.data.buffer,
          filename: cached.data.filename,
          mimeType: cached.data.mimeType,
          format: cached.data.filename.endsWith('.xlsx') ? 'XLSX'
            : cached.data.filename.endsWith('.pdf') ? 'PDF' : 'DOCX',
          hashChain: contentHash,
          createdAt: new Date(cached.data.expiresAt - SEMANTIC_CACHE_TTL_MS),
          metadata: {
            enginePreset: (cached.data.requestMeta?.enginePreset || enginePreset) as EnginePresetType,
            documentType: cached.data.requestMeta?.documentType || documentType,
            title: 'Cached Document (Stale)',
            generationTimeMs: 0,
            sizeBytes: cached.data.buffer.length,
          },
        },
        fromCache: true,
        wasStale: true,
        contentHash,
      }
    }
  }

  // 3. 캐시 미스 → 문서 생성
  const document = await generateFn(request)

  // 4. 생성된 문서 캐시 저장
  cacheDocument(
    document.id,
    document.buffer,
    document.mimeType,
    document.filename,
    {
      useSemanticTTL: true, // 7일 TTL
      contentHash,
      requestMeta: {
        enginePreset,
        documentType,
        programId,
      },
    }
  )

  return {
    document,
    fromCache: false,
    wasStale: false,
    contentHash,
  }
}

/**
 * KidsMap: 백그라운드 캐시 갱신 (SWR 후속 처리)
 *
 * stale 데이터 반환 후 백그라운드에서 갱신할 때 사용
 */
export async function refreshCacheInBackground(
  request: GenerateDocumentRequest,
  generateFn: (req: GenerateDocumentRequest) => Promise<GeneratedDocument>,
  options: GetOrGenerateOptions = {}
): Promise<void> {
  try {
    await getOrGenerateDocument(request, generateFn, {
      ...options,
      bypassCache: true, // 강제 갱신
    })
  } catch (error) {
    // 백그라운드 갱신 실패는 무시 (기존 캐시 유지)
    console.warn('[Cache] Background refresh failed:', error)
  }
}
