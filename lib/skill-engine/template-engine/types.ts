/**
 * QETTA Template Engine Types
 *
 * 공고문 기반 템플릿 생성 시스템
 *
 * 핵심 기능:
 * 1. 공고문 구조 분석 → 변수 추출
 * 2. 도메인별 섹션 커스터마이징
 * 3. 재사용 가능한 템플릿 생성
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import type { EnginePresetType } from '@/types/inbox'
import type { RawAnnouncement } from '../skills/announcement'

// ============================================
// 1. Template Variable Types
// ============================================

export type VariableCategory =
  | 'company' // 회사 정보 (사업자등록번호, 대표자 등)
  | 'project' // 프로젝트 정보 (사업명, 기간 등)
  | 'financial' // 재무 정보 (매출액, 자본금 등)
  | 'technical' // 기술 정보 (특허, 인증 등)
  | 'contact' // 연락처 정보
  | 'date' // 날짜 정보
  | 'custom' // 사용자 정의

export type VariableType =
  | 'text' // 일반 텍스트
  | 'number' // 숫자
  | 'currency' // 금액 (원, 만원, 억원)
  | 'date' // 날짜
  | 'phone' // 전화번호
  | 'email' // 이메일
  | 'percent' // 백분율
  | 'multiline' // 여러 줄 텍스트
  | 'select' // 선택형
  | 'file' // 파일 첨부

export interface TemplateVariable {
  /** 변수 ID (예: company_name, project_budget) */
  id: string

  /** 변수명 (한글, UI 표시용) */
  name: string

  /** 변수명 (영문) */
  nameEn: string

  /** 카테고리 */
  category: VariableCategory

  /** 데이터 타입 */
  type: VariableType

  /** 필수 여부 */
  required: boolean

  /** 기본값 */
  defaultValue?: string

  /** 설명/힌트 */
  description?: string

  /** 예시 값 */
  example?: string

  /** 검증 규칙 */
  validation?: VariableValidation

  /** 선택 옵션 (type이 'select'인 경우) */
  options?: string[]

  /** 소스 (공고문 원문에서 추출된 경우) */
  sourceInfo?: {
    section: string
    originalText: string
  }
}

export interface VariableValidation {
  /** 최소 길이 */
  minLength?: number

  /** 최대 길이 */
  maxLength?: number

  /** 최소값 (숫자/금액) */
  min?: number

  /** 최대값 (숫자/금액) */
  max?: number

  /** 정규식 패턴 */
  pattern?: string

  /** 에러 메시지 */
  errorMessage?: string
}

// ============================================
// 2. Template Section Types
// ============================================

export type SectionType =
  | 'applicant_info' // 신청자 정보
  | 'company_overview' // 기업 개요
  | 'project_plan' // 사업 계획
  | 'budget_plan' // 예산 계획
  | 'expected_outcome' // 기대 성과
  | 'team_info' // 팀 구성
  | 'technology_info' // 기술 현황
  | 'market_analysis' // 시장 분석
  | 'implementation_plan' // 추진 일정
  | 'risk_management' // 위험 관리
  | 'appendix' // 부록
  | 'custom' // 사용자 정의

export interface TemplateSection {
  /** 섹션 ID */
  id: string

  /** 섹션 유형 */
  type: SectionType

  /** 섹션명 */
  title: string

  /** 섹션명 (영문) */
  titleEn: string

  /** 순서 */
  order: number

  /** 필수 여부 */
  required: boolean

  /** 포함된 변수 ID 목록 */
  variableIds: string[]

  /** 섹션 설명 */
  description?: string

  /** 최대 글자수 (해당되는 경우) */
  maxLength?: number

  /** 가이드라인/팁 */
  guidelines?: string[]

  /** 공고문에서 추출된 원문 요구사항 */
  originalRequirement?: string
}

// ============================================
// 3. Domain Customization Types
// ============================================

export interface DomainSectionConfig {
  /** 도메인 */
  domain: EnginePresetType

  /** 추가 섹션 */
  additionalSections: TemplateSection[]

  /** 추가 변수 */
  additionalVariables: TemplateVariable[]

  /** 도메인 특화 용어 */
  terminology: Record<string, string>

  /** 도메인 특화 검증 규칙 */
  validationRules?: DomainValidationRule[]
}

export interface DomainValidationRule {
  /** 규칙 ID */
  id: string

  /** 대상 변수 */
  variableId: string

  /** 조건 */
  condition: string

  /** 에러 메시지 */
  errorMessage: string
}

// ============================================
// 4. Template Types
// ============================================

export type TemplateType =
  | 'application_form' // 신청서
  | 'business_plan' // 사업계획서
  | 'budget_plan' // 예산서
  | 'performance_report' // 실적보고서
  | 'settlement_report' // 정산보고서
  | 'checklist' // 체크리스트

export interface DocumentTemplate {
  /** 템플릿 ID */
  id: string

  /** 템플릿명 */
  name: string

  /** 템플릿명 (영문) */
  nameEn: string

  /** 템플릿 유형 */
  type: TemplateType

