/**
 * CompanyBlockManager Tests
 *
 * 목표 커버리지: 85%
 * - CRUD 작업
 * - Fact 관리
 * - 압축 (Mem0 패턴)
 * - 학습 기능
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CompanyBlockManager, createCompanyBlockManager } from '../company-block'
import type { CompanyProfile, ApplicationHistory, RejectionPattern } from '@/lib/skill-engine/types'

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
      annualRevenue: 50, // 억 단위
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
      applications: [
        {
          id: 'app-1',
          programId: 'prog-ai-voucher',
          programName: 'AI 바우처',
          source: 'MSS',
          type: 'voucher',
          result: 'rejected',
          appliedAt: '2024-06-15',
          rejectionReason: '기술성 미달',
          feedbackApplied: false,
        },
        {
          id: 'app-2',
          programId: 'prog-smart-factory',
          programName: '스마트공장',
          source: 'MSS',
          type: 'subsidy',
          result: 'selected',
          appliedAt: '2024-03-01',
          amount: 5000,
          feedbackApplied: true,
        },
      ],
    },
    ...overrides,
  } as CompanyProfile
}

// ============================================
// Tests
// ============================================

describe('CompanyBlockManager', () => {
  let manager: CompanyBlockManager

  beforeEach(() => {
    manager = createCompanyBlockManager()
  })

  afterEach(() => {
    manager.clear()
  })

  describe('CRUD Operations', () => {
    it('should create a company block', () => {
      const profile = createMockProfile()
      const block = manager.create(profile)

      expect(block.companyId).toBe('test-company-1')
      expect(block.profile.name).toBe('테스트 기업')
      expect(block.facts.length).toBeGreaterThan(0)
      expect(block.updatedAt).toBeDefined()
    })

    it('should get a company block by id', () => {
      const profile = createMockProfile()
      manager.create(profile)

      const block = manager.get('test-company-1')

      expect(block).toBeDefined()
      expect(block?.companyId).toBe('test-company-1')
    })

    it('should return undefined for non-existent company', () => {
      const block = manager.get('non-existent')

      expect(block).toBeUndefined()
    })

    it('should update a company block', () => {
      const profile = createMockProfile()
      manager.create(profile)

      const updatedProfile = createMockProfile({ name: '업데이트된 기업' })
      const updated = manager.update('test-company-1', { profile: updatedProfile })

      expect(updated.profile.name).toBe('업데이트된 기업')
      expect(updated.companyId).toBe('test-company-1') // ID unchanged
    })

    it('should throw error when updating non-existent company', () => {
      expect(() => manager.update('non-existent', {})).toThrow('Company not found')
    })

    it('should delete a company block', () => {
      const profile = createMockProfile()
      manager.create(profile)

      const deleted = manager.delete('test-company-1')

      expect(deleted).toBe(true)
      expect(manager.get('test-company-1')).toBeUndefined()
    })

    it('should return false when deleting non-existent company', () => {
      const deleted = manager.delete('non-existent')

      expect(deleted).toBe(false)
    })

    it('should get all company blocks', () => {
      manager.create(createMockProfile({ id: 'company-1' }))
      manager.create(createMockProfile({ id: 'company-2' }))

      const all = manager.getAll()

      expect(all.length).toBe(2)
    })

    it('should clear all company blocks', () => {
      manager.create(createMockProfile({ id: 'company-1' }))
      manager.create(createMockProfile({ id: 'company-2' }))

      manager.clear()

      expect(manager.getAll().length).toBe(0)
    })
  })

  describe('Fact Management', () => {
    beforeEach(() => {
      manager.create(createMockProfile())
    })

    it('should add a new fact', () => {
      const fact = manager.addFact('test-company-1', {
        type: 'capability',
        content: 'AI 기술 역량 보유',
        confidence: 0.9,
        source: 'user_input',
      })

      expect(fact.id).toBeDefined()
      expect(fact.content).toBe('AI 기술 역량 보유')
      expect(fact.createdAt).toBeDefined()
    })

    it('should throw error when adding fact to non-existent company', () => {
      expect(() =>
        manager.addFact('non-existent', {
          type: 'capability',
          content: 'Test',
          confidence: 1,
          source: 'user_input',
        })
      ).toThrow('Company not found')
    })

    it('should get all facts', () => {
      const facts = manager.getFacts('test-company-1')

      expect(facts.length).toBeGreaterThan(0)
    })

    it('should filter facts by type', () => {
      manager.addFact('test-company-1', {
        type: 'capability',
        content: 'AI 역량',
        confidence: 0.9,
        source: 'user_input',
      })

      const capabilities = manager.getFacts('test-company-1', ['capability'])

      expect(capabilities.every((f) => f.type === 'capability')).toBe(true)
    })

    it('should return empty array for non-existent company facts', () => {
      const facts = manager.getFacts('non-existent')

      expect(facts).toEqual([])
    })

    it('should remove a fact', () => {
      const fact = manager.addFact('test-company-1', {
        type: 'capability',
        content: 'To be removed',
        confidence: 1,
        source: 'user_input',
      })

      const removed = manager.removeFact('test-company-1', fact.id)

      expect(removed).toBe(true)
      expect(manager.getFacts('test-company-1').find((f) => f.id === fact.id)).toBeUndefined()
    })

    it('should return false when removing non-existent fact', () => {
      const removed = manager.removeFact('test-company-1', 'non-existent-fact')

      expect(removed).toBe(false)
    })

    it('should cleanup expired facts', () => {
      // Add expired fact
      const block = manager.get('test-company-1')!
      block.facts.push({
        id: 'expired-fact',
        type: 'capability',
        content: 'Expired',
        confidence: 1,
        source: 'user_input',
        createdAt: '2020-01-01',
        expiresAt: '2020-01-02', // Past date
      })

      const removed = manager.cleanupExpiredFacts('test-company-1')

      expect(removed).toBe(1)
    })

    it('should return 0 when no expired facts', () => {
      const removed = manager.cleanupExpiredFacts('test-company-1')

      // Initial facts don't have expiresAt, so 0 removed
      expect(removed).toBe(0)
    })

    it('should return 0 for non-existent company cleanup', () => {
      const removed = manager.cleanupExpiredFacts('non-existent')

      expect(removed).toBe(0)
    })
  })

  describe('Compression (Mem0 Pattern)', () => {
    it('should calculate compression stats', () => {
      const profile = createMockProfile()
      const block = manager.create(profile)

      expect(block.compression.originalTokens).toBeGreaterThan(0)
      expect(block.compression.compressedTokens).toBeGreaterThan(0)
      expect(block.compression.ratio).toBeGreaterThanOrEqual(0)
    })

    it('should achieve meaningful compression ratio', () => {
      // Create profile with lots of data
      const profile = createMockProfile({
        qualifications: {
          certifications: [
            'ISO 9001',
            'ISO 14001',
            '벤처기업',
            '이노비즈',
            '메인비즈',
            'ISMS',
            'ISO 27001',
          ],
          registrations: ['AI 공급기업', '조달 등록'],
          patents: 20,
          trademarks: 10,
        },
      })
      const block = manager.create(profile)

      // Should achieve at least 50% compression
      expect(block.compression.ratio).toBeGreaterThanOrEqual(50)
    })

    it('should get compressed context within token budget', () => {
      manager.create(createMockProfile())

      const context = manager.getCompressedContext('test-company-1', 500)

      expect(context.length).toBeGreaterThan(0)
      expect(context).toContain('테스트 기업')
    })

    it('should return empty string for non-existent company context', () => {
      const context = manager.getCompressedContext('non-existent')

      expect(context).toBe('')
    })

    it('should include key facts in compressed context', () => {
      manager.create(createMockProfile())
      manager.addFact('test-company-1', {
        type: 'rejection_pattern',
        content: '기술성 평가 주의 필요',
        confidence: 0.95,
        source: 'ai_inferred',
      })

      const context = manager.getCompressedContext('test-company-1')

      // rejection_pattern has highest priority, should be included
      expect(context).toContain('기술성')
    })
  })

  describe('Learning', () => {
    beforeEach(() => {
      manager.create(createMockProfile())
    })

    it('should learn from application history - selected', () => {
      const history: ApplicationHistory = {
        id: 'app-new',
        programId: 'prog-digital',
        programName: '디지털 전환',
        source: 'MSS',
        type: 'subsidy',
        result: 'selected',
        appliedAt: '2024-09-01',
        amount: 10000,
        feedbackApplied: false,
      }

      manager.learnFromApplication('test-company-1', history)

      const facts = manager.getFacts('test-company-1', ['application'])
      const newFact = facts.find((f) => f.relatedId === 'app-new')

      expect(newFact).toBeDefined()
      expect(newFact?.content).toContain('디지털 전환')
      expect(newFact?.content).toContain('선정')
    })

    it('should learn from application history - rejected', () => {
      const history: ApplicationHistory = {
        id: 'app-rej',
        programId: 'prog-rnd-voucher',
        programName: 'R&D 바우처',
        source: 'MSS',
        type: 'voucher',
        result: 'rejected',
        appliedAt: '2024-08-01',
        rejectionReason: '서류 미비',
        feedbackApplied: false,
      }

      manager.learnFromApplication('test-company-1', history)

      const facts = manager.getFacts('test-company-1', ['application'])
      const newFact = facts.find((f) => f.relatedId === 'app-rej')

      expect(newFact?.content).toContain('탈락')
      expect(newFact?.content).toContain('서류 미비')
    })

    it('should learn from rejection pattern', () => {
      const pattern: RejectionPattern = {
        id: 'pattern-1',
        category: 'technical_fail',
        domain: 'all',
        pattern: {
          keywords: ['기술성', '기술 역량', '미흡'],
          context: '핵심 기술 역량 미흡',
        },
        stats: {
          frequency: 3,
          preventionRate: 80,
          avgRecoveryDays: 90,
        },
        solution: {
          immediate: '기술 역량 강화 후 재신청',
          prevention: 'R&D 투자 확대 및 기술 인력 확보',
          documents: ['기술개발계획서', '특허 현황'],
          checklistItems: ['기술 인력 확보', 'R&D 투자 계획'],
        },
        metadata: {
          confidence: 0.85,
          source: 'ai_inferred',
          lastUpdated: '2024-09-01',
          sampleCount: 10,
        },
      }

      manager.learnFromRejection('test-company-1', pattern)

      const facts = manager.getFacts('test-company-1', ['rejection_pattern'])
      const newFact = facts.find((f) => f.relatedId === 'pattern-1')

      expect(newFact).toBeDefined()
      expect(newFact?.content).toContain('technical_fail')
      expect(newFact?.confidence).toBe(0.85)
    })

    it('should not add fact if company does not exist', () => {
      // Should not throw, just silently return
      manager.learnFromApplication('non-existent', {
        id: 'app-x',
        programId: 'prog-test',
        programName: 'Test',
        source: 'MSS',
        type: 'subsidy',
        result: 'selected',
        appliedAt: '2024-01-01',
        feedbackApplied: false,
      })

      // No error thrown
      expect(true).toBe(true)
    })
  })

  describe('Fact Priority', () => {
    beforeEach(() => {
      manager.create(createMockProfile())
    })

    it('should prioritize rejection_pattern facts', () => {
      // Add various fact types
      manager.addFact('test-company-1', {
        type: 'profile',
        content: 'Low priority',
        confidence: 1,
        source: 'user_input',
      })
      manager.addFact('test-company-1', {
        type: 'rejection_pattern',
        content: 'High priority rejection',
        confidence: 0.9,
        source: 'ai_inferred',
      })
      manager.addFact('test-company-1', {
        type: 'capability',
        content: 'Medium priority',
        confidence: 1,
        source: 'user_input',
      })

      const context = manager.getCompressedContext('test-company-1')

      // rejection_pattern should appear before profile
      const rejectionIndex = context.indexOf('High priority rejection')
      const profileIndex = context.indexOf('Low priority')

      if (rejectionIndex !== -1 && profileIndex !== -1) {
        expect(rejectionIndex).toBeLessThan(profileIndex)
      }
    })
  })

  describe('Token Estimation', () => {
    it('should estimate tokens for Korean text', () => {
      const profile = createMockProfile()
      const block = manager.create(profile)

      // Korean text should have higher token count per character
      expect(block.compression.originalTokens).toBeGreaterThan(100)
    })

    it('should estimate tokens for mixed text', () => {
      const profile = createMockProfile({
        qualifications: {
          certifications: ['ISO 9001', 'ISO 14001', 'ISMS-P'],
          registrations: ['AI 공급기업'],
          patents: 5,
          trademarks: 2,
        },
      })
      const block = manager.create(profile)

      expect(block.compression.originalTokens).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle profile with no certifications', () => {
      const profile = createMockProfile({
        qualifications: {
          certifications: [],
          registrations: [],
          patents: 0,
          trademarks: 0,
        },
      })

      const block = manager.create(profile)

      expect(block).toBeDefined()
      expect(block.compression.ratio).toBeGreaterThanOrEqual(0)
    })

    it('should handle profile with no application history', () => {
      const profile = createMockProfile({
        history: {
          totalApplications: 0,
          selectionCount: 0,
          rejectionCount: 0,
          qettaCreditScore: 500,
          applications: [],
        },
      })

      const block = manager.create(profile)

      expect(block).toBeDefined()
    })

    it('should handle very recent company', () => {
      const today = new Date().toISOString().split('T')[0]
      const profile = createMockProfile({
        basic: {
          foundedDate: today,
          employeeCount: 1,
          annualRevenue: 0,
          region: '서울',
          industry: 'SOFTWARE',
          mainProducts: ['소프트웨어'],
        },
      })

      const block = manager.create(profile)
      const context = manager.getCompressedContext(profile.id)

      expect(context).toContain('0년차')
    })
  })
})
