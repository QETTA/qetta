/**
 * QETTA 도메인별 서브엔진 체계
 *
 * ⚠️ 핵심 원칙: 예측/fabricate 절대 금지!
 * - 모든 정보는 실제 공고문에서 추출
 * - 2026년 정보는 실제 공고 게시 후에만 반영
 *
 * 🎯 타겟: 중장년 제조/설비 사업자
 * 📊 수익화: 도메인 블록 = 유료 플러그인
 *
 * 핵심 소스:
 * - 기업마당 (bizinfo.go.kr) - 통합 정책자금
 * - 소상공인24 (sbiz24.kr) - 소상공인
 * - 중기청 (smba.go.kr) - 중소기업
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import type { EnginePresetType } from '../../types'
import { DISPLAY_METRICS } from '@/constants/metrics'

// ============================================
// 서브엔진 타입 정의
// ============================================

/**
 * 서브엔진 = 도메인 내 특화 기능 단위
 * 각 서브엔진은 독립적으로 활성화/비활성화 가능
 */
export interface SubEngine {
  id: string
  name: string
  nameKo: string
  description: string

  // 소속 도메인
  domain: EnginePresetType | 'CROSS_DOMAIN'

  // 핵심 데이터 소스 (공고문 기반)
  primarySources: AnnouncementPortal[]

  // 출력물 템플릿
  templates: SubEngineTemplate[]

  // 필요한 시스템 프롬프트 토큰 (Prompt Caching용)
  requiredPromptTokens: number

  // 수익화 티어
  tier: MonetizationTier

  // 메타데이터
  metadata: {
    version: string
    lastUpdated: string
    announcementCount: number // 학습된 공고문 수
    templateCount: number
    avgSuccessRate?: number // 사용자 선정률 (실제 데이터만)
  }
}

/**
 * 공고문 포털 (핵심 데이터 소스)
 *
 * ⚠️ 기업마당, 소상공인24, 중기청이 핵심!
 */
export interface AnnouncementPortal {
  id: string
  name: string
  nameKo: string
  url: string
  description: string

  // 포털 유형
  type: 'integrated' | 'ministry' | 'agency' | 'local'

  // 주요 지원 대상
  targetBusiness: ('소상공인' | '중소기업' | '중견기업' | '스타트업' | '예비창업')[]

  // 주요 산업
  targetIndustries: string[]

  // 크롤링 설정
  crawlerConfig?: {
    searchUrl: string
    listSelector: string
    detailSelector: string
    paginationType: 'page' | 'scroll' | 'ajax'
  }
}

/**
 * 서브엔진 템플릿
 */
export interface SubEngineTemplate {
  id: string
  name: string
  nameKo: string
  format: 'HWP' | 'DOCX' | 'XLSX' | 'PDF'

  // 공고문 기반 필수 섹션
  sections: {
    name: string
    required: boolean
    sourceField: string // 공고문의 어느 필드에서 가져올지
  }[]

  // 예상 생성 시간 (초)
  estimatedTime: number

  // 연결된 공고문 유형
  announcementTypes: string[]
}

/**
 * 수익화 티어 (도메인 블록 = 플러그인)
 */
export type MonetizationTier =
  | 'free'       // 무료 체험 (기본 기능만)
  | 'starter'    // 스타터 (도메인 1개)
  | 'growth'     // 그로스 (도메인 3개)
  | 'enterprise' // 엔터프라이즈 (전체 + 커스텀)

export interface TierConfig {
  tier: MonetizationTier
  price: {
    monthly: number // 원
    yearly: number  // 원 (연간 할인)
    govSupport: number // 정부지원 후 실부담 (%)
  }
  limits: {
    domains: number | 'unlimited'
    subEngines: number | 'unlimited'
    documentsPerMonth: number | 'unlimited'
    apiCallsPerDay: number | 'unlimited'
  }
  features: string[]
}

// ============================================
// 핵심 공고문 포털 정의
// ============================================

