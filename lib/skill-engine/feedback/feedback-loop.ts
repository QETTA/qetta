/**
 * QETTA Rejection Feedback Loop
 *
 * 탈락 패턴 학습 및 도메인 엔진 피드백 시스템
 *
 * 기능:
 * 1. 탈락 패턴 수집 및 분류
 * 2. 패턴 빈도 분석 및 트렌드 감지
 * 3. 도메인 엔진 업데이트 제안 생성
 * 4. 피드백 효과 측정
 *
 * @see docs/plans/2026-01-22-domain-engine-master-plan.md
 */

import type {
  LearnedPattern,
  FeedbackRecord,
  FeedbackAction,
  FeedbackLoopStats,
  EnginePresetSuggestion,
  LearningConfig,
  RejectionCategory,
} from './types'
import { DEFAULT_LEARNING_CONFIG } from './types'
import type { RejectionAnalysisResult, EnginePresetType } from '../types'

// ============================================
// Feedback Loop Store (In-Memory)
// ============================================

interface FeedbackStore {
  patterns: Map<string, LearnedPattern>
  records: FeedbackRecord[]
  suggestions: EnginePresetSuggestion[]
  config: LearningConfig
}

const store: FeedbackStore = {
  patterns: new Map(),
  records: [],
  suggestions: [],
  config: DEFAULT_LEARNING_CONFIG,
}

// ============================================
// Pattern Learning
// ============================================

/**
 * 탈락 분석 결과에서 패턴 학습
 */
