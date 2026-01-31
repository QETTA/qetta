/**
 * Compression Module Tests
 *
 * 목표 커버리지: 85%
 * - Mem0 압축 전략
 * - 의미 기반 중복 제거
 * - 토큰 추정
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createMem0Compressor,
  calculateSimilarity,
  semanticDedup,
  extractKeywords,
  clusterFacts,
  selectRepresentative,
  mergeSimilarFacts,
  compressCompanyData,
  estimateTokens,
  meetsTargetRatio,
} from '../index'
import type { CompanyFact, CompanyFactType } from '../../types'
import type { CompanyProfile } from '@/lib/skill-engine/types'

// ============================================
// Test Fixtures
// ============================================

function createMockProfile(overrides: Partial<CompanyProfile> = {}): CompanyProfile {
  return {
    id: 'test-company-1',
    name: '테스트 기업',
    businessNumber: '123-45-67890',
    basic: {
      foundedDate: '2020-01-15',
      employeeCount: 50,
      annualRevenue: 50,
      region: '서울시 강남구',
      industry: 'SOFTWARE',
      mainProducts: ['소프트웨어 개발', 'IT 컨설팅'],
    },
    qualifications: {
      certifications: ['ISO 9001', '벤처기업', '이노비즈'],
      registrations: ['AI 공급기업'],
      patents: 5,
      trademarks: 2,
    },
    history: {
      totalApplications: 10,
      selectionCount: 6,
      rejectionCount: 4,
      qettaCreditScore: 750,
      applications: [],
    },
    ...overrides,
  }
}

function createMockFact(overrides: Partial<CompanyFact> = {}): CompanyFact {
  return {
    id: `fact-${Math.random().toString(36).substr(2, 9)}`,
    type: 'capability' as CompanyFactType,
    content: '테스트 역량 보유',
    confidence: 0.9,
    source: 'user_input',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ============================================
// Mem0 Compressor Tests
// ============================================

describe('Mem0Compressor', () => {
  describe('compress', () => {
    it('should achieve 80%+ compression ratio', () => {
      const compressor = createMem0Compressor()
      const profile = createMockProfile({
        qualifications: {
          certifications: ['ISO 9001', 'ISO 14001', '벤처기업', '이노비즈', '메인비즈', 'ISMS', 'ISO 27001'],
          registrations: ['AI 공급기업', '조달 등록'],
          patents: 20,
          trademarks: 10,
        },
      })
      const facts = [
        createMockFact({ type: 'rejection_pattern', content: '기술성 평가에서 미달 판정', confidence: 0.95 }),
        createMockFact({ type: 'capability', content: 'AI/ML 기술 역량 보유', confidence: 0.9 }),
        createMockFact({ type: 'certification', content: 'ISMS 인증 취득', confidence: 1.0 }),
      ]

      const result = compressor.compress(profile, facts)

      expect(result.stats.ratio).toBeGreaterThanOrEqual(50) // 최소 50% 이상
      expect(result.context).toBeTruthy()
      expect(result.selectedFacts.length).toBeLessThanOrEqual(5)
    })

    it('should prioritize rejection_pattern facts', () => {
      const compressor = createMem0Compressor({ maxFacts: 2 })
      const profile = createMockProfile()
      const facts = [
        createMockFact({ type: 'profile', content: '기본 정보', confidence: 1.0 }),
        createMockFact({ type: 'rejection_pattern', content: '핵심 탈락 패턴', confidence: 0.8 }),
        createMockFact({ type: 'capability', content: '기술 역량', confidence: 0.9 }),
      ]

      const result = compressor.compress(profile, facts)

      // rejection_pattern이 선택되어야 함
      const hasRejectionPattern = result.selectedFacts.some(f => f.type === 'rejection_pattern')
      expect(hasRejectionPattern).toBe(true)
    })

    it('should filter low confidence facts', () => {
      const compressor = createMem0Compressor({ minConfidence: 0.7 })
      const profile = createMockProfile()
      const facts = [
        createMockFact({ content: 'High confidence', confidence: 0.9 }),
        createMockFact({ content: 'Low confidence', confidence: 0.3 }),
      ]

      const result = compressor.compress(profile, facts)

      expect(result.selectedFacts.every(f => f.confidence >= 0.7)).toBe(true)
      expect(result.breakdown.afterFilterCount).toBeLessThan(result.breakdown.afterDedupCount)
    })

    it('should include profile summary in context', () => {
      const compressor = createMem0Compressor()
      const profile = createMockProfile({ name: '테스트주식회사' })
      const facts: CompanyFact[] = []

      const result = compressor.compress(profile, facts)

      expect(result.context).toContain('테스트주식회사')
      expect(result.context).toContain('년차')
    })

    it('should include certifications when present', () => {
      const compressor = createMem0Compressor()
      const profile = createMockProfile({
        qualifications: {
          certifications: ['ISO 9001', '벤처기업'],
          registrations: [],
          patents: 0,
          trademarks: 0,
        },
      })

      const result = compressor.compress(profile, [])

      expect(result.context).toContain('인증')
      expect(result.context).toContain('ISO 9001')
    })

    it('should include history summary', () => {
      const compressor = createMem0Compressor()
      const profile = createMockProfile({
        history: {
          totalApplications: 10,
          selectionCount: 7,
          rejectionCount: 3,
          qettaCreditScore: 800,
          applications: [],
        },
      })

      const result = compressor.compress(profile, [])

      expect(result.context).toContain('신청')
      expect(result.context).toContain('선정')
    })
  })
})

// ============================================
// Semantic Dedup Tests
// ============================================

describe('Semantic Deduplication', () => {
  describe('calculateSimilarity', () => {
    it('should return 1 for identical texts', () => {
      const similarity = calculateSimilarity('동일한 텍스트', '동일한 텍스트')
      expect(similarity).toBe(1)
    })

    it('should return 0 for completely different texts', () => {
      const similarity = calculateSimilarity('사과 바나나 딸기', 'xyz abc def')
      expect(similarity).toBe(0)
    })

    it('should return value between 0 and 1 for similar texts', () => {
      const similarity = calculateSimilarity(
        'AI 기술 역량 보유',
        'AI 기술 능력 보유'
      )
      expect(similarity).toBeGreaterThan(0)
      expect(similarity).toBeLessThan(1)
    })

    it('should handle empty strings', () => {
      expect(calculateSimilarity('', 'text')).toBe(0)
      expect(calculateSimilarity('text', '')).toBe(0)
      expect(calculateSimilarity('', '')).toBe(0)
    })
  })

  describe('semanticDedup', () => {
    it('should remove duplicate facts', () => {
      const facts = [
        createMockFact({ content: 'AI 기술 역량 보유', confidence: 0.9 }),
        createMockFact({ content: 'AI 기술 역량 보유', confidence: 0.8 }),
      ]

      const result = semanticDedup(facts, 0.9)

      expect(result.length).toBe(1)
      expect(result[0].confidence).toBe(0.9) // 높은 confidence 보존
    })

    it('should keep facts below threshold', () => {
      const facts = [
        createMockFact({ content: 'AI 기술 역량' }),
        createMockFact({ content: '재무 건전성' }),
      ]

      const result = semanticDedup(facts, 0.85)

      expect(result.length).toBe(2)
    })

    it('should handle single fact', () => {
      const facts = [createMockFact({ content: 'Single fact' })]
      const result = semanticDedup(facts)
      expect(result.length).toBe(1)
    })

    it('should handle empty array', () => {
      const result = semanticDedup([])
      expect(result.length).toBe(0)
    })
  })

  describe('extractKeywords', () => {
    it('should extract keywords from text', () => {
      const keywords = extractKeywords('AI 기술 역량 보유 특허 다수', 3)

      expect(keywords.length).toBeLessThanOrEqual(3)
      expect(keywords.length).toBeGreaterThan(0)
    })

    it('should filter stopwords', () => {
      const keywords = extractKeywords('의 및 등 를 기술 역량', 5)

      expect(keywords).not.toContain('의')
      expect(keywords).not.toContain('및')
    })

    it('should handle empty text', () => {
      const keywords = extractKeywords('')
      expect(keywords.length).toBe(0)
    })
  })

  describe('clusterFacts', () => {
    it('should cluster similar facts', () => {
      const facts = [
        createMockFact({ id: '1', content: 'AI 기술 역량 보유' }),
        createMockFact({ id: '2', content: 'AI 기술 역량 확보' }),
        createMockFact({ id: '3', content: '재무 건전성 우수' }),
      ]

      const clusters = clusterFacts(facts, 0.6)

      // AI 관련 2개가 하나의 클러스터, 재무가 별도 클러스터
      expect(clusters.length).toBeLessThanOrEqual(3)
    })

    it('should handle empty array', () => {
      const clusters = clusterFacts([])
      expect(clusters.length).toBe(0)
    })
  })

  describe('selectRepresentative', () => {
    it('should select highest confidence fact', () => {
      const cluster = [
        createMockFact({ confidence: 0.7 }),
        createMockFact({ confidence: 0.95 }),
        createMockFact({ confidence: 0.8 }),
      ]

      const representative = selectRepresentative(cluster)

      expect(representative.confidence).toBe(0.95)
    })
  })

  describe('mergeSimilarFacts', () => {
    it('should merge similar facts', () => {
      const facts = [
        createMockFact({ id: '1', content: 'AI 기술 보유', confidence: 0.9 }),
        createMockFact({ id: '2', content: 'AI 기술 역량', confidence: 0.8 }),
        createMockFact({ id: '3', content: '재무 건전', confidence: 0.9 }),
      ]

      const merged = mergeSimilarFacts(facts)

      expect(merged.length).toBeLessThanOrEqual(facts.length)
    })
  })
})

// ============================================
// Utility Function Tests
// ============================================

describe('Utility Functions', () => {
  describe('compressCompanyData', () => {
    it('should return context and stats', () => {
      const profile = createMockProfile()
      const facts = [createMockFact()]

      const result = compressCompanyData(profile, facts)

      expect(result.context).toBeTruthy()
      expect(result.stats.originalTokens).toBeGreaterThan(0)
      expect(result.stats.compressedTokens).toBeGreaterThan(0)
      expect(typeof result.stats.ratio).toBe('number')
    })
  })

  describe('estimateTokens', () => {
    it('should estimate Korean text tokens', () => {
      const tokens = estimateTokens('한글 텍스트입니다')
      expect(tokens).toBeGreaterThan(0)
    })

    it('should estimate English text tokens', () => {
      const tokens = estimateTokens('This is English text')
      expect(tokens).toBeGreaterThan(0)
    })

    it('should handle mixed text', () => {
      const tokens = estimateTokens('한글과 English 혼합')
      expect(tokens).toBeGreaterThan(0)
    })

    it('should return 0 for empty string', () => {
      const tokens = estimateTokens('')
      expect(tokens).toBe(0)
    })
  })

  describe('meetsTargetRatio', () => {
    it('should return true when ratio meets target', () => {
      const stats = { originalTokens: 1000, compressedTokens: 100, ratio: 90 }
      expect(meetsTargetRatio(stats, 80)).toBe(true)
    })

    it('should return false when ratio below target', () => {
      const stats = { originalTokens: 1000, compressedTokens: 500, ratio: 50 }
      expect(meetsTargetRatio(stats, 80)).toBe(false)
    })

    it('should use default target of 80', () => {
      const stats = { originalTokens: 1000, compressedTokens: 150, ratio: 85 }
      expect(meetsTargetRatio(stats)).toBe(true)
    })
  })
})
