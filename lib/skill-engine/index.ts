/**
 * QETTA Skill Engine
 *
 * 도메인 블록 엔진의 핵심 모듈
 *
 * @example
 * ```ts
 * import { skillEngine, rejectionAnalyzer, emailDetector } from '@/lib/skill-engine'
 *
 * // 탈락 분석
 * const analysis = await rejectionAnalyzer.analyze(rejectionText, 'ENVIRONMENT')
 *
 * // 이메일 감지
 * const event = emailDetector.detect({ subject, from, date, body })
 *
 * // 문서 생성
 * const doc = await skillEngine.generateDocument('ENVIRONMENT', 'daily-report', context)
 * ```
 */

// Core
export { SkillEngine, skillEngine } from './core/skill-engine'

// ============================================
// v4.0 Domain Engine Architecture
// "1 Engine × 12 BLOCKs × 6 Presets"
// ============================================

// Domain Engine (universal pipeline)
export { EnginePreset, createEnginePreset } from './core/domain-engine'
export type {
  DataSource,
  RawData,
  ProcessedData,
  GeneratedDocument,
  VerificationResult,
  MatchResult,
  EngineAction,
  EngineInput,
  EngineOutput,
} from './core/domain-engine'

// Industry BLOCKs (12 pluggable knowledge packages)
export { blockRegistry } from './blocks'
export type {
  TermMetadata,
  TermMapping,
  TermFull,
  BlockTemplate,
  ComplianceRule,
  EnrichedIndustryBlock,
  BlockRegistry,
} from './blocks/types'
export { ALL_BLOCK_IDS } from './blocks/types'

// Presets (6 common BLOCK combinations)
export {
  PRESETS,
  PRESET_INFO,
  getPresetBlocks,
  getPresetInfo,
  findPresetsForBlock,
  getAllPresetIds,
} from './presets'
export type { PresetInfo } from './presets'

// Rejection Analysis
export { RejectionAnalyzer, rejectionAnalyzer } from './rejection/analyzer'
export {
  REJECTION_PATTERNS,
  REJECTION_STATS,
  findPatternsByKeyword,
  findPatternsByCategory,
  findPatternsByDomain,
  getTopRejectionCauses,
  calculatePreventionScore,
} from './rejection/patterns'

// Email Integration
export { EmailEventDetector, emailDetector } from './email/detector'

// Types
export type {
  // Skill Types
  SkillCategory,
  BaseSkill,
  DocumentSkill,
  DocumentTemplate,
  SkillPackage,

  // Rejection Types
  RejectionCategory,
  RejectionPattern,
  RejectionAnalysisResult,

  // Email Types
  EmailProvider,
  EmailEventType,
  EmailIntegrationConfig,
  DetectedEmailEvent,

  // Agent Types
  AgentRole,
  AgentConfig,

  // Feedback Types
  EnginePresetFeedback,

  // Business Types
  FundingSource,
  ProgramType,
  GovernmentProgram,
  CompanyProfile,
  ApplicationHistory,
} from './types'

// Agent Configs
export { AGENT_CONFIGS } from './types'

// Domain Skills
export {
  TMS_TERMINOLOGY,
  TMS_TEMPLATES,
  TMS_SKILLS,
  TMS_SKILL_PACKAGE,
  TMS_VALIDATION_RULES,
  generateDailyReportContent,
  validateTMSData,
  generateTMSFeedback,
} from './skills/tms'

export type { TMSEmissionData } from './skills/tms'

// Announcement-Based Learning (공고문 기반)
export {
  DEFAULT_CRAWLER_CONFIG,
  REAL_ANNOUNCEMENT_SOURCES,
  ANNOUNCEMENT_WARNINGS,
} from './skills/announcement'

export type {
  AnnouncementSource,
  RawAnnouncement,
  ParseStatus,
  AnnouncementRecord,
  AnnouncementCrawlerConfig,
  AnnouncementStore,
  AnnouncementFilters,
  AnnouncementParser,
  TemplateFromAnnouncement,
  AnnouncementLearningLog,
} from './skills/announcement'

