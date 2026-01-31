/**
 * QETTA BLOCK 3-Layer Engine Types
 *
 * 3-Layer Architecture:
 * - Layer 1: Domain Engine (산업별 지식) - 기존 EnginePreset 래핑
 * - Layer 2: Company Block (회사별 메모리) - Mem0 패턴 80% 압축
 * - Layer 3: Session Context (실시간 컨텍스트)
 *
 * @see lib/skill-engine (기존 Domain Engine)
 * @see docs/04-block-definitions.md (Block 정의)
 */

import type { EnginePresetType, IndustryBlockType } from '@/lib/super-model'
import type {
  TermFull,
  BlockTemplate,
  ComplianceRule,
} from '@/lib/skill-engine/blocks/types'
import type { ApplicationHistory, CompanyProfile } from '@/lib/skill-engine/types'

// ================== v2.1 Industry Block Types ==================
// 10개로 재정의 (v2.0 12개에서 통합/추가)

export type IndustryBlockTypeV21 =
  | 'FOOD'        // 식품/음료 (KSIC 10, 11) - AI바우처 15%
  | 'TEXTILE'     // 섬유/의류 (KSIC 13, 14) - AI바우처 8%
  | 'METAL'       // 금속/철강 (KSIC 24, 25) - AI바우처 12%
  | 'CHEMICAL'    // 화학/소재 (KSIC 20, 22) - AI바우처 10%
  | 'ELECTRONICS' // 전자/반도체 (KSIC 26, 27) - AI바우처 18%
  | 'MACHINERY'   // 기계/장비 (KSIC 28, 29) - AI바우처 14%
  | 'AUTOMOTIVE'  // 자동차/부품 (KSIC 30) - AI바우처 8%
  | 'BIO_PHARMA'  // 바이오/제약 (KSIC 21) - AI바우처 7%
  | 'ENVIRONMENT' // 환경/에너지 (KSIC 35, 38) - AI바우처 5%
  | 'GENERAL'     // 일반제조 (기타) - AI바우처 3%

// ================== Layer 1: Domain ==================

export type TokenBudgetLevel = 'metadata' | 'terminology' | 'full'

export interface TokenBudget {
  current: number
  max: number
  level: TokenBudgetLevel
}

export interface DomainContext {
  /** 현재 로드된 프리셋 ID */
  presetId: EnginePresetType

  /** 로드된 Industry Blocks (기존 12개 또는 v2.1 10개) */
  loadedBlocks: IndustryBlockType[]

  /** 용어 사전 (Progressive Disclosure) */
  terminology: TermFull[]

  /** 문서 템플릿 */
  templates: BlockTemplate[]

  /** 규정/규칙 (Program Block 역할) */
  rules: ComplianceRule[]

  /** 토큰 예산 */
  tokenBudget: TokenBudget
}

// ================== Layer 2: Company ==================
// Mem0 패턴 기반 압축 Fact 시스템

export type CompanyFactType =
  | 'profile'           // 기본 정보
  | 'certification'     // 보유 인증
  | 'application'       // 신청 이력
  | 'preference'        // 학습된 선호
  | 'rejection_pattern' // 탈락 패턴
  | 'success_pattern'   // 성공 패턴
  | 'capability'        // 기술 역량

export type FactSource =
  | 'user_input'      // 사용자 직접 입력
  | 'document_parsed' // 문서에서 추출
  | 'email_detected'  // 이메일에서 감지
  | 'ai_inferred'     // AI 추론

export interface CompanyFact {
  /** 고유 ID */
  id: string

  /** Fact 유형 */
  type: CompanyFactType

  /** 압축된 자연어 내용 */
  content: string

  /** 신뢰도 (0-1) */
  confidence: number

  /** 데이터 출처 */
  source: FactSource

  /** 생성 시각 (ISO 8601) */
  createdAt: string

  /** 만료 시각 (선택) */
  expiresAt?: string

  /** 관련 문서/이벤트 ID (선택) */
  relatedId?: string
}

export interface CompressionStats {
  /** 압축 전 토큰 수 */
  originalTokens: number

  /** 압축 후 토큰 수 */
  compressedTokens: number

  /** 압축률 (%) */
  ratio: number
}

export interface CompanyBlock {
  /** 회사 고유 ID */
  companyId: string