  /** 적용 도메인 (null이면 범용) */
  domain: EnginePresetType | null

  /** 버전 */
  version: string

  /** 섹션 목록 */
  sections: TemplateSection[]

  /** 변수 목록 */
  variables: TemplateVariable[]

  /** 출력 형식 */
  outputFormats: ('DOCX' | 'PDF' | 'XLSX')[]

  /** 생성 일시 */
  createdAt: string

  /** 수정 일시 */
  updatedAt: string

  /** 소스 정보 (공고문 기반인 경우) */
  sourceInfo?: {
    announcementId: string
    announcementTitle: string
    announcementUrl: string
    extractedAt: string
  }

  /** 메타데이터 */
  metadata: {
    /** 사용 횟수 */
    usageCount: number
    /** 평균 작성 시간 (분) */
    avgCompletionTime?: number
    /** 성공률 (선정률) */
    successRate?: number
    /** 태그 */
    tags: string[]
  }
}

// ============================================
// 5. Template Generation Types
// ============================================

export interface TemplateGenerationRequest {
  /** 공고문 (파싱된 데이터) */
  announcement: RawAnnouncement

  /** 대상 도메인 */
  domain: EnginePresetType

  /** 생성할 템플릿 유형 */
  templateType: TemplateType

  /** 추가 요구사항 (선택) */
  additionalRequirements?: string[]

  /** 이전 템플릿 참조 (버전 업데이트 시) */
  previousTemplateId?: string

  /** 생성 옵션 */
  options?: {
    /** 선택 변수 포함 여부 */
    includeOptionalVariables?: boolean
    /** 공통 변수 병합 여부 */
    mergeCommonVariables?: boolean
  }
}

export interface TemplateGenerationResult {
  /** 성공 여부 */
  success: boolean

  /** 생성된 템플릿 (성공 시) */
  template?: DocumentTemplate

  /** 에러 정보 (실패 시) */
  error?: {
    code: TemplateErrorCode
    message: string
    details?: Record<string, unknown>
  }

  /** 추출된 변수 목록 */
  extractedVariables?: TemplateVariable[]

  /** 분석 통계 */
  stats?: {
    /** 공고문에서 추출된 요구사항 수 */
    extractedRequirements: number
    /** 자동 매핑된 변수 수 */
    autoMappedVariables: number
    /** 수동 확인 필요한 변수 수 */
    manualReviewNeeded: number
    /** 신뢰도 */
    confidence: number
    /** 처리 시간 (ms) */
    processingTime?: number
  }

  /** 경고 메시지 */
  warnings?: string[]

  /** 생성 시간 */
  generatedAt?: string

  /** 추천 사항 */
  recommendations?: string[]
}

// ============================================
// 6. Variable Extraction Types
// ============================================

export interface VariableExtractionResult {
  /** 추출된 변수 목록 */
  variables: ExtractedVariable[]

  /** 추출 통계 */
  stats: {
    totalFound: number
    byCategory: Record<VariableCategory, number>
    byType: Record<VariableType, number>
  }

  /** 처리 시간 (ms) */
  processingTimeMs: number
}

export interface ExtractedVariable extends TemplateVariable {
  /** 추출 신뢰도 (0-1) */
  confidence: number

  /** 추출 위치 (원문에서) */
  position?: {
    section: string
    line?: number
  }

  /** 유사 변수 후보 (중복 방지용) */
  similarVariables?: string[]
}

// ============================================
// 7. Template Fill Types
// ============================================

export interface TemplateFillData {
  /** 템플릿 ID */
  templateId: string

  /** 변수값 매핑 */
  values: Record<string, string | number | boolean>

  /** 파일 첨부 */
  attachments?: Record<string, File | Buffer>

  /** 메타데이터 */
  metadata?: {
    filledBy?: string
    filledAt?: string
    notes?: string
  }
}

export interface TemplateFillResult {
  /** 성공 여부 */
  success: boolean

  /** 누락된 필수 변수 */
  missingRequired: string[]

  /** 검증 오류 */
  validationErrors: ValidationError[]

  /** 경고 */
  warnings: string[]

  /** 완성도 (%) */
  completeness: number
}

export interface ValidationError {
  variableId: string
  message: string
  value?: string
}

// ============================================
// 8. Common Variables (기본 제공 변수)
// ============================================

