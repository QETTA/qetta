/**
 * QETTA Core Skill Engine
 *
 * 모든 스킬을 조율하는 핵심 오케스트레이터
 *
 * 아키텍처:
 * - Multi-Agent: Orchestrator, Scout, Matcher, Writer, Analyst
 * - Prompt Caching: 도메인 시스템 프롬프트 90% 비용 절감
 * - Extended Thinking: 탈락 분석에 10K 토큰 추론 예산
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import Anthropic from '@anthropic-ai/sdk'

import { ENV } from '@/lib/env/validate'
import { logger } from '@/lib/api/logger'

import type {
  EnginePresetType,
  GovernmentProgram,
  CompanyProfile,
  RejectionAnalysisResult,
  EnginePresetFeedback,
  DetectedEmailEvent,
} from '../types'

import { RejectionAnalyzer, rejectionAnalyzer } from '../rejection/analyzer'
import { EmailEventDetector, emailDetector } from '../email/detector'
import { DOMAIN_ENGINE_CONFIGS } from '@/lib/domain-engines/constants'

// ============================================
// Skill Engine Configuration
// ============================================

export interface SkillEngineConfig {
  // Claude API
  apiKey: string
  defaultModel: 'opus' | 'sonnet' | 'haiku'

  // Prompt Caching
  enablePromptCaching: boolean
  cachePrefix: string

  // Extended Thinking
  enableExtendedThinking: boolean
  defaultThinkingBudget: number // tokens

  // Feedback Loop
  enableFeedbackLoop: boolean
  feedbackThreshold: number // 최소 신뢰도

  // Cost Management
  monthlyBudget: number // USD
  costAlertThreshold: number // % of budget
}

// Note: ENV.ANTHROPIC_API_KEY will throw EnvValidationError if not set
// This is intentional - fail fast instead of silently using empty string
const getDefaultConfig = (): SkillEngineConfig => ({
  apiKey: ENV.ANTHROPIC_API_KEY,
  defaultModel: 'sonnet',
  enablePromptCaching: true,
  cachePrefix: 'qetta_domain_',
  enableExtendedThinking: true,
  defaultThinkingBudget: 10000,
  enableFeedbackLoop: true,
  feedbackThreshold: 0.7,
  monthlyBudget: 500,
  costAlertThreshold: 80,
})

// Lazily evaluated default config
let _defaultConfig: SkillEngineConfig | null = null
const DEFAULT_CONFIG = new Proxy({} as SkillEngineConfig, {
  get(_, prop: keyof SkillEngineConfig) {
    if (!_defaultConfig) {
      _defaultConfig = getDefaultConfig()
    }
    return _defaultConfig[prop]
  },
})

// ============================================
// Domain System Prompts (Prompt Caching용)
// ============================================

const DOMAIN_SYSTEM_PROMPTS: Record<EnginePresetType, string> = {
  MANUFACTURING: `당신은 QETTA Manufacturing(제조/스마트공장) 도메인 전문가입니다. MES/ERP 데이터 분석, OEE 계산, 스마트공장 정산보고서 작성을 지원합니다.`,

  ENVIRONMENT: `당신은 QETTA Environment(환경/TMS) 도메인 전문가입니다. 환경 규제 준수, TMS 데이터 수집, 탄소중립 보고서 작성을 지원합니다.`,

  DIGITAL: `당신은 QETTA Digital(AI/SW 바우처) 도메인 전문가입니다. NIPA 바우처 사업, 공급기업/수요기업 매칭, 실적보고서 작성을 지원합니다.`,

  FINANCE: `당신은 QETTA Finance(융자/보증) 도메인 전문가입니다. 기보/신보 신청서, 기술평가서, 정책금융 문서 작성을 지원합니다.`,

  STARTUP: `당신은 QETTA Startup(창업지원) 도메인 전문가입니다. TIPS 사업계획서, IR 덱, 창업지원사업 신청서 작성을 지원합니다.`,

  EXPORT: `당신은 QETTA Export(수출/글로벌) 도메인 전문가입니다. KOTRA 수출바우처, 글로벌 입찰 제안서, 다국어 번역 문서 작성을 지원합니다.`,
}

// ============================================
// Core Skill Engine Class
// ============================================

export class SkillEngine {
  private config: SkillEngineConfig
  private rejectionAnalyzer: RejectionAnalyzer
  private emailDetector: EmailEventDetector
  private feedbackQueue: EnginePresetFeedback[] = []
  private usageStats: {
    inputTokens: number
    outputTokens: number
    cachedTokens: number
    cost: number
  } = { inputTokens: 0, outputTokens: 0, cachedTokens: 0, cost: 0 }

  // ============================================
  // Runtime Update Cache (Extended Thinking 피드백)
  // 도메인 엔진 학습 데이터 - 런타임 메모리 내 저장
  // ============================================
  private runtimePatternUpdates: Map<
    string,
    { patternId: string; deltaFrequency: number; newSamples: number; confidence: number }
  > = new Map()
  private runtimeTerminologyUpdates: Map<
    string,
    { term: string; definition: string; context: string; domain: EnginePresetType }
  > = new Map()
  private runtimeStatUpdates: Map<
    string,
    { metric: string; value: number; timestamp: string; domain: EnginePresetType }
  > = new Map()
  private feedbackProcessingLog: Array<{
    processedAt: string
    feedbackType: string
    domain: EnginePresetType
    confidence: number
    applied: boolean
    reason?: string
  }> = []

  constructor(config: Partial<SkillEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.rejectionAnalyzer = rejectionAnalyzer
    this.emailDetector = emailDetector
  }

  // ============================================
  // Core Methods
  // ============================================

  /**
   * 도메인 시스템 프롬프트 가져오기 (Prompt Caching용)
   */
  getDomainSystemPrompt(domain: EnginePresetType): string {
    return DOMAIN_SYSTEM_PROMPTS[domain]
  }

  /**
   * 문서 생성 스킬 실행
   */
  async generateDocument(
    domain: EnginePresetType,
    templateId: string,
    context: {
      companyProfile: CompanyProfile
      programInfo?: GovernmentProgram
      additionalData?: Record<string, unknown>
    }
  ): Promise<{
    success: boolean
    document?: {
      content: string
      format: 'DOCX' | 'PDF' | 'XLSX' | 'HWP'
      metadata: {
        generatedAt: string
        domain: EnginePresetType
        templateId: string
        tokens: { input: number; output: number; cached: number }
      }
    }
    error?: string
  }> {
    const systemPrompt = this.getDomainSystemPrompt(domain)
    const domainConfig = DOMAIN_ENGINE_CONFIGS[domain]

    // API Key 검증
    if (!this.config.apiKey) {
      return {
        success: false,
        error: 'ANTHROPIC_API_KEY is not configured',
      }
    }

    try {
      // Anthropic SDK 인스턴스 생성
      const anthropic = new Anthropic({
        apiKey: this.config.apiKey,
      })

      // 사용자 프롬프트 구성 (컨텍스트 기반)
      const userPrompt = this.buildDocumentPrompt(domain, templateId, context)

      // Claude API 호출 (Prompt Caching 적용)
      const response = await anthropic.messages.create({
        model: this.getModelId(),
        max_tokens: 4096,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            // Prompt Caching: 도메인 시스템 프롬프트 캐싱으로 90% 비용 절감
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      })

      // 응답에서 텍스트 컨텐츠 추출
      const textContent = response.content.find((block) => block.type === 'text')
      const documentContent = textContent?.type === 'text' ? textContent.text : ''

      // 사용량 통계 추출
      const inputTokens = response.usage.input_tokens
      const outputTokens = response.usage.output_tokens
      // cache_read_input_tokens는 Anthropic 응답에서 제공될 때 사용
      const cachedTokens = (response.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens || 0

      // 사용량 통계 업데이트
      this.updateUsageStats({
        input: inputTokens,
        output: outputTokens,
        cached: cachedTokens,
      })

      return {
        success: true,
        document: {
          content: documentContent,
          format: domainConfig.requiredFormat,
          metadata: {
            generatedAt: new Date().toISOString(),
            domain,
            templateId,
            tokens: {
              input: inputTokens,
              output: outputTokens,
              cached: cachedTokens,
            },
          },
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      logger.error('[SkillEngine] Document generation error:', errorMessage)

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * 문서 생성 프롬프트 빌드
   */
  private buildDocumentPrompt(
    domain: EnginePresetType,
    templateId: string,
    context: {
      companyProfile: CompanyProfile
      programInfo?: GovernmentProgram
      additionalData?: Record<string, unknown>
    }
  ): string {
    const { companyProfile, programInfo, additionalData } = context
    const domainConfig = DOMAIN_ENGINE_CONFIGS[domain]

    let prompt = `## 문서 생성 요청

### 템플릿
- ID: ${templateId}
- 도메인: ${domainConfig.label}
- 출력 형식: ${domainConfig.requiredFormat}

### 회사 정보
- 회사명: ${companyProfile.name}
- 사업자등록번호: ${companyProfile.businessNumber}
- 설립일: ${companyProfile.basic.foundedDate}
- 업종: ${companyProfile.basic.industry}
- 지역: ${companyProfile.basic.region}
- 종업원 수: ${companyProfile.basic.employeeCount}명
- 연매출: ${companyProfile.basic.annualRevenue}억원
- 주요 제품: ${companyProfile.basic.mainProducts.join(', ') || '없음'}

### 자격 정보
- 보유 인증: ${companyProfile.qualifications.certifications.join(', ') || '없음'}
- 등록 현황: ${companyProfile.qualifications.registrations.join(', ') || '없음'}
- 특허 수: ${companyProfile.qualifications.patents}건
- 상표 수: ${companyProfile.qualifications.trademarks}건

### 실적 이력
- 총 신청 건수: ${companyProfile.history.totalApplications}건
- 선정 건수: ${companyProfile.history.selectionCount}건
- 탈락 건수: ${companyProfile.history.rejectionCount}건
- QETTA 신용점수: ${companyProfile.history.qettaCreditScore}점
`

    // 프로그램 정보 추가 (있는 경우)
    if (programInfo) {
      prompt += `
### 지원 프로그램
- 프로그램명: ${programInfo.name}
- 자금 출처: ${programInfo.source}
- 프로그램 유형: ${programInfo.type}
- 지원 분야: ${programInfo.domain}
- 지원 일정: ${programInfo.schedule.applicationStart} ~ ${programInfo.schedule.applicationEnd}
- 최대 지원금: ${programInfo.support.maxAmount.toLocaleString()}만원
- 자부담 비율: ${programInfo.support.matchingRatio || 0}%
`
    }

    // 추가 데이터 (있는 경우)
    if (additionalData && Object.keys(additionalData).length > 0) {
      prompt += `
### 추가 데이터
${JSON.stringify(additionalData, null, 2)}
`
    }

    prompt += `
### 요청사항
위 정보를 바탕으로 ${domainConfig.label} 도메인에 적합한 문서를 생성해주세요.
규칙과 양식에 맞게 작성하고, 정량적 지표와 근거 데이터를 포함해주세요.
`

    return prompt
  }

  /**
   * 탈락 분석 실행 (Extended Thinking)
   */
  async analyzeRejection(
    rejectionText: string,
    domain: EnginePresetType | 'general',
    companyProfile?: CompanyProfile
  ): Promise<RejectionAnalysisResult> {
    const result = await this.rejectionAnalyzer.analyze(
      rejectionText,
      domain,
      companyProfile?.history.applications
    )

    // 피드백 큐에 추가
    if (this.config.enableFeedbackLoop && result.feedbackToEngine) {
      this.enqueueFeedback(result.feedbackToEngine)
    }

    return result
  }

  /**
   * 이메일 이벤트 감지
   */
  async detectEmailEvent(email: {
    subject: string
    from: string
    date: string
    body: string
  }): Promise<DetectedEmailEvent | null> {
    const event = this.emailDetector.detect(email)

    // 탈락 이메일인 경우 자동 분석
    if (event && event.type === 'selection_result' && event.extracted.result === 'rejected') {
      if (event.extracted.rejectionReason) {
        // 자동 분석 트리거
        await this.analyzeRejection(event.extracted.rejectionReason, 'general')
      }
    }

    return event
  }

  /**
   * 프로그램 매칭 스코어 계산
   */
  async calculateMatchScore(
    program: GovernmentProgram,
    company: CompanyProfile
  ): Promise<{
    score: number // 0-100
    breakdown: {
      eligibility: number
      experience: number
      technical: number
      financial: number
    }
    risks: string[]
    recommendations: string[]
  }> {
    let eligibilityScore = 100
    let experienceScore = 50
    let technicalScore = 50
    let financialScore = 50
    const risks: string[] = []
    const recommendations: string[] = []

    // 자격 요건 체크
    const { eligibility } = program

    // 업력 체크
    const companyAge = this.calculateCompanyAge(company.basic.foundedDate)
    if (eligibility.companyAge) {
      if (eligibility.companyAge.min && companyAge < eligibility.companyAge.min) {
        eligibilityScore -= 30
        risks.push(`업력 부족: ${companyAge}년 < ${eligibility.companyAge.min}년`)
      }
      if (eligibility.companyAge.max && companyAge > eligibility.companyAge.max) {
        eligibilityScore -= 50 // 치명적
        risks.push(`업력 초과: ${companyAge}년 > ${eligibility.companyAge.max}년`)
      }
    }

    // 매출 체크
    if (eligibility.revenue) {
      if (eligibility.revenue.min && company.basic.annualRevenue < eligibility.revenue.min) {
        eligibilityScore -= 25
        risks.push(`매출 미달: ${company.basic.annualRevenue}억 < ${eligibility.revenue.min}억`)
      }
    }

    // 종업원 수 체크
    if (eligibility.employeeCount) {
      if (
        eligibility.employeeCount.max &&
        company.basic.employeeCount > eligibility.employeeCount.max
      ) {
        eligibilityScore -= 50
        risks.push(`종업원 초과: ${company.basic.employeeCount}명 > ${eligibility.employeeCount.max}명`)
      }
    }

    // 인증 체크
    if (eligibility.certifications) {
      const missingCerts = eligibility.certifications.filter(
        (cert) => !company.qualifications.certifications.includes(cert)
      )
      if (missingCerts.length > 0) {
        eligibilityScore -= 20 * missingCerts.length
        risks.push(`인증 누락: ${missingCerts.join(', ')}`)
        recommendations.push(`인증 취득 필요: ${missingCerts.join(', ')}`)
      }
    }

    // 경험 점수 (이력 기반)
    const successRate =
      company.history.totalApplications > 0
        ? company.history.selectionCount / company.history.totalApplications
        : 0
    experienceScore = Math.round(50 + successRate * 50)

    // QETTA Credit Score 반영
    if (company.history.qettaCreditScore > 700) {
      experienceScore += 20
    }

    // 최종 점수 계산
    const score = Math.round(
      eligibilityScore * 0.4 +
        experienceScore * 0.25 +
        technicalScore * 0.2 +
        financialScore * 0.15
    )

    return {
      score: Math.max(0, Math.min(100, score)),
      breakdown: {
        eligibility: Math.max(0, eligibilityScore),
        experience: experienceScore,
        technical: technicalScore,
        financial: financialScore,
      },
      risks,
      recommendations,
    }
  }

  // ============================================
  // Feedback Loop Methods
  // ============================================

  /**
   * 피드백 큐에 추가
   */
  private enqueueFeedback(feedback: EnginePresetFeedback): void {
    if (feedback.metadata.confidence >= this.config.feedbackThreshold) {
      this.feedbackQueue.push(feedback)
    }
  }

  /**
   * 피드백 처리 (도메인 엔진에 반영)
   *
   * Extended Thinking 결과를 도메인 엔진에 학습시키는 핵심 루프
   * - 패턴 업데이트: 탈락/성공 패턴 빈도 및 샘플 수 조정
   * - 용어 업데이트: 새로운 도메인 용어 추가
   * - 통계 업데이트: 성공률, 예방률 등 KPI 업데이트
   */
  async processFeedbackQueue(): Promise<{
    processed: number
    applied: number
    skipped: number
    details: {
      patternUpdates: number
      terminologyUpdates: number
      statUpdates: number
    }
  }> {
    const results = {
      processed: 0,
      applied: 0,
      skipped: 0,
      details: {
        patternUpdates: 0,
        terminologyUpdates: 0,
        statUpdates: 0,
      },
    }

    for (const feedback of this.feedbackQueue) {
      results.processed++
      const timestamp = new Date().toISOString()

      // 신뢰도 기반 적용 여부 결정 (0.8 이상만 자동 적용)
      const shouldApply = feedback.metadata.confidence >= 0.8
      let applied = false
      let reason = ''

      switch (feedback.type) {
        // 1. 패턴 업데이트 (탈락/성공 패턴)
        case 'pattern_update':
          if (feedback.patternUpdate && shouldApply) {
            const { patternId, deltaFrequency, newSamples, confidence } = feedback.patternUpdate
            const key = `${feedback.domain}:${patternId}`

            // 기존 업데이트가 있으면 누적
            const existing = this.runtimePatternUpdates.get(key)
            if (existing) {
              this.runtimePatternUpdates.set(key, {
                patternId,
                deltaFrequency: existing.deltaFrequency + deltaFrequency,
                newSamples: existing.newSamples + newSamples,
                confidence: (existing.confidence + confidence) / 2, // 평균 신뢰도
              })
            } else {
              this.runtimePatternUpdates.set(key, { patternId, deltaFrequency, newSamples, confidence })
            }

            results.details.patternUpdates++
            applied = true
            reason = `Pattern ${patternId} updated: +${deltaFrequency}% frequency, +${newSamples} samples`
          } else if (!shouldApply) {
            reason = `Confidence ${feedback.metadata.confidence} below threshold 0.8`
          }
          break

        // 2. 용어 업데이트 (도메인 전문 용어)
        case 'terminology_update':
          if (feedback.terminologyUpdate && shouldApply) {
            const { term, definition, context } = feedback.terminologyUpdate
            const key = `${feedback.domain}:${term}`

            this.runtimeTerminologyUpdates.set(key, {
              term,
              definition,
              context,
              domain: feedback.domain,
            })

            results.details.terminologyUpdates++
            applied = true
            reason = `Terminology added: "${term}" in ${feedback.domain}`
          } else if (!shouldApply) {
            reason = `Confidence ${feedback.metadata.confidence} below threshold 0.8`
          }
          break

        // 3. 통계 업데이트 (KPI 메트릭)
        case 'stat_update':
          if (feedback.statUpdate && shouldApply) {
            const { metric, value, timestamp: statTimestamp } = feedback.statUpdate
            const key = `${feedback.domain}:${metric}`

            this.runtimeStatUpdates.set(key, {
              metric,
              value,
              timestamp: statTimestamp,
              domain: feedback.domain,
            })

            results.details.statUpdates++
            applied = true
            reason = `Stat updated: ${metric} = ${value} in ${feedback.domain}`
          } else if (!shouldApply) {
            reason = `Confidence ${feedback.metadata.confidence} below threshold 0.8`
          }
          break

        // 4. 규칙 업데이트 (향후 구현)
        case 'rule_update':
          reason = 'Rule updates not yet implemented'
          break

        default:
          reason = `Unknown feedback type: ${feedback.type}`
      }

      // 처리 로그 기록
      this.feedbackProcessingLog.push({
        processedAt: timestamp,
        feedbackType: feedback.type,
        domain: feedback.domain,
        confidence: feedback.metadata.confidence,
        applied,
        reason,
      })

      if (applied) {
        results.applied++
      } else {
        results.skipped++
      }
    }

    // 큐 비우기
    this.feedbackQueue = []

    return results
  }

  /**
   * 현재 피드백 큐 상태
   */
  getFeedbackQueueStatus(): {
    pending: number
    byDomain: Record<EnginePresetType, number>
    avgConfidence: number
  } {
    const byDomain: Record<string, number> = {
      TMS: 0,
      SMART_FACTORY: 0,
      AI_VOUCHER: 0,
      GLOBAL_TENDER: 0,
    }

    let totalConfidence = 0

    for (const feedback of this.feedbackQueue) {
      byDomain[feedback.domain]++
      totalConfidence += feedback.metadata.confidence
    }

    return {
      pending: this.feedbackQueue.length,
      byDomain: byDomain as Record<EnginePresetType, number>,
      avgConfidence:
        this.feedbackQueue.length > 0 ? totalConfidence / this.feedbackQueue.length : 0,
    }
  }

  /**
   * 런타임 학습 데이터 조회
   * Extended Thinking을 통해 학습된 패턴/용어/통계 데이터
   */
  getLearnedData(): {
    patterns: Array<{
      key: string
      patternId: string
      deltaFrequency: number
      newSamples: number
      confidence: number
    }>
    terminology: Array<{
      key: string
      term: string
      definition: string
      context: string
      domain: EnginePresetType
    }>
    stats: Array<{
      key: string
      metric: string
      value: number
      timestamp: string
      domain: EnginePresetType
    }>
    processingLog: Array<{
      processedAt: string
      feedbackType: string
      domain: EnginePresetType
      confidence: number
      applied: boolean
      reason?: string
    }>
  } {
    return {
      patterns: Array.from(this.runtimePatternUpdates.entries()).map(([key, data]) => ({
        key,
        ...data,
      })),
      terminology: Array.from(this.runtimeTerminologyUpdates.entries()).map(([key, data]) => ({
        key,
        ...data,
      })),
      stats: Array.from(this.runtimeStatUpdates.entries()).map(([key, data]) => ({
        key,
        ...data,
      })),
      processingLog: this.feedbackProcessingLog,
    }
  }

  /**
   * 런타임 학습 데이터 초기화
   * 주의: 학습된 모든 데이터가 삭제됩니다
   */
  clearLearnedData(): void {
    this.runtimePatternUpdates.clear()
    this.runtimeTerminologyUpdates.clear()
    this.runtimeStatUpdates.clear()
    this.feedbackProcessingLog = []
  }

  /**
   * 학습 데이터 요약 통계
   */
  getLearnedDataSummary(): {
    totalPatterns: number
    totalTerminology: number
    totalStats: number
    totalProcessed: number
    appliedRate: number
    byDomain: Record<EnginePresetType, { patterns: number; terminology: number; stats: number }>
  } {
    const byDomain: Record<string, { patterns: number; terminology: number; stats: number }> = {
      TMS: { patterns: 0, terminology: 0, stats: 0 },
      SMART_FACTORY: { patterns: 0, terminology: 0, stats: 0 },
      AI_VOUCHER: { patterns: 0, terminology: 0, stats: 0 },
      GLOBAL_TENDER: { patterns: 0, terminology: 0, stats: 0 },
    }

    // 도메인별 집계
    for (const [key] of this.runtimePatternUpdates) {
      const domain = key.split(':')[0] as EnginePresetType
      if (byDomain[domain]) byDomain[domain].patterns++
    }
    for (const [, data] of this.runtimeTerminologyUpdates) {
      if (byDomain[data.domain]) byDomain[data.domain].terminology++
    }
    for (const [, data] of this.runtimeStatUpdates) {
      if (byDomain[data.domain]) byDomain[data.domain].stats++
    }

    const appliedCount = this.feedbackProcessingLog.filter((log) => log.applied).length
    const totalProcessed = this.feedbackProcessingLog.length

    return {
      totalPatterns: this.runtimePatternUpdates.size,
      totalTerminology: this.runtimeTerminologyUpdates.size,
      totalStats: this.runtimeStatUpdates.size,
      totalProcessed,
      appliedRate: totalProcessed > 0 ? appliedCount / totalProcessed : 0,
      byDomain: byDomain as Record<
        EnginePresetType,
        { patterns: number; terminology: number; stats: number }
      >,
    }
  }

  // ============================================
  // Cost Management
  // ============================================

  /**
   * 사용량 통계 업데이트
   */
  updateUsageStats(tokens: {
    input: number
    output: number
    cached?: number
  }): void {
    this.usageStats.inputTokens += tokens.input
    this.usageStats.outputTokens += tokens.output
    this.usageStats.cachedTokens += tokens.cached || 0

    // 비용 계산 (Sonnet 기준)
    const inputCost = (tokens.input - (tokens.cached || 0)) * 0.000003
    const cachedCost = (tokens.cached || 0) * 0.0000003
    const outputCost = tokens.output * 0.000015

    this.usageStats.cost += inputCost + cachedCost + outputCost
  }

  /**
   * 사용량 통계 조회
   */
  getUsageStats(): typeof this.usageStats & {
    budgetUsed: number // %
    estimatedMonthlyTotal: number
  } {
    const budgetUsed = (this.usageStats.cost / this.config.monthlyBudget) * 100

    return {
      ...this.usageStats,
      budgetUsed,
      estimatedMonthlyTotal: this.usageStats.cost * 30, // 일 기준 추정
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private calculateCompanyAge(foundedDate: string): number {
    const founded = new Date(foundedDate)
    const now = new Date()
    return Math.floor((now.getTime() - founded.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }

  private getModelId(): string {
    const models = {
      opus: 'claude-opus-4-5-20251101',
      sonnet: 'claude-sonnet-4-20250514',
      haiku: 'claude-3-haiku-20240307',
    }
    return models[this.config.defaultModel]
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

export const skillEngine = new SkillEngine()