export function learnFromRejection(
  analysis: RejectionAnalysisResult,
  domain: EnginePresetType | 'general',
  program: string
): LearnedPattern[] {
  const learnedPatterns: LearnedPattern[] = []

  for (const pattern of analysis.patterns) {
    const patternKey = `${domain}:${pattern.category}`
    let learnedPattern = store.patterns.get(patternKey)

    if (learnedPattern) {
      // 기존 패턴 업데이트
      learnedPattern.frequency++
      learnedPattern.lastSeen = new Date()
      if (!learnedPattern.programs.includes(program)) {
        learnedPattern.programs.push(program)
      }
      // 키워드 병합
      const newKeywords = pattern.pattern.keywords.filter(
        (k) => !learnedPattern!.keywords.includes(k)
      )
      learnedPattern.keywords.push(...newKeywords)
    } else {
      // 새 패턴 생성
      learnedPattern = {
        id: `lp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        category: mapToRejectionCategory(pattern.category),
        name: pattern.pattern.context,
        description: pattern.solution.immediate,
        keywords: pattern.pattern.keywords,
        frequency: 1,
        lastSeen: new Date(),
        domain: domain === 'general' ? 'general' : domain,
        programs: [program],
        severity: determineSeverity(pattern.category),
        autoFix: determineAutoFix(pattern),
      }
      store.patterns.set(patternKey, learnedPattern)
    }

    learnedPatterns.push(learnedPattern)
  }

  return learnedPatterns
}

/**
 * RejectionCategory를 LearnedPattern의 RejectionCategory로 매핑
 */
function mapToRejectionCategory(
  category: string
): RejectionCategory {
  const mapping: Record<string, RejectionCategory> = {
    document_incomplete: 'document_quality',
    format_violation: 'document_quality',
    deadline_missed: 'timeline_issue',
    eligibility_fail: 'content_mismatch',
    budget_mismatch: 'budget_issue',
    technical_fail: 'content_mismatch',
    experience_lack: 'content_mismatch',
    certification_missing: 'evidence_missing',
    reference_invalid: 'evidence_missing',
    other: 'other',
  }
  return mapping[category] || 'other'
}

/**
 * 심각도 결정
 */
function determineSeverity(
  category: string
): 'high' | 'medium' | 'low' {
  const highSeverity = ['document_incomplete', 'eligibility_fail', 'deadline_missed']
  const mediumSeverity = ['format_violation', 'budget_mismatch', 'technical_fail']

  if (highSeverity.includes(category)) return 'high'
  if (mediumSeverity.includes(category)) return 'medium'
  return 'low'
}

/**
 * 자동 수정 가능 여부 결정
 */
function determineAutoFix(
  pattern: RejectionAnalysisResult['patterns'][0]
): LearnedPattern['autoFix'] {
  const category = mapToRejectionCategory(pattern.category)

  // 문서 품질 문제는 템플릿 업데이트 가능
  if (category === 'document_quality') {
    return {
      available: true,
      type: 'update_template',
      suggestion: pattern.solution.prevention,
    }
  }

  // 증빙 누락은 체크리스트 추가
  if (category === 'evidence_missing') {
    return {
      available: true,
      type: 'add_validation_rule',
      suggestion: pattern.solution.checklistItems.join(', '),
    }
  }

  // 용어 오류는 용어 매핑 업데이트
  if (category === 'terminology_error') {
    return {
      available: true,
      type: 'update_terminology',
      suggestion: pattern.solution.prevention,
    }
  }

  return {
    available: false,
    type: 'update_guideline',
    suggestion: pattern.solution.prevention,
  }
}

// ============================================
// Feedback Recording
// ============================================

/**
 * 피드백 기록 생성
 */
export function createFeedbackRecord(
  rejectionId: string,
  pattern: LearnedPattern,
  originalReason: string,
  domain: EnginePresetType | 'general',
  program: string
): FeedbackRecord {
  const action = generateFeedbackAction(pattern)

  const record: FeedbackRecord = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date(),
    rejectionId,
    patternId: pattern.id,
    domain,
    program,
    originalReason,
    extractedPattern: {
      category: pattern.category,
      keywords: pattern.keywords,
      context: pattern.name,
    },
    feedbackAction: action,
    applied: false,
  }

  store.records.push(record)
  return record
}

/**
 * 피드백 액션 생성
 */
function generateFeedbackAction(pattern: LearnedPattern): FeedbackAction {
  if (pattern.autoFix?.available) {
    return {
      type: pattern.autoFix.type,
      target: `${pattern.domain}.${pattern.category}`,
      action: pattern.autoFix.suggestion,
      priority: pattern.frequency >= 5 ? 'immediate' : 'next_batch',
    }
  }

  return {
    type: 'alert_user',
    target: 'dashboard.notifications',
    action: `새로운 탈락 패턴 감지: ${pattern.name}`,
    priority: 'review_needed',
  }
}

// ============================================
// Domain Engine Suggestions
// ============================================

/**
 * 도메인 엔진 업데이트 제안 생성
 */
export function generateEngineSuggestions(): EnginePresetSuggestion[] {
  const suggestions: EnginePresetSuggestion[] = []

  // 빈도가 높은 패턴들을 도메인별로 그룹화
  const patternsByDomain = groupPatternsByDomain()

  for (const [domain, patterns] of Object.entries(patternsByDomain)) {
    if (domain === 'general') continue

    // 자동 수정 가능한 고빈도 패턴 찾기
    const highFreqPatterns = patterns.filter(
      (p) => p.frequency >= store.config.minOccurrences && p.autoFix?.available
    )

    if (highFreqPatterns.length === 0) continue

    // 카테고리별 제안 생성
    const byCategory = groupByCategory(highFreqPatterns)

    for (const [category, categoryPatterns] of Object.entries(byCategory)) {
      const suggestion: EnginePresetSuggestion = {
        id: `sug_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date(),
        domain: domain as EnginePresetType,
        type: determineSuggestionType(category as RejectionCategory),
        title: `${domain} 엔진 ${category} 패턴 업데이트`,
        description: generateSuggestionDescription(categoryPatterns),
        basedOn: categoryPatterns.map((p) => p.id),
        impact: {
          estimatedImprovement: calculateEstimatedImprovement(categoryPatterns),
          affectedPrograms: [
            ...new Set(categoryPatterns.flatMap((p) => p.programs)),
          ],
        },
        status: 'pending',
      }

      suggestions.push(suggestion)
    }
  }

  store.suggestions = suggestions
  return suggestions
}

function groupPatternsByDomain(): Record<string, LearnedPattern[]> {
  const grouped: Record<string, LearnedPattern[]> = {}

  for (const pattern of store.patterns.values()) {
    const domain = pattern.domain
    if (!grouped[domain]) {
      grouped[domain] = []
    }
    grouped[domain].push(pattern)
  }

  return grouped
}

function groupByCategory(patterns: LearnedPattern[]): Record<string, LearnedPattern[]> {
  const grouped: Record<string, LearnedPattern[]> = {}

  for (const pattern of patterns) {
    if (!grouped[pattern.category]) {
      grouped[pattern.category] = []
    }
    grouped[pattern.category].push(pattern)
  }

  return grouped
}

function determineSuggestionType(
  category: RejectionCategory
): 'terminology' | 'template' | 'validation' | 'guideline' {
  switch (category) {
    case 'terminology_error':
      return 'terminology'
    case 'document_quality':
      return 'template'
    case 'evidence_missing':
      return 'validation'
    default:
      return 'guideline'
  }
}

