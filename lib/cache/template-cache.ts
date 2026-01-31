/**
 * Template Cache
 *
 * 템플릿 캐싱 레이어
 * - Redis 캐시 (우선)
 * - 인메모리 폴백 (Redis 미사용 시)
 * - LRU 기반 메모리 관리
 * - TTL 지원
 *
 * @module cache/template-cache
 */

import { logger } from '@/lib/api/logger'
import { UniversalCache } from './redis-client'

// ============================================================
// Types
// ============================================================

export interface CachedTemplate {
  /** 템플릿 ID */
  id: string
  /** 템플릿 내용 (렌더링된 문자열, 선택적) */
  content?: string
  /** 템플릿 섹션 (DocumentTemplate 구조) */
  sections?: CachedTemplateSection[]
  /** 템플릿 유형 */
  templateType: string
  /** 도메인 */
  domain: string
  /** 변수 목록 */
  variables: TemplateVariable[]
  /** 메타데이터 */
  metadata: {
    /** 공고 ID (원본) */
    announcementId?: string
    /** 공고 제목 */
    announcementTitle?: string
    /** 생성 시각 */
    createdAt: Date
    /** 마지막 접근 시각 */
    lastAccessedAt: Date
    /** 접근 횟수 */
    accessCount: number
  }
}

export interface CachedTemplateSection {
  /** 섹션 ID */
  id: string
  /** 섹션 유형 */
  type: string
  /** 섹션명 */
  title: string
  /** 순서 */
  order: number
  /** 필수 여부 */
  required: boolean
  /** 포함된 변수 ID 목록 */
  variableIds: string[]
  /** 섹션 설명 */
  description?: string
}

export interface TemplateVariable {
  /** 변수 키 */
  key: string
  /** 라벨 */
  label: string
  /** 필수 여부 */
  required: boolean
  /** 기본값 */
  defaultValue?: string
  /** 현재 값 */
  value?: string
}

export interface TemplateCacheConfig {
  /** 기본 TTL (밀리초, 기본 30분) */
  defaultTtlMs?: number
  /** 최대 항목 수 (기본 100) */
  maxEntries?: number
  /** 정리 주기 (밀리초, 기본 5분) */
  cleanupIntervalMs?: number
  /** 디버그 모드 */
  debug?: boolean
}

interface CacheEntry {
  template: CachedTemplate
  expiresAt: number
  createdAt: number
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_CONFIG: Required<TemplateCacheConfig> = {
  defaultTtlMs: 30 * 60 * 1000, // 30분
  maxEntries: 100,
  cleanupIntervalMs: 5 * 60 * 1000, // 5분
  debug: process.env.NODE_ENV === 'development',
}

// ============================================================
// Template Cache Class
// ============================================================

export class TemplateCache {
  private cache = new Map<string, CacheEntry>()
  private config: Required<TemplateCacheConfig>
  private cleanupTimer: ReturnType<typeof setInterval> | null = null
  private redisCache: UniversalCache

  constructor(config: TemplateCacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.redisCache = new UniversalCache({ debug: config.debug })
    this.startCleanupTimer()
  }

  /**
   * 템플릿 저장
   */
  async set(
    template: CachedTemplate,
    ttlMs?: number
  ): Promise<void> {
    const effectiveTtl = ttlMs ?? this.config.defaultTtlMs
    const now = Date.now()

    // 업데이트된 템플릿 생성
    const updatedTemplate: CachedTemplate = {
      ...template,
      metadata: {
        ...template.metadata,
        lastAccessedAt: new Date(),
      },
    }

    // Redis에 저장 (TTL은 초 단위)
    const ttlSeconds = Math.ceil(effectiveTtl / 1000)
    await this.redisCache.set(
      `template:${template.id}`,
      updatedTemplate,
      ttlSeconds
    )

    // 인메모리 캐시에도 저장 (LRU 지원)
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLru()
    }

    const entry: CacheEntry = {
      template: updatedTemplate,
      expiresAt: now + effectiveTtl,
      createdAt: now,
    }

    this.cache.set(template.id, entry)

    if (this.config.debug) {
      logger.debug(`[TemplateCache] Set: ${template.id} (TTL: ${effectiveTtl}ms)`)
    }
  }

  /**
   * 템플릿 조회
   */
  async get(id: string): Promise<CachedTemplate | null> {
    // Redis에서 먼저 조회
    const redisTemplate = await this.redisCache.get<CachedTemplate>(`template:${id}`)

    if (redisTemplate) {
      // 접근 정보 업데이트
      redisTemplate.metadata.lastAccessedAt = new Date()
      redisTemplate.metadata.accessCount++

      // 인메모리 캐시도 업데이트
      const entry = this.cache.get(id)
      if (entry) {
        entry.template = redisTemplate
      }

      if (this.config.debug) {
        logger.debug(`[TemplateCache] Redis Hit: ${id}`)
      }

      return redisTemplate
    }

    // 인메모리 캐시 폴백
    const entry = this.cache.get(id)

    if (!entry) {
      if (this.config.debug) {
        logger.debug(`[TemplateCache] Miss: ${id}`)
      }
      return null
    }

    // 만료 확인
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(id)
      if (this.config.debug) {
        logger.debug(`[TemplateCache] Expired: ${id}`)
      }
      return null
    }

