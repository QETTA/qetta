/**
 * QETTA Widget v2.0 Types
 *
 * 임베드 가능한 문서 생성 위젯의 타입 정의
 */

import type { EnginePresetType, DocumentFormat } from '@/lib/document-generator/types'

// ============================================
// 문서 타입
// ============================================

export type WidgetDocumentType =
  | 'result_report'      // 결과보고서
  | 'performance_report' // 실적보고서
  | 'sustainability_plan' // 자활계획서
  | 'settlement_report'  // 정산보고서
  | 'business_plan'      // 사업계획서

export type WidgetDocumentStatus =
  | 'idle'
  | 'validating'
  | 'generating'
  | 'complete'
  | 'error'

// ============================================
// 위자드 상태
// ============================================

export interface WizardStep {
  id: number
  title: string
  description: string
  status: 'pending' | 'active' | 'completed'
}

export interface WizardState {
  currentStep: number
  totalSteps: number
  documentType: WidgetDocumentType | null
  enginePreset: EnginePresetType | null
  inputData: Record<string, unknown>
  document: GeneratedWidgetDocument | null
  error: string | null
}

// ============================================
// 진행률
// ============================================

export type ProgressPhase =
  | 'validating'   // 데이터 검증
  | 'analyzing'    // AI 분석
  | 'generating'   // 문서 생성
  | 'rendering'    // 렌더링
  | 'complete'     // 완료

export interface ProgressState {
  phase: ProgressPhase
  progress: number // 0-100
  message: string
  estimatedTimeRemaining: number // seconds
  startedAt: number // timestamp
}

// ============================================
// 생성된 문서
// ============================================

export interface GeneratedWidgetDocument {
  id: string
  title: string
  format: DocumentFormat
  url: string
  previewUrl?: string
  createdAt: Date
  processingTimeMs: number
  timeSavedMinutes: number
  pageCount?: number
}

// ============================================
// 파트너/화이트라벨 설정
// ============================================

export interface PartnerConfig {
  partnerId: string
  partnerName: string
  logoUrl?: string
  brandColor: string
  secondaryColor?: string
  allowedDocTypes: WidgetDocumentType[]
}

// ============================================
// 임베드 설정
// ============================================

export interface EmbedConfig {
  partnerId?: string
  theme: 'light' | 'dark'
  locale: 'ko' | 'en'
  allowedDocTypes?: WidgetDocumentType[]
  onComplete?: (document: GeneratedWidgetDocument) => void
  onError?: (error: Error) => void
  onStepChange?: (step: number) => void
}

// ============================================
// 폼 필드
// ============================================

export interface FieldDefinition {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'file' | 'checkbox'
  required: boolean
  placeholder?: string
  description?: string
  options?: { value: string; label: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface DocumentTemplate {
  documentType: WidgetDocumentType
  name: string
  description: string
  icon: string
  estimatedTimeMinutes: number
  timeSavedMinutes: number // 수동 작업 대비 절감 시간
  fields: FieldDefinition[]
}

// ============================================
// 템플릿 정의
// ============================================

export const WIDGET_TEMPLATES: DocumentTemplate[] = [
  {
    documentType: 'result_report',
    name: '결과보고서',
    description: 'AI 바우처 사업 결과보고서 자동 생성',
    icon: '📊',
    estimatedTimeMinutes: 3,
    timeSavedMinutes: 480, // 8시간
    fields: [
      { name: 'projectName', label: '사업명', type: 'text', required: true },
      { name: 'period', label: '사업기간', type: 'text', required: true },
      { name: 'budget', label: '사업비', type: 'number', required: true },
      { name: 'achievements', label: '주요 성과', type: 'textarea', required: true },
      { name: 'kpiData', label: 'KPI 데이터', type: 'textarea', required: false },
    ],
  },
  {
    documentType: 'performance_report',
    name: '실적보고서',
    description: '월간 실적보고서 자동 생성',
    icon: '📈',
    estimatedTimeMinutes: 2,
    timeSavedMinutes: 240, // 4시간
    fields: [
      { name: 'month', label: '보고 월', type: 'text', required: true },
      { name: 'tasksCompleted', label: '완료 업무', type: 'textarea', required: true },
      { name: 'issues', label: '이슈 사항', type: 'textarea', required: false },
      { name: 'nextPlans', label: '익월 계획', type: 'textarea', required: true },
    ],
  },
  {
    documentType: 'sustainability_plan',
    name: '자활계획서',
    description: '사업 자활계획서 자동 생성',
    icon: '🎯',
    estimatedTimeMinutes: 5,
    timeSavedMinutes: 720, // 12시간
    fields: [
      { name: 'companyInfo', label: '기업 정보', type: 'textarea', required: true },
      { name: 'businessPlan', label: '사업 계획', type: 'textarea', required: true },
      { name: 'revenueProjection', label: '매출 전망', type: 'textarea', required: true },
    ],
  },
  {
    documentType: 'settlement_report',
    name: '정산보고서',
    description: '스마트공장/AI 바우처 정산보고서',
    icon: '💰',
    estimatedTimeMinutes: 4,
    timeSavedMinutes: 360, // 6시간
    fields: [
      { name: 'projectName', label: '사업명', type: 'text', required: true },
      { name: 'totalBudget', label: '총 사업비', type: 'number', required: true },
      { name: 'usedBudget', label: '집행 금액', type: 'number', required: true },
      { name: 'details', label: '집행 내역', type: 'textarea', required: true },
    ],
  },
  {
    documentType: 'business_plan',
    name: '사업계획서',
    description: 'TIPS/정부지원사업 사업계획서',
    icon: '📝',
    estimatedTimeMinutes: 8,
    timeSavedMinutes: 960, // 16시간
    fields: [
      { name: 'companyName', label: '기업명', type: 'text', required: true },
      { name: 'projectTitle', label: '과제명', type: 'text', required: true },
      { name: 'projectSummary', label: '과제 요약', type: 'textarea', required: true },
      { name: 'teamInfo', label: '팀 구성', type: 'textarea', required: true },
      { name: 'budget', label: '신청 예산', type: 'number', required: true },
    ],
  },
]
