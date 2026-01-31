/**
 * @deprecated v4.0 — Use `EnginePreset` + `PRESETS.EXPORT` from `@/lib/skill-engine`.
 *
 * QETTA Global Tender Domain Skills
 *
 * 해외 입찰/조달 시스템 도메인
 *
 * 지원 플랫폼:
 * - SAM.gov (미국 연방 정부)
 * - UNGM (UN 산하 기관)
 * - Goszakup (카자흐스탄)
 * - TED (EU 공식 저널)
 *
 * 출력물:
 * - 입찰 제안서 (Technical Proposal)
 * - 역량 기술서 (Capability Statement)
 * - 가격 제안서 (Price Proposal)
 * - 규정 준수 체크리스트
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import type {
  BaseSkill,
  DocumentSkill,
  DocumentTemplate,
  SkillPackage,
  EnginePresetFeedback,
} from '../../types'
import { DISPLAY_METRICS } from '@/constants/metrics'

// ============================================
// Global Tender Terminology (핵심 용어집)
// ============================================

export const GLOBAL_TENDER_TERMINOLOGY = {
  // 조달 플랫폼
  platforms: {
    SAM_GOV: {
      korean: '미국 연방 조달 시스템',
      english: 'System for Award Management',
      country: 'USA',
      countryCode: 'US',
      url: 'https://sam.gov',
      description: '미국 연방 정부 조달 및 입찰 시스템',
      currency: 'USD',
      language: 'en',
      registrationRequired: true,
      uniqueIdType: 'UEI', // Unique Entity Identifier
    },
    UNGM: {
      korean: 'UN 글로벌 마켓플레이스',
      english: 'United Nations Global Marketplace',
      country: 'International',
      countryCode: 'UN',
      url: 'https://www.ungm.org',
      description: 'UN 및 산하 기관 조달 플랫폼',
      currency: 'USD',
      language: 'en',
      registrationRequired: true,
      uniqueIdType: 'UNGM_ID',
    },
    GOSZAKUP: {
      korean: '카자흐스탄 정부 조달',
      english: 'State Procurement Portal (Kazakhstan)',
      country: 'Kazakhstan',
      countryCode: 'KZ',
      url: 'https://goszakup.gov.kz',
      description: '카자흐스탄 국가 전자조달 시스템',
      currency: 'KZT',
      language: 'kk', // 카자흐어 (러시아어도 지원)
      registrationRequired: true,
      uniqueIdType: 'BIN', // Business Identification Number
    },
    TED: {
      korean: 'EU 입찰 공고 저널',
      english: 'Tenders Electronic Daily',
      country: 'EU',
      countryCode: 'EU',
      url: 'https://ted.europa.eu',
      description: 'EU 공공 조달 공식 저널',
      currency: 'EUR',
      language: 'multi', // 24개 EU 언어
      registrationRequired: false,
      uniqueIdType: 'VAT',
    },
    KOTRA: {
      korean: 'KOTRA 해외조달정보',
      english: 'KOTRA Overseas Procurement',
      country: 'Korea',
      countryCode: 'KR',
      url: 'https://www.kotra.or.kr',
      description: '해외조달시장 진출 지원',
      currency: 'KRW',
      language: 'ko',
      registrationRequired: true,
      uniqueIdType: 'BRN', // Business Registration Number
    },
  },

  // 국가별 규제 요건 데이터베이스
  countryRegulations: {
    US: {
      name: '미국',
      nameEnglish: 'United States',
      requirements: {
        registration: 'SAM.gov 등록 필수 (UEI 발급)',
        certification: 'GSA Schedule, SDVOSB, 8(a), HUBZone 등',
        compliance: 'FAR (Federal Acquisition Regulation) 준수',
        security: 'NIST, FISMA, FedRAMP (IT 사업 시)',
        insurance: '종합배상책임보험, 전문직업배상책임보험',
        bonding: '입찰보증금 (Bid Bond), 이행보증금 (Performance Bond)',
      },
      documentLanguage: 'en',
      taxRequirements: 'W-9, EIN 또는 SSN',
      keyTerms: {
        RFP: 'Request for Proposal (제안요청서)',
        RFQ: 'Request for Quotation (견적요청서)',
        RFI: 'Request for Information (정보요청서)',
        SOW: 'Statement of Work (작업명세서)',
        PWS: 'Performance Work Statement (성과기반작업명세서)',
        IDIQ: 'Indefinite Delivery, Indefinite Quantity (무기한계약)',
        BPA: 'Blanket Purchase Agreement (포괄구매계약)',
      },
    },
    UN: {
      name: '국제연합',
      nameEnglish: 'United Nations',
      requirements: {
        registration: 'UNGM 공급자 등록',
        certification: 'UN Global Compact 서명 권장',
        compliance: 'UN Supplier Code of Conduct 준수',
        security: 'UN Security Management System (해당 시)',
        insurance: '제3자 배상책임보험 필수',
        bonding: '이행보증금 (일반적으로 계약금의 10%)',
      },
      documentLanguage: 'en',
      taxRequirements: '면세 (UN 특권)',
      keyTerms: {
        ITB: 'Invitation to Bid (입찰초청)',
        RFP: 'Request for Proposal (제안요청)',
        EOI: 'Expression of Interest (관심표명)',
        LTA: 'Long Term Agreement (장기계약)',
        PO: 'Purchase Order (구매발주)',
      },
    },
    KZ: {
      name: '카자흐스탄',
      nameEnglish: 'Kazakhstan',
      requirements: {
        registration: 'Goszakup 전자서명 등록',
        certification: 'ISO 9001 권장, 현지 인증 필요 시 Kazakh 표준',
        compliance: '카자흐스탄 공공조달법 (Law No. 434-V)',
        security: 'AIFC 규정 (아스타나 국제금융센터)',
        insurance: '현지 보험사 또는 재보험 필요',
        bonding: '입찰보증금 1-3%, 이행보증금 3-5%',
      },
      documentLanguage: 'kk', // 카자흐어, 러시아어 병행
      taxRequirements: 'BIN 등록, VAT 12%',
      keyTerms: {
        Konkurs: '경쟁입찰',
        TsenovoePredlozheniye: '가격제안',
        TekhSpetsifikatsiya: '기술사양서',
      },
    },
    EU: {
      name: '유럽연합',
      nameEnglish: 'European Union',
      requirements: {
        registration: 'e-Certis, ESPD (European Single Procurement Document)',
        certification: 'CE 마킹, ISO 인증 (품목별)',
        compliance: 'EU 공공조달지침 2014/24/EU',
        security: 'GDPR 준수 (개인정보 처리 시)',
        insurance: '전문직업배상책임보험, 제조물책임보험',
        bonding: '국가별 상이 (일반적으로 계약금의 5-10%)',
      },
      documentLanguage: 'multi',
      taxRequirements: 'VAT 등록 (국가별 세율)',
      keyTerms: {
        OJEU: 'Official Journal of the European Union',
        PIN: 'Prior Information Notice (사전정보공고)',
        CN: 'Contract Notice (계약공고)',
        CAN: 'Contract Award Notice (낙찰공고)',
        ESPD: 'European Single Procurement Document (유럽단일조달문서)',
      },
    },
  },

  // 입찰 문서 유형
  documentTypes: {
    technicalProposal: {
      korean: '기술제안서',
      english: 'Technical Proposal',
      description: '기술적 접근방법, 방법론, 인력 계획 등',
      requiredFor: ['SAM_GOV', 'UNGM', 'TED'],
    },
    priceProposal: {
      korean: '가격제안서',
      english: 'Price/Cost Proposal',
      description: '세부 비용 내역, 단가표, 총 금액',
      requiredFor: ['SAM_GOV', 'UNGM', 'GOSZAKUP', 'TED'],
    },
    capabilityStatement: {
      korean: '역량기술서',
      english: 'Capability Statement',
      description: '회사 역량, 과거 실적, 인증 현황',
      requiredFor: ['SAM_GOV', 'UNGM'],
    },
    pastPerformance: {
      korean: '과거실적증명',
      english: 'Past Performance Information',
      description: '유사 프로젝트 수행 이력 및 평가',
      requiredFor: ['SAM_GOV'],
    },
    complianceMatrix: {
      korean: '규정준수표',
      english: 'Compliance Matrix',
      description: '요구사항 대비 충족 여부 매트릭스',
      requiredFor: ['SAM_GOV', 'UNGM', 'TED'],
    },
    bidBond: {
      korean: '입찰보증서',
      english: 'Bid Bond / Bid Security',
      description: '입찰 철회 방지를 위한 보증',
      requiredFor: ['GOSZAKUP', 'TED'],
    },
  },

  // 조달 분야 (QETTA 특화)
  procurementCategories: {
    environmentalMonitoring: {
      korean: '환경 모니터링 장비',
      english: 'Environmental Monitoring Equipment',
      naicsCode: '334516', // US NAICS
      unspscCode: '41113600', // UN SPSC
      cpvCode: '38340000', // EU CPV
      keywords: ['air quality', 'emission monitoring', 'ENVIRONMENT', 'CEMS'],
    },
    industrialAutomation: {
      korean: '산업 자동화 시스템',
      english: 'Industrial Automation Systems',
      naicsCode: '334513',
      unspscCode: '43222600',
      cpvCode: '31600000',
      keywords: ['PLC', 'SCADA', 'MES', 'OPC-UA'],
    },
    aiSoftware: {
      korean: 'AI 소프트웨어 솔루션',
      english: 'Artificial Intelligence Software',
      naicsCode: '511210',
      unspscCode: '43232300',
      cpvCode: '48000000',
      keywords: ['machine learning', 'NLP', 'data analytics'],
    },
    consultingServices: {
      korean: '컨설팅 서비스',
      english: 'Consulting Services',
      naicsCode: '541611',
      unspscCode: '80101500',
      cpvCode: '79400000',
      keywords: ['regulatory', 'compliance', 'strategy'],
    },
  },

  // 입찰 상태
  tenderStatus: {
    upcoming: { korean: '공고 예정', english: 'Upcoming' },
    open: { korean: '입찰 진행중', english: 'Open' },
    closing: { korean: '마감 임박', english: 'Closing Soon' },
    closed: { korean: '마감', english: 'Closed' },
    awarded: { korean: '낙찰', english: 'Awarded' },
    cancelled: { korean: '취소', english: 'Cancelled' },
  },
} as const

// ============================================
// Global Tender Document Templates
// ============================================

export const GLOBAL_TENDER_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'gt-technical-proposal',
    name: 'Technical Proposal (기술제안서)',
    domain: 'EXPORT',
    sections: [
      '1. Executive Summary',
      '2. Understanding of Requirements',
      '   2.1 Project Background',
      '   2.2 Scope Analysis',
      '   2.3 Key Challenges Identified',
      '3. Technical Approach',
      '   3.1 Methodology',
      '   3.2 Work Breakdown Structure',
      '   3.3 Technical Solution Architecture',
      '4. Management Approach',
      '   4.1 Project Organization',
      '   4.2 Risk Management',
      '   4.3 Quality Assurance',
      '5. Staffing Plan',
      '   5.1 Key Personnel',
      '   5.2 Team Structure',
      '   5.3 Qualifications Summary',
      '6. Past Performance',
      '   6.1 Relevant Experience',
      '   6.2 Client References',
      '7. Schedule / Milestones',
      '8. Appendices',
    ],
    estimatedGenerationTime: 120, // 2분
  },
  {
    id: 'gt-capability-statement',
    name: 'Capability Statement (역량기술서)',
    domain: 'EXPORT',
    sections: [
      'Company Overview',
      'Core Competencies',
      'NAICS Codes / UNSPSC Codes',
      'Certifications & Registrations',
      'Past Performance Highlights',
      'Differentiators',
      'Contact Information',
    ],
    estimatedGenerationTime: 45,
  },
  {
    id: 'gt-price-proposal',
    name: 'Price Proposal (가격제안서)',
    domain: 'EXPORT',
    sections: [
      '1. Pricing Summary',
      '2. Cost Breakdown',
      '   2.1 Labor Costs',
      '   2.2 Materials & Equipment',
      '   2.3 Travel & Logistics',
      '   2.4 Overhead & Indirect Costs',
      '3. Payment Terms',
      '4. Validity Period',
      '5. Assumptions & Exclusions',
      '6. Detailed Line Items (Attachment)',
    ],
    estimatedGenerationTime: 60,
  },
  {
    id: 'gt-compliance-checklist',
    name: 'Compliance Checklist (규정준수체크리스트)',
    domain: 'EXPORT',
    sections: [
      'Document Submission Requirements',
      'Registration & Certification',
      'Technical Specifications Compliance',
      'Financial Requirements',
      'Insurance & Bonding',
      'Deadline & Submission Method',
      'Special Conditions',
    ],
    estimatedGenerationTime: 30,
  },
]

// ============================================
// Global Tender Skills Definition
// ============================================

export const GLOBAL_TENDER_SKILLS: DocumentSkill[] = [
  {
    id: 'gt-technical-proposal',
    name: 'Technical Proposal Generator',
    nameKo: '기술제안서 생성기',
    category: 'document_generation',
    description: 'Generate comprehensive technical proposals for international tenders',
    version: '1.0.0',
    domains: ['EXPORT'],
    requiredPromptTokens: 15000, // 국가별 규제 포함
    outputFormats: ['DOCX', 'PDF'],
    templates: [GLOBAL_TENDER_TEMPLATES[0]],
  },
  {
    id: 'gt-capability-statement',
    name: 'Capability Statement Generator',
    nameKo: '역량기술서 생성기',
    category: 'document_generation',
    description: 'Generate capability statements for supplier registration',
    version: '1.0.0',
    domains: ['EXPORT'],
    requiredPromptTokens: 8000,
    outputFormats: ['PDF', 'DOCX'],
    templates: [GLOBAL_TENDER_TEMPLATES[1]],
  },
  {
    id: 'gt-compliance-report',
    name: 'Regulatory Compliance Report',
    nameKo: '규정 준수 보고서',
    category: 'document_generation',
    description: 'Generate compliance verification report for tender submissions',
    version: '1.0.0',
    domains: ['EXPORT'],
    requiredPromptTokens: 10000,
    outputFormats: ['PDF', 'DOCX'],
    templates: [GLOBAL_TENDER_TEMPLATES[3]],
  },
]

// ============================================
// Global Tender Utility Skills (Non-Document)
// ============================================

/**
 * 문서 생성이 아닌 유틸리티 스킬 (BaseSkill 타입)
 */
