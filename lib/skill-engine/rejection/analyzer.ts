/**
 * QETTA Rejection Analyzer
 *
 * 🧠 Extended Thinking을 활용한 심층 탈락 분석
 *
 * 기능:
 * 1. 탈락 사유 패턴 매칭
 * 2. Extended Thinking으로 근본 원인 추론
 * 3. 도메인 엔진에 피드백 데이터 생성
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import type {
  RejectionPattern,
  RejectionCategory,
  RejectionAnalysisResult,
  EnginePresetFeedback,
  EnginePresetType,
  ApplicationHistory,
} from '../types'

import {
  REJECTION_PATTERNS,
  findPatternsByCategory,
  findPatternsByDomain,
} from './patterns'
import { logger } from '@/lib/api/logger'

// ============================================
// Rejection Analyzer Configuration
// ============================================

export interface AnalyzerConfig {
  useExtendedThinking: boolean
  thinkingBudget: number // tokens (기본 10K)
  confidenceThreshold: number // 최소 신뢰도 (0-1)
  maxPatterns: number // 분석할 최대 패턴 수
  feedbackEnabled: boolean // 도메인 엔진 피드백 활성화
}

const DEFAULT_CONFIG: AnalyzerConfig = {
  useExtendedThinking: true,
  thinkingBudget: 10000, // 10K tokens
  confidenceThreshold: 0.7,
  maxPatterns: 10,
  feedbackEnabled: true,
}

// ============================================
// Rejection Analyzer Class
// ============================================

export class RejectionAnalyzer {
  private config: AnalyzerConfig

  constructor(config: Partial<AnalyzerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 탈락 사유 분석
   *
   * @param rejectionText - 탈락 사유 텍스트 (이메일 또는 공문)
   * @param domain - 도메인 엔진 타입
   * @param companyHistory - 기업 신청 이력 (선택)
   */
  async analyze(
    rejectionText: string,
    domain: EnginePresetType | 'general',
    companyHistory?: ApplicationHistory[]
  ): Promise<RejectionAnalysisResult> {
    // 1. 패턴 매칭
    const matchedPatterns = this.matchPatterns(rejectionText, domain)

    // 2. Extended Thinking 분석 (향후 Claude API 연동)
    const extendedAnalysis = await this.performExtendedThinking(
      rejectionText,
      matchedPatterns,
      companyHistory
    )

    // 3. 추천 사항 생성
    const recommendations = this.generateRecommendations(matchedPatterns, extendedAnalysis)

    // 4. 도메인 엔진 피드백 생성
    const feedback = this.generateFeedback(matchedPatterns, domain, extendedAnalysis)

    return {
      patterns: matchedPatterns,
      extendedThinking: {
        enabled: true as const,
        thinkingBudget: this.config.thinkingBudget,
        reasoning: extendedAnalysis.reasoning,
      },
      recommendations,
      feedbackToEngine: feedback,
    }
  }

  /**
   * 패턴 매칭 (키워드 기반)
   */
  private matchPatterns(
    text: string,
    domain: EnginePresetType | 'general'
  ): RejectionPattern[] {
    const normalizedText = text.toLowerCase()
    const allPatterns =
      domain === 'general' ? REJECTION_PATTERNS : findPatternsByDomain(domain as EnginePresetType)

    // 키워드 매칭 점수 계산
    const scoredPatterns = allPatterns.map((pattern) => {
      const matchedKeywords = pattern.pattern.keywords.filter((keyword) =>
        normalizedText.includes(keyword.toLowerCase())
      )
      const score = matchedKeywords.length / pattern.pattern.keywords.length
      return { pattern, score, matchedKeywords }
    })

    // 점수 기준 필터링 및 정렬
    return scoredPatterns
      .filter((item) => item.score >= this.config.confidenceThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxPatterns)
      .map((item) => ({
        ...item.pattern,
        metadata: {
          ...item.pattern.metadata,
          confidence: item.score,
        },
      }))
  }

  /**
   * Extended Thinking 분석 (Claude API 연동)
   *
   * Claude Opus 4.5의 Extended Thinking을 활용한 심층 탈락 분석
   * - 표면적 원인 → 근본 원인 추론
   * - 숨겨진 패턴 발견
   * - 맞춤형 개선 전략 도출
   *
   * @see https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking
   */
  private async performExtendedThinking(
    rejectionText: string,
    matchedPatterns: RejectionPattern[],
    companyHistory?: ApplicationHistory[]
  ): Promise<{ reasoning: string; rootCause: string; hiddenFactors: string[] }> {
    // Extended Thinking 비활성화 시 로컬 분석으로 폴백
    if (!this.config.useExtendedThinking) {
      return this.performLocalAnalysis(rejectionText, matchedPatterns, companyHistory)
    }

    try {
      // Dynamic import로 서버 사이드에서만 로드 (Edge Runtime 호환)
      const Anthropic = (await import('@anthropic-ai/sdk')).default

      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        logger.warn('ANTHROPIC_API_KEY not found, falling back to local analysis')
        return this.performLocalAnalysis(rejectionText, matchedPatterns, companyHistory)
      }

      const anthropic = new Anthropic({ apiKey })

      // Extended Thinking 프롬프트 구성
      const systemPrompt = this.buildExtendedThinkingPrompt(matchedPatterns, companyHistory)

      // Claude Opus 4.5 + Extended Thinking 호출
      // Note: Extended Thinking은 streaming을 지원하지 않음
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 16000,
        thinking: {
          type: 'enabled',
          budget_tokens: this.config.thinkingBudget,
        },
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `다음 탈락 사유를 심층 분석해주세요:\n\n${rejectionText}`,
          },
        ],
      })

      // Extended Thinking 응답 파싱
      return this.parseExtendedThinkingResponse(response, matchedPatterns, companyHistory)
    } catch (error) {
      logger.error('[RejectionAnalyzer] Extended Thinking API error:', error)
      // API 에러 시 로컬 분석으로 폴백
      return this.performLocalAnalysis(rejectionText, matchedPatterns, companyHistory)
    }
  }

  /**
   * Extended Thinking용 시스템 프롬프트 구성
   */
  private buildExtendedThinkingPrompt(
    matchedPatterns: RejectionPattern[],
    companyHistory?: ApplicationHistory[]
  ): string {
    const patternContext = matchedPatterns
      .map((p) => `- ${p.id}: ${p.pattern.context} (빈도: ${p.stats.frequency}%)`)
      .join('\n')

    const historyContext = companyHistory
      ? `\n\n## 기업 신청 이력\n- 총 ${companyHistory.length}회 신청\n- 탈락: ${companyHistory.filter((h) => h.result === 'rejected').length}회`
      : ''

    return `당신은 QETTA 탈락 분석 전문가입니다. 정부지원사업 탈락 사유를 심층 분석합니다.

## 분석 원칙
1. 표면적 원인 뒤에 숨겨진 근본 원인을 찾습니다
2. 기업 이력에서 반복 패턴을 발견합니다
3. 실행 가능한 개선 전략을 제시합니다
4. 구체적인 수치와 일정으로 제안합니다

## 매칭된 패턴 정보
${patternContext || '(매칭된 패턴 없음)'}${historyContext}

## 출력 형식
반드시 다음 JSON 형식으로 응답하세요:
{
  "rootCause": "근본 원인 (한 문장)",
  "hiddenFactors": ["숨겨진 요인 1", "숨겨진 요인 2"],
  "recommendations": [
    {"action": "조치 사항", "timeline": "기한", "priority": "high|medium|low"}
  ]
}`
  }

  /**
   * Extended Thinking 응답 파싱
   */
  private parseExtendedThinkingResponse(
    response: { content: Array<{ type: string; text?: string; thinking?: string }> },
    matchedPatterns: RejectionPattern[],
    companyHistory?: ApplicationHistory[]
  ): { reasoning: string; rootCause: string; hiddenFactors: string[] } {
    // thinking 블록과 text 블록 분리
    const thinkingBlock = response.content.find((c) => c.type === 'thinking')
    const textBlock = response.content.find((c) => c.type === 'text')

    const reasoning = thinkingBlock?.thinking || ''

    // JSON 응답 파싱 시도
    try {
      const jsonMatch = textBlock?.text?.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          reasoning: `## Extended Thinking 분석 결과\n\n${reasoning}\n\n### 최종 분석\n${textBlock?.text || ''}`,
          rootCause: parsed.rootCause || this.identifyRootCause(matchedPatterns, this.analyzeHistory(companyHistory || [])),
          hiddenFactors: parsed.hiddenFactors || [],
        }
      }
    } catch {
      // JSON 파싱 실패 시 텍스트 그대로 사용
    }

    return {
      reasoning: `## Extended Thinking 분석 결과\n\n${reasoning}\n\n### AI 분석\n${textBlock?.text || '분석 결과 없음'}`,
      rootCause: this.identifyRootCause(matchedPatterns, this.analyzeHistory(companyHistory || [])),
      hiddenFactors: [],
    }
  }

  /**
   * 로컬 분석 (Extended Thinking 비활성화 또는 API 에러 시 폴백)
   */
  private performLocalAnalysis(
    _rejectionText: string,
    matchedPatterns: RejectionPattern[],
    companyHistory?: ApplicationHistory[]
  ): { reasoning: string; rootCause: string; hiddenFactors: string[] } {
    // 기존 로컬 분석 로직
    const patternCategories = [...new Set(matchedPatterns.map((p) => p.category))]
    const historyInsights = companyHistory
      ? this.analyzeHistory(companyHistory)
      : { repeatedCategories: [], improvementRate: 0 }

    const reasoning = `
## 탈락 사유 심층 분석

### 1. 직접적 원인
- 매칭된 패턴: ${matchedPatterns.length}개
- 주요 카테고리: ${patternCategories.join(', ')}
- 탈락 텍스트에서 발견된 핵심 키워드 분석 완료

### 2. 이력 기반 분석
${companyHistory ? `
- 총 신청 횟수: ${companyHistory.length}회
- 반복되는 탈락 유형: ${historyInsights.repeatedCategories.join(', ') || '없음'}
- 개선율: ${historyInsights.improvementRate}%
` : '- 이력 데이터 없음'}

### 3. 숨겨진 요인 추론
${this.inferHiddenFactors(matchedPatterns, historyInsights)}

### 4. 근본 원인
${this.identifyRootCause(matchedPatterns, historyInsights)}
    `.trim()

    return {
      reasoning,
      rootCause: this.identifyRootCause(matchedPatterns, historyInsights),
      hiddenFactors: this.inferHiddenFactors(matchedPatterns, historyInsights).split('\n').filter(Boolean),
    }
  }

  /**
   * 이력 분석
   */
  private analyzeHistory(history: ApplicationHistory[]): {
    repeatedCategories: RejectionCategory[]
    improvementRate: number
  } {
    const rejections = history.filter((h) => h.result === 'rejected')
    const categoryCount: Record<string, number> = {}

    rejections.forEach((r) => {
      if (r.rejectionCategory) {
        categoryCount[r.rejectionCategory] = (categoryCount[r.rejectionCategory] || 0) + 1
      }
    })

    const repeatedCategories = Object.entries(categoryCount)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_category, count]) => count >= 2)
      .map(([category]) => category as RejectionCategory)

    // 개선율: 같은 카테고리 탈락이 줄어들었는지
    const recentRejections = rejections.slice(-5)
    const olderRejections = rejections.slice(0, -5)

    let improvementRate = 0
    if (olderRejections.length > 0 && recentRejections.length > 0) {
      const olderRate = olderRejections.length / Math.max(olderRejections.length + 1, 1)
      const recentRate = recentRejections.length / Math.max(recentRejections.length + 1, 1)
      improvementRate = Math.round((1 - recentRate / olderRate) * 100)
    }

    return { repeatedCategories, improvementRate }
  }

  /**
   * 숨겨진 요인 추론
   */
  private inferHiddenFactors(
    patterns: RejectionPattern[],
    historyInsights: { repeatedCategories: RejectionCategory[]; improvementRate: number }
  ): string {
    const factors: string[] = []

    // 반복 패턴 감지
    if (historyInsights.repeatedCategories.length > 0) {
      factors.push(
        `- 반복적인 ${historyInsights.repeatedCategories[0]} 패턴 감지: 프로세스 개선 필요`
      )
    }

    // 다중 패턴 감지
    if (patterns.length >= 3) {
      factors.push('- 복합적인 문제: 전반적인 신청 프로세스 재검토 권장')
    }

    // 자격 문제 + 서류 문제 조합
    const hasQualificationIssue = patterns.some((p) => p.category === 'qualification_fail')
    const hasDocumentIssue = patterns.some((p) => p.category === 'missing_document')
    if (hasQualificationIssue && hasDocumentIssue) {
      factors.push('- 자격 요건 이해 부족 가능성: 공고문 분석 역량 강화 필요')
    }

    // 예방율 낮은 패턴 감지
    const lowPreventionPatterns = patterns.filter((p) => p.stats.preventionRate < 70)
    if (lowPreventionPatterns.length > 0) {
      factors.push('- 단기 개선이 어려운 구조적 문제 존재: 장기 전략 수립 필요')
    }

    return factors.length > 0 ? factors.join('\n') : '- 특이 요인 미발견'
  }

  /**
   * 근본 원인 식별
   */
  private identifyRootCause(
    patterns: RejectionPattern[],
    historyInsights: { repeatedCategories: RejectionCategory[]; improvementRate: number }
  ): string {
    if (patterns.length === 0) {
      return '패턴 매칭 실패: 수동 분석 필요'
    }

    // 가장 빈도 높은 카테고리
    const topPattern = patterns[0]

    // 반복 패턴이 있으면 우선
    if (historyInsights.repeatedCategories.length > 0) {
      const repeatedCategory = historyInsights.repeatedCategories[0]
      const categoryName = this.getCategoryName(repeatedCategory)
      return `반복적인 ${categoryName} 문제: 체계적인 프로세스 개선 필요`
    }

    return `${this.getCategoryName(topPattern.category)}: ${topPattern.pattern.context}`
  }

  /**
   * 카테고리 한글명
   */
  private getCategoryName(category: RejectionCategory): string {
    const names: Record<RejectionCategory, string> = {
      missing_document: '서류 누락',
      format_error: '양식 오류',
      deadline_missed: '기한 초과',
      qualification_fail: '자격 미달',
      budget_mismatch: '예산 부적합',
      technical_fail: '기술 점수 미달',
      experience_lack: '경험 부족',
      certification_missing: '인증 누락',
      reference_invalid: '레퍼런스 부적합',
      other: '기타',
    }
    return names[category] || category
  }

  /**
   * 추천 사항 생성
   */
  private generateRecommendations(
    patterns: RejectionPattern[],
    extendedAnalysis: { reasoning: string; rootCause: string; hiddenFactors: string[] }
  ): RejectionAnalysisResult['recommendations'] {
    if (patterns.length === 0) {
      return [
        {
          priority: 'medium',
          action: '탈락 사유 상세 확인 후 재분석 필요',
          expectedOutcome: '정확한 원인 파악',
        },
      ]
    }

    const recommendations: RejectionAnalysisResult['recommendations'] = []

    // 즉시 조치 (가장 높은 빈도 패턴)
    const topPattern = patterns[0]
    recommendations.push({
      priority: topPattern.stats.frequency > 15 ? 'critical' : 'high',
      action: topPattern.solution.immediate,
      expectedOutcome: `${topPattern.stats.preventionRate}% 예방 효과`,
    })

    // 예방 조치
    recommendations.push({
      priority: 'medium',
      action: topPattern.solution.prevention,
      expectedOutcome: '동일 유형 재발 방지',
    })

    // 숨겨진 요인 기반 추천
    if (extendedAnalysis.hiddenFactors.length > 0) {
      recommendations.push({
        priority: 'low',
        action: '프로세스 전반 점검 및 QETTA 자동화 도입 검토',
        expectedOutcome: '신청 성공률 전반 향상',
      })
    }

    return recommendations
  }

  /**
   * 도메인 엔진 피드백 생성
   */
  private generateFeedback(
    patterns: RejectionPattern[],
    domain: EnginePresetType | 'general',
    extendedAnalysis: { reasoning: string; rootCause: string; hiddenFactors: string[] }
  ): EnginePresetFeedback {
    const feedback: EnginePresetFeedback = {
      domain: domain === 'general' ? 'ENVIRONMENT' : domain, // 기본값
      type: 'pattern_update',
      patternUpdate: patterns.length > 0
        ? {
            patternId: patterns[0].id,
            deltaFrequency: 0.1, // 빈도 약간 증가
            newSamples: 1,
            confidence: patterns[0].metadata.confidence,
          }
        : undefined,
      metadata: {
        inferredAt: new Date().toISOString(),
        agentRole: 'analyst',
        reasoningTokens: extendedAnalysis.reasoning.length,
        confidence: patterns.length > 0 ? patterns[0].metadata.confidence : 0.5,
      },
    }

    return feedback
  }

  /**
   * 사전 검증 (신청 전)
   */
  async preValidate(
    applicationData: {
      programId: string
      domain: EnginePresetType
      documents: string[]
      companyProfile: { certifications: string[]; revenue: number; employeeCount: number }
    },
    programRequirements: {
      requiredDocuments: string[]
      eligibility: { minRevenue?: number; maxEmployees?: number; requiredCerts?: string[] }
    }
  ): Promise<{
    isValid: boolean
    risks: Array<{ pattern: RejectionPattern; risk: 'high' | 'medium' | 'low' }>
    missingItems: string[]
    suggestions: string[]
  }> {
    const risks: Array<{ pattern: RejectionPattern; risk: 'high' | 'medium' | 'low' }> = []
    const missingItems: string[] = []
    const suggestions: string[] = []

    // 1. 서류 누락 체크
    const missingDocs = programRequirements.requiredDocuments.filter(
      (doc) => !applicationData.documents.includes(doc)
    )
    if (missingDocs.length > 0) {
      missingItems.push(...missingDocs)
      const docPatterns = findPatternsByCategory('missing_document')
      if (docPatterns.length > 0) {
        risks.push({ pattern: docPatterns[0], risk: 'high' })
      }
    }

    // 2. 자격 요건 체크
    const { eligibility } = programRequirements
    const { companyProfile } = applicationData

    if (eligibility.minRevenue && companyProfile.revenue < eligibility.minRevenue) {
      const qualPatterns = findPatternsByCategory('qualification_fail')
      if (qualPatterns.length > 0) {
        risks.push({ pattern: qualPatterns[0], risk: 'high' })
      }
      suggestions.push(`매출 요건 미달: ${companyProfile.revenue}억 < ${eligibility.minRevenue}억`)
    }

    if (eligibility.maxEmployees && companyProfile.employeeCount > eligibility.maxEmployees) {
      suggestions.push(`종업원 수 초과: ${companyProfile.employeeCount}명 > ${eligibility.maxEmployees}명`)
    }

    // 3. 인증 요건 체크
    if (eligibility.requiredCerts) {
      const missingCerts = eligibility.requiredCerts.filter(
        (cert) => !companyProfile.certifications.includes(cert)
      )
      if (missingCerts.length > 0) {
        missingItems.push(...missingCerts.map((c) => `인증: ${c}`))
        suggestions.push(`필요 인증 누락: ${missingCerts.join(', ')}`)
      }
    }

    const isValid = risks.filter((r) => r.risk === 'high').length === 0 && missingItems.length === 0

    return { isValid, risks, missingItems, suggestions }
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

export const rejectionAnalyzer = new RejectionAnalyzer()
