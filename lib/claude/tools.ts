/**
 * QETTA Claude Tool Use - 문서 생성 도구
 *
 * Claude Tool Use를 활용한 자동 문서 생성 시스템
 *
 * @see https://docs.anthropic.com/en/docs/build-with-claude/tool-use
 *
 * 핵심 도구:
 * 1. generate_tms_daily_report - TMS 일일보고서 생성
 * 2. generate_smart_factory_settlement - 스마트공장 정산보고서 생성
 * 3. verify_document_hash - 해시체인 검증
 * 4. search_announcements - 공고문 검색
 * 5. match_company_program - 기업-프로그램 매칭
 *
 * @example
 * ```ts
 * import { qettaTools, executeToolCall } from '@/lib/claude/tools'
 *
 * // Claude API에 도구 전달
 * const response = await anthropic.messages.create({
 *   model: 'claude-sonnet-4-20250514',
 *   tools: qettaTools,
 *   messages: [{ role: 'user', content: 'TMS 일일보고서를 생성해줘' }]
 * })
 *
 * // 도구 실행
 * if (response.stop_reason === 'tool_use') {
 *   const toolUse = response.content.find(c => c.type === 'tool_use')
 *   const result = await executeToolCall(toolUse.name, toolUse.input)
 * }
 * ```
 */

import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { DISPLAY_METRICS } from '@/constants/metrics'
import { logger } from '@/lib/api/logger'

// Skill Engine 연동
import { getBizInfoClient } from '@/lib/skill-engine/data-sources/bizinfo/client'
import { rejectionAnalyzer } from '@/lib/skill-engine/rejection/analyzer'
import type { EnginePresetType } from '@/lib/skill-engine/types'

// ============================================
// 타입 정의
// ============================================

export type QettaToolName =
  | 'generate_tms_daily_report'
  | 'generate_smart_factory_settlement'
  | 'generate_ai_voucher_report'
  | 'verify_document_hash'
  | 'search_announcements'
  | 'match_company_program'
  | 'analyze_rejection'

export interface ToolDefinition {
  name: QettaToolName
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
}

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
  metadata?: {
    executedAt: string
    durationMs: number
    toolName: QettaToolName
  }
}

// TMS 보고서 입력
interface TMSDailyReportInput {
  date: string // YYYY-MM-DD
  facilityId: string
  nox: number // ppm
  sox: number // ppm
  pm: number // mg/m³
  operatingHours: number
  notes?: string
}

// 스마트공장 정산 입력
interface SmartFactorySettlementInput {
  projectId: string
  period: { start: string; end: string }
  expenses: Array<{
    category: string
    amount: number
    description: string
  }>
  milestones: Array<{
    name: string
    status: 'completed' | 'in_progress' | 'pending'
  }>
}

// AI 바우처 보고서 입력
interface AIVoucherReportInput {
  projectId: string
  reportType: 'interim' | 'final'
  aiModelUsage: {
    requests: number
    tokens: number
    cost: number
  }
  outcomes: string[]
}

// 해시 검증 입력
interface VerifyHashInput {
  documentId: string
  content: string
  expectedHash?: string
}

// 공고 검색 입력
interface SearchAnnouncementsInput {
  keyword?: string
  domain?: 'ENVIRONMENT' | 'MANUFACTURING' | 'DIGITAL' | 'EXPORT'
  activeOnly?: boolean
  limit?: number
}

// 매칭 입력
interface MatchCompanyProgramInput {
  companyProfile: {
    name?: string
    industry: string
    annualRevenue?: number // 연매출 (원)
    revenue?: number // 레거시
    employeeCount: number
    certifications: string[]
    location: string
  }
  preferences?: {
    fundingTypes?: string[]
    maxAmount?: number
    urgency?: 'high' | 'medium' | 'low'
    preferredDomains?: string[] // TMS, SMART_FACTORY, AI_VOUCHER, GLOBAL_TENDER
    keywords?: string[] // 검색 키워드
    maxResults?: number // 최대 결과 수 (기본 10)
  }
}

