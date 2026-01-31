/**
 * Domain Cache
 *
 * 도메인 프리셋 및 Company Block 캐싱.
 * - 도메인 프리셋: 7일 TTL (거의 불변)
 * - Company Block: 1시간 TTL (프로필 변경 가능)
 *
 * Key 패턴:
 * - domain:{industryBlock}:{programType} - 도메인 프리셋
 * - company:{companyId} - Company Block
 * - company:{companyId}:facts - Company Facts
 */

import { UniversalCache, getCache, CACHE_TTL } from './redis-client'
import { logger } from '@/lib/api/logger'
import type { CompanyBlock, CompanyFact } from '@/lib/block-engine/types'

// ============================================
// Constants
// ============================================

const DOMAIN_PREFIX = 'domain:'
const COMPANY_PREFIX = 'company:'

// ============================================
// Types
// ============================================

export interface DomainPreset {
  /** 산업 블록 */
  industryBlock: string
  /** 프로그램 유형 */
  programType: string
  /** 도메인 용어집 */
  terminology: Record<string, string>
  /** 핵심 평가 기준 */
  evaluationCriteria: string[]
  /** 성공 패턴 */
  successPatterns: string[]
  /** 일반적 탈락 사유 */
  commonRejectionReasons: string[]
  /** 추천 인증 */
  recommendedCertifications: string[]
  /** 메타데이터 */
  metadata: {
    version: string
    updatedAt: string
  }
}

export interface CachedCompanyBlock {
  /** Company Block 데이터 */
  block: CompanyBlock
  /** 캐시 시각 */
  cachedAt: string
  /** 압축 컨텍스트 (선택적) */
  compressedContext?: string
}

// ============================================
// Domain Cache Class
// ============================================

export class DomainCache {
  private cache: UniversalCache

  constructor(cache?: UniversalCache) {
    this.cache = cache ?? getCache()
  }

  // ============================================
  // Domain Preset Operations
  // ============================================

  /**
   * 도메인 프리셋 키 생성
   */
  private domainKey(industryBlock: string, programType: string): string {
    return `${DOMAIN_PREFIX}${industryBlock}:${programType}`
  }

  /**
   * 도메인 프리셋을 조회합니다.
   */
  async getDomainPreset(
    industryBlock: string,
    programType: string
  ): Promise<DomainPreset | null> {
    const key = this.domainKey(industryBlock, programType)
    const preset = await this.cache.getJson<DomainPreset>(key)

    if (preset) {
      logger.debug(`[DomainCache] Hit: ${industryBlock}/${programType}`)
    }

    return preset
  }

  /**
   * 도메인 프리셋을 저장합니다.
   */
  async setDomainPreset(preset: DomainPreset): Promise<void> {
    const key = this.domainKey(preset.industryBlock, preset.programType)
    await this.cache.setJson(key, preset, CACHE_TTL.DOMAIN_PRESET)
    logger.debug(`[DomainCache] Set: ${preset.industryBlock}/${preset.programType}`)
  }

  /**
   * 산업별 모든 프리셋을 조회합니다.
   */
  async getDomainPresetsByIndustry(industryBlock: string): Promise<DomainPreset[]> {
    const keys = await this.cache.keys(`${DOMAIN_PREFIX}${industryBlock}:*`)
    if (keys.length === 0) return []

    const presets = await Promise.all(
      keys.map(key => this.cache.getJson<DomainPreset>(key))
    )

    return presets.filter((p): p is DomainPreset => p !== null)
  }

  /**
   * 도메인 프리셋을 삭제합니다.
   */
  async deleteDomainPreset(industryBlock: string, programType: string): Promise<void> {
    const key = this.domainKey(industryBlock, programType)
    await this.cache.del(key)
  }

  // ============================================
  // Company Block Operations
  // ============================================

  /**
   * Company Block 키 생성
   */
  private companyKey(companyId: string): string {
    return `${COMPANY_PREFIX}${companyId}`
  }

  /**
   * Company Facts 키 생성
   */
  private factsKey(companyId: string): string {
    return `${COMPANY_PREFIX}${companyId}:facts`
  }

  /**
   * Company Block을 조회합니다.
   */
  async getCompanyBlock(companyId: string): Promise<CachedCompanyBlock | null> {
    const key = this.companyKey(companyId)
    const cached = await this.cache.getJson<CachedCompanyBlock>(key)

    if (cached) {
      logger.debug(`[DomainCache] Company hit: ${companyId}`)
    }

    return cached
  }