export const GLOBAL_TENDER_UTILITY_SKILLS: BaseSkill[] = [
  {
    id: 'gt-compliance-checker',
    name: 'Regulatory Compliance Checker',
    nameKo: '규정 준수 검사기',
    category: 'verification',
    description: 'Check tender documents against country-specific regulations',
    version: '1.0.0',
    domains: ['EXPORT'],
    requiredPromptTokens: 10000,
  },
  {
    id: 'gt-tender-search',
    name: 'Global Tender Search',
    nameKo: '글로벌 입찰 검색',
    category: 'matching',
    description: 'Search and filter tenders from 63만+ global database',
    version: '1.0.0',
    domains: ['EXPORT'],
    requiredPromptTokens: 5000,
  },
]

// ============================================
// Global Tender Skill Package
// ============================================

export const GLOBAL_TENDER_SKILL_PACKAGE: SkillPackage = {
  id: 'pkg-global-tender-complete',
  name: 'Global Tender Complete Package',
  nameKo: '해외 입찰 완전 패키지',
  description: 'SAM.gov, UNGM, Goszakup, TED 전체 플랫폼 지원',
  skills: GLOBAL_TENDER_SKILLS.map((s) => s.id),
  domain: 'EXPORT',
  tier: 'domain',
  estimatedCost: {
    perDocument: 0.25, // $0.25/건 (다국어 + 규제 복잡성)
    perMonth: 75, // 월 300건 기준
    cacheEfficiency: 85, // 85% 캐싱 효율
  },
  metadata: {
    createdAt: '2026-01-24',
    updatedAt: '2026-01-24',
    usageCount: 0,
    rating: 0,
  },
}