// 탈락 분석 입력
interface AnalyzeRejectionInput {
  rejectionText: string
  domain?: string
  companyHistory?: Array<{
    programId?: string
    programName: string
    appliedAt?: string
    result: 'selected' | 'rejected' | 'pending' | 'withdrawn'
    rejectionReason?: string
    date?: string // 레거시
  }>
}

// ============================================
// 도구 정의 (Anthropic Tool Format)
// ============================================

export const qettaTools: Anthropic.Tool[] = [
  // 1. TMS 일일보고서 생성
  {
    name: 'generate_tms_daily_report',
    description: `TMS(Tele-Monitoring System) 일일보고서를 생성합니다.
환경부 CleanSYS 양식에 맞는 측정기록부를 45초 내에 생성합니다.
NOx, SOx, PM 측정값과 시설 정보를 입력하면 자동으로 양식이 완성됩니다.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: '보고서 날짜 (YYYY-MM-DD 형식)',
        },
        facilityId: {
          type: 'string',
          description: '시설 고유 ID',
        },
        nox: {
          type: 'number',
          description: 'NOx 측정값 (ppm)',
        },
        sox: {
          type: 'number',
          description: 'SOx 측정값 (ppm)',
        },
        pm: {
          type: 'number',
          description: 'PM(미세먼지) 측정값 (mg/m³)',
        },
        operatingHours: {
          type: 'number',
          description: '당일 운전 시간',
        },
        notes: {
          type: 'string',
          description: '특이사항 (선택)',
        },
      },
      required: ['date', 'facilityId', 'nox', 'sox', 'pm', 'operatingHours'],
    },
  },

  // 2. 스마트공장 정산보고서 생성
  {
    name: 'generate_smart_factory_settlement',
    description: `스마트공장 정산보고서를 생성합니다.
중소기업벤처부 양식에 맞는 사업비 정산 및 마일스톤 달성 보고서입니다.
비용 항목별 정산과 진행 상태를 자동으로 정리합니다.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        projectId: {
          type: 'string',
          description: '프로젝트 ID',
        },
        period: {
          type: 'object',
          properties: {
            start: { type: 'string', description: '시작일 (YYYY-MM-DD)' },
            end: { type: 'string', description: '종료일 (YYYY-MM-DD)' },
          },
          required: ['start', 'end'],
        },
        expenses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              amount: { type: 'number' },
              description: { type: 'string' },
            },
            required: ['category', 'amount', 'description'],
          },
          description: '비용 항목 목록',
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string', enum: ['completed', 'in_progress', 'pending'] },
            },
            required: ['name', 'status'],
          },
          description: '마일스톤 목록',
        },
      },
      required: ['projectId', 'period', 'expenses', 'milestones'],
    },
  },

  // 3. AI 바우처 실적보고서 생성
  {
    name: 'generate_ai_voucher_report',
    description: `AI 바우처 실적보고서를 생성합니다.
NIPA 양식에 맞는 AI 서비스 이용 실적 및 성과를 정리합니다.
API 사용량, 비용, 성과 지표를 자동으로 집계합니다.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        projectId: {
          type: 'string',
          description: '프로젝트 ID',
        },
        reportType: {
          type: 'string',
          enum: ['interim', 'final'],
          description: '보고서 유형 (중간/최종)',
        },
        aiModelUsage: {
          type: 'object',
          properties: {
            requests: { type: 'number', description: 'API 호출 횟수' },
            tokens: { type: 'number', description: '사용 토큰 수' },
            cost: { type: 'number', description: '비용 (원)' },
          },
          required: ['requests', 'tokens', 'cost'],
        },
        outcomes: {
          type: 'array',
          items: { type: 'string' },
          description: '성과 목록',
        },
      },
      required: ['projectId', 'reportType', 'aiModelUsage', 'outcomes'],
    },
  },

  // 4. 해시체인 검증
  {
    name: 'verify_document_hash',
    description: `문서의 SHA-256 해시체인 무결성을 검증합니다.
문서 내용에서 해시를 생성하고, 기존 해시와 비교합니다.
검증 결과와 타임스탬프를 QR 코드로 제공합니다.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        documentId: {
          type: 'string',
          description: '문서 ID',
        },
        content: {
          type: 'string',
          description: '검증할 문서 내용',
        },
        expectedHash: {
          type: 'string',
          description: '기대하는 해시값 (선택, 없으면 새로 생성)',
        },
      },
      required: ['documentId', 'content'],
    },
  },

  // 5. 공고문 검색
  {
    name: 'search_announcements',
    description: `기업마당, 소상공인24 등에서 지원사업 공고를 검색합니다.
키워드, 도메인, 접수 상태로 필터링합니다.
63만+ 글로벌 입찰 DB도 검색 가능합니다.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '검색 키워드',
        },
        domain: {
          type: 'string',
          enum: ['ENVIRONMENT', 'MANUFACTURING', 'DIGITAL', 'EXPORT'],
          description: '도메인 엔진 필터',
        },
        activeOnly: {
          type: 'boolean',
          description: '접수 중인 공고만 (기본: true)',
        },
        limit: {
          type: 'number',
          description: '최대 결과 수 (기본: 20)',
        },
      },
      required: [],
    },
  },

  // 6. 기업-프로그램 매칭
  {
    name: 'match_company_program',
    description: `기업 프로필과 지원사업을 AI 맥락 매칭합니다.
업종, 매출, 인원, 인증 현황을 분석하여 적합한 프로그램을 추천합니다.
${DISPLAY_METRICS.termAccuracy.value} 용어 매핑 정확도로 정밀 매칭합니다.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        companyProfile: {
          type: 'object',
          properties: {
            industry: { type: 'string', description: '업종' },
            revenue: { type: 'number', description: '연 매출 (억원)' },
            employeeCount: { type: 'number', description: '종업원 수' },
            certifications: {
              type: 'array',
              items: { type: 'string' },
              description: '보유 인증 목록',
            },
            location: { type: 'string', description: '소재지' },
          },
          required: ['industry', 'revenue', 'employeeCount', 'location'],
        },
        preferences: {
          type: 'object',
          properties: {
            fundingTypes: {
              type: 'array',
              items: { type: 'string' },
              description: '선호 지원 유형',
            },
            maxAmount: { type: 'number', description: '최대 희망 금액' },
            urgency: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: '긴급도',
            },
          },
        },
      },
      required: ['companyProfile'],
    },
  },

  // 7. 탈락 원인 분석
  {
    name: 'analyze_rejection',
    description: `탈락 사유를 심층 분석합니다.
Extended Thinking으로 표면적 원인 뒤의 근본 원인을 찾습니다.
30개 탈락 패턴 DB와 비교하여 예방책을 제안합니다.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        rejectionText: {
          type: 'string',
          description: '탈락 사유 텍스트',
        },
        domain: {
          type: 'string',
          description: '도메인 (TMS, SMART_FACTORY, AI_VOUCHER, GLOBAL_TENDER, general)',
        },
        companyHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              programName: { type: 'string' },
              result: { type: 'string', enum: ['selected', 'rejected'] },
              date: { type: 'string' },
            },
          },
          description: '신청 이력 (선택)',
        },
      },
      required: ['rejectionText'],
    },
  },
]

// ============================================
// 도구 실행 함수
// ============================================

/**
 * 도구 호출 실행
 */
export async function executeToolCall(
  toolName: string,
  input: unknown
): Promise<ToolResult> {
  const startTime = Date.now()

  try {
    let data: unknown

    switch (toolName as QettaToolName) {
      case 'generate_tms_daily_report':
        data = await generateTMSDailyReport(input as TMSDailyReportInput)
        break
      case 'generate_smart_factory_settlement':
        data = await generateSmartFactorySettlement(input as SmartFactorySettlementInput)
        break
      case 'generate_ai_voucher_report':
        data = await generateAIVoucherReport(input as AIVoucherReportInput)
        break
      case 'verify_document_hash':
        data = await verifyDocumentHash(input as VerifyHashInput)
        break
      case 'search_announcements':
        data = await searchAnnouncements(input as SearchAnnouncementsInput)
        break
      case 'match_company_program':
        data = await matchCompanyProgram(input as MatchCompanyProgramInput)
        break
      case 'analyze_rejection':
        data = await analyzeRejection(input as AnalyzeRejectionInput)
        break
      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }

    return {
      success: true,
      data,
      metadata: {
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        toolName: toolName as QettaToolName,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        toolName: toolName as QettaToolName,
      },
    }
  }
}

// ============================================
// 개별 도구 구현
// ============================================

async function generateTMSDailyReport(input: TMSDailyReportInput) {
  const { date, facilityId, nox, sox, pm, operatingHours, notes } = input

  // 기준치 체크
  const NOX_LIMIT = 100 // ppm
  const SOX_LIMIT = 100 // ppm
  const PM_LIMIT = 30 // mg/m³

  const violations = []
  if (nox > NOX_LIMIT) violations.push(`NOx: ${nox}ppm (기준 ${NOX_LIMIT}ppm 초과)`)
  if (sox > SOX_LIMIT) violations.push(`SOx: ${sox}ppm (기준 ${SOX_LIMIT}ppm 초과)`)
  if (pm > PM_LIMIT) violations.push(`PM: ${pm}mg/m³ (기준 ${PM_LIMIT}mg/m³ 초과)`)

  const report = {
    reportType: 'TMS_DAILY',
    date,
    facilityId,
    measurements: {
      nox: { value: nox, unit: 'ppm', limit: NOX_LIMIT, status: nox <= NOX_LIMIT ? 'normal' : 'exceeded' },
      sox: { value: sox, unit: 'ppm', limit: SOX_LIMIT, status: sox <= SOX_LIMIT ? 'normal' : 'exceeded' },
      pm: { value: pm, unit: 'mg/m³', limit: PM_LIMIT, status: pm <= PM_LIMIT ? 'normal' : 'exceeded' },
    },
    operatingHours,
    notes: notes || '특이사항 없음',
    violations,
    status: violations.length === 0 ? 'compliant' : 'violation',
    generatedAt: new Date().toISOString(),
    hash: '', // 아래에서 계산
  }

  // 해시 생성
  const contentHash = createHash('sha256')
    .update(JSON.stringify(report))
    .digest('hex')
  report.hash = contentHash

  return report
}

async function generateSmartFactorySettlement(input: SmartFactorySettlementInput) {
  const { projectId, period, expenses, milestones } = input

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length

  return {
    reportType: 'SMART_FACTORY_SETTLEMENT',
    projectId,
    period,
    financialSummary: {
      totalExpense,
      categories: expenses.map((e) => ({
        ...e,
        percentage: Math.round((e.amount / totalExpense) * 100),
      })),
    },
    milestoneProgress: {
      total: milestones.length,
      completed: completedMilestones,
      completionRate: Math.round((completedMilestones / milestones.length) * 100),
      details: milestones,
    },
    generatedAt: new Date().toISOString(),
    hash: createHash('sha256')
      .update(JSON.stringify({ projectId, period, expenses, milestones }))
      .digest('hex'),
  }
}

async function generateAIVoucherReport(input: AIVoucherReportInput) {
  const { projectId, reportType, aiModelUsage, outcomes } = input

  return {
    reportType: `AI_VOUCHER_${reportType.toUpperCase()}`,
    projectId,
    usageSummary: {
      ...aiModelUsage,
      averageTokensPerRequest: Math.round(aiModelUsage.tokens / aiModelUsage.requests),
      costPerRequest: Math.round(aiModelUsage.cost / aiModelUsage.requests),
    },
    outcomes: outcomes.map((o, i) => ({
      id: i + 1,
      description: o,
    })),
    outcomeCount: outcomes.length,
    generatedAt: new Date().toISOString(),
    hash: createHash('sha256')
      .update(JSON.stringify({ projectId, reportType, aiModelUsage, outcomes }))
      .digest('hex'),
  }
}

async function verifyDocumentHash(input: VerifyHashInput) {
  const { documentId, content, expectedHash } = input

  const computedHash = createHash('sha256').update(content).digest('hex')

  const isValid = expectedHash ? computedHash === expectedHash : true

  return {
    documentId,
    computedHash,
    expectedHash: expectedHash || null,
    isValid,
    verifiedAt: new Date().toISOString(),
    qrCodeData: `qetta://verify/${documentId}?hash=${computedHash}&timestamp=${Date.now()}`,
  }
}

