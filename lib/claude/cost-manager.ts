/**
 * QETTA Cost Manager
 *
 * Claude API 비용 추적 및 예산 관리 시스템
 *
 * 기능:
 * 1. 실시간 비용 추적 (요청별)
 * 2. 일일/월간 예산 제한
 * 3. 임계값 도달 시 알림
 * 4. 예산 초과 시 자동 폴백 (Opus → Sonnet → Haiku)
 *
 * @see MODEL_STRATEGY in ./index.ts
 */

import { getModelForTask } from './index'
import { logger } from '@/lib/api/logger'

// ============================================
// 가격 정책 (USD per 1M tokens, 2026-01)
// ============================================

/**
 * Claude API 가격표 (per million tokens)
 * @see https://www.anthropic.com/pricing
 */
export const CLAUDE_PRICING = {
  'claude-opus-4-5-20251101': {
    input: 15.0, // $15/MTok
    output: 75.0, // $75/MTok
    cachedInput: 1.5, // 90% 할인
    extendedThinking: 15.0, // thinking tokens도 input rate
  },
  'claude-sonnet-4-20250514': {
    input: 3.0, // $3/MTok
    output: 15.0, // $15/MTok
    cachedInput: 0.3, // 90% 할인
  },
  'claude-haiku-4-20250514': {
    input: 0.25, // $0.25/MTok
    output: 1.25, // $1.25/MTok
    cachedInput: 0.025, // 90% 할인
  },
} as const

export type ClaudeModelId = keyof typeof CLAUDE_PRICING

// ============================================
// 예산 설정
// ============================================

export interface BudgetConfig {
  dailyLimit: number // USD
  monthlyLimit: number // USD
  alertThreshold: number // 0-1 (예: 0.8 = 80%)
  autoFallback: boolean // 예산 초과 시 자동 모델 다운그레이드
}

const DEFAULT_BUDGET: BudgetConfig = {
  dailyLimit: 50, // $50/day
  monthlyLimit: 500, // $500/month
  alertThreshold: 0.8, // 80%에서 경고
  autoFallback: true,
}

// ============================================
// 사용량 추적
// ============================================

export interface UsageRecord {
  timestamp: Date
  model: ClaudeModelId
  inputTokens: number
  outputTokens: number
  cachedInputTokens?: number
  thinkingTokens?: number
  cost: number
  taskType: string
  requestId?: string
}

export interface UsageSummary {
  daily: {
    cost: number
    requests: number
    inputTokens: number
    outputTokens: number
  }
  monthly: {
    cost: number
    requests: number
    inputTokens: number
    outputTokens: number
  }
  budgetStatus: {
    dailyUsedPercent: number
    monthlyUsedPercent: number
    isOverDaily: boolean
    isOverMonthly: boolean
    shouldAlert: boolean
  }
}

// ============================================
// Cost Manager Class
// ============================================

class CostManager {
  private budget: BudgetConfig
  private usageHistory: UsageRecord[] = []
  private alertCallbacks: Array<(summary: UsageSummary) => void> = []

  constructor(budget: Partial<BudgetConfig> = {}) {
    this.budget = { ...DEFAULT_BUDGET, ...budget }
  }

  /**
   * 요청 비용 계산
   */
  calculateCost(
    model: ClaudeModelId,
    inputTokens: number,
    outputTokens: number,
    cachedInputTokens: number = 0,
    thinkingTokens: number = 0
  ): number {
    const pricing = CLAUDE_PRICING[model]
    if (!pricing) {
      logger.warn(`Unknown model: ${model}, using Sonnet pricing`)
      return this.calculateCost(
        'claude-sonnet-4-20250514',
        inputTokens,
        outputTokens,
        cachedInputTokens,
        thinkingTokens
      )
    }

    // 일반 input (캐시된 토큰 제외)
    const regularInputTokens = Math.max(0, inputTokens - cachedInputTokens)
    const inputCost = (regularInputTokens / 1_000_000) * pricing.input

    // 캐시된 input (90% 할인)
    const cachedCost = (cachedInputTokens / 1_000_000) * pricing.cachedInput

    // Output
    const outputCost = (outputTokens / 1_000_000) * pricing.output

    // Extended Thinking (Opus만)
    let thinkingCost = 0
    if (thinkingTokens > 0 && 'extendedThinking' in pricing) {
      thinkingCost = (thinkingTokens / 1_000_000) * pricing.extendedThinking
    }

    return inputCost + cachedCost + outputCost + thinkingCost
  }

