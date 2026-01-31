/**
 * QETTA Claude Integration Module
 *
 * Claude API 통합 모듈
 *
 * @see generators/gov-support/data/qetta-super-model.json (claudeEcosystemIntegration)
 *
 * 통합 기능:
 * 1. Batch API - 대량 공고문 분석 (50% 비용 절감)
 * 2. Tool Use - 문서 자동 생성 (7개 도구)
 * 3. Extended Thinking - 탈락 분석 (RejectionAnalyzer에서 사용)
 * 4. Prompt Caching - 비용 최적화 (70% → 90% 목표)
 *
 * 비용 최적화 전략:
 * - Opus 20%: 탈락 분석, 복잡한 매칭
 * - Sonnet 60%: 채팅, 문서 생성, 공고 파싱
 * - Haiku 20%: 형식 검증, 분류, 이메일 감지
 *
 * @example
 * ```ts
 * import {
 *   batchClient,
 *   qettaTools,
 *   executeToolCall,
 *   MODEL_STRATEGY
 * } from '@/lib/claude'
 *
 * // Batch API
 * const batch = await batchClient.createAnnouncementAnalysisBatch(announcements)
 *
 * // Tool Use
 * const result = await executeToolCall('generate_tms_daily_report', { ... })
 * ```
 */

import { DISPLAY_METRICS } from '@/constants/metrics'

// Cost Manager
export {
  costManager,
  getCostManager,
  initCostManager,
  estimateCost,
  selectModelWithBudget,
  formatCost,
  formatTokens,
  CLAUDE_PRICING,
} from './cost-manager'

export type {
  BudgetConfig,
  UsageRecord,
  UsageSummary,
  ClaudeModelId,
} from './cost-manager'

// Batch API
export {
  ClaudeBatchClient,
  getBatchClient,
  initBatchClient,
  batchClient,
} from './batch-client'

export type {
  BatchStatus,
  BatchRequest,
  BatchResult,
  BatchJob,
  AnnouncementForBatch,
  BatchClientConfig,
} from './batch-client'

// Tool Use
export {
  qettaTools,
  executeToolCall,
  handleToolUseResponse,
  formatToolResultsForClaude,
} from './tools'

export type { QettaToolName, ToolDefinition, ToolResult } from './tools'

// ============================================
// 모델 전략 (슈퍼모델 기반)
// ============================================

/**
 * 모델 선택 전략
 *
 * @see qetta-super-model.json > claudeEcosystemIntegration > modelSelection
 */
export const MODEL_STRATEGY = {
  opus: {
    id: 'claude-opus-4-5-20251101',
    usage: '20%',
    tasks: ['탈락 분석 (Extended Thinking)', '복잡한 매칭 결정', '품질 검증 Orchestrator'],
    monthlyCost: '$40',
  },
  sonnet: {
    id: 'claude-sonnet-4-20250514',
    usage: '60%',
    tasks: ['일반 채팅 응답', '문서 생성', '공고문 파싱', '기업-공고 매칭'],
    monthlyCost: '$50',
  },
  haiku: {
    id: 'claude-haiku-4-20250514',
    usage: '20%',
    tasks: ['형식 검증', '해시 생성', '간단한 분류', '이메일 이벤트 감지'],
    monthlyCost: '$5',
  },
} as const

/**
 * 작업 유형별 적합 모델 반환
 */
export function getModelForTask(
  taskType:
    | 'chat'
    | 'document_generation'
    | 'announcement_parsing'
    | 'matching'
    | 'rejection_analysis'
    | 'validation'
    | 'classification'
    | 'email_detection'
): string {
  switch (taskType) {
    // Opus 작업
    case 'rejection_analysis':
      return MODEL_STRATEGY.opus.id

    // Sonnet 작업
    case 'chat':
    case 'document_generation':
    case 'announcement_parsing':
    case 'matching':
      return MODEL_STRATEGY.sonnet.id

    // Haiku 작업
    case 'validation':
    case 'classification':
    case 'email_detection':
      return MODEL_STRATEGY.haiku.id

    default:
      return MODEL_STRATEGY.sonnet.id // 기본값
  }
}

// ============================================
// 비용 최적화 상수
// ============================================

/**
 * 비용 최적화 시나리오
 *
 * @see qetta-super-model.json > claudeEcosystemIntegration > costOptimization
 */
export const COST_SCENARIOS = {
  basic: {
    cost: '$55/월',
    description: 'Prompt Caching 최적화 (기본 채팅만)',
    reduction: '63%',
  },
  standard: {
    cost: '$95/월',
    description: '모델 티어링 (Opus 20% + Sonnet 60% + Haiku 20%)',
    reduction: '37%',
    recommended: true,
  },
  multiAgent: {
    cost: '$145/월',
    description: '멀티에이전트 (Orchestrator + 6 Workers)',
    reduction: '27%',
  },
} as const

/**
 * 현재 월 비용 vs 최적화 비용
 */
export const COST_BREAKDOWN = {
  current: '$150/월',
  optimized: '$55-145/월',
  savings: {
    promptCaching: '-20%',
    modelTiering: '-25%',
    batchAPI: '-18%',
  },
}

// ============================================
// Prompt Caching 설정
// ============================================

/**
 * 캐싱 가능한 시스템 프롬프트 (정적 부분)
 */
export const CACHED_SYSTEM_PROMPTS = {
  base: `당신은 QETTA AI 어시스턴트입니다.

## QETTA 소개
QETTA는 산업용 블랙박스로, 도메인 엔진 기술을 통해 정부지원사업 문서를 자동 생성합니다.

## 핵심 가치
- 시간 단축: 8시간 → 30분 (${DISPLAY_METRICS.timeSaved.value} 절감)
- 반려율 감소: ${DISPLAY_METRICS.rejectionReduction.value}
- API 가용성: ${DISPLAY_METRICS.apiUptime.value}

## 금지 용어
- "블록체인" → "해시체인" 사용
- "혁신적" → 구체적 수치 사용
- "TIPS 5억" → "웰컴투 동남권 TIPS 선정"`,

  tms: `## TMS 도메인 엔진
환경부 CleanSYS 연동 전문가입니다.
- 핵심 용어: NOx, SOx, PM, 측정기록부
- 기준치: NOx 100ppm, SOx 100ppm, PM 30mg/m³`,

  smartFactory: `## 스마트공장 도메인 엔진
중소기업벤처부 스마트공장 전문가입니다.
- 핵심 용어: MES, PLC, OPC-UA, 4M1E, OEE
- 정산 보고서, 실적 보고서 양식 숙지`,

  aiVoucher: `## AI 바우처 도메인 엔진
NIPA AI 바우처 전문가입니다.
- 핵심 용어: 공급기업, 수요기업, 바우처
- 실적 보고서, 중간/최종 보고서 양식 숙지`,

  globalTender: `## 해외입찰 도메인 엔진
글로벌 조달 전문가입니다.
- 포털: SAM.gov, UNGM, Goszakup
- 63만+ 입찰 DB 검색 가능`,
}

/**
 * 캐시 효율 계산
 */
export function calculateCacheEfficiency(
  cachedTokens: number,
  totalTokens: number
): number {
  if (totalTokens === 0) return 0
  return Math.round((cachedTokens / totalTokens) * 100)
}