export const CORE_ANNOUNCEMENT_PORTALS: AnnouncementPortal[] = [
  // === 통합 포털 (최우선) ===
  {
    id: 'bizinfo',
    name: 'BizInfo',
    nameKo: '기업마당',
    url: 'https://www.bizinfo.go.kr',
    description: '중소벤처기업부 통합 정책자금 포털 - 모든 정부지원 공고 통합',
    type: 'integrated',
    targetBusiness: ['소상공인', '중소기업', '중견기업', '스타트업', '예비창업'],
    targetIndustries: ['제조', '서비스', 'IT', '유통', '건설', '환경'],
    crawlerConfig: {
      searchUrl: 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do',
      listSelector: '.tbl_list tbody tr',
      detailSelector: '.view_cont',
      paginationType: 'page',
    },
  },
  {
    id: 'sme24',
    name: 'SME24',
    nameKo: '소상공인24',
    url: 'https://www.sbiz24.kr',
    description: '소상공인시장진흥공단 통합 포털 - 소상공인 특화',
    type: 'integrated',
    targetBusiness: ['소상공인'],
    targetIndustries: ['소매', '음식', '서비스', '제조'],
    crawlerConfig: {
      searchUrl: 'https://www.sbiz24.kr',
      listSelector: '.board-list li',
      detailSelector: '.view-content',
      paginationType: 'page',
    },
  },
  {
    id: 'k-startup',
    name: 'K-Startup',
    nameKo: '케이스타트업',
    url: 'https://www.k-startup.go.kr',
    description: '창업진흥원 통합 포털 - 예비창업/초기창업 특화',
    type: 'integrated',
    targetBusiness: ['예비창업', '스타트업'],
    targetIndustries: ['IT', '제조', '서비스', '바이오'],
    crawlerConfig: {
      searchUrl: 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do',
      listSelector: '.bizp_list li',
      detailSelector: '.bizp_view',
      paginationType: 'page',
    },
  },

  // === 부처별 포털 ===
  {
    id: 'smba',
    name: 'SMBA',
    nameKo: '중소벤처기업부',
    url: 'https://www.mss.go.kr',
    description: '중소벤처기업부 직접 공고 - 정책자금, 스마트공장',
    type: 'ministry',
    targetBusiness: ['중소기업', '소상공인'],
    targetIndustries: ['제조', '서비스'],
  },
  {
    id: 'me',
    name: 'ME',
    nameKo: '환경부',
    url: 'https://www.me.go.kr',
    description: '환경부 직접 공고 - TMS, 환경설비',
    type: 'ministry',
    targetBusiness: ['중소기업', '중견기업'],
    targetIndustries: ['환경', '제조'],
  },
  {
    id: 'motie',
    name: 'MOTIE',
    nameKo: '산업통상자원부',
    url: 'https://www.motie.go.kr',
    description: '산업부 직접 공고 - 스마트제조, 에너지',
    type: 'ministry',
    targetBusiness: ['중소기업', '중견기업'],
    targetIndustries: ['제조', '에너지', '소재'],
  },
  {
    id: 'msit',
    name: 'MSIT',
    nameKo: '과학기술정보통신부',
    url: 'https://www.msit.go.kr',
    description: '과기부 직접 공고 - AI바우처, 데이터',
    type: 'ministry',
    targetBusiness: ['중소기업', '스타트업'],
    targetIndustries: ['IT', 'AI', '데이터'],
  },

  // === 기관별 포털 ===
  {
    id: 'kosmes',
    name: 'KOSMES',
    nameKo: '중소기업진흥공단',
    url: 'https://www.kosmes.or.kr',
    description: '중진공 - 정책자금 융자, 수출지원',
    type: 'agency',
    targetBusiness: ['중소기업'],
    targetIndustries: ['제조', '수출'],
    crawlerConfig: {
      searchUrl: 'https://www.kosmes.or.kr/sbc/SH/SBI/SHSBI001M0.do',
      listSelector: '.board_list tbody tr',
      detailSelector: '.board_view',
      paginationType: 'page',
    },
  },
  {
    id: 'semas',
    name: 'SEMAS',
    nameKo: '소상공인시장진흥공단',
    url: 'https://www.semas.or.kr',
    description: '소진공 - 소상공인 정책자금, 컨설팅',
    type: 'agency',
    targetBusiness: ['소상공인'],
    targetIndustries: ['소매', '음식', '서비스'],
    crawlerConfig: {
      searchUrl: 'https://www.semas.or.kr/web/SUP01/SUP0101.kmdc',
      listSelector: '.board-list li',
      detailSelector: '.view-content',
      paginationType: 'page',
    },
  },
  {
    id: 'nipa',
    name: 'NIPA',
    nameKo: '정보통신산업진흥원',
    url: 'https://www.nipa.kr',
    description: 'NIPA - AI바우처, SW사업, 디지털전환',
    type: 'agency',
    targetBusiness: ['중소기업', '스타트업'],
    targetIndustries: ['IT', 'SW', 'AI'],
  },
  {
    id: 'kibo',
    name: 'KIBO',
    nameKo: '기술보증기금',
    url: 'https://www.kibo.or.kr',
    description: '기보 - 기술보증, 기술평가',
    type: 'agency',
    targetBusiness: ['중소기업', '스타트업'],
    targetIndustries: ['기술기반'],
  },
  {
    id: 'kodit',
    name: 'KODIT',
    nameKo: '신용보증기금',
    url: 'https://www.kodit.co.kr',
    description: '신보 - 신용보증, 정책자금 보증',
    type: 'agency',
    targetBusiness: ['중소기업', '소상공인'],
    targetIndustries: ['전산업'],
  },
]

