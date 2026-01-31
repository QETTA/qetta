/**
 * Rejection Patterns Utility Tests
 *
 * 패턴 검색 유틸리티 함수 테스트
 * - findPatternsByKeyword
 * - findPatternsByCategory
 * - findPatternsByDomain
 * - getTopRejectionCauses
 */

import { describe, it, expect } from 'vitest'
import {
  REJECTION_PATTERNS,
  findPatternsByKeyword,
  findPatternsByCategory,
  findPatternsByDomain,
  getTopRejectionCauses,
} from '../patterns'
import type { RejectionCategory, EnginePresetType } from '../../types'

// ============================================
// REJECTION_PATTERNS 기본 검증
// ============================================

describe('REJECTION_PATTERNS', () => {
  it('has at least 10 patterns', () => {
    expect(REJECTION_PATTERNS.length).toBeGreaterThanOrEqual(10)
  })

  it('all patterns have required fields', () => {
    for (const pattern of REJECTION_PATTERNS) {
      expect(pattern.id).toBeDefined()
      expect(pattern.category).toBeDefined()
      expect(pattern.domain).toBeDefined()
      expect(pattern.pattern.keywords).toBeInstanceOf(Array)
      expect(pattern.pattern.keywords.length).toBeGreaterThan(0)
      expect(pattern.stats.frequency).toBeGreaterThanOrEqual(0)
      expect(pattern.stats.preventionRate).toBeGreaterThanOrEqual(0)
      expect(pattern.solution).toBeDefined()
    }
  })
})

// ============================================
// findPatternsByKeyword (lines 477-481)
// ============================================

describe('findPatternsByKeyword', () => {
  it('finds patterns matching keyword (case-insensitive)', () => {
    // '서류' 키워드는 missing_document 패턴에서 발견됨
    const results = findPatternsByKeyword('서류')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((p) => p.category === 'missing_document')).toBe(true)
  })

  it('handles uppercase keywords', () => {
    // 'CLEANSYS'는 환경부 패턴에서 발견됨
    const results = findPatternsByKeyword('CLEANSYS')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((p) => p.domain === 'ENVIRONMENT')).toBe(true)
  })

  it('handles lowercase keywords', () => {
    const results = findPatternsByKeyword('cleansys')
    expect(results.length).toBeGreaterThan(0)
  })

  it('finds patterns by partial keyword match', () => {
    // '누락' 부분 매칭
    const results = findPatternsByKeyword('누락')
    expect(results.length).toBeGreaterThan(0)
  })

  it('returns empty array for non-matching keyword', () => {
    const results = findPatternsByKeyword('존재하지않는키워드xyz123')
    expect(results).toEqual([])
  })

  it('handles empty keyword', () => {
    // 빈 문자열은 모든 패턴과 매칭될 수 있음 (includes(''))는 true)
    const results = findPatternsByKeyword('')
    expect(results.length).toBe(REJECTION_PATTERNS.length)
  })

  it('finds multiple patterns for common keyword', () => {
    // '미달' 같은 공통 키워드는 여러 패턴에서 발견
    const results = findPatternsByKeyword('미달')
    // qualification_fail 카테고리에서 발견될 가능성 높음
    expect(results.length).toBeGreaterThanOrEqual(1)
  })
})

// ============================================
// findPatternsByCategory
// ============================================

describe('findPatternsByCategory', () => {
  it('finds patterns by missing_document category', () => {
    const results = findPatternsByCategory('missing_document')
    expect(results.length).toBeGreaterThan(0)
    results.forEach((p) => expect(p.category).toBe('missing_document'))
  })

  it('finds patterns by format_error category', () => {
    const results = findPatternsByCategory('format_error')
    expect(results.length).toBeGreaterThan(0)
    results.forEach((p) => expect(p.category).toBe('format_error'))
  })

  it('finds patterns by qualification_fail category', () => {
    const results = findPatternsByCategory('qualification_fail')
    expect(results.length).toBeGreaterThan(0)
    results.forEach((p) => expect(p.category).toBe('qualification_fail'))
  })

  it('finds patterns by experience_lack category', () => {
    const results = findPatternsByCategory('experience_lack')
    expect(results.length).toBeGreaterThan(0)
    results.forEach((p) => expect(p.category).toBe('experience_lack'))
  })

  it('returns empty for non-existent category', () => {
    const results = findPatternsByCategory('nonexistent_category' as RejectionCategory)
    expect(results).toEqual([])
  })
})

// ============================================
// findPatternsByDomain
// ============================================

describe('findPatternsByDomain', () => {
  it('finds patterns for ENVIRONMENT domain', () => {
    const results = findPatternsByDomain('ENVIRONMENT')
    expect(results.length).toBeGreaterThan(0)
    // 'all' 도메인 패턴도 포함됨
    results.forEach((p) => expect(['ENVIRONMENT', 'all']).toContain(p.domain))
  })

  it('finds patterns for MANUFACTURING domain', () => {
    const results = findPatternsByDomain('MANUFACTURING')
    expect(results.length).toBeGreaterThan(0)
    results.forEach((p) => expect(['MANUFACTURING', 'all']).toContain(p.domain))
  })

  it('includes all-domain patterns for any domain query', () => {
    const allDomainPatterns = REJECTION_PATTERNS.filter((p) => p.domain === 'all')

    // 모든 도메인 쿼리에 'all' 패턴이 포함되어야 함
    const envResults = findPatternsByDomain('ENVIRONMENT')
    const mfgResults = findPatternsByDomain('MANUFACTURING')

    // 'all' 도메인 패턴 개수 확인
    expect(envResults.filter((p) => p.domain === 'all').length).toBe(allDomainPatterns.length)
    expect(mfgResults.filter((p) => p.domain === 'all').length).toBe(allDomainPatterns.length)
  })

  it('returns only all-domain patterns for unknown domain', () => {
    const results = findPatternsByDomain('UNKNOWN_DOMAIN' as EnginePresetType)
    // unknown 도메인이면 'all' 패턴만 반환
    results.forEach((p) => expect(p.domain).toBe('all'))
  })
})

// ============================================
// getTopRejectionCauses
// ============================================

describe('getTopRejectionCauses', () => {
  it('returns top 5 causes by default', () => {
    const results = getTopRejectionCauses()
    expect(results.length).toBeLessThanOrEqual(5)
  })

  it('returns specified number of causes', () => {
    const results = getTopRejectionCauses(3)
    expect(results.length).toBeLessThanOrEqual(3)
  })

  it('returns patterns sorted by frequency (descending)', () => {
    const results = getTopRejectionCauses(10)
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].stats.frequency).toBeGreaterThanOrEqual(results[i + 1].stats.frequency)
    }
  })

  it('handles limit larger than total patterns', () => {
    const results = getTopRejectionCauses(1000)
    expect(results.length).toBe(REJECTION_PATTERNS.length)
  })

  it('returns empty array when limit is 0', () => {
    const results = getTopRejectionCauses(0)
    expect(results).toEqual([])
  })

  it('does not modify original REJECTION_PATTERNS array', () => {
    const originalOrder = [...REJECTION_PATTERNS.map((p) => p.id)]
    getTopRejectionCauses(10)
    const afterOrder = REJECTION_PATTERNS.map((p) => p.id)
    expect(afterOrder).toEqual(originalOrder)
  })
})