// ============================================
// Type Definitions
// ============================================

export type PlatformCode = keyof typeof GLOBAL_TENDER_TERMINOLOGY.platforms
export type CountryCode = keyof typeof GLOBAL_TENDER_TERMINOLOGY.countryRegulations

export interface TenderOpportunity {
  id: string
  title: string
  titleKo?: string
  platform: PlatformCode
  country: CountryCode
  agency: string
  category: keyof typeof GLOBAL_TENDER_TERMINOLOGY.procurementCategories
  estimatedValue?: {
    amount: number
    currency: string
  }
  deadline: string // ISO date
  publishedDate: string
  status: keyof typeof GLOBAL_TENDER_TERMINOLOGY.tenderStatus
  url: string
  description: string
  requirements: string[]
  attachments?: string[]
}

export interface CompanyProfile {
  name: string
  nameKo?: string
  country: string
  registrations: {
    platform: PlatformCode
    id: string
    status: 'active' | 'pending' | 'expired'
  }[]
  certifications: string[]
  naicsCodes?: string[]
  unspscCodes?: string[]
  cpvCodes?: string[]
  pastPerformance: {
    client: string
    project: string
    value: number
    currency: string
    year: number
    rating?: number
  }[]
}

export interface ComplianceCheckResult {
  platform: PlatformCode
  country: CountryCode
  checkDate: string
  overallStatus: 'compliant' | 'partial' | 'non-compliant'
  items: {
    requirement: string
    status: 'pass' | 'fail' | 'warning' | 'na'
    notes?: string
    actionRequired?: string
  }[]
  missingDocuments: string[]
  recommendations: string[]
}

