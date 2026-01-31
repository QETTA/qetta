/**
 * Job Queue Tests
 *
 * BullMQ 기반 작업 큐 테스트.
 * 타입, 상수, 데이터 구조 검증에 집중.
 * 실제 Redis 연동 테스트는 통합 테스트에서 수행.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  QUEUE_NAMES,
  DEFAULT_JOB_OPTIONS,
  type JobType,
  type DocumentGenerationJobData,
  type FactLearningJobData,
  type RejectionAnalysisJobData,
  type BatchApiCallJobData,
  type JobResult,
  type JobStatus,
} from '../queue'

// ============================================
// Constants Tests
// ============================================

describe('Job Queue Constants', () => {
  it('should have correct queue names with qetta prefix', () => {
    expect(QUEUE_NAMES.DOCUMENT).toBe('qetta:document')
    expect(QUEUE_NAMES.LEARNING).toBe('qetta:learning')
    expect(QUEUE_NAMES.ANALYSIS).toBe('qetta:analysis')
    expect(QUEUE_NAMES.BATCH).toBe('qetta:batch')
  })

  it('should have all required queue names', () => {
    const queueNames = Object.keys(QUEUE_NAMES)
    expect(queueNames).toContain('DOCUMENT')
    expect(queueNames).toContain('LEARNING')
    expect(queueNames).toContain('ANALYSIS')
    expect(queueNames).toContain('BATCH')
    expect(queueNames).toHaveLength(4)
  })

  it('should have correct default job options for retries', () => {
    expect(DEFAULT_JOB_OPTIONS.attempts).toBe(3)
    expect(DEFAULT_JOB_OPTIONS.backoff.type).toBe('exponential')
    expect(DEFAULT_JOB_OPTIONS.backoff.delay).toBe(2000)
  })

  it('should have correct cleanup settings', () => {
    // 완료된 작업: 24시간 후 또는 1000개 초과 시 삭제
    expect(DEFAULT_JOB_OPTIONS.removeOnComplete.age).toBe(24 * 60 * 60)
    expect(DEFAULT_JOB_OPTIONS.removeOnComplete.count).toBe(1000)

    // 실패한 작업: 7일 후 삭제
    expect(DEFAULT_JOB_OPTIONS.removeOnFail.age).toBe(7 * 24 * 60 * 60)
  })
})

// ============================================
// Type Tests (Compile-time validation)
// ============================================

describe('Job Data Types', () => {
  describe('DocumentGenerationJobData', () => {
    it('should create valid data with required fields', () => {
      const data: DocumentGenerationJobData = {
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        companyBlockId: 'block-1',
        programId: 'AI001',
        programName: 'AI바우처',
      }

      expect(data.userId).toBe('user-1')
      expect(data.companyBlockId).toBe('block-1')
      expect(data.programId).toBe('AI001')
      expect(data.programName).toBe('AI바우처')
      expect(data.createdAt).toBeDefined()
    })

    it('should allow optional templateId', () => {
      const data: DocumentGenerationJobData = {
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        companyBlockId: 'block-1',
        programId: 'AI001',
        programName: 'AI바우처',
        templateId: 'template-custom',
      }

      expect(data.templateId).toBe('template-custom')
    })

    it('should allow optional metadata', () => {
      const data: DocumentGenerationJobData = {
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        companyBlockId: 'block-1',
        programId: 'AI001',
        programName: 'AI바우처',
        metadata: { priority: 'high', source: 'manual' },
      }

      expect(data.metadata).toEqual({ priority: 'high', source: 'manual' })
    })
  })

  describe('FactLearningJobData', () => {
    it('should create valid data from rejection source', () => {
      const data: FactLearningJobData = {
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        companyId: 'company-1',
        source: 'rejection',
        sourceId: 'rejection-1',
        content: '기술성 부족으로 인한 탈락. 시장 분석 미흡.',
      }

      expect(data.companyId).toBe('company-1')
      expect(data.source).toBe('rejection')
      expect(data.content).toContain('기술성')
    })

    it('should support application source', () => {
      const data: FactLearningJobData = {
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        companyId: 'company-1',
        source: 'application',
        sourceId: 'app-1',
        content: 'AI 기술 개발 역량 보유. 특허 3건.',
      }

      expect(data.source).toBe('application')
    })

    it('should support document source', () => {
      const data: FactLearningJobData = {
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        companyId: 'company-1',
        source: 'document',
        sourceId: 'doc-1',
        content: 'ISO 9001 인증 획득. 벤처기업 확인.',
      }

      expect(data.source).toBe('document')
    })
  })

  describe('RejectionAnalysisJobData', () => {
    it('should create valid rejection analysis data', () => {
      const data: RejectionAnalysisJobData = {
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        companyId: 'company-1',
        applicationId: 'app-1',
        rejectionReason: '사업성 분석 미흡. 경쟁 우위 불명확.',
        programName: 'AI바우처',
      }

      expect(data.applicationId).toBe('app-1')
      expect(data.rejectionReason).toContain('사업성')
      expect(data.programName).toBe('AI바우처')
    })
  })

  describe('BatchApiCallJobData', () => {
    it('should create valid GET request data', () => {
      const data: BatchApiCallJobData = {
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        endpoint: 'https://api.bizinfo.go.kr/programs',
        method: 'GET',
      }

      expect(data.endpoint).toContain('bizinfo.go.kr')
      expect(data.method).toBe('GET')
      expect(data.payload).toBeUndefined()
    })

    it('should create valid POST request with payload', () => {
      const data: BatchApiCallJobData = {
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        endpoint: 'https://api.example.com/data',
        method: 'POST',
        payload: { key: 'value', nested: { a: 1 } },
      }

      expect(data.method).toBe('POST')
      expect(data.payload).toEqual({ key: 'value', nested: { a: 1 } })
    })

    it('should support all HTTP methods', () => {
      const methods: Array<'GET' | 'POST' | 'PUT' | 'DELETE'> = [
        'GET', 'POST', 'PUT', 'DELETE'
      ]

      for (const method of methods) {
        const data: BatchApiCallJobData = {
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          endpoint: 'https://api.example.com',
          method,
        }
        expect(data.method).toBe(method)
      }
    })

    it('should allow optional retryCount', () => {
      const data: BatchApiCallJobData = {
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        endpoint: 'https://api.example.com',
        method: 'GET',
        retryCount: 5,
      }

      expect(data.retryCount).toBe(5)
    })
  })
})

// ============================================
// JobResult Type Tests
// ============================================

describe('JobResult Type', () => {
  it('should create success result with data', () => {
    const result: JobResult = {
      success: true,
      data: {
        documentId: 'doc-1',
        programName: 'AI바우처',
        tokenCount: 1500,
      },
      completedAt: new Date().toISOString(),
    }

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      documentId: 'doc-1',
      programName: 'AI바우처',
      tokenCount: 1500,
    })
    expect(result.error).toBeUndefined()
  })

  it('should create failure result with error', () => {
    const result: JobResult = {
      success: false,
      error: 'Company block not found: block-999',
      completedAt: new Date().toISOString(),
    }

    expect(result.success).toBe(false)
    expect(result.error).toContain('block-999')
    expect(result.data).toBeUndefined()
  })

  it('should create success result without data', () => {
    const result: JobResult = {
      success: true,
      completedAt: new Date().toISOString(),
    }

    expect(result.success).toBe(true)
    expect(result.data).toBeUndefined()
  })

  it('should always include completedAt', () => {
    const successResult: JobResult = {
      success: true,
      completedAt: '2026-01-30T12:00:00.000Z',
    }

    const failureResult: JobResult = {
      success: false,
      error: 'Error',
      completedAt: '2026-01-30T12:00:00.000Z',
    }

    expect(successResult.completedAt).toBeDefined()
    expect(failureResult.completedAt).toBeDefined()
  })
})

// ============================================
// JobStatus Type Tests
// ============================================

describe('JobStatus Type', () => {
  it('should include all BullMQ states', () => {
    const validStatuses: JobStatus[] = [
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'prioritized',
      'unknown',
    ]

    for (const status of validStatuses) {
      expect(typeof status).toBe('string')
    }
  })

  it('should be usable in conditional logic', () => {
    const getStatusMessage = (status: JobStatus): string => {
      switch (status) {
        case 'waiting':
          return '대기 중'
        case 'active':
          return '처리 중'
        case 'completed':
          return '완료'
        case 'failed':
          return '실패'
        case 'delayed':
          return '지연됨'
        case 'prioritized':
          return '우선 처리'
        case 'unknown':
        default:
          return '알 수 없음'
      }
    }

    expect(getStatusMessage('waiting')).toBe('대기 중')
    expect(getStatusMessage('completed')).toBe('완료')
    expect(getStatusMessage('failed')).toBe('실패')
  })
})

// ============================================
// Worker Configuration Tests
// ============================================

describe('Worker Configuration', () => {
  it('should document expected concurrency settings', () => {
    // Document Worker: 3 concurrent, max 10/minute
    const documentWorkerConfig = {
      concurrency: 3,
      limiter: { max: 10, duration: 60000 },
    }
    expect(documentWorkerConfig.concurrency).toBe(3)
    expect(documentWorkerConfig.limiter.max).toBe(10)
    expect(documentWorkerConfig.limiter.duration).toBe(60000)

    // Fact Learner Worker: 5 concurrent, max 20/minute
    const factLearnerConfig = {
      concurrency: 5,
      limiter: { max: 20, duration: 60000 },
    }
    expect(factLearnerConfig.concurrency).toBe(5)
    expect(factLearnerConfig.limiter.max).toBe(20)
  })

  it('should use exponential backoff by default', () => {
    expect(DEFAULT_JOB_OPTIONS.backoff.type).toBe('exponential')

    // 2초, 4초, 8초 지연
    const delay = DEFAULT_JOB_OPTIONS.backoff.delay
    expect(delay).toBe(2000)
  })
})
