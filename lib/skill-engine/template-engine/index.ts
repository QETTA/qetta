/**
 * Template Engine - Unified Exports
 *
 * 공고문 분석 및 템플릿 생성 엔진
 *
 * @module template-engine
 * @description
 * 정부 지원 사업 공고문을 분석하여 재사용 가능한 템플릿을 생성합니다.
 * - 변수 추출: Mustache 스타일 {{variable}} 패턴
 * - 도메인 커스터마이징: TMS, SMART_FACTORY, AI_VOUCHER, GLOBAL_TENDER
 * - 템플릿 생성: 신청서, 사업계획서, 예산서, 실적보고서 등
 *
 * @example
 * ```ts
 * import { templateGenerator, variableExtractor } from '@/lib/skill-engine/template-engine'
 *
 * // 공고문에서 변수 추출
 * const result = variableExtractor.extractFromAnnouncement(announcement)
 *
 * // 템플릿 생성
 * const template = await templateGenerator.generateFromAnnouncement({
 *   announcement,
 *   templateType: 'application_form',
 *   domain: 'MANUFACTURING',
 * })
 * ```
 */

// =============================================================================
// Types from types.ts
// =============================================================================
export type {
  // Variable Types
  VariableCategory,
  VariableType,
  VariableValidation,
  TemplateVariable,
  ExtractedVariable,
  // Section Types
  SectionType,
  TemplateSection,
  DomainSectionConfig,
  DomainValidationRule,
  // Template Types
  TemplateType,
  DocumentTemplate,
  // Request/Response Types
  TemplateGenerationRequest,
  TemplateGenerationResult,
  VariableExtractionResult,
  TemplateFillData,
  TemplateFillResult,
  ValidationError,
  // Error Types
  TemplateErrorCode,
} from './types'

// =============================================================================
// Constants from types.ts
// =============================================================================
export { COMMON_VARIABLES, TEMPLATE_ERROR_CODES, TemplateEngineError } from './types'

// =============================================================================
// Variable Extractor
// =============================================================================
export { VariableExtractor, variableExtractor } from './variable-extractor'

// =============================================================================
// Domain Customization
// =============================================================================
export {
  getDomainConfig,
  getDomainVariables,
  getDomainSections,
  getDomainValidationRules,
  getAllTerminology,
  translateTerm,
  DOMAIN_CONFIGS,
  DOMAIN_TERMINOLOGY,
} from './domain-customization'

// =============================================================================
// Template Generator
// =============================================================================
export { TemplateGenerator, templateGenerator } from './template-generator'

// =============================================================================
// Utility Functions
// =============================================================================

import { variableExtractor } from './variable-extractor'
import { templateGenerator } from './template-generator'
import { getDomainConfig } from './domain-customization'
import type { RawAnnouncement } from '../skills/announcement'
import type { EnginePresetType } from '@/types/inbox'
import type { TemplateType, DocumentTemplate } from './types'

/**
 * 공고문에서 도메인 자동 감지
 *
 * @description
 * 공고문 내용을 분석하여 가장 적합한 도메인 엔진을 감지합니다.
 * 도메인별 용어 사전과 키워드 매칭을 통해 결정됩니다.
 *
 * @param announcement - 파싱된 공고문
 * @returns 감지된 도메인 엔진 타입
 */
export function detectDomainFromAnnouncement(announcement: RawAnnouncement): EnginePresetType {
  const text = [
    announcement.title,
    announcement.programName || '',
    announcement.eligibilityText || '',
    announcement.supportText || '',
  ]
    .join(' ')
    .toLowerCase()

  // 도메인별 점수 계산
  const scores: Record<EnginePresetType, number> = {
    MANUFACTURING: 0,
    ENVIRONMENT: 0,
    DIGITAL: 0,
    FINANCE: 0,
    STARTUP: 0,
    EXPORT: 0,
  }

  // TMS 키워드
  const tmsKeywords = [
    'nox',
    'sox',
    'pm',
    'pm2.5',
    'pm10',
    '대기오염',
    '배출',
    '굴뚝',
    'cleansys',
    '환경부',
    '대기환경',
    '연속측정',
    'cems',
    'voc',
    '황산화물',
    '질소산화물',
    '미세먼지',
  ]

  // Smart Factory 키워드
  const smartFactoryKeywords = [
    'mes',
    'plc',
    'opc-ua',
    'opc ua',
    '4m1e',
    'oee',
    '스마트공장',
    '스마트팩토리',
    '제조혁신',
    '중기부',
    '중소벤처기업부',
    '생산관리',
    '설비',
    'scada',
    'erp',
    '디지털전환',
    '자동화',
  ]

  // AI Voucher 키워드
  const aiVoucherKeywords = [
    'ai',
    '인공지능',
    '바우처',
    'nipa',
    '정보통신산업진흥원',
    '공급기업',
    '수요기업',
    '데이터',
    '머신러닝',
    'ml',
    'ai솔루션',
    '딥러닝',
    '빅데이터',
  ]

  // Global Tender 키워드
  const globalTenderKeywords = [
    'sam.gov',
    'ungm',
    'goszakup',
    '해외',
    '국제',
    '입찰',
    'tender',
    'procurement',
    'rfp',
    'rfq',
    'rfi',
    'global',
    '조달',
    '카자흐스탄',
    'usa',
    'un',
    '세계은행',
    'adb',
  ]

  // 키워드 매칭
  for (const keyword of tmsKeywords) {
    if (text.includes(keyword)) scores.ENVIRONMENT += 1
  }
  for (const keyword of smartFactoryKeywords) {
    if (text.includes(keyword)) scores.MANUFACTURING += 1
  }
  for (const keyword of aiVoucherKeywords) {
    if (text.includes(keyword)) scores.DIGITAL += 1
  }
  for (const keyword of globalTenderKeywords) {
    if (text.includes(keyword)) scores.EXPORT += 1
  }

  // 최고 점수 도메인 반환
  let maxScore = 0
  let detectedDomain: EnginePresetType = 'MANUFACTURING' // 기본값

  for (const [domain, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      detectedDomain = domain as EnginePresetType
    }
  }

  return detectedDomain
}