export interface ProposalGenerationInput {
  tender: TenderOpportunity
  company: CompanyProfile
  technicalApproach: string
  keyPersonnel: {
    name: string
    role: string
    qualifications: string
    yearsExperience: number
  }[]
  pricingData?: {
    laborCosts: number
    materials: number
    travel: number
    overhead: number
    profit: number
  }
}

// ============================================
// Country Regulation Lookup
// ============================================

/**
 * 국가별 규제 요건 조회
 *
 * @param countryCode - ISO 국가 코드 또는 플랫폼 코드
 * @returns 해당 국가의 규제 요건
 */
export function getCountryRegulations(countryCode: CountryCode | string) {
  const code = countryCode.toUpperCase() as CountryCode

  const regulations = GLOBAL_TENDER_TERMINOLOGY.countryRegulations[code]

  if (!regulations) {
    return {
      found: false,
      message: `No regulations found for country code: ${countryCode}`,
      availableCountries: Object.keys(GLOBAL_TENDER_TERMINOLOGY.countryRegulations),
    }
  }

  return {
    found: true,
    country: regulations.name,
    countryEnglish: regulations.nameEnglish,
    ...regulations,
  }
}

/**
 * 플랫폼별 필수 문서 목록 조회
 *
 * @param platform - 조달 플랫폼 코드
 * @returns 필수 문서 목록
 */
export function getRequiredDocuments(platform: PlatformCode): string[] {
  const documents: string[] = []

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_key, docType] of Object.entries(GLOBAL_TENDER_TERMINOLOGY.documentTypes)) {
    // Type assertion needed because `as const` creates readonly tuple types
    if ((docType.requiredFor as readonly PlatformCode[]).includes(platform)) {
      documents.push(`${docType.english} (${docType.korean})`)
    }
  }

  return documents
}

// ============================================
// Compliance Checker
// ============================================

/**
 * 입찰 규정 준수 검사
 *
 * @param company - 회사 프로필
 * @param platform - 대상 플랫폼
 * @returns 규정 준수 검사 결과
 */
