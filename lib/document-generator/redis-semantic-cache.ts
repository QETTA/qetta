/**
 * Redis Semantic Cache for Document Generation
 *
 * P2-2: Redis 기반 Semantic Cache Layer
 *
 * 핵심 기능:
 * - 7일 TTL로 생성된 문서 영속 캐싱
 * - contentHash 기반 중복 요청 제거
 * - 캐시 히트/미스 통계 추적
 * - 서버 재시작 시에도 캐시 유지
 *
 * Key Schema:
 * - doc:semantic:{hash} → RedisCachedDocument (JSON)
 * - doc:idx:{preset}:{type} → SET of hashes (인덱스)
 * - doc:stats:hits → Integer (히트 카운터)
 * - doc:stats:misses → Integer (미스 카운터)
 *
 * @module document-generator/redis-semantic-cache
 */

import { getRedisClient, isRedisEnabled } from '@/lib/cache/redis-client'
import { logger } from '@/lib/api/logger'
import { createContentHash } from './cache'
import type { EnginePresetType } from './types'

// ============================================
// Types
// ============================================

/**
 * Redis에 저장되는 캐시된 문서 구조
 */
export interface RedisCachedDocument {
  /** Buffer → base64 직렬화 */
  bufferBase64: string
  /** MIME 타입 */
  mimeType: string
  /** 파일명 */
  filename: string
  /** 메타데이터 */
  metadata: {
    enginePreset: string
    documentType: string
    programId?: string
    generationTimeMs: number
    sizeBytes: number
  }
  /** 캐시 저장 시각 (ISO) */
  cachedAt: string
  /** 만료 시각 (ISO) */
  expiresAt: string
}

/**
 * 캐시 조회 결과
 */
export interface RedisCacheResult {
  data: RedisCachedDocument | null
  hitType: 'hit' | 'miss'
  fromRedis: boolean
}

/**
 * 캐시 저장 옵션
 */
export interface RedisCacheOptions {
  /** 도메인 엔진 프리셋 */
  enginePreset: string
  /** 문서 유형 */
  documentType: string
  /** 프로그램 ID (선택) */
  programId?: string
  /** 생성 시간 (ms) */
  generationTimeMs?: number
}

/**
 * 캐시 통계
 */
export interface RedisCacheStats {
  hits: number
  misses: number
  hitRate: number
  /** Redis 사용 여부 */
  usingRedis: boolean
}

// ============================================
// Constants
// ============================================

/** 캐시 키 프리픽스 */
const KEY_PREFIX = {
  DOCUMENT: 'doc:semantic:',
  INDEX: 'doc:idx:',
  STATS_HITS: 'doc:stats:hits',
  STATS_MISSES: 'doc:stats:misses',
} as const

/** 기본 TTL: 7일 (초) */
export const REDIS_SEMANTIC_CACHE_TTL = 7 * 24 * 60 * 60

// ============================================
// RedisSemanticCache Class
// ============================================

/**
 * Redis 기반 Semantic Cache
 *
 * @example
 * ```ts
 * const cache = new RedisSemanticCache()
 *
 * // 캐시 저장
 * await cache.set(contentHash, buffer, 'application/pdf', 'report.pdf', {
 *   enginePreset: 'DIGITAL',
 *   documentType: 'proposal',
 *   programId: 'AI001',
 * })
 *
 * // 캐시 조회
 * const result = await cache.get(contentHash)
 * if (result.hitType === 'hit') {
 *   const buffer = Buffer.from(result.data!.bufferBase64, 'base64')
 * }
 * ```
 */
export class RedisSemanticCache {
  private debug: boolean

  constructor(options: { debug?: boolean } = {}) {
    this.debug = options.debug ?? process.env.NODE_ENV === 'development'
  }

  /**
   * 캐시 키 생성
   */
  private getDocumentKey(contentHash: string): string {
    return `${KEY_PREFIX.DOCUMENT}${contentHash}`
  }

  /**
   * 인덱스 키 생성
   */
  private getIndexKey(enginePreset: string, documentType: string): string {
    return `${KEY_PREFIX.INDEX}${enginePreset}:${documentType}`
  }