/**
 * 간편 템플릿 생성 함수
 *
 * @description
 * 공고문에서 바로 템플릿을 생성하는 원스톱 함수입니다.
 * 도메인 자동 감지, 변수 추출, 템플릿 생성을 한 번에 수행합니다.
 *
 * @param announcement - 파싱된 공고문
 * @param templateType - 생성할 템플릿 유형
 * @param domain - (선택) 도메인 엔진 타입, 미지정 시 자동 감지
 * @returns 생성된 문서 템플릿
 *
 * @example
 * ```ts
 * const template = await quickGenerateTemplate(
 *   announcement,
 *   'application_form'
 * )
 * console.log(template.sections) // 템플릿 섹션들
 * console.log(template.variables) // 추출된 변수들
 * ```
 */
export async function quickGenerateTemplate(
  announcement: RawAnnouncement,
  templateType: TemplateType,
  domain?: EnginePresetType
): Promise<DocumentTemplate> {
  // 도메인 자동 감지
  const detectedDomain = domain || detectDomainFromAnnouncement(announcement)

  // 템플릿 생성 요청
  const result = await templateGenerator.generateFromAnnouncement({
    announcement,
    templateType,
    domain: detectedDomain,
    options: {
      includeOptionalVariables: true,
      mergeCommonVariables: true,
    },
  })

  if (!result.success) {
    throw new Error(`Template generation failed: ${result.error?.message}`)
  }

  return result.template!
}

/**
 * 공고문 분석 요약
 *
 * @description
 * 공고문을 빠르게 분석하여 요약 정보를 반환합니다.
 * - 감지된 도메인
 * - 추출된 변수 수
 * - 권장 템플릿 유형
 *
 * @param announcement - 파싱된 공고문
 * @returns 분석 요약 객체
 */
export function analyzeAnnouncement(announcement: RawAnnouncement): {
  domain: EnginePresetType
  domainConfig: ReturnType<typeof getDomainConfig>
  variableCount: number
  categories: string[]
  suggestedTemplateTypes: TemplateType[]
} {
  // 도메인 감지
  const domain = detectDomainFromAnnouncement(announcement)
  const domainConfig = getDomainConfig(domain)

  // 변수 추출
  const extraction = variableExtractor.extractFromAnnouncement(announcement)

  // 카테고리 집계
  const categories = [...new Set(extraction.variables.map((v) => v.category))]

  // 권장 템플릿 유형 (도메인 설정 기반)
  const suggestedTemplateTypes: TemplateType[] = []
  if (domainConfig.additionalSections.length > 0) {
    // 도메인 특화 섹션이 있으면 해당 템플릿 우선
    suggestedTemplateTypes.push('application_form')
  }
  suggestedTemplateTypes.push('business_plan', 'budget_plan')

  return {
    domain,
    domainConfig,
    variableCount: extraction.variables.length,
    categories,
    suggestedTemplateTypes,
  }
}

/**
 * 변수 값 검증
 *
 * @description
 * 사용자가 입력한 변수 값이 유효한지 검증합니다.
 *
 * @param template - 대상 템플릿
 * @param values - 변수 값 매핑
 * @returns 검증 결과
 */
export function validateTemplateFill(
  template: DocumentTemplate,
  values: Record<string, string | number | boolean>
): ReturnType<typeof templateGenerator.validateFillData> {
  return templateGenerator.validateFillData(template, {
    templateId: template.id,
    values,
  })
}

/**
 * 템플릿 텍스트에 값 채우기
 *
 * @description
 * 템플릿 텍스트의 Mustache 변수({{variable}})를 실제 값으로 치환합니다.
 *
 * @param templateText - Mustache 변수가 포함된 템플릿 텍스트
 * @param values - 변수 값 매핑
 * @returns 치환된 텍스트
 */
export function fillTemplate(
  templateText: string,
  values: Record<string, string | number | boolean>
): string {
  return templateGenerator.fillTemplate(templateText, values)
}

// =============================================================================
// Default Export
// =============================================================================
const TemplateEngine = {
  // Singletons
  variableExtractor,
  templateGenerator,

  // Utility functions
  quickGenerateTemplate,
  analyzeAnnouncement,
  validateTemplateFill,
  fillTemplate,
  detectDomainFromAnnouncement,

  // Domain utilities
  getDomainConfig,
}

export default TemplateEngine
