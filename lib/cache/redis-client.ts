/**
 * Redis Client (Upstash)
 *
 * Upstash Redis 클라이언트 래퍼.
 * - 환경 변수 기반 설정
 * - 폴백: Redis 미설정 시 메모리 캐시 사용
 * - Edge Runtime 호환
 */

import { Redis } from '@upstash/redis'
import { logger } from '@/lib/api/logger'

// ============================================
// Types
// ============================================

export interface CacheConfig {
  /** 기본 TTL (초) */
  defaultTtlSeconds?: number
  /** 디버그 모드 */
  debug?: boolean
}

export interface CacheEntry<T> {
  value: T
  expiresAt: number
}

// ============================================
// TTL Constants
// ============================================

export const CACHE_TTL = {
  /** 도메인 프리셋: 7일 (거의 불변) */
  DOMAIN_PRESET: 7 * 24 * 60 * 60,
  /** Company Block: 1시간 */
  COMPANY_BLOCK: 60 * 60,
  /** 세션 컨텍스트: 30분 */
  SESSION_CONTEXT: 30 * 60,
  /** 템플릿: 30분 */
  TEMPLATE: 30 * 60,
} as const

// ============================================
// Redis Client Singleton
// ============================================

let redisClient: Redis | null = null
let isRedisAvailable = false

/**
 * Redis 클라이언트를 초기화합니다.
 * 환경 변수가 설정되지 않으면 null 반환.
 */
function initializeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    logger.warn('[RedisClient] UPSTASH_REDIS_REST_URL or TOKEN not set. Using in-memory fallback.')
    return null
  }

  try {
    const client = new Redis({ url, token })
    isRedisAvailable = true
    logger.info('[RedisClient] Connected to Upstash Redis')
    return client
  } catch (error) {
    logger.error('[RedisClient] Failed to connect to Upstash Redis', { error })
    return null
  }
}

/**
 * Redis 클라이언트를 가져옵니다.
 */
export function getRedisClient(): Redis | null {
  if (redisClient === null) {
    redisClient = initializeRedis()
  }
  return redisClient
}

/**
 * Redis 사용 가능 여부 확인
 */
export function isRedisEnabled(): boolean {
  if (redisClient === null) {
    redisClient = initializeRedis()
  }
  return isRedisAvailable
}

// ============================================
// In-Memory Fallback Cache
// ============================================

class InMemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private cleanupTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.startCleanup()
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? CACHE_TTL.SESSION_CONTEXT
    const expiresAt = Date.now() + ttl * 1000

    this.cache.set(key, { value, expiresAt })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$')
    const result: string[] = []
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt > now && regex.test(key)) {
        result.push(key)
      }
    }

    return result
  }

  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)))
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.cache.get(key)
    if (entry) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000
    }
  }

  clear(): void {
    this.cache.clear()
  }

  getStats(): { size: number } {
    return { size: this.cache.size }
  }

  private startCleanup(): void {
    if (this.cleanupTimer) return

    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt <= now) {
          this.cache.delete(key)
        }
      }
    }, 60 * 1000) // 1분마다 정리

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}

// ============================================
// Universal Cache Interface
// ============================================

/**
 * 통합 캐시 인터페이스
 * Redis 사용 가능 시 Redis, 불가능 시 인메모리 폴백
 */
export class UniversalCache {
  private redis: Redis | null
  private fallback: InMemoryCache
  private debug: boolean

  constructor(config: CacheConfig = {}) {
    this.redis = getRedisClient()
    this.fallback = new InMemoryCache()
    this.debug = config.debug ?? process.env.NODE_ENV === 'development'
  }

  /**
   * 캐시에서 값을 조회합니다.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis) {
        const value = await this.redis.get<T>(key)
        if (this.debug) {
          logger.debug(`[Cache] GET ${key}: ${value ? 'HIT' : 'MISS'}`)
        }
        return value
      }
      return this.fallback.get<T>(key)
    } catch (error) {
      logger.error(`[Cache] GET error for ${key}`, { error })
      return this.fallback.get<T>(key)
    }
  }

  /**
   * 캐시에 값을 저장합니다.
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? CACHE_TTL.SESSION_CONTEXT

    try {
      if (this.redis) {
        await this.redis.set(key, value, { ex: ttl })
        if (this.debug) {
          logger.debug(`[Cache] SET ${key} (TTL: ${ttl}s)`)
        }
      } else {
        await this.fallback.set(key, value, ttl)
      }
    } catch (error) {
      logger.error(`[Cache] SET error for ${key}`, { error })
      await this.fallback.set(key, value, ttl)
    }
  }

  /**
   * 캐시에서 값을 삭제합니다.
   */
  async del(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key)
        if (this.debug) {
          logger.debug(`[Cache] DEL ${key}`)
        }
      } else {
        await this.fallback.del(key)
      }
    } catch (error) {
      logger.error(`[Cache] DEL error for ${key}`, { error })
      await this.fallback.del(key)
    }
  }

  /**
   * 키 존재 여부를 확인합니다.
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.redis) {
        const result = await this.redis.exists(key)
        return result === 1
      }
      return this.fallback.exists(key)
    } catch (error) {
      logger.error(`[Cache] EXISTS error for ${key}`, { error })
      return this.fallback.exists(key)
    }
  }

  /**
   * 패턴에 맞는 키 목록을 조회합니다.
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      if (this.redis) {
        const result = await this.redis.keys(pattern)
        return result
      }
      return this.fallback.keys(pattern)
    } catch (error) {
      logger.error(`[Cache] KEYS error for ${pattern}`, { error })
      return this.fallback.keys(pattern)
    }
  }

  /**
   * 여러 키의 값을 한번에 조회합니다.
   */
  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    try {
      if (this.redis) {
        const results = await this.redis.mget<T[]>(...keys)
        return results
      }
      return this.fallback.mget<T>(...keys)
    } catch (error) {
      logger.error(`[Cache] MGET error`, { error })
      return this.fallback.mget<T>(...keys)
    }
  }

  /**
   * TTL을 갱신합니다.
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.expire(key, ttlSeconds)
        if (this.debug) {
          logger.debug(`[Cache] EXPIRE ${key} (TTL: ${ttlSeconds}s)`)
        }
      } else {
        await this.fallback.expire(key, ttlSeconds)
      }
    } catch (error) {
      logger.error(`[Cache] EXPIRE error for ${key}`, { error })
      await this.fallback.expire(key, ttlSeconds)
    }
  }

  /**
   * JSON 객체를 저장합니다.
   */
  async setJson<T>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds)
  }

  /**
   * JSON 객체를 조회합니다.
   */
  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get<string>(key)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  /**
   * Redis 연결 상태를 확인합니다.
   */
  isUsingRedis(): boolean {
    return this.redis !== null
  }

  /**
   * 캐시 통계를 조회합니다.
   */
  getStats(): { backend: 'redis' | 'memory'; fallbackSize: number } {
    return {
      backend: this.redis ? 'redis' : 'memory',
      fallbackSize: this.fallback.getStats().size,
    }
  }

  /**
   * 리소스를 정리합니다 (테스트용).
   */
  stop(): void {
    this.fallback.stop()
  }
}

// ============================================
// Singleton Instance
// ============================================

let cacheInstance: UniversalCache | null = null

export function getCache(): UniversalCache {
  if (!cacheInstance) {
    cacheInstance = new UniversalCache()
  }
  return cacheInstance
}

// ============================================
// Factory Function
// ============================================

export function createCache(config?: CacheConfig): UniversalCache {
  return new UniversalCache(config)
}