  /**
   * Redis 사용 가능 여부 확인
   */
  isAvailable(): boolean {
    return isRedisEnabled()
  }

  /**
   * 캐시에서 문서 조회
   */
  async get(contentHash: string): Promise<RedisCacheResult> {
    const redis = getRedisClient()

    if (!redis) {
      if (this.debug) {
        logger.debug('[RedisCache] Redis not available, returning miss')
      }
      return { data: null, hitType: 'miss', fromRedis: false }
    }

    try {
      const key = this.getDocumentKey(contentHash)
      const cached = await redis.get<RedisCachedDocument>(key)

      if (cached) {
        // 히트 카운터 증가 (비동기, 에러 무시)
        redis.incr(KEY_PREFIX.STATS_HITS).catch(() => {})

        if (this.debug) {
          logger.debug(`[RedisCache] HIT: ${contentHash.slice(0, 8)}...`)
        }

        return { data: cached, hitType: 'hit', fromRedis: true }
      }

      // 미스 카운터 증가 (비동기, 에러 무시)
      redis.incr(KEY_PREFIX.STATS_MISSES).catch(() => {})

      if (this.debug) {
        logger.debug(`[RedisCache] MISS: ${contentHash.slice(0, 8)}...`)
      }

      return { data: null, hitType: 'miss', fromRedis: true }
    } catch (error) {
      logger.error('[RedisCache] GET error:', { error, contentHash })
      return { data: null, hitType: 'miss', fromRedis: false }
    }
  }

