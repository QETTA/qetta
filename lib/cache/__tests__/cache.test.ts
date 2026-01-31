/**
 * Cache Module Tests
 *
 * 목표 커버리지: 80%
 * - Redis 클라이언트 (폴백 모드)
 * - 세션 캐시
 * - 도메인 캐시
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  UniversalCache,
  createCache,
  CACHE_TTL,
} from '../redis-client'
import { SessionCache, createSessionCache } from '../session-cache'
import { DomainCache, createDomainCache, type DomainPreset } from '../domain-cache'
import type { CompanyBlock, CompanyFact } from '@/lib/block-engine/types'

// ============================================
// Test Fixtures
// ============================================

function createMockCompanyBlock(overrides: Partial<CompanyBlock> = {}): CompanyBlock {
  return {
    companyId: 'company-1',
    version: 1,
    profile: {
      id: 'company-1',
      name: '테스트 기업',
      businessNumber: '123-45-67890',
      industry: 'SOFTWARE',
      basic: {
        foundedDate: '2020-01-15',
        employeeCount: 50,
        annualRevenue: 50,
        address: '서울시 강남구',
      },
      qualifications: {
        certifications: ['ISO 9001'],
        patents: 5,
        trademarks: 2,
      },
      history: {
        totalApplications: 10,
        selectionCount: 6,
        rejectionCount: 4,
        applications: [],
      },
    },
    facts: [],
    compression: {
      originalTokens: 1000,
      compressedTokens: 200,
      ratio: 80,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as CompanyBlock
}

function createMockDomainPreset(overrides: Partial<DomainPreset> = {}): DomainPreset {
  return {
    industryBlock: 'SOFTWARE',
    programType: 'R&D',
    terminology: { AI: '인공지능', ML: '머신러닝' },
    evaluationCriteria: ['기술성', '사업성', '시장성'],
    successPatterns: ['명확한 기술 차별화', '구체적 사업화 계획'],
    commonRejectionReasons: ['기술성 부족', '시장 분석 미흡'],
    recommendedCertifications: ['벤처기업', 'ISO 9001'],
    metadata: {
      version: '1.0',
      updatedAt: new Date().toISOString(),
    },
    ...overrides,
  }
}

// ============================================
// UniversalCache Tests
// ============================================

describe('UniversalCache', () => {
  let cache: UniversalCache

  beforeEach(() => {
    cache = createCache({ debug: false })
  })

  afterEach(() => {
    cache.stop()
  })

  describe('basic operations', () => {
    it('should set and get string value', async () => {
      await cache.set('test-key', 'test-value')
      const result = await cache.get<string>('test-key')

      expect(result).toBe('test-value')
    })

    it('should set and get object value', async () => {
      const obj = { name: 'test', value: 123 }
      await cache.set('obj-key', obj)
      const result = await cache.get<typeof obj>('obj-key')

      expect(result).toEqual(obj)
    })

    it('should return null for non-existent key', async () => {
      const result = await cache.get('non-existent')
      expect(result).toBeNull()
    })

    it('should delete key', async () => {
      await cache.set('to-delete', 'value')
      await cache.del('to-delete')
      const result = await cache.get('to-delete')

      expect(result).toBeNull()
    })

    it('should check key existence', async () => {
      await cache.set('exists-key', 'value')

      expect(await cache.exists('exists-key')).toBe(true)
      expect(await cache.exists('not-exists')).toBe(false)
    })
  })

  describe('TTL handling', () => {
    it('should expire key after TTL', async () => {
      await cache.set('expire-key', 'value', 1) // 1초 TTL

      // 바로 조회하면 존재
      expect(await cache.get('expire-key')).toBe('value')

      // 1.1초 후 만료
      await new Promise(resolve => setTimeout(resolve, 1100))
      expect(await cache.get('expire-key')).toBeNull()
    })

    it('should use default TTL from CACHE_TTL', () => {
      expect(CACHE_TTL.SESSION_CONTEXT).toBe(30 * 60)
      expect(CACHE_TTL.COMPANY_BLOCK).toBe(60 * 60)
      expect(CACHE_TTL.DOMAIN_PRESET).toBe(7 * 24 * 60 * 60)
    })
  })

  describe('JSON operations', () => {
    it('should set and get JSON object', async () => {
      const data = { name: '테스트', count: 42, nested: { a: 1 } }
      await cache.setJson('json-key', data)
      const result = await cache.getJson<typeof data>('json-key')

      expect(result).toEqual(data)
    })

    it('should return null for non-existent JSON key', async () => {
      const result = await cache.getJson('non-json')
      expect(result).toBeNull()
    })
  })

  describe('pattern matching', () => {
    it('should find keys by pattern', async () => {
      await cache.set('prefix:a', '1')
      await cache.set('prefix:b', '2')
      await cache.set('other:c', '3')

      const keys = await cache.keys('prefix:*')

      expect(keys).toHaveLength(2)
      expect(keys).toContain('prefix:a')
      expect(keys).toContain('prefix:b')
    })
  })

  describe('mget', () => {
    it('should get multiple keys at once', async () => {
      await cache.set('m1', 'v1')
      await cache.set('m2', 'v2')
      await cache.set('m3', 'v3')

      const results = await cache.mget<string>('m1', 'm2', 'm4')

      expect(results[0]).toBe('v1')
      expect(results[1]).toBe('v2')
      expect(results[2]).toBeNull() // m4 없음
    })
  })

  describe('stats', () => {
    it('should return stats', () => {
      const stats = cache.getStats()

      expect(stats.backend).toBe('memory') // Redis 없으므로 memory
      expect(typeof stats.fallbackSize).toBe('number')
    })
  })
})

// ============================================
// SessionCache Tests
// ============================================

describe('SessionCache', () => {
  let sessionCache: SessionCache
  let mockCache: UniversalCache

  beforeEach(() => {
    mockCache = createCache({ debug: false })
    sessionCache = createSessionCache(mockCache)
  })

  afterEach(() => {
    mockCache.stop()
  })

  describe('session lifecycle', () => {
    it('should create new session', async () => {
      const session = await sessionCache.create()

      expect(session.sessionId).toMatch(/^session-/)
      expect(session.intent.type).toBe('question_answer')
      expect(session.messages).toHaveLength(0)
    })

    it('should get existing session', async () => {
      const created = await sessionCache.create()
      const retrieved = await sessionCache.get(created.sessionId)

      expect(retrieved).not.toBeNull()
      expect(retrieved!.sessionId).toBe(created.sessionId)
    })

    it('should return null for non-existent session', async () => {
      const result = await sessionCache.get('non-existent-session')
      expect(result).toBeNull()
    })

    it('should destroy session', async () => {
      const session = await sessionCache.create()
      await sessionCache.destroy(session.sessionId)

      const result = await sessionCache.get(session.sessionId)
      expect(result).toBeNull()
    })

    it('should check session existence', async () => {
      const session = await sessionCache.create()

      expect(await sessionCache.exists(session.sessionId)).toBe(true)
      expect(await sessionCache.exists('non-existent')).toBe(false)
    })
  })

  describe('message management', () => {
    it('should add user message', async () => {
      const session = await sessionCache.create()
      const message = await sessionCache.addMessage(session.sessionId, {
        role: 'user',
        content: '제안서 작성해줘',
      })

      expect(message).not.toBeNull()
      expect(message!.role).toBe('user')
      expect(message!.id).toMatch(/^msg-/)
    })

    it('should add assistant message', async () => {
      const session = await sessionCache.create()
      const message = await sessionCache.addMessage(session.sessionId, {
        role: 'assistant',
        content: '네, 제안서를 작성하겠습니다.',
      })

      expect(message).not.toBeNull()
      expect(message!.role).toBe('assistant')
    })

    it('should get recent messages', async () => {
      const session = await sessionCache.create()

      for (let i = 0; i < 5; i++) {
        await sessionCache.addMessage(session.sessionId, {
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `메시지 ${i}`,
        })
      }

      const messages = await sessionCache.getRecentMessages(session.sessionId, 3)
      expect(messages).toHaveLength(3)
      expect(messages[2].content).toBe('메시지 4')
    })

    it('should return null when adding message to non-existent session', async () => {
      const result = await sessionCache.addMessage('non-existent', {
        role: 'user',
        content: 'test',
      })

      expect(result).toBeNull()
    })
  })

  describe('intent detection', () => {
    it('should detect document_generation intent', async () => {
      const session = await sessionCache.create()
      await sessionCache.addMessage(session.sessionId, {
        role: 'user',
        content: '사업계획서 작성해줘',
      })

      const updated = await sessionCache.get(session.sessionId)
      expect(updated!.intent.type).toBe('document_generation')
      expect(updated!.intent.confidence).toBeGreaterThan(0.5)
    })

    it('should detect rejection_analysis intent', async () => {
      const session = await sessionCache.create()
      await sessionCache.addMessage(session.sessionId, {
        role: 'user',
        content: '왜 탈락했는지 분석해줘',
      })

      const updated = await sessionCache.get(session.sessionId)
      expect(updated!.intent.type).toBe('rejection_analysis')
    })

    it('should detect program_search intent', async () => {
      const session = await sessionCache.create()
      await sessionCache.addMessage(session.sessionId, {
        role: 'user',
        content: '지원 가능한 사업 추천해줘',
      })

      const updated = await sessionCache.get(session.sessionId)
      expect(updated!.intent.type).toBe('program_search')
    })
  })

  describe('active document/program', () => {
    it('should set and clear active document', async () => {
      const session = await sessionCache.create()

      await sessionCache.setActiveDocument(session.sessionId, {
        id: 'doc-1',
        title: '사업계획서',
        completionPercent: 50,
        openedAt: new Date().toISOString(),
      })

      let updated = await sessionCache.get(session.sessionId)
      expect(updated!.activeDocument).toBeDefined()
      expect(updated!.activeDocument!.title).toBe('사업계획서')

      await sessionCache.clearActiveDocument(session.sessionId)
      updated = await sessionCache.get(session.sessionId)
      expect(updated!.activeDocument).toBeUndefined()
    })

    it('should set and clear active program', async () => {
      const session = await sessionCache.create()

      await sessionCache.setActiveProgram(session.sessionId, {
        id: 'prog-1',
        name: 'AI바우처',
        deadline: '2026-03-31',
        matchScore: 85,
      })

      let updated = await sessionCache.get(session.sessionId)
      expect(updated!.activeProgram).toBeDefined()
      expect(updated!.activeProgram!.name).toBe('AI바우처')

      await sessionCache.clearActiveProgram(session.sessionId)
      updated = await sessionCache.get(session.sessionId)
      expect(updated!.activeProgram).toBeUndefined()
    })
  })

  describe('serialization', () => {
    it('should serialize session to string', async () => {
      const session = await sessionCache.create()
      await sessionCache.addMessage(session.sessionId, {
        role: 'user',
        content: '제안서 작성해줘',
      })

      const serialized = await sessionCache.serialize(session.sessionId)

      expect(serialized).toContain('문서 생성')
      expect(serialized).toContain('사용자: 제안서 작성해줘')
    })

    it('should return empty string for non-existent session', async () => {
      const result = await sessionCache.serialize('non-existent')
      expect(result).toBe('')
    })
  })
})

// ============================================
// DomainCache Tests
// ============================================

describe('DomainCache', () => {
  let domainCache: DomainCache
  let mockCache: UniversalCache

  beforeEach(() => {
    mockCache = createCache({ debug: false })
    domainCache = createDomainCache(mockCache)
  })

  afterEach(() => {
    mockCache.stop()
  })

  describe('domain preset operations', () => {
    it('should set and get domain preset', async () => {
      const preset = createMockDomainPreset()
      await domainCache.setDomainPreset(preset)

      const retrieved = await domainCache.getDomainPreset('SOFTWARE', 'R&D')

      expect(retrieved).not.toBeNull()
      expect(retrieved!.industryBlock).toBe('SOFTWARE')
      expect(retrieved!.evaluationCriteria).toContain('기술성')
    })

    it('should return null for non-existent preset', async () => {
      const result = await domainCache.getDomainPreset('UNKNOWN', 'UNKNOWN')
      expect(result).toBeNull()
    })

    it('should get presets by industry', async () => {
      await domainCache.setDomainPreset(createMockDomainPreset({ programType: 'R&D' }))
      await domainCache.setDomainPreset(createMockDomainPreset({ programType: 'STARTUP' }))
      await domainCache.setDomainPreset(createMockDomainPreset({
        industryBlock: 'BIO',
        programType: 'R&D',
      }))

      const softwarePresets = await domainCache.getDomainPresetsByIndustry('SOFTWARE')

      expect(softwarePresets).toHaveLength(2)
    })

    it('should delete domain preset', async () => {
      const preset = createMockDomainPreset()
      await domainCache.setDomainPreset(preset)
      await domainCache.deleteDomainPreset('SOFTWARE', 'R&D')

      const result = await domainCache.getDomainPreset('SOFTWARE', 'R&D')
      expect(result).toBeNull()
    })
  })

  describe('company block operations', () => {
    it('should set and get company block', async () => {
      const block = createMockCompanyBlock()
      await domainCache.setCompanyBlock('company-1', block, '압축된 컨텍스트')

      const cached = await domainCache.getCompanyBlock('company-1')

      expect(cached).not.toBeNull()
      expect(cached!.block.companyId).toBe('company-1')
      expect(cached!.compressedContext).toBe('압축된 컨텍스트')
    })

    it('should return null for non-existent company', async () => {
      const result = await domainCache.getCompanyBlock('non-existent')
      expect(result).toBeNull()
    })

    it('should delete company block', async () => {
      const block = createMockCompanyBlock()
      await domainCache.setCompanyBlock('company-1', block)
      await domainCache.deleteCompanyBlock('company-1')

      const result = await domainCache.getCompanyBlock('company-1')
      expect(result).toBeNull()
    })

    it('should invalidate company block', async () => {
      const block = createMockCompanyBlock()
      await domainCache.setCompanyBlock('company-1', block)
      await domainCache.invalidateCompanyBlock('company-1')

      const result = await domainCache.getCompanyBlock('company-1')
      expect(result).toBeNull()
    })
  })

  describe('company facts operations', () => {
    it('should set and get company facts', async () => {
      const facts: CompanyFact[] = [
        {
          id: 'fact-1',
          type: 'capability',
          content: 'AI 기술 역량 보유',
          confidence: 0.9,
          source: 'user_input',
          createdAt: new Date().toISOString(),
        },
      ]

      await domainCache.setCompanyFacts('company-1', facts)
      const retrieved = await domainCache.getCompanyFacts('company-1')

      expect(retrieved).not.toBeNull()
      expect(retrieved).toHaveLength(1)
      expect(retrieved![0].content).toBe('AI 기술 역량 보유')
    })
  })

  describe('batch operations', () => {
    it('should get multiple company blocks', async () => {
      await domainCache.setCompanyBlock('c1', createMockCompanyBlock({ companyId: 'c1' }))
      await domainCache.setCompanyBlock('c2', createMockCompanyBlock({ companyId: 'c2' }))

      const map = await domainCache.getCompanyBlocks(['c1', 'c2', 'c3'])

      expect(map.size).toBe(2)
      expect(map.has('c1')).toBe(true)
      expect(map.has('c2')).toBe(true)
      expect(map.has('c3')).toBe(false)
    })
  })

  describe('stats', () => {
    it('should return cache stats', async () => {
      await domainCache.setDomainPreset(createMockDomainPreset())
      await domainCache.setCompanyBlock('c1', createMockCompanyBlock())

      const stats = await domainCache.getStats()

      expect(stats.backend).toBe('memory')
      expect(stats.domainPresetCount).toBe(1)
      expect(stats.companyBlockCount).toBe(1)
    })
  })
})