function generateSuggestionDescription(patterns: LearnedPattern[]): string {
  const totalFreq = patterns.reduce((sum, p) => sum + p.frequency, 0)
  const keywords = [...new Set(patterns.flatMap((p) => p.keywords))].slice(0, 5)

  return `${patterns.length}개 관련 패턴 감지 (총 ${totalFreq}건). ` +
    `주요 키워드: ${keywords.join(', ')}. ` +
    `자동 수정 제안: ${patterns[0].autoFix?.suggestion || '없음'}`
}

function calculateEstimatedImprovement(patterns: LearnedPattern[]): number {
  // 패턴 빈도와 심각도 기반 예상 개선율 계산
  const severityWeight = { high: 15, medium: 10, low: 5 }
  let totalWeight = 0

  for (const p of patterns) {
    totalWeight += severityWeight[p.severity] * Math.log(p.frequency + 1)
  }

  return Math.min(Math.round(totalWeight), 40) // 최대 40%
}

// ============================================
// Statistics
// ============================================

/**
 * 피드백 루프 통계 조회
 */
export function getStats(): FeedbackLoopStats {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const byDomain: FeedbackLoopStats['byDomain'] = {
    MANUFACTURING: { rejections: 0, patterns: 0, topCategories: [] },
    ENVIRONMENT: { rejections: 0, patterns: 0, topCategories: [] },
    DIGITAL: { rejections: 0, patterns: 0, topCategories: [] },
    FINANCE: { rejections: 0, patterns: 0, topCategories: [] },
    STARTUP: { rejections: 0, patterns: 0, topCategories: [] },
    EXPORT: { rejections: 0, patterns: 0, topCategories: [] },
    general: { rejections: 0, patterns: 0, topCategories: [] },
  }

  const byCategory: FeedbackLoopStats['byCategory'] = {
    document_quality: { count: 0, trend: 'stable' },
    content_mismatch: { count: 0, trend: 'stable' },
    terminology_error: { count: 0, trend: 'stable' },
    budget_issue: { count: 0, trend: 'stable' },
    timeline_issue: { count: 0, trend: 'stable' },
    evidence_missing: { count: 0, trend: 'stable' },
    competition_loss: { count: 0, trend: 'stable' },
    other: { count: 0, trend: 'stable' },
  }

  // 패턴별 통계 집계
  for (const pattern of store.patterns.values()) {
    const domain = pattern.domain as EnginePresetType | 'general'
    if (byDomain[domain]) {
      byDomain[domain].patterns++
      byDomain[domain].rejections += pattern.frequency
    }

    if (byCategory[pattern.category]) {
      byCategory[pattern.category].count += pattern.frequency
    }
  }

  // 최근 활동
  const last24h = store.records.filter(
    (r) => now - r.timestamp.getTime() < day
  ).length
  const last7d = store.records.filter(
    (r) => now - r.timestamp.getTime() < 7 * day
  ).length
  const last30d = store.records.filter(
    (r) => now - r.timestamp.getTime() < 30 * day
  ).length

  return {
    totalRejections: store.records.length,
    totalPatterns: store.patterns.size,
    totalFeedbackActions: store.records.filter((r) => r.feedbackAction).length,
    appliedActions: store.records.filter((r) => r.applied).length,
    byDomain,
    byCategory,
    recentActivity: { last24h, last7d, last30d },
  }
}

// ============================================
// Management Functions
// ============================================

/**
 * 피드백 적용 처리
 */
export function markFeedbackApplied(
  recordId: string,
  successRateChange?: number
): boolean {
  const record = store.records.find((r) => r.id === recordId)
  if (!record) return false

  record.applied = true
  record.appliedAt = new Date()

  if (successRateChange !== undefined) {
    record.effectMeasured = {
      successRateChange,
      measureDate: new Date(),
    }
  }

  return true
}

/**
 * 제안 승인/거절
 */
export function updateSuggestionStatus(
  suggestionId: string,
  status: 'approved' | 'rejected' | 'applied',
  reviewedBy?: string
): boolean {
  const suggestion = store.suggestions.find((s) => s.id === suggestionId)
  if (!suggestion) return false

  suggestion.status = status
  suggestion.reviewedAt = new Date()
  if (reviewedBy) {
    suggestion.reviewedBy = reviewedBy
  }

  return true
}

/**
 * 설정 업데이트
 */
export function updateConfig(config: Partial<LearningConfig>): void {
  store.config = { ...store.config, ...config }
}

/**
 * 스토어 초기화 (테스트용)
 */
export function clearStore(): void {
  store.patterns.clear()
  store.records = []
  store.suggestions = []
}

// ============================================
// Export Functions
// ============================================

export {
  store as feedbackStore,
}
