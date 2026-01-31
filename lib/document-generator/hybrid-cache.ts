/**
 * Hybrid Cache - L1 (Memory) + L2 (Redis)
 *
 * P2-2: 하이브리드 캐싱 전략
 *
 * 캐시 계층:
 * - L1: 메모리 LRU 캐시 (기존 KidsMap) - 빠른 응답, 휘발성
 * - L2: Redis Semantic Cache - 영속성, 서버 간 공유
 *
 * 읽기 전략:
 * L1 → L2 → Generate → Write L2 → Write L1
 *
 * 쓰기 전략:
 * L2 (async) + L1 (sync)
 *
 * @module document-generator/hybrid-cache
 */

import { logger } from '@/lib/api/logger'
import {
  cacheDocument,
  getDocumentByContentHash,
  createContentHash,
  SEMANTIC_CACHE_TTL_MS,
  type CacheResult,
} from './cache'
import {
  RedisSemanticCache,
  getRedisSemanticCache,
  cachedDocumentToBuffer,
  type RedisCachedDocument,
  type RedisCacheOptions,
} from './redis-semantic-cache'
import type {
  GenerateDocumentRequest,
  GeneratedDocument,
  EnginePresetType,
} from './types'

// ============================================
// Types
// ============================================

/**
 * 하이브리드 캐시 조회 결과
 */
export interface HybridCacheResult {
  /** 캐시된 문서 데이터 */
  data: HybridCachedDocument | null
  /** 캐시 히트 유형 */
  hitType: 'l1-hit' | 'l2-hit' | 'miss'
  /** 캐시 소스 */
  source: 'memory' | 'redis' | 'none'
  /** 캐시 키 (contentHash) */
  contentHash: string
  /** Stale 여부 (L1 only) */
  isStale?: boolean
}

/**
 * 하이브리드 캐시 문서 (통합 형식)
 */
export interface HybridCachedDocument {
  buffer: Buffer
  mimeType: string
  filename: string
  metadata: {
    enginePreset: string
    documentType: string
    programId?: string
    generationTimeMs: number
    sizeBytes: number
  }
  cachedAt: Date
}

/**
 * 하이브리드 캐시 저장 옵션
 */
export interface HybridCacheSetOptions extends RedisCacheOptions {
  /** L1 캐시 스킵 */
  skipL1?: boolean
  /** L2 캐시 스킵 */
  skipL2?: boolean
}

/**
 * getOrGenerate 옵션
 */
export interface HybridGetOrGenerateOptions {
  /** 캐시 전략 */
  cacheStrategy?: 'prefer' | 'bypass' | 'only'
  /** 프로그램 ID */
  programId?: string
  /** Stale 데이터 허용 */
  allowStale?: boolean
}

/**
 * getOrGenerate 결과
 */
export interface HybridGetOrGenerateResult {
  document: GeneratedDocument
  fromCache: boolean
  cacheSource: 'memory' | 'redis' | 'none'
  contentHash: string
  wasStale: boolean
}

/**
 * 캐시 통계 (통합)
 */
export interface HybridCacheStats {
  l1: {
    count: number
    hitCount: number
    missCount: number
    hitRate: number
  }
  l2: {
    hits: number
    misses: number
    hitRate: number
    available: boolean
  }
  combined: {
    totalHits: number
    totalMisses: number
    hitRate: number
  }
}

// ============================================
// HybridCache Class
// ============================================

/**
 * L1 (Memory) + L2 (Redis) 하이브리드 캐시
 *
 * @example
 * ```ts
 * const cache = new HybridCache()
 *
 * // 캐시 우선 문서 생성
 * const result = await cache.getOrGenerate(
 *   request,
 *   generateDocument,
 *   { cacheStrategy: 'prefer', programId: 'AI001' }
 * )
 *
 * console.log(`From ${result.cacheSource}, contentHash: ${result.contentHash}`)
 * ```
 */
export class HybridCache {
  private l2Cache: RedisSemanticCache
  private debug: boolean

  // L1 통계 (메모리 캐시는 기존 모듈에서 관리)
  private l1Stats = {
    hits: 0,
    misses: 0,
  }

  constructor(options: { debug?: boolean; l2Cache?: RedisSemanticCache } = {}) {
    this.debug = options.debug ?? process.env.NODE_ENV === 'development'
    this.l2Cache = options.l2Cache ?? getRedisSemanticCache()
  }

