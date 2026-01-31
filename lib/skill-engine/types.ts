/**
 * QETTA Skill Engine Types
 *
 * 핵심 킬러 기능:
 * 1. 탈락분석 (Rejection Analysis) - Extended Thinking 활용
 * 2. 이메일 연동 - 선정/불합격 자동 감지
 * 3. 추론 데이터 → 도메인 엔진 피드백 루프
 *
 * @see generators/gov-support/data/qetta-super-model.json (Single Source of Truth)
 */

import type { EnginePresetType } from '@/types/inbox'

// ============================================
// 1. Skill Engine Core Types
// ============================================

export type SkillCategory =
  | 'document_generation' // 문서 생성
  | 'rejection_analysis' // 탈락 분석 (핵심!)
  | 'matching' // 사업 매칭
  | 'verification' // 검증
  | 'translation' // 번역
  | 'email_integration' // 이메일 연동

export interface BaseSkill {
  id: string
  name: string
  nameKo: string
  category: SkillCategory
  description: string
  version: string
  domains: EnginePresetType[] | 'all' // 적용 가능 도메인
  requiredPromptTokens: number // Prompt Caching 최적화용
}

export interface DocumentSkill extends BaseSkill {
  category: 'document_generation'
  outputFormats: ('DOCX' | 'PDF' | 'XLSX' | 'HWP')[]
  templates: DocumentTemplate[]
}

export interface DocumentTemplate {
  id: string
  name: string
  domain: EnginePresetType
  sections: string[]
  estimatedGenerationTime: number // seconds
}

// ============================================
// 2. Rejection Analysis Types (핵심 킬러 기능)
// ============================================

export type RejectionCategory =
  | 'missing_document' // 서류 누락
  | 'format_error' // 양식 오류
  | 'deadline_missed' // 기한 초과
  | 'qualification_fail' // 자격 미달
  | 'budget_mismatch' // 예산 불일치
  | 'technical_fail' // 기술 점수 미달
  | 'experience_lack' // 경험 부족
  | 'certification_missing' // 인증 누락
  | 'reference_invalid' // 레퍼런스 부적합
  | 'other' // 기타

export interface RejectionPattern {
  id: string
  category: RejectionCategory
  domain: EnginePresetType | 'all'

  // 패턴 정의
  pattern: {
    keywords: string[] // 탈락 사유에서 발견되는 키워드
    regex?: string // 정규식 패턴 (선택)
    context: string // 발생 맥락
  }

  // 통계
  stats: {
    frequency: number // 발생 빈도 (전체 탈락 중 %)
    preventionRate: number // QETTA 사용 시 예방율 (%)
    avgRecoveryDays: number // 평균 재도전까지 일수
  }

  // 해결책
  solution: {
    immediate: string // 즉시 조치
    prevention: string // 예방책
    documents: string[] // 관련 문서
    checklistItems: string[] // 체크리스트
  }

  // 메타데이터
  metadata: {
    source: 'manual' | 'email_detected' | 'user_reported' | 'ai_inferred'
    confidence: number // 0-1
    lastUpdated: string // ISO date
    sampleCount: number // 학습 샘플 수
  }
}

export interface RejectionAnalysisResult {
  patterns: RejectionPattern[]
  extendedThinking: {
    enabled: true
    thinkingBudget: number // tokens (기본 10K)
    reasoning: string // 추론 과정
  }
  recommendations: {
    priority: 'critical' | 'high' | 'medium' | 'low'
    action: string
    expectedOutcome: string
  }[]
  feedbackToEngine: EnginePresetFeedback // 도메인 엔진에 반영할 데이터
}

// ============================================
// 3. Email Integration Types (킬러 기능 2)
// ============================================

export type EmailProvider = 'gmail' | 'outlook' | 'naver' | 'daum'

export type EmailEventType =
  | 'application_submitted' // 신청 완료
  | 'under_review' // 심사 중
  | 'document_request' // 추가 서류 요청
  | 'interview_scheduled' // 면접/발표 일정
  | 'selection_result' // 선정/불합격 결과
  | 'contract_notice' // 계약 안내
  | 'payment_notice' // 정산/지급 안내

export interface EmailIntegrationConfig {
  provider: EmailProvider
  oauth: {
    clientId: string
    scopes: string[]
    redirectUri: string
  }
  filters: {
    senders: string[] // 감지할 발신자 (예: noreply@koita.or.kr)
    subjects: string[] // 제목 키워드
    labels?: string[] // Gmail 라벨
  }
}