    // 접근 정보 업데이트
    entry.template.metadata.lastAccessedAt = new Date()
    entry.template.metadata.accessCount++

    if (this.config.debug) {
      logger.debug(`[TemplateCache] Memory Hit: ${id}`)
    }

    return entry.template
  }

  /**
   * 템플릿 존재 여부 확인
   */
  async has(id: string): Promise<boolean> {
    // Redis 먼저 확인
    const redisExists = await this.redisCache.exists(`template:${id}`)
    if (redisExists) return true

    // 인메모리 폴백
    const entry = this.cache.get(id)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(id)
      return false
    }
    return true
  }

  /**
   * 템플릿 삭제
   */
  async delete(id: string): Promise<boolean> {
    // Redis에서 삭제
    await this.redisCache.del(`template:${id}`)

    // 인메모리에서도 삭제
    const result = this.cache.delete(id)
    if (this.config.debug && result) {
      logger.debug(`[TemplateCache] Delete: ${id}`)
    }
    return result
  }

  /**
   * 전체 캐시 초기화
   */
  async clear(): Promise<void> {
    // Redis 템플릿 키 삭제
    const keys = await this.redisCache.keys('template:*')
    for (const key of keys) {
      await this.redisCache.del(key)
    }

    // 인메모리 캐시 초기화
    this.cache.clear()
    if (this.config.debug) {
      logger.debug(`[TemplateCache] Cleared`)
    }
  }

  /**
   * 캐시 통계
   */
  getStats(): {
    size: number
    maxEntries: number
    oldestEntry: Date | null
    newestEntry: Date | null
  } {
    let oldest: number | null = null
    let newest: number | null = null

    for (const entry of this.cache.values()) {
      if (oldest === null || entry.createdAt < oldest) {
        oldest = entry.createdAt
      }
      if (newest === null || entry.createdAt > newest) {
        newest = entry.createdAt
      }
    }

    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      oldestEntry: oldest ? new Date(oldest) : null,
      newestEntry: newest ? new Date(newest) : null,
    }
  }

  /**
   * 도메인별 템플릿 목록 조회
   */
  getByDomain(domain: string): CachedTemplate[] {
    const templates: CachedTemplate[] = []
    const now = Date.now()

    for (const entry of this.cache.values()) {
      if (entry.expiresAt > now && entry.template.domain === domain) {
        templates.push(entry.template)
      }
    }

    return templates
  }

  /**
   * 템플릿 유형별 목록 조회
   */
  getByType(templateType: string): CachedTemplate[] {
    const templates: CachedTemplate[] = []
    const now = Date.now()

    for (const entry of this.cache.values()) {
      if (entry.expiresAt > now && entry.template.templateType === templateType) {
        templates.push(entry.template)
      }
    }

    return templates
  }

  /**
   * 모든 유효한 템플릿 조회
   */
  getAll(): CachedTemplate[] {
    const templates: CachedTemplate[] = []
    const now = Date.now()

    for (const entry of this.cache.values()) {
      if (entry.expiresAt > now) {
        templates.push(entry.template)
      }
    }

    return templates
  }

  /**
   * LRU 방식으로 가장 오래된 항목 제거
   */
  private evictLru(): void {
    let oldestId: string | null = null
    let oldestAccess: Date | null = null

    for (const [id, entry] of this.cache.entries()) {
      const lastAccess = entry.template.metadata.lastAccessedAt
      if (oldestAccess === null || lastAccess < oldestAccess) {
        oldestAccess = lastAccess
        oldestId = id
      }
    }

    if (oldestId) {
      this.cache.delete(oldestId)
      if (this.config.debug) {
        logger.debug(`[TemplateCache] LRU evict: ${oldestId}`)
      }
    }
  }

  /**
   * 만료된 항목 정리
   */
  private cleanup(): void {
    const now = Date.now()
    let removed = 0

    for (const [id, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(id)
        removed++
      }
    }

    if (this.config.debug && removed > 0) {
      logger.debug(`[TemplateCache] Cleanup: removed ${removed} expired entries`)
    }
  }

  /**
   * 정리 타이머 시작
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) return

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupIntervalMs)

    // Node.js에서 프로세스 종료 방지하지 않도록
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
  }

  /**
   * 정리 타이머 중지
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}

// ============================================================
// 기본 인스턴스
// ============================================================

/**
 * 전역 템플릿 캐시 인스턴스
 */
export const templateCache = new TemplateCache()

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 템플릿 ID 생성
 */
export function generateTemplateId(
  domain: string,
  templateType: string,
  announcementId?: string
): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  const suffix = announcementId
    ? `-${announcementId.substring(0, 8)}`
    : ''
  return `tpl-${domain.toLowerCase()}-${templateType}${suffix}-${timestamp}-${random}`
}

/**
 * 캐시 키에서 정보 추출
 */
export function parseTemplateId(id: string): {
  domain: string
  templateType: string
  timestamp: string
} | null {
  const match = id.match(/^tpl-([a-z_]+)-([a-z_]+)(?:-[a-z0-9]+)?-([a-z0-9]+)-[a-z0-9]+$/)
  if (!match) return null
  return {
    domain: match[1].toUpperCase(),
    templateType: match[2],
    timestamp: match[3],
  }
}