  /**
   * 캐시에서 문서 조회 (L1 → L2)
   */
  async get(contentHash: string): Promise<HybridCacheResult> {
    // 1. L1 (메모리) 조회
    const l1Result = getDocumentByContentHash(contentHash)

    if (l1Result.hitType === 'hit' && l1Result.data) {
      this.l1Stats.hits++

      if (this.debug) {
        logger.debug(`[HybridCache] L1 HIT: ${contentHash.slice(0, 8)}...`)
      }

      return {
        data: {
          buffer: l1Result.data.buffer,
          mimeType: l1Result.data.mimeType,
          filename: l1Result.data.filename,
          metadata: {
            enginePreset: l1Result.data.requestMeta?.enginePreset ?? 'unknown',
            documentType: l1Result.data.requestMeta?.documentType ?? 'unknown',
            programId: l1Result.data.requestMeta?.programId,
            generationTimeMs: 0,
            sizeBytes: l1Result.data.buffer.length,
          },
          cachedAt: new Date(l1Result.data.lastAccessedAt),
        },
        hitType: 'l1-hit',
        source: 'memory',
        contentHash,
        isStale: false,
      }
    }

    // L1 Stale 히트 (SWR)
    if (l1Result.hitType === 'stale' && l1Result.data) {
      this.l1Stats.hits++

      if (this.debug) {
        logger.debug(`[HybridCache] L1 STALE HIT: ${contentHash.slice(0, 8)}...`)
      }

      return {
        data: {
          buffer: l1Result.data.buffer,
          mimeType: l1Result.data.mimeType,
          filename: l1Result.data.filename,
          metadata: {
            enginePreset: l1Result.data.requestMeta?.enginePreset ?? 'unknown',
            documentType: l1Result.data.requestMeta?.documentType ?? 'unknown',
            programId: l1Result.data.requestMeta?.programId,
            generationTimeMs: 0,
            sizeBytes: l1Result.data.buffer.length,
          },
          cachedAt: new Date(l1Result.data.lastAccessedAt),
        },
        hitType: 'l1-hit',
        source: 'memory',
        contentHash,
        isStale: true,
      }
    }

    this.l1Stats.misses++

    // 2. L2 (Redis) 조회
    const l2Result = await this.l2Cache.get(contentHash)

    if (l2Result.hitType === 'hit' && l2Result.data) {
      if (this.debug) {
        logger.debug(`[HybridCache] L2 HIT: ${contentHash.slice(0, 8)}...`)
      }

      const buffer = cachedDocumentToBuffer(l2Result.data)

      // L2 히트 시 L1에도 캐싱 (Promote)
      this.promoteToL1(contentHash, l2Result.data)

      return {
        data: {
          buffer,
          mimeType: l2Result.data.mimeType,
          filename: l2Result.data.filename,
          metadata: l2Result.data.metadata,
          cachedAt: new Date(l2Result.data.cachedAt),
        },
        hitType: 'l2-hit',
        source: 'redis',
        contentHash,
      }
    }

    if (this.debug) {
      logger.debug(`[HybridCache] MISS: ${contentHash.slice(0, 8)}...`)
    }

    return {
      data: null,
      hitType: 'miss',
      source: 'none',
      contentHash,
    }
  }

  /**
   * 캐시에 문서 저장 (L1 + L2)
   */
  async set(
    contentHash: string,
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: HybridCacheSetOptions
  ): Promise<void> {
    const { skipL1 = false, skipL2 = false, ...redisOptions } = options

    // L1 저장 (동기)
    if (!skipL1) {
      cacheDocument(
        `hybrid-${contentHash}`,
        buffer,
        mimeType,
        filename,
        {
          useSemanticTTL: true,
          contentHash,
          requestMeta: {
            enginePreset: redisOptions.enginePreset,
            documentType: redisOptions.documentType,
            programId: redisOptions.programId,
          },
        }
      )

      if (this.debug) {
        logger.debug(`[HybridCache] L1 SET: ${contentHash.slice(0, 8)}...`)
      }
    }

    // L2 저장 (비동기)
    if (!skipL2) {
      this.l2Cache.set(contentHash, buffer, mimeType, filename, redisOptions).catch((error) => {
        logger.error('[HybridCache] L2 SET failed:', { error, contentHash })
      })
    }
  }

  /**
   * L2 히트 시 L1으로 승격 (백그라운드)
   */
  private promoteToL1(contentHash: string, cached: RedisCachedDocument): void {
    try {
      const buffer = cachedDocumentToBuffer(cached)

      cacheDocument(
        `hybrid-${contentHash}`,
        buffer,
        cached.mimeType,
        cached.filename,
        {
          useSemanticTTL: true,
          contentHash,
          requestMeta: {
            enginePreset: cached.metadata.enginePreset,
            documentType: cached.metadata.documentType,
            programId: cached.metadata.programId,
          },
        }
      )

      if (this.debug) {
        logger.debug(`[HybridCache] Promoted to L1: ${contentHash.slice(0, 8)}...`)
      }
    } catch (error) {
      logger.error('[HybridCache] Promote to L1 failed:', { error, contentHash })
    }
  }

  /**
   * 캐시에서 문서 삭제 (L1 + L2)
   */
  async delete(contentHash: string): Promise<void> {
    // L2 삭제
    await this.l2Cache.delete(contentHash)

    // L1은 contentHash 인덱스로 삭제 불가 (ID 기반)
    // 다음 정리 사이클에서 만료됨

    if (this.debug) {
      logger.debug(`[HybridCache] DEL: ${contentHash.slice(0, 8)}...`)
    }
  }