// 포털 검색 헬퍼
export function findPortalById(id: string): AnnouncementPortal | undefined {
  return CORE_ANNOUNCEMENT_PORTALS.find((p) => p.id === id)
}

export function findPortalsByTarget(
  target: '소상공인' | '중소기업' | '스타트업'
): AnnouncementPortal[] {
  return CORE_ANNOUNCEMENT_PORTALS.filter((p) => p.targetBusiness.includes(target))
}

// ============================================
// 수익화 티어 설정
// ============================================

export const MONETIZATION_TIERS: TierConfig[] = [
  {
    tier: 'free',
    price: {
      monthly: 0,
      yearly: 0,
      govSupport: 0,
    },
    limits: {
      domains: 1,
      subEngines: 2,
      documentsPerMonth: 10,
      apiCallsPerDay: 50,
    },
    features: [
      '기업마당 공고 검색',
      '기본 문서 템플릿 2개',
      '월 10건 문서 생성',
      '이메일 지원',
    ],
  },
  {
    tier: 'starter',
    price: {
      monthly: 990000, // 99만원
      yearly: 9900000, // 990만원 (연 2개월 무료)
      govSupport: 50, // 정부지원 50% → 실부담 49.5만원
    },
    limits: {
      domains: 1,
      subEngines: 5,
      documentsPerMonth: 100,
      apiCallsPerDay: 500,
    },
    features: [
      '도메인 1개 선택 (TMS/스마트공장/AI바우처/해외)',
      '서브엔진 5개',
      '월 100건 문서 생성',
      '탈락 사유 분석 기본',
      '이메일 자동 감지',
      '전화/채팅 지원',
    ],
  },
  {
    tier: 'growth',
    price: {
      monthly: 2900000, // 290만원
      yearly: 29000000, // 2,900만원 (연 2개월 무료)
      govSupport: 50, // 정부지원 50% → 실부담 145만원
    },
    limits: {
      domains: 3,
      subEngines: 15,
      documentsPerMonth: 500,
      apiCallsPerDay: 2000,
    },
    features: [
      '도메인 3개 선택',
      '서브엔진 15개',
      '월 500건 문서 생성',
      '탈락 사유 심층 분석 (Extended Thinking)',
      '공고문 맞춤 알림',
      'API 연동',
      '전담 매니저',
    ],
  },
  {
    tier: 'enterprise',
    price: {
      monthly: 0, // 별도 협의
      yearly: 0,
      govSupport: 50,
    },
    limits: {
      domains: 'unlimited',
      subEngines: 'unlimited',
      documentsPerMonth: 'unlimited',
      apiCallsPerDay: 'unlimited',
    },
    features: [
      '전체 도메인 + 서브엔진',
      '무제한 문서 생성',
      '커스텀 도메인 엔진 개발',
      '화이트라벨 (브랜드 제거)',
      '온프레미스 설치 옵션',
      `SLA ${DISPLAY_METRICS.apiUptime.value} 보장`,
      '24/7 전담 지원',
    ],
  },
]

