import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  executeToolCall,
  qettaTools,
  handleToolUseResponse,
  formatToolResultsForClaude,
  type QettaToolName,
  type ToolResult,
} from '../tools'
import type Anthropic from '@anthropic-ai/sdk'

// ============================================
// Test Helper Types
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TestData = Record<string, any>

/** Type assertion helper for accessing unknown data in tests */
function getData(result: ToolResult): TestData {
  return result.data as TestData
}

// ============================================
// Mock External Dependencies
// ============================================

vi.mock('@/lib/skill-engine/data-sources/bizinfo/client', () => ({
  getBizInfoClient: () => ({
    searchByKeyword: vi.fn().mockResolvedValue({
      announcements: [
        {
          id: 'ANN-001',
          title: '2026 스마트공장 지원사업',
          agency: '중소벤처기업부',
          status: 'open',
          applicationPeriod: { start: '2026-01-01', end: '2026-02-28' },
          targetDescription: '중소기업',
          sourceUrl: 'https://example.com/ann-001',
        },
      ],
      totalCount: 1,
      searchedAt: new Date().toISOString(),
      fromCache: false,
    }),
    search: vi.fn().mockResolvedValue({
      announcements: [],
      totalCount: 0,
      searchedAt: new Date().toISOString(),
      fromCache: false,
    }),
    getActive: vi.fn().mockResolvedValue({
      announcements: [
        {
          id: 'ANN-002',
          title: 'AI 바우처 지원사업',
          agency: 'NIPA',
          status: 'open',
          field: 'DIGITAL',
          applicationPeriod: { start: '2026-01-15', end: '2026-03-15' },
          targetDescription: '중소기업',
          sourceUrl: 'https://example.com/ann-002',
        },
      ],
      totalCount: 1,
    }),
  }),
}))

vi.mock('@/lib/skill-engine/rejection/analyzer', () => ({
  rejectionAnalyzer: {
    analyze: vi.fn().mockResolvedValue({
      patterns: [
        {
          id: 'PAT-001',
          category: 'missing_document',
          pattern: { context: '필수 서류 누락' },
          metadata: { confidence: 0.85 },
          stats: { frequency: 0.25, preventionRate: 0.9 },
        },
      ],
      extendedThinking: {
        enabled: true,
        thinkingBudget: 5000,
        reasoning: 'Extended thinking analysis completed',
      },
      recommendations: [
        {
          priority: 'high',
          action: '서류 체크리스트 작성',
          expectedOutcome: '서류 누락 방지',
        },
      ],
      feedbackToEngine: {
        domain: 'general',
        type: 'REJECTION_PATTERN',
        metadata: { confidence: 0.85 },
      },
    }),
  },
}))

// ============================================
// qettaTools Definition Tests
// ============================================

describe('qettaTools', () => {
  it('defines all 7 QETTA tools', () => {
    expect(qettaTools).toHaveLength(7)
  })

  it('includes all required tool names', () => {
    const toolNames = qettaTools.map((t) => t.name)
    expect(toolNames).toContain('generate_tms_daily_report')
    expect(toolNames).toContain('generate_smart_factory_settlement')
    expect(toolNames).toContain('generate_ai_voucher_report')
    expect(toolNames).toContain('verify_document_hash')
    expect(toolNames).toContain('search_announcements')
    expect(toolNames).toContain('match_company_program')
    expect(toolNames).toContain('analyze_rejection')
  })

  it('each tool has valid Anthropic Tool structure', () => {
    for (const tool of qettaTools) {
      expect(tool).toHaveProperty('name')
      expect(tool).toHaveProperty('description')
      expect(tool).toHaveProperty('input_schema')
      expect(tool.input_schema.type).toBe('object')
      expect(tool.input_schema).toHaveProperty('properties')
      expect(tool.input_schema).toHaveProperty('required')
      expect(Array.isArray(tool.input_schema.required)).toBe(true)
    }
  })
})

// ============================================
// executeToolCall Tests
// ============================================