  /** 회사 프로필 (기존 skill-engine 타입 재사용) */
  profile: CompanyProfile

  /** 압축된 Fact 목록 */
  facts: CompanyFact[]

  /** 압축 통계 */
  compression: CompressionStats

  /** 마지막 업데이트 시각 */
  updatedAt: string
}

// ================== Layer 3: Session ==================

export type SessionIntentType =
  | 'document_generation'   // 제안서 생성
  | 'application_review'    // 신청서 검토
  | 'program_search'        // 사업 매칭
  | 'rejection_analysis'    // 탈락 분석
  | 'question_answer'       // Q&A

export interface SessionIntent {
  /** 의도 유형 */
  type: SessionIntentType

  /** 신뢰도 (0-1) */
  confidence: number

  /** 추출된 엔티티 */
  entities: Record<string, string>

  /** 감지된 시각 */
  detectedAt: string
}

export type MessageRole = 'user' | 'assistant' | 'system'

export interface SessionMessage {
  /** 고유 ID */
  id: string

  /** 역할 */
  role: MessageRole

  /** 메시지 내용 */
  content: string

  /** 생성 시각 */
  timestamp: string

  /** 토큰 수 (추정) */
  tokens?: number
}

export interface ActiveDocument {
  /** 문서 ID */
  id: string

  /** 문서 제목 */
  title: string

  /** 현재 편집 중인 섹션 */
  currentSection?: string

  /** 완료율 (0-100) */
  completionPercent: number

  /** 열린 시각 */
  openedAt: string
}

export interface ActiveProgram {
  /** 프로그램 ID */
  id: string

  /** 프로그램명 */
  name: string

  /** 마감일 */
  deadline: string

  /** 매칭 점수 (0-100) */
  matchScore: number
}

export interface SessionContext {
  /** 세션 고유 ID */
  sessionId: string

  /** 현재 감지된 의도 */
  intent: SessionIntent

  /** 대화 메시지 히스토리 */
  messages: SessionMessage[]

  /** 현재 작업 중인 문서 (선택) */
  activeDocument?: ActiveDocument

  /** 현재 대상 프로그램 (선택) */
  activeProgram?: ActiveProgram

  /** 세션 생성 시각 */
  createdAt: string

  /** 마지막 활동 시각 */
  lastActivityAt: string
}

// ================== Assembled Output ==================

export interface TokenBreakdown {
  /** Layer 1 Domain 토큰 */
  domain: number

  /** Layer 2 Company 토큰 */
  company: number

  /** Layer 3 Session 토큰 */
  session: number
}

export interface AssemblyMetadata {
  /** 총 토큰 수 */
  totalTokens: number

  /** 레이어별 토큰 분배 */
  tokenBreakdown: TokenBreakdown

  /** 조립 시각 */
  assembledAt: string

  /** 예산 내 여부 */
  withinBudget: boolean
}

export interface AssembledContext {
  /** Layer 1: Domain 컨텍스트 */
  domain: DomainContext

  /** Layer 2: Company 컨텍스트 */
  company: CompanyBlock

  /** Layer 3: Session 컨텍스트 */
  session: SessionContext

  /** 조립 메타데이터 */
  assembly: AssemblyMetadata
}

// ================== Prompt Output ==================

export interface AssembledPrompt {
  /** 시스템 프롬프트 */
  system: string

  /** 컨텍스트 섹션 (Domain + Company) */
  context: string

  /** 최근 대화 히스토리 */
  history: string

  /** 현재 사용자 입력 */
  userInput: string

  /** 총 토큰 수 (추정) */
  estimatedTokens: number
}

// ================== Assembly Options ==================

export interface AssemblyOptions {
  /** 최대 토큰 예산 (기본: 8000) */
  maxTokens?: number

  /** Domain 레이어 로딩 레벨 */
  domainLevel?: TokenBudgetLevel

  /** Company facts 필터 */
  factTypes?: CompanyFactType[]

  /** 메시지 히스토리 제한 */
  messageLimit?: number

  /** 프롬프트 생성 포함 여부 */
  includePrompt?: boolean
}

// ================== Default Values ==================

export const DEFAULT_TOKEN_BUDGET = 8000
export const DEFAULT_DOMAIN_TOKENS = 2000
export const DEFAULT_COMPANY_TOKENS = 1500
export const DEFAULT_SESSION_TOKENS = 500
export const DEFAULT_SYSTEM_TOKENS = 500
export const DEFAULT_HEADROOM_TOKENS = 3500

