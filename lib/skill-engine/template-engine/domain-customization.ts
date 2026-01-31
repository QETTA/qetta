/**
 * QETTA Domain Customization
 *
 * 6개 도메인 엔진별 템플릿 커스터마이징
 *
 * 도메인 엔진:
 * - MANUFACTURING: 중기부·산업부 (MES, PLC, OPC-UA, 4M1E, OEE)
 * - ENVIRONMENT: 환경부 (NOx, SOx, PM, CleanSYS, TMS)
 * - DIGITAL: 과기정통부 (AI바우처, 공급기업, 수요기업, NIPA)
 * - FINANCE: 중기부·금융위 (기보, 신보, 소진공, 융자)
 * - STARTUP: 중기부 (TIPS, 액셀러레이팅, IR덱)
 * - EXPORT: 산업부·KOTRA (SAM.gov, UNGM, Goszakup, RFP)
 *
 * @see generators/gov-support/data/qetta-super-model.json v4.0
 */

import type { EnginePresetType } from '@/types/inbox'
import type {
  DomainSectionConfig,
  TemplateSection,
  TemplateVariable,
  DomainValidationRule,
} from './types'

// ============================================
// 도메인별 용어 사전
// ============================================

export const DOMAIN_TERMINOLOGY: Record<EnginePresetType, Record<string, string>> = {
  MANUFACTURING: {
    MES: '생산실행시스템',
    OEE: '설비종합효율',
    PLC: '프로그래머블 로직 컨트롤러',
  },
  ENVIRONMENT: {
    TMS: '원격 모니터링 시스템',
    NOx: '질소산화물',
    탄소중립: 'Carbon Neutrality',
  },
  DIGITAL: {
    AI: '인공지능',
    '바우처': 'Voucher',
    NIPA: '정보통신산업진흥원',
  },
  FINANCE: {
    '기보': '기술보증기금',
    '신보': '신용보증기금',
    '융자': 'Loan',
  },
  STARTUP: {
    TIPS: 'Tech Incubator Program for Startup',
    IR: 'Investor Relations',
    '창업진흥원': 'Korea Institute of Startup & Entrepreneurship Development',
  },
  EXPORT: {
    KOTRA: '대한무역투자진흥공사',
    '수출바우처': 'Export Voucher',
    '글로벌입찰': 'Global Tender',
  },
}

// ============================================
// 도메인별 추가 변수
// ============================================


// ============================================
// 도메인 설정 통합
// ============================================

export const DOMAIN_CONFIGS: Record<EnginePresetType, DomainSectionConfig> = {
  MANUFACTURING: {
    domain: 'MANUFACTURING',
    additionalSections: [],
    additionalVariables: [],
    terminology: DOMAIN_TERMINOLOGY.MANUFACTURING,
    validationRules: [],
  },
  ENVIRONMENT: {
    domain: 'ENVIRONMENT',
    additionalSections: [],
    additionalVariables: [],
    terminology: DOMAIN_TERMINOLOGY.ENVIRONMENT,
    validationRules: [],
  },
  DIGITAL: {
    domain: 'DIGITAL',
    additionalSections: [],
    additionalVariables: [],
    terminology: DOMAIN_TERMINOLOGY.DIGITAL,
    validationRules: [],
  },
  FINANCE: {
    domain: 'FINANCE',
    additionalSections: [],
    additionalVariables: [],
    terminology: DOMAIN_TERMINOLOGY.FINANCE,
    validationRules: [],
  },
  STARTUP: {
    domain: 'STARTUP',
    additionalSections: [],
    additionalVariables: [],
    terminology: DOMAIN_TERMINOLOGY.STARTUP,
    validationRules: [],
  },
  EXPORT: {
    domain: 'EXPORT',
    additionalSections: [],
    additionalVariables: [],
    terminology: DOMAIN_TERMINOLOGY.EXPORT,
    validationRules: [],
  },
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 도메인별 설정 가져오기
 */
export function getDomainConfig(domain: EnginePresetType): DomainSectionConfig {
  return DOMAIN_CONFIGS[domain]
}

/**
 * 도메인 용어 번역
 */
export function translateTerm(domain: EnginePresetType, term: string): string {
  return DOMAIN_TERMINOLOGY[domain][term] || term
}

/**
 * 도메인별 추가 변수 가져오기
 */
export function getDomainVariables(domain: EnginePresetType): TemplateVariable[] {
  return DOMAIN_CONFIGS[domain].additionalVariables
}

/**
 * 도메인별 추가 섹션 가져오기
 */
export function getDomainSections(domain: EnginePresetType): TemplateSection[] {
  return DOMAIN_CONFIGS[domain].additionalSections
}

/**
 * 도메인별 검증 규칙 가져오기
 */
export function getDomainValidationRules(domain: EnginePresetType): DomainValidationRule[] {
  return DOMAIN_CONFIGS[domain].validationRules || []
}

/**
 * 모든 도메인 용어 가져오기 (통합)
 */
export function getAllTerminology(): Record<string, string> {
  const all: Record<string, string> = {}
  for (const domain of Object.keys(DOMAIN_TERMINOLOGY) as EnginePresetType[]) {
    Object.assign(all, DOMAIN_TERMINOLOGY[domain])
  }
  return all
}