export interface DetectedEmailEvent {
  id: string
  type: EmailEventType
  provider: EmailProvider
  email: {
    subject: string
    from: string
    date: string
    snippet: string
    bodyPreview: string
  }
  extracted: {
    programName: string // 추출된 사업명
    programId?: string // 사업 ID (있는 경우)
    result?: 'selected' | 'rejected' | 'pending'
    rejectionReason?: string // 탈락 사유 (있는 경우)
    nextStep?: string // 다음 단계
    deadline?: string // 마감일 (있는 경우)
  }
  confidence: number // 추출 신뢰도 (0-1)
  processedAt: string
}

// ============================================
// 4. Agent Types (Multi-Agent Architecture)
// ============================================

export type AgentRole =
  | 'orchestrator' // 총괄 조율 (Opus)
  | 'scout' // 사업 탐색 (Haiku + Computer Use)
  | 'matcher' // 매칭 분석 (Sonnet + Cache)
  | 'writer' // 문서 작성 (Sonnet + Cache)
  | 'analyst' // 탈락 분석 (Sonnet + Extended Thinking)

export interface AgentConfig {
  role: AgentRole
  model: 'claude-opus-4-5-20251101' | 'claude-sonnet-4-20250514' | 'claude-haiku-3'
  capabilities: {
    promptCaching: boolean
    extendedThinking: boolean
    computerUse: boolean
    toolUse: boolean
  }
  costPerMillionTokens: {
    input: number
    output: number
    cacheRead?: number // Prompt Caching 시
  }
}

export const AGENT_CONFIGS: Record<AgentRole, AgentConfig> = {
  orchestrator: {
    role: 'orchestrator',
    model: 'claude-opus-4-5-20251101',
    capabilities: {
      promptCaching: true,
      extendedThinking: true,
      computerUse: false,
      toolUse: true,
    },
    costPerMillionTokens: {
      input: 15,
      output: 75,
      cacheRead: 1.5,
    },
  },
  scout: {
    role: 'scout',
    model: 'claude-haiku-3',
    capabilities: {
      promptCaching: false,
      extendedThinking: false,
      computerUse: true,
      toolUse: true,
    },
    costPerMillionTokens: {
      input: 0.25,
      output: 1.25,
    },
  },
  matcher: {
    role: 'matcher',
    model: 'claude-sonnet-4-20250514',
    capabilities: {
      promptCaching: true,
      extendedThinking: false,
      computerUse: false,
      toolUse: true,
    },
    costPerMillionTokens: {
      input: 3,
      output: 15,
      cacheRead: 0.3,
    },
  },
  writer: {
    role: 'writer',
    model: 'claude-sonnet-4-20250514',
    capabilities: {
      promptCaching: true,
      extendedThinking: false,
      computerUse: false,
      toolUse: true,
    },
    costPerMillionTokens: {
      input: 3,
      output: 15,
      cacheRead: 0.3,
    },
  },
  analyst: {
    role: 'analyst',
    model: 'claude-sonnet-4-20250514',
    capabilities: {
      promptCaching: true,
      extendedThinking: true, // 핵심! 탈락 분석용
      computerUse: false,
      toolUse: true,
    },
    costPerMillionTokens: {
      input: 3,
      output: 15,
      cacheRead: 0.3,
    },
  },
}

// ============================================
// 5. Domain Engine Feedback (추론 → 엔진 반영)
// ============================================

export interface EnginePresetFeedback {
  domain: EnginePresetType
  type: 'terminology_update' | 'pattern_update' | 'rule_update' | 'stat_update'

  // 용어 업데이트
  terminologyUpdate?: {
    term: string
    definition: string
    context: string
    source: 'rejection_analysis' | 'success_pattern' | 'user_feedback'
  }

  // 패턴 업데이트 (탈락/성공)
  patternUpdate?: {
    patternId: string
    deltaFrequency: number // 빈도 변화
    newSamples: number
    confidence: number
  }

  // 규칙 업데이트
  ruleUpdate?: {
    ruleId: string
    condition: string
    action: string
    priority: number
  }

  // 통계 업데이트
  statUpdate?: {
    metric: string
    value: number
    timestamp: string
  }

  // 메타데이터
  metadata: {
    inferredAt: string
    agentRole: AgentRole
    reasoningTokens: number
    confidence: number
  }
}

// ============================================
// 6. Program/Business Types (사업 정보)
// ============================================