export const SESSION_TTL_MS = 30 * 60 * 1000 // 30분

// ================== v2.1 Industry Block Definitions ==================

export interface IndustryBlockDefinition {
  id: IndustryBlockTypeV21
  nameKo: string
  nameEn: string
  ksicCodes: string[]
  coreTerms: string[]
  aiVoucherPercent: number
  color: string
}

export const INDUSTRY_BLOCKS_V21: IndustryBlockDefinition[] = [
  {
    id: 'FOOD',
    nameKo: '식품/음료',
    nameEn: 'Food & Beverage',
    ksicCodes: ['10', '11'],
    coreTerms: ['HACCP', 'GMP', '콜드체인', '식품안전'],
    aiVoucherPercent: 15,
    color: 'orange',
  },
  {
    id: 'TEXTILE',
    nameKo: '섬유/의류',
    nameEn: 'Textile & Apparel',
    ksicCodes: ['13', '14'],
    coreTerms: ['원단 LOT', '염색 레시피', '봉제', '패턴'],
    aiVoucherPercent: 8,
    color: 'pink',
  },
  {
    id: 'METAL',
    nameKo: '금속/철강',
    nameEn: 'Metal & Steel',
    ksicCodes: ['24', '25'],
    coreTerms: ['열처리', '도금', '금형', '프레스'],
    aiVoucherPercent: 12,
    color: 'slate',
  },
  {
    id: 'CHEMICAL',
    nameKo: '화학/소재',
    nameEn: 'Chemical & Materials',
    ksicCodes: ['20', '22'],
    coreTerms: ['배합비', 'MSDS', 'PSM', 'VOC'],
    aiVoucherPercent: 10,
    color: 'amber',
  },
  {
    id: 'ELECTRONICS',
    nameKo: '전자/반도체',
    nameEn: 'Electronics & Semiconductor',
    ksicCodes: ['26', '27'],
    coreTerms: ['PCB', 'SMT', '클린룸', 'Wafer'],
    aiVoucherPercent: 18,
    color: 'cyan',
  },
  {
    id: 'MACHINERY',
    nameKo: '기계/장비',
    nameEn: 'Machinery & Equipment',
    ksicCodes: ['28', '29'],
    coreTerms: ['CNC', 'PLC', '공차', '4M1E'],
    aiVoucherPercent: 14,
    color: 'blue',
  },
  {
    id: 'AUTOMOTIVE',
    nameKo: '자동차/부품',
    nameEn: 'Automotive & Parts',
    ksicCodes: ['30'],
    coreTerms: ['IATF 16949', 'PPAP', 'JIT', 'Tier'],
    aiVoucherPercent: 8,
    color: 'indigo',
  },
  {
    id: 'BIO_PHARMA',
    nameKo: '바이오/제약',
    nameEn: 'Bio & Pharma',
    ksicCodes: ['21'],
    coreTerms: ['GMP', '밸리데이션', '임상', 'cGMP'],
    aiVoucherPercent: 7,
    color: 'rose',
  },
  {
    id: 'ENVIRONMENT',
    nameKo: '환경/에너지',
    nameEn: 'Environment & Energy',
    ksicCodes: ['35', '38'],
    coreTerms: ['TMS', '탄소중립', 'NOx', 'ESS'],
    aiVoucherPercent: 5,
    color: 'emerald',
  },
  {
    id: 'GENERAL',
    nameKo: '일반제조',
    nameEn: 'General Manufacturing',
    ksicCodes: [],
    coreTerms: ['4M1E', '생산성', 'OEE', '품질관리'],
    aiVoucherPercent: 3,
    color: 'gray',
  },
]

// ================== Type Guards ==================

export function isCompanyFact(obj: unknown): obj is CompanyFact {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj &&
    'content' in obj &&
    'confidence' in obj &&
    'source' in obj &&
    'createdAt' in obj
  )
}

export function isSessionContext(obj: unknown): obj is SessionContext {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'sessionId' in obj &&
    'intent' in obj &&
    'messages' in obj
  )
}

export function isAssembledContext(obj: unknown): obj is AssembledContext {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'domain' in obj &&
    'company' in obj &&
    'session' in obj &&
    'assembly' in obj
  )
}