export function checkCompliance(
  company: CompanyProfile,
  platform: PlatformCode
): ComplianceCheckResult {
  const platformInfo = GLOBAL_TENDER_TERMINOLOGY.platforms[platform]
  const countryCode = platformInfo.countryCode as CountryCode
  const regulations = GLOBAL_TENDER_TERMINOLOGY.countryRegulations[countryCode]

  const items: ComplianceCheckResult['items'] = []
  const missingDocuments: string[] = []
  const recommendations: string[] = []

  // 1. 플랫폼 등록 확인
  const registration = company.registrations.find((r) => r.platform === platform)
  if (registration?.status === 'active') {
    items.push({
      requirement: `${platform} Registration`,
      status: 'pass',
      notes: `Registered with ID: ${registration.id}`,
    })
  } else if (registration?.status === 'pending') {
    items.push({
      requirement: `${platform} Registration`,
      status: 'warning',
      notes: 'Registration pending approval',
      actionRequired: 'Follow up on registration status',
    })
  } else {
    items.push({
      requirement: `${platform} Registration`,
      status: 'fail',
      notes: 'Not registered',
      actionRequired: regulations?.requirements.registration || 'Complete platform registration',
    })
    missingDocuments.push('Platform Registration')
  }

  // 2. 인증 확인
  const certifications = company.certifications || []
  if (certifications.length > 0) {
    items.push({
      requirement: 'Certifications',
      status: 'pass',
      notes: certifications.join(', '),
    })
  } else {
    items.push({
      requirement: 'Certifications',
      status: 'warning',
      notes: 'No certifications listed',
      actionRequired: regulations?.requirements.certification || 'Consider obtaining relevant certifications',
    })
    recommendations.push('Obtain ISO 9001 certification for improved competitiveness')
  }

  // 3. 산업 코드 확인
  if (platform === 'SAM_GOV' && (!company.naicsCodes || company.naicsCodes.length === 0)) {
    items.push({
      requirement: 'NAICS Codes',
      status: 'fail',
      notes: 'Required for SAM.gov',
      actionRequired: 'Add relevant NAICS codes to company profile',
    })
    missingDocuments.push('NAICS Codes')
  } else if (platform === 'UNGM' && (!company.unspscCodes || company.unspscCodes.length === 0)) {
    items.push({
      requirement: 'UNSPSC Codes',
      status: 'warning',
      notes: 'Recommended for UNGM',
      actionRequired: 'Add relevant UNSPSC codes',
    })
  } else if (platform === 'TED' && (!company.cpvCodes || company.cpvCodes.length === 0)) {
    items.push({
      requirement: 'CPV Codes',
      status: 'warning',
      notes: 'Recommended for EU tenders',
      actionRequired: 'Add relevant CPV codes',
    })
  }

  // 4. 과거 실적 확인
  const relevantExperience = company.pastPerformance.filter((p) => p.year >= new Date().getFullYear() - 5)
  if (relevantExperience.length >= 3) {
    items.push({
      requirement: 'Past Performance (최근 5년)',
      status: 'pass',
      notes: `${relevantExperience.length} relevant projects`,
    })
  } else if (relevantExperience.length > 0) {
    items.push({
      requirement: 'Past Performance (최근 5년)',
      status: 'warning',
      notes: `Only ${relevantExperience.length} relevant projects`,
      actionRequired: 'Document additional past performance',
    })
  } else {
    items.push({
      requirement: 'Past Performance (최근 5년)',
      status: 'fail',
      notes: 'No recent relevant experience documented',
      actionRequired: 'Compile past performance documentation',
    })
    missingDocuments.push('Past Performance Information')
  }

  // 5. 보험/보증 (플랫폼별)
  if (regulations?.requirements.insurance) {
    items.push({
      requirement: 'Insurance Requirements',
      status: 'warning',
      notes: regulations.requirements.insurance,
      actionRequired: 'Verify insurance coverage meets requirements',
    })
  }

  // 전체 상태 계산
  const failCount = items.filter((i) => i.status === 'fail').length
  const warningCount = items.filter((i) => i.status === 'warning').length

  let overallStatus: ComplianceCheckResult['overallStatus']
  if (failCount > 0) {
    overallStatus = 'non-compliant'
  } else if (warningCount > 0) {
    overallStatus = 'partial'
  } else {
    overallStatus = 'compliant'
  }

  // 추가 권장사항
  if (platform === 'SAM_GOV') {
    recommendations.push('Consider obtaining small business certifications (8(a), SDVOSB, HUBZone)')
  }
  if (platform === 'UNGM') {
    recommendations.push('Sign the UN Global Compact to demonstrate sustainability commitment')
  }
  if (platform === 'GOSZAKUP') {
    recommendations.push('Partner with local Kazakh company for improved market access')
  }
  if (platform === 'TED') {
    recommendations.push('Prepare ESPD (European Single Procurement Document) in advance')
  }

  return {
    platform,
    country: countryCode,
    checkDate: new Date().toISOString(),
    overallStatus,
    items,
    missingDocuments,
    recommendations,
  }
}