  /**
   * 캐시에 문서 저장
   */
  async set(
    contentHash: string,
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: RedisCacheOptions
  ): Promise<boolean> {
    const redis = getRedisClient()

    if (!redis) {
      if (this.debug) {
        logger.debug('[RedisCache] Redis not available, skipping set')
      }
      return false
    }

    try {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + REDIS_SEMANTIC_CACHE_TTL * 1000)

      const document: RedisCachedDocument = {
        bufferBase64: buffer.toString('base64'),
        mimeType,
        filename,
        metadata: {
          enginePreset: options.enginePreset,
          documentType: options.documentType,
          programId: options.programId,
          generationTimeMs: options.generationTimeMs ?? 0,
          sizeBytes: buffer.length,
        },
        cachedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      }

      const key = this.getDocumentKey(contentHash)

      // 문서 저장
      await redis.set(key, document, { ex: REDIS_SEMANTIC_CACHE_TTL })

      // 인덱스에 추가 (SET 자료형)
      const indexKey = this.getIndexKey(options.enginePreset, options.documentType)
      await redis.sadd(indexKey, contentHash)
      await redis.expire(indexKey, REDIS_SEMANTIC_CACHE_TTL)

      if (this.debug) {
        logger.debug(`[RedisCache] SET: ${contentHash.slice(0, 8)}... (${buffer.length} bytes)`)
      }

      return true
    } catch (error) {
      logger.error('[RedisCache] SET error:', { error, contentHash })
      return false
    }
  }

  /**
   * 캐시에서 문서 삭제
   */
  async delete(contentHash: string): Promise<boolean> {
    const redis = getRedisClient()

    if (!redis) {
      return false
    }

    try {
      const key = this.getDocumentKey(contentHash)

      // 삭제 전에 메타데이터 조회 (인덱스 정리용)
      const cached = await redis.get<RedisCachedDocument>(key)

      if (cached) {
        // 인덱스에서 제거
        const indexKey = this.getIndexKey(
          cached.metadata.enginePreset,
          cached.metadata.documentType
        )
        await redis.srem(indexKey, contentHash)
      }

      await redis.del(key)

      if (this.debug) {
        logger.debug(`[RedisCache] DEL: ${contentHash.slice(0, 8)}...`)
      }

      return true
    } catch (error) {
      logger.error('[RedisCache] DEL error:', { error, contentHash })
      return false
    }
  }

  /**
   * 특정 도메인/문서 유형의 캐시 목록 조회
   */
  async listByType(
    enginePreset: string,
    documentType: string
  ): Promise<string[]> {
    const redis = getRedisClient()

    if (!redis) {
      return []
    }

    try {
      const indexKey = this.getIndexKey(enginePreset, documentType)
      const hashes = await redis.smembers(indexKey)
      return hashes
    } catch (error) {
      logger.error('[RedisCache] LIST error:', { error, enginePreset, documentType })
      return []
    }
  }

  /**
   * 캐시 통계 조회
   */
  async getStats(): Promise<RedisCacheStats> {
    const redis = getRedisClient()

    if (!redis) {
      return { hits: 0, misses: 0, hitRate: 0, usingRedis: false }
    }

    try {
      const [hits, misses] = await Promise.all([
        redis.get<number>(KEY_PREFIX.STATS_HITS),
        redis.get<number>(KEY_PREFIX.STATS_MISSES),
      ])

      const totalHits = hits ?? 0
      const totalMisses = misses ?? 0
      const total = totalHits + totalMisses
      const hitRate = total > 0 ? Math.round((totalHits / total) * 1000) / 10 : 0

      return {
        hits: totalHits,
        misses: totalMisses,
        hitRate,
        usingRedis: true,
      }
    } catch (error) {
      logger.error('[RedisCache] STATS error:', { error })
      return { hits: 0, misses: 0, hitRate: 0, usingRedis: false }
    }
  }

  /**
   * 캐시 통계 초기화
   */
  async resetStats(): Promise<void> {
    const redis = getRedisClient()

    if (!redis) {
      return
    }

    try {
      await Promise.all([
        redis.del(KEY_PREFIX.STATS_HITS),
        redis.del(KEY_PREFIX.STATS_MISSES),
      ])

      if (this.debug) {
        logger.debug('[RedisCache] Stats reset')
      }
    } catch (error) {
      logger.error('[RedisCache] RESET STATS error:', { error })
    }
  }

  /**
   * 특정 도메인의 모든 캐시 삭제
   */
  async clearByDomain(enginePreset: string): Promise<number> {
    const redis = getRedisClient()

    if (!redis) {
      return 0
    }

    try {
      // 패턴 매칭으로 인덱스 키 조회
      const indexPattern = `${KEY_PREFIX.INDEX}${enginePreset}:*`
      const indexKeys = await redis.keys(indexPattern)

      let deletedCount = 0

      for (const indexKey of indexKeys) {
        const hashes = await redis.smembers(indexKey)

        for (const hash of hashes) {
          await this.delete(hash)
          deletedCount++
        }
      }

      if (this.debug) {
        logger.debug(`[RedisCache] Cleared ${deletedCount} entries for ${enginePreset}`)
      }

      return deletedCount
    } catch (error) {
      logger.error('[RedisCache] CLEAR BY DOMAIN error:', { error, enginePreset })
      return 0
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let cacheInstance: RedisSemanticCache | null = null

/**
 * 싱글턴 Redis Semantic Cache 인스턴스
 */
export function getRedisSemanticCache(): RedisSemanticCache {
  if (!cacheInstance) {
    cacheInstance = new RedisSemanticCache()
  }
  return cacheInstance
}

/**
 * 새 Redis Semantic Cache 인스턴스 생성
 */
export function createRedisSemanticCache(
  options?: { debug?: boolean }
): RedisSemanticCache {
  return new RedisSemanticCache(options)
}

// ============================================
// Utility Functions
// ============================================

/**
 * 캐시된 문서를 Buffer로 변환
 */
export function cachedDocumentToBuffer(cached: RedisCachedDocument): Buffer {
  return Buffer.from(cached.bufferBase64, 'base64')
}

/**
 * contentHash 생성 (cache.ts의 함수 재노출)
 */
export { createContentHash }

/**
 * 캐시 키 생성 헬퍼
 */
export function createSemanticCacheKey(
  enginePreset: string | EnginePresetType,
  documentType: string,
  metadata?: Record<string, unknown>
): string {
  return createContentHash(
    typeof enginePreset === 'string' ? enginePreset : enginePreset,
    documentType,
    metadata
  )
}