describe('executeToolCall', () => {
  describe('generate_tms_daily_report', () => {
    it('generates TMS report with valid input', async () => {
      const result = await executeToolCall('generate_tms_daily_report', {
        date: '2026-01-29',
        facilityId: 'FAC-001',
        nox: 50,
        sox: 40,
        pm: 15,
        operatingHours: 8,
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('reportType', 'TMS_DAILY')
      expect(result.data).toHaveProperty('date', '2026-01-29')
      expect(result.data).toHaveProperty('facilityId', 'FAC-001')
      expect(result.data).toHaveProperty('measurements')
      expect(result.data).toHaveProperty('hash')
      expect(result.data).toHaveProperty('status', 'compliant')
      expect(result.metadata).toHaveProperty('toolName', 'generate_tms_daily_report')
    })

    it('flags violations when measurements exceed limits', async () => {
      const result = await executeToolCall('generate_tms_daily_report', {
        date: '2026-01-29',
        facilityId: 'FAC-002',
        nox: 150, // exceeds 100 ppm limit
        sox: 120, // exceeds 100 ppm limit
        pm: 50, // exceeds 30 mg/m³ limit
        operatingHours: 8,
      })

      expect(result.success).toBe(true)
      expect(getData(result).status).toBe('violation')
      expect(getData(result).violations).toHaveLength(3)
      expect(getData(result).measurements.nox.status).toBe('exceeded')
      expect(getData(result).measurements.sox.status).toBe('exceeded')
      expect(getData(result).measurements.pm.status).toBe('exceeded')
    })

    it('includes optional notes in report', async () => {
      const result = await executeToolCall('generate_tms_daily_report', {
        date: '2026-01-29',
        facilityId: 'FAC-001',
        nox: 50,
        sox: 40,
        pm: 15,
        operatingHours: 8,
        notes: '정기 점검 완료',
      })

      expect(result.success).toBe(true)
      expect(getData(result).notes).toBe('정기 점검 완료')
    })
  })

  describe('generate_smart_factory_settlement', () => {
    it('generates settlement report with expenses and milestones', async () => {
      const result = await executeToolCall('generate_smart_factory_settlement', {
        projectId: 'PRJ-001',
        period: { start: '2026-01-01', end: '2026-01-31' },
        expenses: [
          { category: '장비비', amount: 50000000, description: 'MES 시스템' },
          { category: '인건비', amount: 30000000, description: '개발 인력' },
        ],
        milestones: [
          { name: '설계 완료', status: 'completed' },
          { name: '개발 완료', status: 'in_progress' },
          { name: '테스트 완료', status: 'pending' },
        ],
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('reportType', 'SMART_FACTORY_SETTLEMENT')
      expect(getData(result).financialSummary.totalExpense).toBe(80000000)
      expect(getData(result).milestoneProgress.completed).toBe(1)
      expect(getData(result).milestoneProgress.total).toBe(3)
      expect(getData(result).milestoneProgress.completionRate).toBe(33) // 1/3 * 100
    })

    it('calculates expense percentages correctly', async () => {
      const result = await executeToolCall('generate_smart_factory_settlement', {
        projectId: 'PRJ-002',
        period: { start: '2026-01-01', end: '2026-01-31' },
        expenses: [
          { category: 'A', amount: 100, description: 'A' },
          { category: 'B', amount: 100, description: 'B' },
        ],
        milestones: [{ name: 'M1', status: 'completed' }],
      })

      expect(result.success).toBe(true)
      expect(getData(result).financialSummary.categories[0].percentage).toBe(50)
      expect(getData(result).financialSummary.categories[1].percentage).toBe(50)
    })
  })

  describe('generate_ai_voucher_report', () => {
    it('generates AI voucher report with usage stats', async () => {
      const result = await executeToolCall('generate_ai_voucher_report', {
        projectId: 'VOUCHER-001',
        reportType: 'interim',
        aiModelUsage: {
          requests: 1000,
          tokens: 500000,
          cost: 150000,
        },
        outcomes: ['정확도 10% 향상', '처리 시간 50% 단축'],
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('reportType', 'AI_VOUCHER_INTERIM')
      expect(getData(result).usageSummary.averageTokensPerRequest).toBe(500)
      expect(getData(result).usageSummary.costPerRequest).toBe(150)
      expect(getData(result).outcomeCount).toBe(2)
    })

    it('handles final report type', async () => {
      const result = await executeToolCall('generate_ai_voucher_report', {
        projectId: 'VOUCHER-002',
        reportType: 'final',
        aiModelUsage: { requests: 5000, tokens: 2500000, cost: 750000 },
        outcomes: ['목표 달성'],
      })

      expect(result.success).toBe(true)
      expect(getData(result).reportType).toBe('AI_VOUCHER_FINAL')
    })
  })

  describe('verify_document_hash', () => {
    it('generates hash for document content', async () => {
      const result = await executeToolCall('verify_document_hash', {
        documentId: 'DOC-001',
        content: 'Test document content',
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('documentId', 'DOC-001')
      expect(result.data).toHaveProperty('computedHash')
      expect(getData(result).computedHash).toHaveLength(64) // SHA-256 hex
      expect(getData(result).isValid).toBe(true)
      expect(result.data).toHaveProperty('qrCodeData')
    })

    it('validates against expected hash when provided', async () => {
      const content = 'Test content'
      // First, get the correct hash
      const firstResult = await executeToolCall('verify_document_hash', {
        documentId: 'DOC-002',
        content,
      })
      const correctHash = getData(firstResult).computedHash

      // Verify with correct hash
      const validResult = await executeToolCall('verify_document_hash', {
        documentId: 'DOC-002',
        content,
        expectedHash: correctHash,
      })
      expect(getData(validResult).isValid).toBe(true)

      // Verify with incorrect hash
      const invalidResult = await executeToolCall('verify_document_hash', {
        documentId: 'DOC-002',
        content,
        expectedHash: 'invalid-hash-value',
      })
      expect(getData(invalidResult).isValid).toBe(false)
    })

    it('generates consistent hash for same content', async () => {
      const content = 'Consistent test content'

      const result1 = await executeToolCall('verify_document_hash', {
        documentId: 'DOC-A',
        content,
      })
      const result2 = await executeToolCall('verify_document_hash', {
        documentId: 'DOC-B',
        content,
      })

      expect(getData(result1).computedHash).toBe(getData(result2).computedHash)
    })
  })

  describe('search_announcements', () => {
    it('searches announcements by keyword', async () => {
      const result = await executeToolCall('search_announcements', {
        keyword: '스마트공장',
        limit: 10,
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('query')
      expect(result.data).toHaveProperty('results')
      expect(result.data).toHaveProperty('totalCount')
      expect(result.data).toHaveProperty('searchedAt')
    })

    it('uses default values for optional parameters', async () => {
      const result = await executeToolCall('search_announcements', {})

      expect(result.success).toBe(true)
      expect(getData(result).query.activeOnly).toBe(true)
      expect(getData(result).query.limit).toBe(20)
    })
  })

  describe('match_company_program', () => {
    it('matches company profile to programs', async () => {
      const result = await executeToolCall('match_company_program', {
        companyProfile: {
          industry: '제조업',
          employeeCount: 50,
          annualRevenue: 5000000000,
          certifications: ['ISO 14001'],
          location: '경기도 성남시',
        },
        preferences: {
          preferredDomains: ['DIGITAL'],
          keywords: ['AI'],
        },
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('companyProfile')
      expect(result.data).toHaveProperty('matches')
      expect(result.data).toHaveProperty('matchCount')
      expect(result.data).toHaveProperty('matchedAt')
    })

    it('handles minimum required company profile', async () => {
      const result = await executeToolCall('match_company_program', {
        companyProfile: {
          industry: '제조업',
          employeeCount: 50,
          certifications: [],
          location: '서울',
        },
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('companyProfile')
      expect(result.data).toHaveProperty('matchedAt')
    })
  })

  describe('analyze_rejection', () => {
    it('analyzes rejection text and provides recommendations', async () => {
      const result = await executeToolCall('analyze_rejection', {
        rejectionText: '필수 서류인 사업자등록증 사본이 누락되었습니다.',
        domain: 'MANUFACTURING',
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('analysis')
      expect(getData(result).analysis).toHaveProperty('patterns')
      expect(getData(result).analysis).toHaveProperty('recommendations')
      expect(getData(result).analysis).toHaveProperty('extendedThinking')
    })

    it('handles company history when provided', async () => {
      const result = await executeToolCall('analyze_rejection', {
        rejectionText: '기술력 부족',
        companyHistory: [
          { programName: 'TIPS', result: 'rejected', date: '2025-01-01' },
        ],
      })

      expect(result.success).toBe(true)
      expect(getData(result).historyCount).toBe(1)
    })

    it('handles analyzer errors gracefully', async () => {
      const { rejectionAnalyzer } = await import('@/lib/skill-engine/rejection/analyzer')
      vi.mocked(rejectionAnalyzer.analyze).mockRejectedValueOnce(new Error('Analyzer service unavailable'))

      const result = await executeToolCall('analyze_rejection', {
        rejectionText: 'Some rejection reason',
        domain: 'ENVIRONMENT',
      })

      expect(result.success).toBe(true) // Still succeeds but returns error info
      expect(result.data).toHaveProperty('error', 'Analyzer service unavailable')
      expect(getData(result).analysis).toBeNull()
    })

    it('handles different domain types', async () => {
      const domains = ['ENVIRONMENT', 'MANUFACTURING', 'DIGITAL', 'EXPORT', 'unknown']

      for (const domain of domains) {
        const result = await executeToolCall('analyze_rejection', {
          rejectionText: 'Test rejection',
          domain,
        })

        expect(result.success).toBe(true)
        // unknown domain should map to 'general'
        if (domain === 'unknown') {
          expect(getData(result).domain).toBe('general')
        }
      }
    })
  })

  describe('unknown tool handling', () => {
    it('returns error for unknown tool name', async () => {
      const result = await executeToolCall('unknown_tool', {})

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unknown tool')
      expect(result.metadata).toHaveProperty('executedAt')
      expect(result.metadata).toHaveProperty('durationMs')
    })
  })

  describe('metadata tracking', () => {
    it('includes execution metadata in all results', async () => {
      const result = await executeToolCall('generate_tms_daily_report', {
        date: '2026-01-29',
        facilityId: 'FAC-001',
        nox: 50,
        sox: 40,
        pm: 15,
        operatingHours: 8,
      })

      expect(result.metadata).toBeDefined()
      expect(result.metadata!.executedAt).toBeDefined()
      expect(result.metadata!.durationMs).toBeGreaterThanOrEqual(0)
      expect(result.metadata!.toolName).toBe('generate_tms_daily_report')
    })
  })
})

// ============================================
// handleToolUseResponse Tests
// ============================================

describe('handleToolUseResponse', () => {
  it('returns empty results when no tool use blocks', async () => {
    const mockResponse = {
      id: 'msg_001',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello' }],
      model: 'claude-sonnet-4-20250514',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 5 },
    } as Anthropic.Message

    const result = await handleToolUseResponse(mockResponse)

    expect(result.hasToolUse).toBe(false)
    expect(result.toolResults).toHaveLength(0)
  })

  it('processes tool use blocks and returns results', async () => {
    const mockResponse = {
      id: 'msg_002',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_001',
          name: 'verify_document_hash',
          input: {
            documentId: 'DOC-001',
            content: 'Test content',
          },
        },
      ],
      model: 'claude-sonnet-4-20250514',
      stop_reason: 'tool_use',
      stop_sequence: null,
      usage: { input_tokens: 100, output_tokens: 50 },
    } as Anthropic.Message

    const result = await handleToolUseResponse(mockResponse)

    expect(result.hasToolUse).toBe(true)
    expect(result.toolResults).toHaveLength(1)
    expect(result.toolResults[0].success).toBe(true)
  })
})

// ============================================
// formatToolResultsForClaude Tests
// ============================================

describe('formatToolResultsForClaude', () => {
  it('formats tool results for Claude message continuation', () => {
    const toolUseBlocks: Anthropic.ToolUseBlock[] = [
      {
        type: 'tool_use',
        id: 'toolu_001',
        name: 'verify_document_hash',
        input: { documentId: 'DOC-001', content: 'Test' },
      },
    ]

    const toolResults: ToolResult[] = [
      {
        success: true,
        data: { isValid: true },
        metadata: {
          executedAt: new Date().toISOString(),
          durationMs: 10,
          toolName: 'verify_document_hash' as QettaToolName,
        },
      },
    ]

    const formatted = formatToolResultsForClaude(toolUseBlocks, toolResults)

    expect(formatted).toHaveLength(1)
    expect(formatted[0].type).toBe('tool_result')
    expect(formatted[0].tool_use_id).toBe('toolu_001')
    expect(typeof formatted[0].content).toBe('string')
    expect(JSON.parse(formatted[0].content as string).success).toBe(true)
  })

  it('handles multiple tool use blocks', () => {
    const toolUseBlocks: Anthropic.ToolUseBlock[] = [
      {
        type: 'tool_use',
        id: 'toolu_001',
        name: 'tool_a',
        input: {},
      },
      {
        type: 'tool_use',
        id: 'toolu_002',
        name: 'tool_b',
        input: {},
      },
    ]

    const toolResults: ToolResult[] = [
      { success: true, metadata: { executedAt: '', durationMs: 0, toolName: 'verify_document_hash' } },
      { success: false, error: 'Failed', metadata: { executedAt: '', durationMs: 0, toolName: 'verify_document_hash' } },
    ]

    const formatted = formatToolResultsForClaude(toolUseBlocks, toolResults)

    expect(formatted).toHaveLength(2)
    expect(formatted[0].tool_use_id).toBe('toolu_001')
    expect(formatted[1].tool_use_id).toBe('toolu_002')
  })
})