  /**
   * 캐시 우선 문서 생성 (Cache-Through Pattern)
   *
   * 전략:
   * - prefer: L1 → L2 → Generate → Cache
   * - bypass: Generate → Cache (캐시 우회)
   * - only: L1 → L2 (캐시만, 생성 안함)
   */
  async getOrGenerate(
    request: GenerateDocumentRequest,
    generateFn: (req: GenerateDocumentRequest) => Promise<GeneratedDocument>,
    options: HybridGetOrGenerateOptions = {}
  ): Promise<HybridGetOrGenerateResult> {
    const {
      cacheStrategy = 'prefer',
      programId,
      allowStale = true,
    } = options

    const { enginePreset, documentType, metadata } = request

    // 1. contentHash 생성
    const contentHash = createContentHash(
      enginePreset,
      documentType,
      { ...metadata, programId }
    )

    // 2. bypass 전략: 캐시 건너뛰고 생성
    if (cacheStrategy === 'bypass') {
      const document = await generateFn(request)

      // 생성 후 캐싱
      await this.set(contentHash, document.buffer, document.mimeType, document.filename, {
        enginePreset,
        documentType,
        programId,
        generationTimeMs: document.metadata.generationTimeMs,
      })

      return {
        document,
        fromCache: false,
        cacheSource: 'none',
        contentHash,
        wasStale: false,
      }
    }

    // 3. 캐시 조회 (L1 → L2)
    const cached = await this.get(contentHash)

    // 캐시 히트
    if (cached.data && (cached.hitType === 'l1-hit' || cached.hitType === 'l2-hit')) {
      // Stale 체크
      if (cached.isStale && !allowStale) {
        // Stale 허용 안함 → 재생성
      } else {
        return {
          document: this.cachedToDocument(cached.data, contentHash),
          fromCache: true,
          cacheSource: cached.source,
          contentHash,
          wasStale: cached.isStale ?? false,
        }
      }
    }

    // 4. only 전략: 캐시만 (생성 안함)
    if (cacheStrategy === 'only') {
      throw new Error('Document not found in cache (cache-only mode)')
    }

    // 5. 캐시 미스 → 문서 생성
    const document = await generateFn(request)

    // 6. 생성된 문서 캐싱
    await this.set(contentHash, document.buffer, document.mimeType, document.filename, {
      enginePreset,
      documentType,
      programId,
      generationTimeMs: document.metadata.generationTimeMs,
    })

    return {
      document,
      fromCache: false,
      cacheSource: 'none',
      contentHash,
      wasStale: false,
    }
  }

  /**
   * 캐시된 문서를 GeneratedDocument로 변환
   */
  private cachedToDocument(
    cached: HybridCachedDocument,
    hashChain: string
  ): GeneratedDocument {
    const format = cached.filename.endsWith('.xlsx')
      ? 'XLSX'
      : cached.filename.endsWith('.pdf')
        ? 'PDF'
        : 'DOCX'

    return {
      id: `cached-${hashChain.slice(0, 8)}`,
      buffer: cached.buffer,
      filename: cached.filename,
      mimeType: cached.mimeType,
      format,
      hashChain,
      createdAt: cached.cachedAt,
      metadata: {
        enginePreset: cached.metadata.enginePreset as EnginePresetType,
        documentType: cached.metadata.documentType,
        title: 'Cached Document',
        generationTimeMs: 0, // 캐시 히트
        sizeBytes: cached.buffer.length,
      },
    }
  }

  /**
   * 통합 캐시 통계 조회
   */
  async getStats(): Promise<HybridCacheStats> {
    const l2Stats = await this.l2Cache.getStats()

    const l1Total = this.l1Stats.hits + this.l1Stats.misses
    const l1HitRate = l1Total > 0 ? Math.round((this.l1Stats.hits / l1Total) * 1000) / 10 : 0

    const combinedHits = this.l1Stats.hits + l2Stats.hits
    const combinedMisses = this.l1Stats.misses + l2Stats.misses - this.l1Stats.hits // L1 미스 후 L2 히트는 중복 제거
    const combinedTotal = combinedHits + combinedMisses
    const combinedHitRate =
      combinedTotal > 0 ? Math.round((combinedHits / combinedTotal) * 1000) / 10 : 0

    return {
      l1: {
        count: l1Total,
        hitCount: this.l1Stats.hits,
        missCount: this.l1Stats.misses,
        hitRate: l1HitRate,
      },
      l2: {
        ...l2Stats,
        available: this.l2Cache.isAvailable(),
      },
      combined: {
        totalHits: combinedHits,
        totalMisses: Math.max(0, combinedMisses),
        hitRate: combinedHitRate,
      },
    }
  }

  /**
   * 통계 초기화
   */
  async resetStats(): Promise<void> {
    this.l1Stats = { hits: 0, misses: 0 }
    await this.l2Cache.resetStats()
  }
}

// ============================================
// Singleton Instance
// ============================================

let hybridCacheInstance: HybridCache | null = null

/**
 * 싱글턴 HybridCache 인스턴스
 */
export function getHybridCache(): HybridCache {
  if (!hybridCacheInstance) {
    hybridCacheInstance = new HybridCache()
  }
  return hybridCacheInstance
}

/**
 * 새 HybridCache 인스턴스 생성
 */
export function createHybridCache(
  options?: { debug?: boolean; l2Cache?: RedisSemanticCache }
): HybridCache {
  return new HybridCache(options)
}