  /**
   * 사용량 기록
   */
  recordUsage(
    model: ClaudeModelId,
    inputTokens: number,
    outputTokens: number,
    taskType: string,
    options: {
      cachedInputTokens?: number
      thinkingTokens?: number
      requestId?: string
    } = {}
  ): UsageRecord {
    const cost = this.calculateCost(
      model,
      inputTokens,
      outputTokens,
      options.cachedInputTokens || 0,
      options.thinkingTokens || 0
    )

    const record: UsageRecord = {
      timestamp: new Date(),
      model,
      inputTokens,
      outputTokens,
      cachedInputTokens: options.cachedInputTokens,
      thinkingTokens: options.thinkingTokens,
      cost,
      taskType,
      requestId: options.requestId,
    }

    this.usageHistory.push(record)

    // 알림 체크
    const summary = this.getSummary()
    if (summary.budgetStatus.shouldAlert) {
      this.triggerAlerts(summary)
    }

    return record
  }

  /**
   * 사용량 요약
   */
  getSummary(): UsageSummary {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // 일일 사용량
    const dailyRecords = this.usageHistory.filter(
      (r) => r.timestamp >= startOfDay
    )
    const dailyCost = dailyRecords.reduce((sum, r) => sum + r.cost, 0)
    const dailyRequests = dailyRecords.length
    const dailyInputTokens = dailyRecords.reduce((sum, r) => sum + r.inputTokens, 0)
    const dailyOutputTokens = dailyRecords.reduce((sum, r) => sum + r.outputTokens, 0)

    // 월간 사용량
    const monthlyRecords = this.usageHistory.filter(
      (r) => r.timestamp >= startOfMonth
    )
    const monthlyCost = monthlyRecords.reduce((sum, r) => sum + r.cost, 0)
    const monthlyRequests = monthlyRecords.length
    const monthlyInputTokens = monthlyRecords.reduce((sum, r) => sum + r.inputTokens, 0)
    const monthlyOutputTokens = monthlyRecords.reduce((sum, r) => sum + r.outputTokens, 0)

    // 예산 상태
    const dailyUsedPercent = (dailyCost / this.budget.dailyLimit) * 100
    const monthlyUsedPercent = (monthlyCost / this.budget.monthlyLimit) * 100
    const isOverDaily = dailyCost >= this.budget.dailyLimit
    const isOverMonthly = monthlyCost >= this.budget.monthlyLimit
    const shouldAlert =
      dailyUsedPercent >= this.budget.alertThreshold * 100 ||
      monthlyUsedPercent >= this.budget.alertThreshold * 100

    return {
      daily: {
        cost: Math.round(dailyCost * 100) / 100,
        requests: dailyRequests,
        inputTokens: dailyInputTokens,
        outputTokens: dailyOutputTokens,
      },
      monthly: {
        cost: Math.round(monthlyCost * 100) / 100,
        requests: monthlyRequests,
        inputTokens: monthlyInputTokens,
        outputTokens: monthlyOutputTokens,
      },
      budgetStatus: {
        dailyUsedPercent: Math.round(dailyUsedPercent * 10) / 10,
        monthlyUsedPercent: Math.round(monthlyUsedPercent * 10) / 10,
        isOverDaily,
        isOverMonthly,
        shouldAlert,
      },
    }
  }