export const COMMON_VARIABLES: Record<VariableCategory, TemplateVariable[]> = {
  company: [
    {
      id: 'company_name',
      name: '회사명',
      nameEn: 'Company Name',
      category: 'company',
      type: 'text',
      required: true,
      example: '주식회사 샘플',
      validation: { minLength: 2, maxLength: 100 },
    },
    {
      id: 'business_number',
      name: '사업자등록번호',
      nameEn: 'Business Registration Number',
      category: 'company',
      type: 'text',
      required: true,
      example: '123-45-67890',
      validation: { pattern: '^\\d{3}-\\d{2}-\\d{5}$', errorMessage: '올바른 사업자등록번호 형식이 아닙니다' },
    },
    {
      id: 'ceo_name',
      name: '대표자명',
      nameEn: 'CEO Name',
      category: 'company',
      type: 'text',
      required: true,
      example: '홍길동',
    },
    {
      id: 'established_date',
      name: '설립일',
      nameEn: 'Established Date',
      category: 'company',
      type: 'date',
      required: true,
      example: '2020-01-01',
    },
    {
      id: 'employee_count',
      name: '상시근로자 수',
      nameEn: 'Employee Count',
      category: 'company',
      type: 'number',
      required: true,
      example: '15',
      validation: { min: 0 },
    },
    {
      id: 'company_address',
      name: '회사 주소',
      nameEn: 'Company Address',
      category: 'company',
      type: 'text',
      required: true,
      example: '서울특별시 강남구 테헤란로 123',
    },
    {
      id: 'industry_code',
      name: '업종코드',
      nameEn: 'Industry Code',
      category: 'company',
      type: 'text',
      required: false,
      example: 'C26310',
    },
  ],
  project: [
    {
      id: 'project_name',
      name: '사업명',
      nameEn: 'Project Name',
      category: 'project',
      type: 'text',
      required: true,
      example: 'AI 기반 스마트공장 구축',
    },
    {
      id: 'project_summary',
      name: '사업 개요',
      nameEn: 'Project Summary',
      category: 'project',
      type: 'multiline',
      required: true,
      validation: { maxLength: 1000 },
    },
    {
      id: 'project_period',
      name: '사업 기간',
      nameEn: 'Project Period',
      category: 'project',
      type: 'text',
      required: true,
      example: '2026.01 ~ 2026.12 (12개월)',
    },
    {
      id: 'project_goal',
      name: '사업 목표',
      nameEn: 'Project Goal',
      category: 'project',
      type: 'multiline',
      required: true,
    },
  ],
  financial: [
    {
      id: 'annual_revenue',
      name: '연매출액',
      nameEn: 'Annual Revenue',
      category: 'financial',
      type: 'currency',
      required: true,
      example: '50억원',
    },
    {
      id: 'capital',
      name: '자본금',
      nameEn: 'Capital',
      category: 'financial',
      type: 'currency',
      required: true,
      example: '5억원',
    },
    {
      id: 'total_budget',
      name: '총 사업비',
      nameEn: 'Total Budget',
      category: 'financial',
      type: 'currency',
      required: true,
      example: '10억원',
    },
    {
      id: 'government_funding',
      name: '정부지원금',
      nameEn: 'Government Funding',
      category: 'financial',
      type: 'currency',
      required: true,
      example: '7억원',
    },
    {
      id: 'self_funding',
      name: '자부담금',
      nameEn: 'Self Funding',
      category: 'financial',
      type: 'currency',
      required: true,
      example: '3억원',
    },
  ],
  technical: [
    {
      id: 'patent_count',
      name: '보유 특허 수',
      nameEn: 'Patent Count',
      category: 'technical',
      type: 'number',
      required: false,
      example: '5',
    },
    {
      id: 'certifications',
      name: '보유 인증',
      nameEn: 'Certifications',
      category: 'technical',
      type: 'text',
      required: false,
      example: 'ISO 9001, 벤처기업 인증',
    },
    {
      id: 'technology_description',
      name: '기술 현황',
      nameEn: 'Technology Description',
      category: 'technical',
      type: 'multiline',
      required: false,
    },
  ],
  contact: [
    {
      id: 'contact_name',
      name: '담당자명',
      nameEn: 'Contact Name',
      category: 'contact',
      type: 'text',
      required: true,
      example: '김담당',
    },
    {
      id: 'contact_phone',
      name: '담당자 연락처',
      nameEn: 'Contact Phone',
      category: 'contact',
      type: 'phone',
      required: true,
      example: '010-1234-5678',
    },
    {
      id: 'contact_email',
      name: '담당자 이메일',
      nameEn: 'Contact Email',
      category: 'contact',
      type: 'email',
      required: true,
      example: 'contact@example.com',
    },
  ],
  date: [
    {
      id: 'application_date',
      name: '신청일',
      nameEn: 'Application Date',
      category: 'date',
      type: 'date',
      required: true,
    },
  ],
  custom: [],
}

// ============================================
// 9. Error Types
// ============================================

export class TemplateEngineError extends Error {
  constructor(
    message: string,
    public code: TemplateErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'TemplateEngineError'
  }
}

export const TEMPLATE_ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_ANNOUNCEMENT: 'INVALID_ANNOUNCEMENT',
  PARSE_FAILED: 'PARSE_FAILED',
  VARIABLE_EXTRACTION_FAILED: 'VARIABLE_EXTRACTION_FAILED',
  TEMPLATE_GENERATION_FAILED: 'TEMPLATE_GENERATION_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNSUPPORTED_DOMAIN: 'UNSUPPORTED_DOMAIN',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
} as const

export type TemplateErrorCode =
  (typeof TEMPLATE_ERROR_CODES)[keyof typeof TEMPLATE_ERROR_CODES]
