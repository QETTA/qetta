/**
 * QETTA Block Engine v2.1
 *
 * 3-Layer 아키텍처로 구성된 컨텍스트 관리 엔진
 *
 * Architecture:
 * ┌─────────────────────────────────────────────┐
 * │  Layer 3: Session Context (실시간)          │
 * │  - 현재 대화, 작업 중인 문서, 사용자 의도   │
 * ├─────────────────────────────────────────────┤
 * │  Layer 2: Company Block (회사별 메모리)     │
 * │  - 회사 프로필, 신청 이력, 학습된 패턴      │
 * │  - Mem0 패턴으로 80% 토큰 압축              │
 * ├─────────────────────────────────────────────┤
 * │  Layer 1: Domain Engine (산업별 지식)       │
 * │  - 기존 EnginePreset 래핑                   │
 * │  - 10 Industry BLOCKs × 6 Presets           │
 * └─────────────────────────────────────────────┘
 *
 * @example
 * ```ts
 * import {
 *   createContextAssembler,
 *   DomainEngineLayer,
 *   CompanyBlockManager,
 *   SessionContextManager,
 * } from '@/lib/block-engine'
 *
 * // 각 Layer 인스턴스 생성
 * const domain = new DomainEngineLayer()
 * const company = new CompanyBlockManager()
 * const session = new SessionContextManager()
 *
 * // Assembler로 통합
 * const assembler = createContextAssembler(domain, company, session)
 *
 * // 컨텍스트 조립
 * const context = assembler.assemble('MANUFACTURING', 'company-1', 'session-1')
 * const prompt = assembler.toPrompt(context)
 * ```
 *
 * @see docs/04-block-definitions.md (Block 정의)
 * @see docs/02-technical-spec.md (기술 명세)
 */

// ================== Types ==================

export type {
  // Layer 1: Domain
  DomainContext,
  TokenBudget,
  TokenBudgetLevel,

  // Layer 2: Company
  CompanyBlock,
  CompanyFact,
  CompanyFactType,
  CompressionStats,
  FactSource,

  // Layer 3: Session
  SessionContext,
  SessionIntent,
  SessionIntentType,
  SessionMessage,
  MessageRole,
  ActiveDocument,
  ActiveProgram,

  // Assembled Output
  AssembledContext,
  AssembledPrompt,
  AssemblyMetadata,
  AssemblyOptions,
  TokenBreakdown,

  // v2.1 Industry Blocks
  IndustryBlockTypeV21,
  IndustryBlockDefinition,
} from './types'

// ================== Constants ==================

export {
  // Token Budget Defaults
  DEFAULT_TOKEN_BUDGET,
  DEFAULT_DOMAIN_TOKENS,
  DEFAULT_COMPANY_TOKENS,
  DEFAULT_SESSION_TOKENS,
  DEFAULT_SYSTEM_TOKENS,
  DEFAULT_HEADROOM_TOKENS,
  SESSION_TTL_MS,

  // v2.1 Industry Block Definitions
  INDUSTRY_BLOCKS_V21,

  // Type Guards
  isCompanyFact,
  isSessionContext,
  isAssembledContext,
} from './types'

// ================== Layer 1: Domain Engine ==================

export {
  DomainEngineLayer,
  createDomainEngineLayer,
  createDomainEngineWithPreset,
} from './domain-engine'

// ================== Layer 2: Company Block ==================

export {
  CompanyBlockManager,
  createCompanyBlockManager,
  getCompanyBlockManager,
} from './company-block'

// ================== Layer 3: Session Context ==================

export {
  SessionContextManager,
  createSessionContextManager,
  getSessionContextManager,
} from './session-context'

// ================== Context Assembler ==================

export {
  ContextAssembler,
  createContextAssembler,
  getContextAssembler,
  quickAssemble,
} from './assembler'

// ================== Re-exports from skill-engine ==================

// 기존 skill-engine 타입 재사용을 위한 re-export
export type {
  TermFull,
  BlockTemplate,
  ComplianceRule,
  EnrichedIndustryBlock,
} from '@/lib/skill-engine/blocks/types'

export type {
  CompanyProfile,
  ApplicationHistory,
  RejectionPattern,
} from '@/lib/skill-engine/types'

export type {
  EnginePresetType,
  IndustryBlockType,
} from '@/lib/super-model'