  /**
   * 예산 초과 시 모델 폴백
   *
   * Opus → Sonnet → Haiku 순서로 다운그레이드
   */
  getModelWithBudgetCheck(
    preferredModel: ClaudeModelId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _taskType: string // Reserved for future task-specific budget rules
  ): ClaudeModelId {
    if (!this.budget.autoFallback) {
      return preferredModel
    }

    const summary = this.getSummary()

    // 예산 내라면 선호 모델 사용
    if (!summary.budgetStatus.isOverDaily && !summary.budgetStatus.isOverMonthly) {
      return preferredModel
    }

    // 예산 초과 시 다운그레이드
    logger.warn(
      `[CostManager] Budget exceeded, downgrading from ${preferredModel}`
    )

    if (preferredModel === 'claude-opus-4-5-20251101') {
      return 'claude-sonnet-4-20250514'
    }
    if (preferredModel === 'claude-sonnet-4-20250514') {
      return 'claude-haiku-4-20250514'
    }

    // Haiku는 더 이상 다운그레이드 불가
    return 'claude-haiku-4-20250514'
  }

  /**
   * 알림 콜백 등록
   */
  onAlert(callback: (summary: UsageSummary) => void): void {
    this.alertCallbacks.push(callback)
  }

  /**
   * 알림 트리거
   */
  private triggerAlerts(summary: UsageSummary): void {
    for (const callback of this.alertCallbacks) {
      try {
        callback(summary)
      } catch (error) {
        logger.error('[CostManager] Alert callback error:', error)
      }
    }
  }

  /**
   * 예산 설정 업데이트
   */
  updateBudget(budget: Partial<BudgetConfig>): void {
    this.budget = { ...this.budget, ...budget }
  }

  /**
   * 사용량 히스토리 초기화 (테스트/리셋용)
   */
  clearHistory(): void {
    this.usageHistory = []
  }

  /**
   * 예산 남은 금액 조회
   */
  getRemainingBudget(): { daily: number; monthly: number } {
    const summary = this.getSummary()
    return {
      daily: Math.max(0, this.budget.dailyLimit - summary.daily.cost),
      monthly: Math.max(0, this.budget.monthlyLimit - summary.monthly.cost),
    }
  }

  /**
   * 모델별 사용량 분석
   */
  getModelBreakdown(): Record<
    string,
    { requests: number; cost: number; tokens: number }
  > {
    const breakdown: Record<
      string,
      { requests: number; cost: number; tokens: number }
    > = {}

    for (const record of this.usageHistory) {
      if (!breakdown[record.model]) {
        breakdown[record.model] = { requests: 0, cost: 0, tokens: 0 }
      }
      breakdown[record.model].requests++
      breakdown[record.model].cost += record.cost
      breakdown[record.model].tokens += record.inputTokens + record.outputTokens
    }

    // 반올림
    for (const model of Object.keys(breakdown)) {
      breakdown[model].cost = Math.round(breakdown[model].cost * 100) / 100
    }

    return breakdown
  }
}

// ============================================
// Singleton Instance
// ============================================

let costManagerInstance: CostManager | null = null

export function getCostManager(budget?: Partial<BudgetConfig>): CostManager {
  if (!costManagerInstance) {
    costManagerInstance = new CostManager(budget)
  } else if (budget) {
    costManagerInstance.updateBudget(budget)
  }
  return costManagerInstance
}

export function initCostManager(budget?: Partial<BudgetConfig>): CostManager {
  costManagerInstance = new CostManager(budget)
  return costManagerInstance
}

// 기본 export
export const costManager = getCostManager()

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 토큰 비용 추정 (요청 전 예측용)
 */
export function estimateCost(
  model: ClaudeModelId,
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
  cacheHitRate: number = 0.7 // 기본 70% 캐시 적중률
): number {
  const cachedTokens = Math.floor(estimatedInputTokens * cacheHitRate)
  return getCostManager().calculateCost(
    model,
    estimatedInputTokens,
    estimatedOutputTokens,
    cachedTokens,
    0
  )
}

/**
 * 모델 선택 with 예산 체크
 */
export function selectModelWithBudget(
  taskType: Parameters<typeof getModelForTask>[0]
): ClaudeModelId {
  const preferredModel = getModelForTask(taskType) as ClaudeModelId
  return getCostManager().getModelWithBudgetCheck(preferredModel, taskType)
}

/**
 * 비용 포맷팅
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) return '<$0.01'
  if (cost < 1) return `$${cost.toFixed(2)}`
  return `$${cost.toFixed(2)}`
}

/**
 * 토큰 수 포맷팅
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K`
  return `${(tokens / 1_000_000).toFixed(2)}M`
}