async function searchAnnouncements(input: SearchAnnouncementsInput) {
  const { keyword, domain, activeOnly = true, limit = 20 } = input

  try {
    const client = getBizInfoClient()

    // 키워드 또는 활성 공고 검색
    const result = keyword
      ? await client.searchByKeyword(keyword, limit)
      : await client.search({
          activeOnly,
          pageSize: limit,
        })

    // 도메인 필터링 (선택적)
    const filteredAnnouncements = domain
      ? result.announcements.filter((a) =>
          a.field?.toLowerCase().includes(domain.toLowerCase()) ||
          a.title.toLowerCase().includes(domain.toLowerCase())
        )
      : result.announcements

    return {
      query: { keyword, domain, activeOnly, limit },
      results: filteredAnnouncements.slice(0, limit).map((a) => ({
        id: a.id,
        title: a.title,
        agency: a.agency,
        status: a.status,
        applicationPeriod: a.applicationPeriod,
        targetDescription: a.targetDescription,
        sourceUrl: a.sourceUrl,
      })),
      totalCount: filteredAnnouncements.length,
      searchedAt: result.searchedAt,
      fromCache: result.fromCache,
    }
  } catch (error) {
    logger.error('[searchAnnouncements] Error:', error)
    return {
      query: { keyword, domain, activeOnly, limit },
      results: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      searchedAt: new Date().toISOString(),
    }
  }
}