export type FundingSource =
  // 정부 부처
  | 'MSS' // 중소벤처기업부
  | 'MOTIE' // 산업통상자원부
  | 'MSIT' // 과학기술정보통신부
  | 'ME' // 환경부
  | 'MOHW' // 보건복지부
  | 'MOLIT' // 국토교통부
  | 'MOF' // 해양수산부
  | 'MAFRA' // 농림축산식품부
  | 'MOD' // 국방부
  | 'MOE' // 교육부
  // 보증/융자 기관
  | 'KIBO' // 기술보증기금
  | 'KODIT' // 신용보증기금
  | 'KOREG' // 신용보증재단
  | 'IBK' // 기업은행
  | 'KDB' // 산업은행
  // 지방자치단체
  | 'LOCAL_SEOUL'
  | 'LOCAL_BUSAN'
  | 'LOCAL_DAEGU'
  | 'LOCAL_INCHEON'
  | 'LOCAL_GWANGJU'
  | 'LOCAL_DAEJEON'
  | 'LOCAL_ULSAN'
  | 'LOCAL_SEJONG'
  | 'LOCAL_GYEONGGI'
  | 'LOCAL_OTHER'
  // 민간/글로벌
  | 'PRIVATE'
  | 'GLOBAL'

export type ProgramType =
  | 'grant' // 출연금 (R&D)
  | 'subsidy' // 보조금
  | 'voucher' // 바우처
  | 'loan' // 융자 (핵심!)
  | 'guarantee' // 보증
  | 'equity' // 지분투자
  | 'tender' // 입찰/조달

export interface GovernmentProgram {
  id: string
  name: string
  nameEn?: string
  source: FundingSource
  type: ProgramType
  domain: EnginePresetType | 'general'

  // 지원 조건
  eligibility: {
    companyAge: { min?: number; max?: number } // 업력 (년)
    employeeCount: { min?: number; max?: number }
    revenue: { min?: number; max?: number } // 매출 (억원)
    regions?: string[] // 지역 제한
    industries?: string[] // 업종 제한
    certifications?: string[] // 필요 인증
  }

  // 지원 내용
  support: {
    maxAmount: number // 최대 지원금 (만원)
    matchingRatio?: number // 자부담 비율 (%)
    duration?: number // 지원 기간 (개월)
  }

  // 일정
  schedule: {
    announcementDate?: string
    applicationStart: string
    applicationEnd: string
    selectionDate?: string
    contractDate?: string
  }

  // 메타데이터
  metadata: {
    url: string
    lastUpdated: string
    popularity: number // 신청 경쟁률 (있는 경우)
    selectionRate?: number // 선정률 (%)
  }
}

// ============================================
// 7. Company Profile Types
// ============================================

export interface CompanyProfile {
  id: string
  name: string
  businessNumber: string // 사업자등록번호

  // 기본 정보
  basic: {
    foundedDate: string
    employeeCount: number
    annualRevenue: number // 억원
    region: string
    industry: string
    mainProducts: string[]
  }

  // 자격/인증
  qualifications: {
    certifications: string[] // 보유 인증 (ISO, 벤처, 이노비즈 등)
    registrations: string[] // 등록 (AI 공급기업, 조달 등록 등)
    patents: number // 특허 수
    trademarks: number // 상표 수
  }

  // 사업 이력 (핵심 - 탈락 분석용)
  history: {
    applications: ApplicationHistory[]
    totalApplications: number
    selectionCount: number
    rejectionCount: number
    qettaCreditScore: number // QETTA 자체 신용 점수 (0-1000)
  }

  // 이메일 연동
  emailIntegration?: {
    provider: EmailProvider
    connected: boolean
    lastSyncAt?: string
    detectedEvents: number
  }
}

export interface ApplicationHistory {
  id: string
  programId: string
  programName: string
  source: FundingSource
  type: ProgramType
  appliedAt: string
  result: 'selected' | 'rejected' | 'pending' | 'withdrawn'
  rejectionReason?: string
  rejectionCategory?: RejectionCategory
  amount?: number // 선정 금액 (있는 경우)
  feedbackApplied: boolean // 피드백이 도메인 엔진에 반영되었는지
}

// ============================================
// 8. Skill Package Types
// ============================================

export interface SkillPackage {
  id: string
  name: string
  nameKo: string
  description: string
  skills: string[] // Skill IDs
  domain: EnginePresetType | 'general'
  tier: 'base' | 'domain' | 'composite'

  // 비용 최적화
  estimatedCost: {
    perDocument: number // $/건
    perMonth: number // 월 예상 비용
    cacheEfficiency: number // 캐싱 효율 (%)
  }

  // 메타데이터
  metadata: {
    createdAt: string
    updatedAt: string
    usageCount: number
    rating: number // 사용자 평점
  }
}

// ============================================
// 9. Export all types
// ============================================

export type {
  EnginePresetType,
} from '@/types/inbox'
