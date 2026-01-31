/**
 * QETTA Rejection Feedback Loop Types
 *
 * 탈락 피드백 루프 관련 타입 정의
 */

import type { EnginePresetType } from '../types'

// ============================================
// Rejection Pattern Types
// ============================================

/**
 * 탈락 패턴 카테고리
 */
export type RejectionCategory =
  | 'document_quality' // 문서 품질 (오탈자, 형식)
  | 'content_mismatch' // 내용 불일치 (자격요건)
  | 'terminology_error' // 용어 오류 (도메인 용어)
  | 'budget_issue' // 예산 관련
  | 'timeline_issue' // 일정 관련
  | 'evidence_missing' // 증빙 누락
  | 'competition_loss' // 경쟁 탈락
  | 'other' // 기타

/**
 * 학습된 탈락 패턴
 */
export interface LearnedPattern {
  id: string
  category: RejectionCategory
  name: string
  description: string
  keywords: string[]
  frequency: number
  lastSeen: Date
  domain: EnginePresetType | 'general'
  programs: string[] // 발생한 프로그램 목록
  severity: 'high' | 'medium' | 'low'
  autoFix?: {
    available: boolean
    type: 'update_template' | 'update_terminology' | 'add_validation_rule' | 'update_guideline'
    suggestion: string
  }
}

/**
 * 피드백 기록
 */
export interface FeedbackRecord {
  id: string
  timestamp: Date
  rejectionId: string // 원본 탈락 분석 ID
  patternId: string
  domain: EnginePresetType | 'general'
  program: string
  originalReason: string
  extractedPattern: {
    category: RejectionCategory
    keywords: string[]
    context: string
  }
  feedbackAction: FeedbackAction
  applied: boolean
  appliedAt?: Date
  effectMeasured?: {
    successRateChange: number
    measureDate: Date
  }
}

/**
 * 피드백 액션
 */
export interface FeedbackAction {
  type:
    | 'add_validation_rule'
    | 'update_terminology'
    | 'update_template'
    | 'add_checklist_item'
    | 'update_guideline'
    | 'alert_user'
  target: string // 대상 (예: 'TMS.terminology', 'template.budget_plan')
  action: string // 구체적 액션 설명
  priority: 'immediate' | 'next_batch' | 'review_needed'
  payload?: Record<string, unknown>
}

// ============================================
// Feedback Loop State
// ============================================

/**
 * 피드백 루프 통계
 */
export interface FeedbackLoopStats {
  totalRejections: number
  totalPatterns: number
  totalFeedbackActions: number
  appliedActions: number
  byDomain: Record<
    EnginePresetType | 'general',
    {
      rejections: number
      patterns: number
      topCategories: RejectionCategory[]
    }
  >
  byCategory: Record<
    RejectionCategory,
    {
      count: number
      trend: 'increasing' | 'decreasing' | 'stable'
    }
  >
  recentActivity: {
    last24h: number
    last7d: number
    last30d: number
  }
}

/**
 * 도메인 엔진 업데이트 제안
 */
export interface EnginePresetSuggestion {
  id: string
  timestamp: Date
  domain: EnginePresetType
  type: 'terminology' | 'template' | 'validation' | 'guideline'
  title: string
  description: string
  basedOn: string[] // 기반 패턴 ID 목록
  impact: {
    estimatedImprovement: number // 예상 개선율 (%)
    affectedPrograms: string[]
  }
  status: 'pending' | 'approved' | 'rejected' | 'applied'
  reviewedBy?: string
  reviewedAt?: Date
}

// ============================================
// Learning Configuration
// ============================================

/**
 * 패턴 학습 설정
 */
export interface LearningConfig {
  minOccurrences: number // 패턴으로 인정할 최소 발생 횟수
  decayRate: number // 시간에 따른 가중치 감소율
  autoApplyThreshold: number // 자동 적용 신뢰도 임계값 (0-1)
  manualReviewRequired: boolean // 적용 전 수동 검토 필요 여부
  enabledDomains: EnginePresetType[] // 활성화된 도메인
}

export const DEFAULT_LEARNING_CONFIG: LearningConfig = {
  minOccurrences: 3,
  decayRate: 0.1, // 10% per week
  autoApplyThreshold: 0.85,
  manualReviewRequired: true,
  enabledDomains: ['ENVIRONMENT', 'MANUFACTURING', 'DIGITAL', 'EXPORT'],
}
