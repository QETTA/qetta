/**
 * Cache Module
 *
 * 캐싱 레이어 모듈
 * - Redis (Upstash) 기반 분산 캐시
 * - 인메모리 폴백 지원
 *
 * @module cache
 */

// ============================================
// Redis Client
// ============================================

export {
  UniversalCache,
  getCache,
  createCache,
  getRedisClient,
  isRedisEnabled,
  CACHE_TTL,
  type CacheConfig,
  type CacheEntry,
} from './redis-client'

// ============================================
// Session Cache
// ============================================

export {
  SessionCache,
  getSessionCache,
  createSessionCache,
} from './session-cache'

// ============================================
// Domain Cache
// ============================================

export {
  DomainCache,
  getDomainCache,
  createDomainCache,
  withCompanyBlockCache,
  type DomainPreset,
  type CachedCompanyBlock,
} from './domain-cache'

// ============================================
// Template Cache
// ============================================

export {
  TemplateCache,
  templateCache,
  generateTemplateId,
  parseTemplateId,
  type CachedTemplate,
  type CachedTemplateSection,
  type TemplateVariable,
  type TemplateCacheConfig,
} from './template-cache'