// ============================================
// Proposal Content Generator
// ============================================

/**
 * 기술제안서 콘텐츠 생성
 *
 * @param input - 제안서 생성 입력 데이터
 * @returns 생성된 제안서 콘텐츠 (마크다운)
 */
export function generateTechnicalProposalContent(input: ProposalGenerationInput): string {
  const { tender, company, technicalApproach, keyPersonnel } = input
  const platformInfo = GLOBAL_TENDER_TERMINOLOGY.platforms[tender.platform]

  const sections: string[] = []

  // 1. Executive Summary
  sections.push(`# Technical Proposal

## 1. Executive Summary

**Project:** ${tender.title}
**Contracting Agency:** ${tender.agency}
**Submitted by:** ${company.name}${company.nameKo ? ` (${company.nameKo})` : ''}
**Date:** ${new Date().toISOString().split('T')[0]}

${company.name} respectfully submits this Technical Proposal in response to the solicitation for ${tender.title}. With our proven track record in ${tender.category} and deep understanding of ${platformInfo.country} regulatory requirements, we are uniquely positioned to deliver exceptional value.

**Key Differentiators:**
- ${company.certifications.slice(0, 3).join(', ') || 'Industry-leading expertise'}
- ${company.pastPerformance.length} successful projects in similar domains
- Compliance with all ${platformInfo.country} regulatory requirements
`)

  // 2. Understanding of Requirements
  sections.push(`## 2. Understanding of Requirements

### 2.1 Project Background

${tender.description}

### 2.2 Scope Analysis

${tender.requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

### 2.3 Key Challenges Identified

Based on our analysis of the requirements, we have identified the following key challenges:
- Compliance with ${platformInfo.country} regulatory framework
- Integration with existing systems and workflows
- Meeting quality standards while optimizing costs
`)

  // 3. Technical Approach
  sections.push(`## 3. Technical Approach

### 3.1 Methodology

${technicalApproach}

### 3.2 Quality Assurance

Our quality assurance approach includes:
- ${company.certifications.includes('ISO 9001') ? 'ISO 9001 certified quality management system' : 'Rigorous quality control procedures'}
- Regular progress reviews and milestone verification
- Documentation aligned with ${platformInfo.country} standards
`)

  // 4. Staffing Plan
  sections.push(`## 5. Staffing Plan

### 5.1 Key Personnel

| Name | Role | Qualifications | Years of Experience |
|------|------|----------------|---------------------|
${keyPersonnel.map((p) => `| ${p.name} | ${p.role} | ${p.qualifications} | ${p.yearsExperience} |`).join('\n')}

### 5.2 Team Structure

Our project team is organized to ensure clear accountability and efficient communication with the ${tender.agency} contracting officer.
`)

  // 5. Past Performance
  sections.push(`## 6. Past Performance

### 6.1 Relevant Experience

${company.pastPerformance
  .slice(0, 3)
  .map(
    (p) => `**${p.project}** (${p.year})
- Client: ${p.client}
- Value: ${p.currency} ${p.value.toLocaleString()}
- Rating: ${p.rating ? `${p.rating}/5` : 'Excellent'}
`
  )
  .join('\n')}
`)

  // Footer
  sections.push(`---

*Generated by QETTA Global Tender Engine*
*Platform: ${platformInfo.english}*
*Submission Deadline: ${tender.deadline}*
`)

  return sections.join('\n\n')
}

/**
 * 역량기술서 콘텐츠 생성
 *
 * @param company - 회사 프로필
 * @param targetPlatform - 대상 플랫폼
 * @returns 생성된 역량기술서 콘텐츠
 */
export function generateCapabilityStatementContent(
  company: CompanyProfile,
  targetPlatform: PlatformCode
): string {
  const platformInfo = GLOBAL_TENDER_TERMINOLOGY.platforms[targetPlatform]

  return `# Capability Statement

## ${company.name}
${company.nameKo ? `(${company.nameKo})` : ''}

---

## Company Overview

${company.name} is a leading provider of environmental monitoring and industrial automation solutions. We specialize in helping organizations achieve regulatory compliance through innovative technology solutions.

## Core Competencies

- Environmental Monitoring Systems (TMS, CEMS)
- Industrial Automation (MES, PLC, SCADA)
- AI-Powered Document Automation
- Regulatory Compliance Consulting

## Industry Codes

${targetPlatform === 'SAM_GOV' && company.naicsCodes ? `**NAICS Codes:** ${company.naicsCodes.join(', ')}` : ''}
${targetPlatform === 'UNGM' && company.unspscCodes ? `**UNSPSC Codes:** ${company.unspscCodes.join(', ')}` : ''}
${targetPlatform === 'TED' && company.cpvCodes ? `**CPV Codes:** ${company.cpvCodes.join(', ')}` : ''}

## Certifications & Registrations

${company.certifications.map((c) => `- ${c}`).join('\n')}

## ${platformInfo.english} Registration

${company.registrations.find((r) => r.platform === targetPlatform)?.id || 'Registration pending'}

## Past Performance Highlights

${company.pastPerformance
  .slice(0, 5)
  .map(
    (p) => `- **${p.project}** (${p.client}, ${p.year}) - ${p.currency} ${p.value.toLocaleString()}`
  )
  .join('\n')}

## Differentiators

- **${DISPLAY_METRICS.timeSaved.value}** reduction in document preparation time
- **${DISPLAY_METRICS.rejectionReduction.value}** reduction in document rejection rates
- **${DISPLAY_METRICS.apiUptime.value}** system availability SLA
- **${DISPLAY_METRICS.globalTenders.value}** global tender database access

## Contact Information

For more information, please contact us through ${platformInfo.url}

---

*QETTA - "Your Industry, Your Intelligence."*
`
}