// Industry Domains (산업별 도메인)
export {
  // 도메인 정의
  MANUFACTURING_DOMAIN,
  ENVIRONMENT_DOMAIN,
  DIGITAL_DOMAIN,
  FINANCE_DOMAIN,
  STARTUP_DOMAIN,
  EXPORT_DOMAIN,
  ENGINE_PRESETS_V2,
  CORE_DOMAINS,

  // 유틸리티
  matchDomainByKeywords,
  getTemplatesByDomain,
  LEGACY_DOMAIN_MAPPING,
  migrateLegacyDomain,
} from './skills/domains'

export type {
  IndustryDomain,
  SupportType,
  EnginePresetV2,
} from './skills/domains'

// Sub-Engines & Monetization (서브엔진 및 수익화)
export {
  // 포털 (기업마당, 소상공인24 등)
  CORE_ANNOUNCEMENT_PORTALS,
  findPortalById,
  findPortalsByTarget,

  // 수익화 티어
  MONETIZATION_TIERS,
  getTierConfig,
  calculateActualPrice,

  // 도메인별 서브엔진
  TMS_SUB_ENGINES,
  SMART_FACTORY_SUB_ENGINES,
  AI_VOUCHER_SUB_ENGINES,
  GLOBAL_TENDER_SUB_ENGINES,
  GOV_SUPPORT_CROSS_ENGINES,
  ALL_SUB_ENGINES,

  // 서브엔진 조회
  getSubEnginesByDomain,
  getSubEnginesByTier,
  getSubEngineById,
  getSubEnginesByPortal,
  getSubEngineStats,

  // 주의사항
  SUB_ENGINE_WARNINGS,
} from './skills/sub-engines'

export type {
  SubEngine,
  SubEngineTemplate,
  AnnouncementPortal,
  MonetizationTier,
  TierConfig,
} from './skills/sub-engines'

// Skill Package Registry (스킬 패키지 레지스트리)
export {
  // 패키지 정의
  TMS_PACKAGE,
  SMART_FACTORY_PACKAGE,
  AI_VOUCHER_PACKAGE,
  GLOBAL_TENDER_PACKAGE,
  GOV_SUPPORT_PACKAGE,
  MANUFACTURING_BUNDLE,
  STARTUP_BUNDLE,
  ENTERPRISE_BUNDLE,
  ALL_PACKAGES,

  // 레지스트리
  SkillPackageRegistry,
  skillPackageRegistry,
} from './registry'

export type { SkillPackage as RegistrySkillPackage, UserSubscription } from './registry'

// Super Model Integration (슈퍼모델 연동)
export {
  QETTA_SUPER_MODEL,
  QETTA_COMPANY_PROFILE,
  QETTA_METRICS,
  QETTA_ENGINE_PRESETS,
  checkForbiddenTerms,
  generateQettaBusinessPlanContext,
  getQettaCompanyForMatching,
} from './integrations/super-model'

export type { QettaSuperModel } from './integrations/super-model'

// Data Sources (데이터 수집 레이어)
export {
  // 기업마당 클라이언트
  BizInfoClient,
  getBizInfoClient,
  initBizInfoClient,
  BizInfoApiError,

  // 상수
  BIZINFO_FIELD_CODES,
  BIZINFO_REGION_CODES,
  BIZINFO_ERROR_CODES,
} from './data-sources'

export type {
  // 기업마당 타입
  BizInfoApiParams,
  BizInfoApiResponse,
  BizInfoAnnouncementItem,
  BizInfoClientConfig,
  BizInfoSearchFilters,
  BizInfoSearchResult,
  NormalizedBizInfoAnnouncement,
  BizInfoFieldCode,
  BizInfoRegionCode,
  BizInfoErrorCode,
} from './data-sources'