  /**
   * Company Block을 저장합니다.
   */
  async setCompanyBlock(
    companyId: string,
    block: CompanyBlock,
    compressedContext?: string
  ): Promise<void> {
    const key = this.companyKey(companyId)
    const cached: CachedCompanyBlock = {
      block,
      cachedAt: new Date().toISOString(),
      compressedContext,
    }

    await this.cache.setJson(key, cached, CACHE_TTL.COMPANY_BLOCK)
    logger.debug(`[DomainCache] Company set: ${companyId}`)
  }

  /**
   * Company Block을 삭제합니다.
   */
  async deleteCompanyBlock(companyId: string): Promise<void> {
    await this.cache.del(this.companyKey(companyId))
    await this.cache.del(this.factsKey(companyId))
    logger.debug(`[DomainCache] Company deleted: ${companyId}`)
  }

  /**
   * Company Facts를 조회합니다.
   */
  async getCompanyFacts(companyId: string): Promise<CompanyFact[] | null> {
    const key = this.factsKey(companyId)
    return this.cache.getJson<CompanyFact[]>(key)
  }

  /**
   * Company Facts를 저장합니다.
   */
  async setCompanyFacts(companyId: string, facts: CompanyFact[]): Promise<void> {
    const key = this.factsKey(companyId)
    await this.cache.setJson(key, facts, CACHE_TTL.COMPANY_BLOCK)
  }

  /**
   * Company Block을 무효화합니다 (데이터 변경 시).
   */
  async invalidateCompanyBlock(companyId: string): Promise<void> {
    await this.deleteCompanyBlock(companyId)
    logger.info(`[DomainCache] Company invalidated: ${companyId}`)
  }

  // ============================================
  // Batch Operations
  // ============================================

  /**
   * 여러 Company Block을 한번에 조회합니다.
   */
  async getCompanyBlocks(companyIds: string[]): Promise<Map<string, CachedCompanyBlock>> {
    const keys = companyIds.map(id => this.companyKey(id))
    const results = await this.cache.mget<CachedCompanyBlock>(...keys)

    const map = new Map<string, CachedCompanyBlock>()
    for (let i = 0; i < companyIds.length; i++) {
      const result = results[i]
      if (result) {
        map.set(companyIds[i], result)
      }
    }

    return map
  }

  /**
   * 모든 도메인 프리셋 키를 조회합니다.
   */
  async getAllDomainPresetKeys(): Promise<string[]> {
    return this.cache.keys(`${DOMAIN_PREFIX}*`)
  }

  /**
   * 모든 Company Block 키를 조회합니다.
   */
  async getAllCompanyBlockKeys(): Promise<string[]> {
    const keys = await this.cache.keys(`${COMPANY_PREFIX}*`)
    // facts 키 제외
    return keys.filter(key => !key.endsWith(':facts'))
  }

  // ============================================
  // Stats
  // ============================================

  /**
   * 캐시 통계를 조회합니다.
   */
  async getStats(): Promise<{
    backend: 'redis' | 'memory'
    domainPresetCount: number
    companyBlockCount: number
  }> {
    const domainKeys = await this.getAllDomainPresetKeys()
    const companyKeys = await this.getAllCompanyBlockKeys()

    return {
      backend: this.cache.isUsingRedis() ? 'redis' : 'memory',
      domainPresetCount: domainKeys.length,
      companyBlockCount: companyKeys.length,
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let domainCacheInstance: DomainCache | null = null

export function getDomainCache(): DomainCache {
  if (!domainCacheInstance) {
    domainCacheInstance = new DomainCache()
  }
  return domainCacheInstance
}

// ============================================
// Factory Function
// ============================================

export function createDomainCache(cache?: UniversalCache): DomainCache {
  return new DomainCache(cache)
}

// ============================================
// Utility Functions
// ============================================

/**
 * Company Block 캐시 데코레이터
 * DB 조회 함수에 캐싱을 추가합니다.
 */
export function withCompanyBlockCache<T extends (...args: unknown[]) => Promise<CompanyBlock | null>>(
  fn: T,
  getCompanyId: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const companyId = getCompanyId(...args)
    const cache = getDomainCache()

    // 캐시 조회
    const cached = await cache.getCompanyBlock(companyId)
    if (cached) {
      return cached.block
    }

    // 원본 함수 호출
    const result = await fn(...args)

    // 캐시 저장
    if (result) {
      await cache.setCompanyBlock(companyId, result)
    }

    return result
  }) as T
}