// ============================================
// Tender Search Interface
// ============================================

export interface TenderSearchParams {
  platforms?: PlatformCode[]
  categories?: (keyof typeof GLOBAL_TENDER_TERMINOLOGY.procurementCategories)[]
  countries?: CountryCode[]
  keywords?: string[]
  minValue?: number
  maxValue?: number
  deadlineAfter?: string
  deadlineBefore?: string
  status?: (keyof typeof GLOBAL_TENDER_TERMINOLOGY.tenderStatus)[]
}

/**
 * 입찰 검색 쿼리 빌더
 *
 * @param params - 검색 파라미터
 * @returns API 호출용 쿼리 객체
 */
export function buildTenderSearchQuery(params: TenderSearchParams): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {}

  if (params.platforms?.length) {
    query.platforms = params.platforms
  }
  if (params.categories?.length) {
    // 카테고리별 코드 추출
    const codes: string[] = []
    params.categories.forEach((cat) => {
      const category = GLOBAL_TENDER_TERMINOLOGY.procurementCategories[cat]
      if (category) {
        codes.push(category.naicsCode, category.unspscCode, category.cpvCode)
      }
    })
    query.industryCodes = codes.filter(Boolean)
  }
  if (params.keywords?.length) {
    query.keywords = params.keywords.join(' ')
  }
  if (params.minValue !== undefined) {
    query.minValue = params.minValue.toString()
  }
  if (params.maxValue !== undefined) {
    query.maxValue = params.maxValue.toString()
  }
  if (params.deadlineAfter) {
    query.deadlineAfter = params.deadlineAfter
  }
  if (params.deadlineBefore) {
    query.deadlineBefore = params.deadlineBefore
  }
  if (params.status?.length) {
    query.status = params.status
  }

  return query
}

// ============================================
// Validation Rules
// ============================================

export interface GlobalTenderValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  score: number // 0-100
}

/**
 * 입찰 기회 유효성 검사
 *
 * @param tender - 입찰 정보
 * @returns 유효성 검사 결과
 */
export function validateTenderOpportunity(tender: Partial<TenderOpportunity>): GlobalTenderValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let score = 100

  // 필수 필드 검사
  if (!tender.title) {
    errors.push('Title is required')
    score -= 20
  }
  if (!tender.platform) {
    errors.push('Platform is required')
    score -= 20
  }
  if (!tender.deadline) {
    errors.push('Deadline is required')
    score -= 15
  } else {
    const deadline = new Date(tender.deadline)
    const now = new Date()
    if (deadline < now) {
      errors.push('Deadline has passed')
      score -= 50
    } else if (deadline.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      warnings.push('Less than 7 days until deadline')
      score -= 10
    }
  }
  if (!tender.description || tender.description.length < 50) {
    warnings.push('Description is too short for proper analysis')
    score -= 5
  }
  if (!tender.requirements?.length) {
    warnings.push('No specific requirements listed')
    score -= 5
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score),
  }
}

/**
 * 회사 프로필 유효성 검사
 *
 * @param company - 회사 프로필
 * @param targetPlatform - 대상 플랫폼
 * @returns 유효성 검사 결과
 */
export function validateCompanyProfile(
  company: Partial<CompanyProfile>,
  targetPlatform?: PlatformCode
): GlobalTenderValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let score = 100

  if (!company.name) {
    errors.push('Company name is required')
    score -= 20
  }
  if (!company.country) {
    errors.push('Country is required')
    score -= 10
  }

  // 플랫폼별 검사
  if (targetPlatform) {
    const hasRegistration = company.registrations?.some(
      (r) => r.platform === targetPlatform && r.status === 'active'
    )
    if (!hasRegistration) {
      errors.push(`Active ${targetPlatform} registration required`)
      score -= 25
    }

    if (targetPlatform === 'SAM_GOV' && (!company.naicsCodes || company.naicsCodes.length === 0)) {
      errors.push('NAICS codes required for SAM.gov')
      score -= 15
    }
  }

  if (!company.certifications?.length) {
    warnings.push('No certifications listed - may reduce competitiveness')
    score -= 5
  }

  if (!company.pastPerformance?.length) {
    warnings.push('No past performance documented')
    score -= 10
  } else if (company.pastPerformance.length < 3) {
    warnings.push('Less than 3 past performance records')
    score -= 5
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score),
  }
}