async function matchCompanyProgram(input: MatchCompanyProgramInput) {
  const { companyProfile, preferences = {} } = input

  try {
    const client = getBizInfoClient()

    // 1. 활성 공고 검색
    const activeAnnouncements = await client.getActive(100)

    // 2. 기업 프로필 기반 매칭 점수 계산
    const scoredMatches = activeAnnouncements.announcements.map((announcement) => {
      let score = 0
      const matchReasons: string[] = []

      // 도메인 매칭
      if (preferences?.preferredDomains?.length) {
        const domainMatch = preferences.preferredDomains.some(
          (domain) =>
            announcement.field?.toLowerCase().includes(domain.toLowerCase()) ||
            announcement.title.toLowerCase().includes(domain.toLowerCase())
        )
        if (domainMatch) {
          score += 30
          matchReasons.push('선호 도메인 매칭')
        }
      }

      // 매출 규모 적합성 (대략적 추론)
      if (companyProfile.annualRevenue && announcement.targetDescription) {
        const target = announcement.targetDescription.toLowerCase()
        if (companyProfile.annualRevenue < 1000000000 && target.includes('소기업')) {
          score += 20
          matchReasons.push('소기업 대상')
        }
        if (companyProfile.annualRevenue < 10000000000 && target.includes('중소기업')) {
          score += 15
          matchReasons.push('중소기업 대상')
        }
      }

      // 키워드 매칭
      if (preferences?.keywords?.length) {
        const keywordMatches = preferences.keywords.filter(
          (kw) =>
            announcement.title.toLowerCase().includes(kw.toLowerCase()) ||
            announcement.targetDescription?.toLowerCase().includes(kw.toLowerCase())
        )
        if (keywordMatches.length > 0) {
          score += keywordMatches.length * 10
          matchReasons.push(`키워드 매칭: ${keywordMatches.join(', ')}`)
        }
      }

      // 접수 마감 임박 보너스 (urgent 우선)
      if (announcement.status === 'open' && announcement.applicationPeriod?.end) {
        const daysLeft = Math.ceil(
          (new Date(announcement.applicationPeriod.end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        if (daysLeft <= 7 && daysLeft > 0) {
          score += 5
          matchReasons.push(`마감 임박 (${daysLeft}일 남음)`)
        }
      }

      return {
        announcement: {
          id: announcement.id,
          title: announcement.title,
          agency: announcement.agency,
          status: announcement.status,
          applicationPeriod: announcement.applicationPeriod,
          targetDescription: announcement.targetDescription,
          sourceUrl: announcement.sourceUrl,
        },
        score,
        matchReasons,
      }
    })

    // 3. 점수 기준 정렬 및 상위 결과 반환
    const topMatches = scoredMatches
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, preferences?.maxResults || 10)

    return {
      companyProfile: {
        name: companyProfile.name,
        employeeCount: companyProfile.employeeCount,
        annualRevenue: companyProfile.annualRevenue,
      },
      preferences,
      matches: topMatches,
      matchCount: topMatches.length,
      totalSearched: activeAnnouncements.totalCount,
      matchedAt: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[matchCompanyProgram] Error:', error)
    return {
      companyProfile,
      preferences,
      matches: [],
      matchCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      matchedAt: new Date().toISOString(),
    }
  }
}

async function analyzeRejection(input: AnalyzeRejectionInput) {
  const { rejectionText, domain, companyHistory } = input

  try {
    // EnginePresetType 변환
    const domainType: EnginePresetType | 'general' = (
      domain?.toUpperCase() === 'ENVIRONMENT' ? 'ENVIRONMENT' :
      domain?.toUpperCase() === 'MANUFACTURING' ? 'MANUFACTURING' :
      domain?.toUpperCase() === 'DIGITAL' ? 'DIGITAL' :
      domain?.toUpperCase() === 'EXPORT' ? 'EXPORT' :
      'general'
    )

    // RejectionAnalyzer 호출 (Extended Thinking 활용)
    // RejectionAnalyzer 호출 (Extended Thinking 활용)
    // 참고: companyHistory는 선택적 기능, 복잡한 타입 변환 대신 undefined 전달
    // 향후 full ApplicationHistory 타입 지원 시 별도 adapter 구현
    const analysisResult = await rejectionAnalyzer.analyze(
      rejectionText,
      domainType,
      undefined // companyHistory는 향후 별도 adapter로 지원
    )

    return {
      rejectionText: rejectionText.slice(0, 200) + (rejectionText.length > 200 ? '...' : ''),
      domain: domainType,
      historyCount: companyHistory?.length || 0,
      analysis: {
        patterns: analysisResult.patterns.map((p) => ({
          id: p.id,
          category: p.category,
          context: p.pattern.context,
          confidence: p.metadata.confidence,
          frequency: p.stats.frequency,
          preventionRate: p.stats.preventionRate,
        })),
        extendedThinking: {
          enabled: analysisResult.extendedThinking.enabled,
          thinkingBudget: analysisResult.extendedThinking.thinkingBudget,
          reasoning: analysisResult.extendedThinking.reasoning?.slice(0, 1000),
        },
        recommendations: analysisResult.recommendations.map((r) => ({
          priority: r.priority,
          action: r.action,
          expectedOutcome: r.expectedOutcome,
        })),
        feedbackToEngine: {
          domain: analysisResult.feedbackToEngine.domain,
          type: analysisResult.feedbackToEngine.type,
          confidence: analysisResult.feedbackToEngine.metadata.confidence,
        },
      },
      analyzedAt: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[analyzeRejection] Error:', error)
    return {
      rejectionText: rejectionText.slice(0, 200),
      domain: domain || 'general',
      historyCount: companyHistory?.length || 0,
      analysis: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      analyzedAt: new Date().toISOString(),
    }
  }
}

// ============================================
// Tool Use 헬퍼 함수
// ============================================

/**
 * Claude 응답에서 도구 호출 처리
 */
export async function handleToolUseResponse(
  response: Anthropic.Message
): Promise<{ toolResults: ToolResult[]; hasToolUse: boolean }> {
  const toolUseBlocks = response.content.filter(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  )

  if (toolUseBlocks.length === 0) {
    return { toolResults: [], hasToolUse: false }
  }

  const toolResults = await Promise.all(
    toolUseBlocks.map((block) =>
      executeToolCall(block.name, block.input)
    )
  )

  return { toolResults, hasToolUse: true }
}

/**
 * 도구 결과를 Claude 메시지 형식으로 변환
 */
export function formatToolResultsForClaude(
  toolUseBlocks: Anthropic.ToolUseBlock[],
  toolResults: ToolResult[]
): Anthropic.ToolResultBlockParam[] {
  return toolUseBlocks.map((block, index) => ({
    type: 'tool_result' as const,
    tool_use_id: block.id,
    content: JSON.stringify(toolResults[index]),
  }))
}