export function getTierConfig(tier: MonetizationTier): TierConfig {
  return MONETIZATION_TIERS.find((t) => t.tier === tier) || MONETIZATION_TIERS[0]
}

export function calculateActualPrice(tier: MonetizationTier, isYearly: boolean): number {
  const config = getTierConfig(tier)
  const basePrice = isYearly ? config.price.yearly : config.price.monthly
  const govSupportRate = config.price.govSupport / 100
  return Math.round(basePrice * (1 - govSupportRate))
}

// ============================================
// 도메인별 서브엔진 정의
// ============================================

/**
 * TMS 도메인 서브엔진
 * 환경부 원격 모니터링 특화
 */
export const TMS_SUB_ENGINES: SubEngine[] = [
  {
    id: 'tms-daily',
    name: 'TMS Daily Report',
    nameKo: '일일 배출량 보고서',
    description: '환경부 TMS 일일 배출량 보고서 자동 생성',
    domain: 'ENVIRONMENT',
    primarySources: [
      findPortalById('me')!,
      findPortalById('bizinfo')!,
    ],
    templates: [
      {
        id: 'tms-daily-report',
        name: 'Daily Emission Report',
        nameKo: '일일 배출량 보고서',
        format: 'HWP',
        sections: [
          { name: '측정 개요', required: true, sourceField: 'schedule' },
          { name: '오염물질별 배출량', required: true, sourceField: 'measurements' },
          { name: '법적 기준 대비', required: true, sourceField: 'legalLimits' },
          { name: '조치 사항', required: false, sourceField: 'notes' },
        ],
        estimatedTime: 45,
        announcementTypes: ['ENVIRONMENT', '환경관리'],
      },
    ],
    requiredPromptTokens: 5000,
    tier: 'starter',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0, // 실제 공고문 학습 후 업데이트
      templateCount: 1,
    },
  },
  {
    id: 'tms-monthly',
    name: 'TMS Monthly Report',
    nameKo: '월간 환경 관리 보고서',
    description: '환경부 TMS 월간 보고서 자동 생성',
    domain: 'ENVIRONMENT',
    primarySources: [
      findPortalById('me')!,
      findPortalById('bizinfo')!,
    ],
    templates: [
      {
        id: 'tms-monthly-report',
        name: 'Monthly Environmental Report',
        nameKo: '월간 환경 관리 보고서',
        format: 'HWP',
        sections: [
          { name: '요약', required: true, sourceField: 'summary' },
          { name: '월간 배출량 현황', required: true, sourceField: 'monthlyData' },
          { name: '법규 준수 현황', required: true, sourceField: 'compliance' },
          { name: '설비 운영 현황', required: true, sourceField: 'equipment' },
          { name: '개선 계획', required: false, sourceField: 'improvements' },
        ],
        estimatedTime: 90,
        announcementTypes: ['ENVIRONMENT', '환경관리'],
      },
    ],
    requiredPromptTokens: 8000,
    tier: 'starter',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
  {
    id: 'tms-cleansys',
    name: 'CleanSYS Sync',
    nameKo: 'CleanSYS 연동',
    description: '환경부 CleanSYS 시스템 데이터 연동 및 보고서',
    domain: 'ENVIRONMENT',
    primarySources: [findPortalById('me')!],
    templates: [
      {
        id: 'tms-cleansys-report',
        name: 'CleanSYS Sync Report',
        nameKo: 'CleanSYS 연동 보고서',
        format: 'XLSX',
        sections: [
          { name: '연동 현황', required: true, sourceField: 'syncStatus' },
          { name: '데이터 요약', required: true, sourceField: 'dataSummary' },
          { name: '오류 이력', required: false, sourceField: 'errors' },
        ],
        estimatedTime: 20,
        announcementTypes: ['ENVIRONMENT'],
      },
    ],
    requiredPromptTokens: 3000,
    tier: 'growth',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
]

/**
 * Smart Factory 도메인 서브엔진
 * 중기부 스마트공장 특화
 */
export const SMART_FACTORY_SUB_ENGINES: SubEngine[] = [
  {
    id: 'sf-application',
    name: 'Smart Factory Application',
    nameKo: '스마트공장 구축사업 신청서',
    description: '중기부 스마트공장 구축사업 신청서 자동 생성',
    domain: 'MANUFACTURING',
    primarySources: [
      findPortalById('bizinfo')!, // 기업마당이 핵심!
      findPortalById('smba')!,
      findPortalById('kosmes')!,
    ],
    templates: [
      {
        id: 'sf-application-form',
        name: 'Smart Factory Application Form',
        nameKo: '스마트공장 구축사업 신청서',
        format: 'HWP',
        sections: [
          { name: '사업자 정보', required: true, sourceField: 'companyInfo' },
          { name: '사업 개요', required: true, sourceField: 'projectOverview' },
          { name: '현황 분석', required: true, sourceField: 'currentStatus' },
          { name: '구축 계획', required: true, sourceField: 'implementationPlan' },
          { name: '기대 효과', required: true, sourceField: 'expectedOutcome' },
          { name: '예산 계획', required: true, sourceField: 'budgetPlan' },
        ],
        estimatedTime: 120,
        announcementTypes: ['스마트공장', '제조혁신'],
      },
    ],
    requiredPromptTokens: 10000,
    tier: 'starter',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
  {
    id: 'sf-settlement',
    name: 'Smart Factory Settlement',
    nameKo: '스마트공장 정산 보고서',
    description: '중기부 스마트공장 사업 정산 보고서 자동 생성',
    domain: 'MANUFACTURING',
    primarySources: [
      findPortalById('bizinfo')!,
      findPortalById('smba')!,
    ],
    templates: [
      {
        id: 'sf-settlement-report',
        name: 'Smart Factory Settlement Report',
        nameKo: '스마트공장 정산 보고서',
        format: 'XLSX',
        sections: [
          { name: '사업 개요', required: true, sourceField: 'projectSummary' },
          { name: '집행 내역', required: true, sourceField: 'expenditure' },
          { name: '증빙 목록', required: true, sourceField: 'evidenceList' },
          { name: '성과 지표', required: true, sourceField: 'kpi' },
        ],
        estimatedTime: 60,
        announcementTypes: ['스마트공장', '정산'],
      },
    ],
    requiredPromptTokens: 6000,
    tier: 'starter',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
  {
    id: 'sf-mes-oee',
    name: 'MES/OEE Report',
    nameKo: 'MES/OEE 분석 보고서',
    description: 'MES 데이터 기반 OEE(설비종합효율) 분석 보고서',
    domain: 'MANUFACTURING',
    primarySources: [findPortalById('smba')!],
    templates: [
      {
        id: 'sf-oee-report',
        name: 'OEE Analysis Report',
        nameKo: 'OEE 분석 보고서',
        format: 'PDF',
        sections: [
          { name: '설비 현황', required: true, sourceField: 'equipmentStatus' },
          { name: 'OEE 지표', required: true, sourceField: 'oeeMetrics' },
          { name: '가동률 분석', required: true, sourceField: 'utilizationAnalysis' },
          { name: '개선 권고', required: false, sourceField: 'recommendations' },
        ],
        estimatedTime: 45,
        announcementTypes: ['스마트공장', 'MES'],
      },
    ],
    requiredPromptTokens: 5000,
    tier: 'growth',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
]

/**
 * AI Voucher 도메인 서브엔진
 * NIPA AI바우처 특화
 */
export const AI_VOUCHER_SUB_ENGINES: SubEngine[] = [
  {
    id: 'aiv-supply',
    name: 'AI Voucher Supply Application',
    nameKo: 'AI바우처 공급기업 신청서',
    description: 'NIPA AI바우처 공급기업 등록 신청서 자동 생성',
    domain: 'DIGITAL',
    primarySources: [
      findPortalById('bizinfo')!, // 기업마당에서 AI바우처 공고 확인
      findPortalById('nipa')!,
    ],
    templates: [
      {
        id: 'aiv-supply-form',
        name: 'AI Voucher Supply Registration',
        nameKo: 'AI바우처 공급기업 등록 신청서',
        format: 'HWP',
        sections: [
          { name: '기업 정보', required: true, sourceField: 'companyInfo' },
          { name: 'AI 솔루션 소개', required: true, sourceField: 'solutionInfo' },
          { name: '기술 역량', required: true, sourceField: 'techCapability' },
          { name: '레퍼런스', required: true, sourceField: 'references' },
          { name: '서비스 체계', required: true, sourceField: 'serviceSystem' },
        ],
        estimatedTime: 90,
        announcementTypes: ['AI바우처', 'AI공급기업'],
      },
    ],
    requiredPromptTokens: 8000,
    tier: 'starter',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
  {
    id: 'aiv-demand',
    name: 'AI Voucher Demand Application',
    nameKo: 'AI바우처 수요기업 신청서',
    description: 'NIPA AI바우처 수요기업 신청서 자동 생성',
    domain: 'DIGITAL',
    primarySources: [
      findPortalById('bizinfo')!,
      findPortalById('nipa')!,
    ],
    templates: [
      {
        id: 'aiv-demand-form',
        name: 'AI Voucher Demand Application',
        nameKo: 'AI바우처 수요기업 신청서',
        format: 'HWP',
        sections: [
          { name: '기업 정보', required: true, sourceField: 'companyInfo' },
          { name: '도입 필요성', required: true, sourceField: 'necessity' },
          { name: '도입 계획', required: true, sourceField: 'adoptionPlan' },
          { name: '기대 효과', required: true, sourceField: 'expectedEffect' },
        ],
        estimatedTime: 60,
        announcementTypes: ['AI바우처', 'AI수요기업'],
      },
    ],
    requiredPromptTokens: 6000,
    tier: 'starter',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
  {
    id: 'aiv-performance',
    name: 'AI Voucher Performance Report',
    nameKo: 'AI바우처 실적 보고서',
    description: 'NIPA AI바우처 사업 실적 보고서 자동 생성',
    domain: 'DIGITAL',
    primarySources: [findPortalById('nipa')!],
    templates: [
      {
        id: 'aiv-performance-report',
        name: 'AI Voucher Performance Report',
        nameKo: 'AI바우처 실적 보고서',
        format: 'XLSX',
        sections: [
          { name: '사업 개요', required: true, sourceField: 'projectSummary' },
          { name: '투입 인력', required: true, sourceField: 'personnel' },
          { name: '수행 내역', required: true, sourceField: 'activities' },
          { name: '성과 지표', required: true, sourceField: 'kpi' },
          { name: '증빙 목록', required: true, sourceField: 'evidenceList' },
        ],
        estimatedTime: 75,
        announcementTypes: ['AI바우처', '실적보고'],
      },
    ],
    requiredPromptTokens: 7000,
    tier: 'growth',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
]

/**
 * Global Tender 도메인 서브엔진
 * 해외 입찰 특화
 */
export const GLOBAL_TENDER_SUB_ENGINES: SubEngine[] = [
  {
    id: 'gt-sam',
    name: 'SAM.gov Proposal',
    nameKo: 'SAM.gov 제안서',
    description: '미국 연방정부 조달 제안서 초안 자동 생성',
    domain: 'EXPORT',
    primarySources: [], // 해외 포털은 별도 관리
    templates: [
      {
        id: 'gt-sam-proposal',
        name: 'SAM.gov Proposal Template',
        nameKo: 'SAM.gov 제안서',
        format: 'DOCX',
        sections: [
          { name: 'Executive Summary', required: true, sourceField: 'summary' },
          { name: 'Technical Approach', required: true, sourceField: 'technical' },
          { name: 'Past Performance', required: true, sourceField: 'experience' },
          { name: 'Pricing', required: true, sourceField: 'pricing' },
        ],
        estimatedTime: 180,
        announcementTypes: ['SAM.gov', 'US Federal'],
      },
    ],
    requiredPromptTokens: 12000,
    tier: 'growth',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
  {
    id: 'gt-ungm',
    name: 'UNGM Proposal',
    nameKo: 'UNGM 제안서',
    description: 'UN 산하기관 조달 제안서 초안 자동 생성',
    domain: 'EXPORT',
    primarySources: [],
    templates: [
      {
        id: 'gt-ungm-proposal',
        name: 'UNGM Proposal Template',
        nameKo: 'UNGM 제안서',
        format: 'DOCX',
        sections: [
          { name: 'Company Profile', required: true, sourceField: 'profile' },
          { name: 'Technical Proposal', required: true, sourceField: 'technical' },
          { name: 'Financial Proposal', required: true, sourceField: 'financial' },
        ],
        estimatedTime: 150,
        announcementTypes: ['UNGM', 'UN Procurement'],
      },
    ],
    requiredPromptTokens: 10000,
    tier: 'growth',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
]

/**
 * 정부지원 공통 서브엔진 (Cross-Domain)
 *
 * 🎯 핵심: 기업마당, 소상공인24, 중기청 공통 템플릿
 */
export const GOV_SUPPORT_CROSS_ENGINES: SubEngine[] = [
  {
    id: 'gov-policy-fund',
    name: 'Policy Fund Application',
    nameKo: '정책자금 신청서',
    description: '기업마당/소상공인24 정책자금 공통 신청서',
    domain: 'CROSS_DOMAIN',
    primarySources: [
      findPortalById('bizinfo')!, // 핵심!
      findPortalById('sme24')!,   // 핵심!
      findPortalById('kosmes')!,
      findPortalById('semas')!,
    ],
    templates: [
      {
        id: 'gov-policy-fund-form',
        name: 'Policy Fund Application',
        nameKo: '정책자금 신청서',
        format: 'HWP',
        sections: [
          { name: '사업자 정보', required: true, sourceField: 'businessInfo' },
          { name: '자금 용도', required: true, sourceField: 'fundPurpose' },
          { name: '재무 현황', required: true, sourceField: 'financialStatus' },
          { name: '상환 계획', required: true, sourceField: 'repaymentPlan' },
        ],
        estimatedTime: 60,
        announcementTypes: ['정책자금', '융자', '운전자금', '시설자금'],
      },
    ],
    requiredPromptTokens: 6000,
    tier: 'free', // 무료 티어에서도 제공!
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
  {
    id: 'gov-startup-pre',
    name: 'Pre-Startup Application',
    nameKo: '예비창업 신청서',
    description: '케이스타트업 예비창업패키지 공통 신청서',
    domain: 'CROSS_DOMAIN',
    primarySources: [
      findPortalById('k-startup')!,
      findPortalById('bizinfo')!,
    ],
    templates: [
      {
        id: 'gov-pre-startup-form',
        name: 'Pre-Startup Package Application',
        nameKo: '예비창업패키지 신청서',
        format: 'HWP',
        sections: [
          { name: '창업자 정보', required: true, sourceField: 'founderInfo' },
          { name: '아이템 소개', required: true, sourceField: 'itemDescription' },
          { name: '시장 분석', required: true, sourceField: 'marketAnalysis' },
          { name: '사업 계획', required: true, sourceField: 'businessPlan' },
          { name: '자금 계획', required: true, sourceField: 'fundingPlan' },
        ],
        estimatedTime: 120,
        announcementTypes: ['예비창업', '창업지원'],
      },
    ],
    requiredPromptTokens: 8000,
    tier: 'starter',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
  {
    id: 'gov-startup-early',
    name: 'Early Startup Application',
    nameKo: '초기창업 신청서',
    description: '케이스타트업 초기창업패키지 공통 신청서',
    domain: 'CROSS_DOMAIN',
    primarySources: [
      findPortalById('k-startup')!,
      findPortalById('bizinfo')!,
    ],
    templates: [
      {
        id: 'gov-early-startup-form',
        name: 'Early Startup Package Application',
        nameKo: '초기창업패키지 신청서',
        format: 'HWP',
        sections: [
          { name: '기업 정보', required: true, sourceField: 'companyInfo' },
          { name: '제품/서비스', required: true, sourceField: 'productService' },
          { name: '시장/경쟁', required: true, sourceField: 'marketCompetition' },
          { name: '팀 구성', required: true, sourceField: 'teamComposition' },
          { name: '성장 전략', required: true, sourceField: 'growthStrategy' },
          { name: '자금 계획', required: true, sourceField: 'fundingPlan' },
        ],
        estimatedTime: 150,
        announcementTypes: ['초기창업', '창업지원'],
      },
    ],
    requiredPromptTokens: 10000,
    tier: 'starter',
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
  {
    id: 'gov-sme-consulting',
    name: 'SME Consulting Application',
    nameKo: '소상공인 컨설팅 신청서',
    description: '소상공인24 컨설팅 지원 신청서',
    domain: 'CROSS_DOMAIN',
    primarySources: [
      findPortalById('sme24')!, // 핵심!
      findPortalById('semas')!,
    ],
    templates: [
      {
        id: 'gov-sme-consulting-form',
        name: 'SME Consulting Application',
        nameKo: '소상공인 컨설팅 신청서',
        format: 'HWP',
        sections: [
          { name: '사업자 정보', required: true, sourceField: 'businessInfo' },
          { name: '컨설팅 분야', required: true, sourceField: 'consultingArea' },
          { name: '현황 및 애로사항', required: true, sourceField: 'currentIssues' },
          { name: '기대 효과', required: true, sourceField: 'expectedEffect' },
        ],
        estimatedTime: 45,
        announcementTypes: ['컨설팅', '소상공인지원'],
      },
    ],
    requiredPromptTokens: 4000,
    tier: 'free', // 무료 티어!
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-22',
      announcementCount: 0,
      templateCount: 1,
    },
  },
]

// ============================================
// 서브엔진 레지스트리
// ============================================

export const ALL_SUB_ENGINES: SubEngine[] = [
  ...TMS_SUB_ENGINES,
  ...SMART_FACTORY_SUB_ENGINES,
  ...AI_VOUCHER_SUB_ENGINES,
  ...GLOBAL_TENDER_SUB_ENGINES,
  ...GOV_SUPPORT_CROSS_ENGINES,
]

export function getSubEnginesByDomain(domain: EnginePresetType | 'CROSS_DOMAIN'): SubEngine[] {
  return ALL_SUB_ENGINES.filter((e) => e.domain === domain)
}

export function getSubEnginesByTier(tier: MonetizationTier): SubEngine[] {
  const tierPriority: Record<MonetizationTier, number> = {
    free: 0,
    starter: 1,
    growth: 2,
    enterprise: 3,
  }

  const currentPriority = tierPriority[tier]
  return ALL_SUB_ENGINES.filter((e) => tierPriority[e.tier] <= currentPriority)
}

export function getSubEngineById(id: string): SubEngine | undefined {
  return ALL_SUB_ENGINES.find((e) => e.id === id)
}

export function getSubEnginesByPortal(portalId: string): SubEngine[] {
  return ALL_SUB_ENGINES.filter((e) =>
    e.primarySources.some((p) => p.id === portalId)
  )
}

// ============================================
// 서브엔진 통계
// ============================================

export function getSubEngineStats(): {
  total: number
  byDomain: Record<string, number>
  byTier: Record<MonetizationTier, number>
  totalTemplates: number
  totalPromptTokens: number
} {
  const byDomain: Record<string, number> = {}
  const byTier: Record<MonetizationTier, number> = {
    free: 0,
    starter: 0,
    growth: 0,
    enterprise: 0,
  }

  let totalTemplates = 0
  let totalPromptTokens = 0

  for (const engine of ALL_SUB_ENGINES) {
    const domain = engine.domain
    byDomain[domain] = (byDomain[domain] || 0) + 1
    byTier[engine.tier]++
    totalTemplates += engine.templates.length
    totalPromptTokens += engine.requiredPromptTokens
  }

  return {
    total: ALL_SUB_ENGINES.length,
    byDomain,
    byTier,
    totalTemplates,
    totalPromptTokens,
  }
}

// ============================================
// 주의사항 상수
// ============================================

export const SUB_ENGINE_WARNINGS = {
  NO_FABRICATION:
    '⚠️ 공고문에 명시되지 않은 정보는 절대 추측하거나 생성하지 마세요',
  VERIFY_ANNOUNCEMENT:
    '⚠️ 템플릿 사용 전 기업마당/소상공인24에서 최신 공고문 확인하세요',
  CHECK_YEAR:
    '⚠️ 연도별로 양식이 다릅니다. 반드시 해당 연도 공고문 기준으로 확인하세요',
  TARGET_AUDIENCE:
    '🎯 타겟: 중장년 제조/설비 사업자 - 행정 서류가 최대 Pain Point',
} as const