// ============================================
// Compliance Feedback (User-Facing Report)
// ============================================

/**
 * 규정 준수 피드백 (사용자 리포트용)
 */
export interface ComplianceFeedbackReport {
  domain: 'EXPORT'
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  warnings: string[]
  terminology: Array<{
    term: string
    definition: string
    usage: string
  }>
}

/**
 * 입찰 규정 준수 피드백 리포트 생성 (사용자용)
 */
export function generateComplianceFeedbackReport(
  complianceResult: ComplianceCheckResult,
  validation: GlobalTenderValidationResult
): ComplianceFeedbackReport {
  const feedback: ComplianceFeedbackReport = {
    domain: 'EXPORT',
    overallScore: Math.round(
      (complianceResult.items.filter((i) => i.status === 'pass').length / complianceResult.items.length) * 100
    ),
    strengths: [],
    weaknesses: [],
    suggestions: [],
    warnings: [],
    terminology: [],
  }

  // 강점 분석
  const passed = complianceResult.items.filter((i) => i.status === 'pass')
  passed.forEach((item) => {
    feedback.strengths.push(`${item.requirement}: ${item.notes || 'Compliant'}`)
  })

  // 약점 분석
  const failed = complianceResult.items.filter((i) => i.status === 'fail')
  failed.forEach((item) => {
    feedback.weaknesses.push(`${item.requirement}: ${item.actionRequired || 'Action required'}`)
  })

  // 권장사항
  feedback.suggestions = complianceResult.recommendations

  // 경고
  const warnings = complianceResult.items.filter((i) => i.status === 'warning')
  warnings.forEach((item) => {
    feedback.warnings.push(`${item.requirement}: ${item.notes || 'Review needed'}`)
  })

  // 누락 문서
  if (complianceResult.missingDocuments.length > 0) {
    feedback.warnings.push(`Missing documents: ${complianceResult.missingDocuments.join(', ')}`)
  }

  // 유효성 검사 통합
  validation.errors.forEach((err) => feedback.weaknesses.push(err))
  validation.warnings.forEach((warn) => feedback.warnings.push(warn))

  // 용어 제안
  const countryReg = GLOBAL_TENDER_TERMINOLOGY.countryRegulations[complianceResult.country]
  if (countryReg?.keyTerms) {
    Object.entries(countryReg.keyTerms).forEach(([abbr, full]) => {
      feedback.terminology.push({
        term: abbr,
        definition: full as string,
        usage: `Use "${abbr}" when referring to ${full}`,
      })
    })
  }

  return feedback
}

// ============================================
// Domain Engine Feedback Generator
// ============================================

/**
 * 도메인 엔진 피드백 생성
 * 입찰 준수율이 낮거나 심각한 문제 발생 시 엔진에 피드백
 *
 * @param complianceResult - 규정 준수 검사 결과
 * @param validation - 유효성 검사 결과
 * @returns 도메인 엔진 피드백 (문제 없으면 null)
 */
export function generateGlobalTenderFeedback(
  complianceResult: ComplianceCheckResult,
  validation: GlobalTenderValidationResult
): EnginePresetFeedback | null {
  const passedCount = complianceResult.items.filter((i) => i.status === 'pass').length
  const totalCount = complianceResult.items.length
  const complianceScore = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0

  // 준수율 80% 미만이거나 critical 에러가 있으면 피드백 생성
  const hasCriticalErrors = validation.errors.length > 0 || complianceResult.missingDocuments.length > 0
  const lowCompliance = complianceScore < 80

  if (!lowCompliance && !hasCriticalErrors) {
    return null
  }

  return {
    domain: 'EXPORT',
    type: 'stat_update',
    statUpdate: {
      metric: hasCriticalErrors ? 'compliance_critical_failure' : 'low_compliance_score',
      value: complianceScore,
      timestamp: new Date().toISOString(),
    },
    metadata: {
      inferredAt: new Date().toISOString(),
      agentRole: 'analyst',
      reasoningTokens: 0,
      confidence: 0.9,
    },
  }
}

// ============================================
// Export All
// ============================================

const GlobalTenderSkillEngine = {
  GLOBAL_TENDER_TERMINOLOGY,
  GLOBAL_TENDER_TEMPLATES,
  GLOBAL_TENDER_SKILLS,
  GLOBAL_TENDER_UTILITY_SKILLS,
  GLOBAL_TENDER_SKILL_PACKAGE,
  getCountryRegulations,
  getRequiredDocuments,
  checkCompliance,
  generateTechnicalProposalContent,
  generateCapabilityStatementContent,
  buildTenderSearchQuery,
  validateTenderOpportunity,
  validateCompanyProfile,
  generateGlobalTenderFeedback,
  generateComplianceFeedbackReport,
}

export default GlobalTenderSkillEngine
