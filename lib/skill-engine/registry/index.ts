/**
 * QETTA 스킬 패키지 레지스트리
 *
 * 도메인 블록 = 플러그인 = 수익화 단위
 *
 * 핵심 원칙:
 * 1. 공고문 기반 학습 (기업마당, 소상공인24 핵심)
 * 2. 티어별 기능 제한
 * 3. 서브엔진 조합으로 패키지 구성
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import type { EnginePresetType } from '../types'
import { DISPLAY_METRICS } from '@/constants/metrics'
import {
  ALL_SUB_ENGINES,
  MONETIZATION_TIERS,
  CORE_ANNOUNCEMENT_PORTALS,
  getSubEnginesByDomain,
  getSubEnginesByTier,
  getTierConfig,
  calculateActualPrice,
  type SubEngine,
  type MonetizationTier,
} from '../skills/sub-engines'

// ============================================
// 스킬 패키지 타입 정의
// ============================================

/**
 * 스킬 패키지 = 여러 서브엔진의 묶음 (판매 단위)
 */
export interface SkillPackage {
  id: string
  name: string
  nameKo: string
  description: string

  // 포함된 도메인
  domains: (EnginePresetType | 'CROSS_DOMAIN')[]

  // 포함된 서브엔진 ID 목록
  subEngineIds: string[]

  // 수익화 티어 (최소 요구 티어)
  minimumTier: MonetizationTier

  // 가격 (개별 구매 시)
  pricing: {
    oneTime: number // 일회성 구매
    monthly: number // 월 구독
    yearly: number // 연 구독
  }

  // 패키지 통계
  stats: {
    templateCount: number
    estimatedTokens: number
    avgGenerationTime: number // 평균 문서 생성 시간 (초)
  }

  // 마케팅 정보
  marketing: {
    tagline: string
    highlights: string[]
    targetAudience: string[]
  }

  metadata: {
    version: string
    createdAt: string
    updatedAt: string
  }
}

/**
 * 사용자 구독 정보
 */
export interface UserSubscription {
  userId: string
  tier: MonetizationTier
  startDate: string
  endDate: string
  isYearly: boolean

  // 활성화된 도메인/서브엔진
  activeDomains: EnginePresetType[]
  activeSubEngines: string[]

  // 사용량
  usage: {
    documentsThisMonth: number
    apiCallsToday: number
    lastResetDate: string
  }
}

// ============================================
// 도메인별 스킬 패키지 정의
// ============================================

export const TMS_PACKAGE: SkillPackage = {
  id: 'pkg-tms',
  name: 'TMS Environmental Package',
  nameKo: 'TMS 환경부 패키지',
  description: '환경부 원격 모니터링 시스템 완전 패키지 - 일일/월간 보고서, CleanSYS 연동',
  domains: ['ENVIRONMENT'],
  subEngineIds: ['tms-daily', 'tms-monthly', 'tms-cleansys'],
  minimumTier: 'starter',
  pricing: {
    oneTime: 500000, // 50만원
    monthly: 50000,  // 5만원/월
    yearly: 500000,  // 50만원/년 (2개월 무료)
  },
  stats: {
    templateCount: 3,
    estimatedTokens: 16000,
    avgGenerationTime: 52,
  },
  marketing: {
    tagline: `환경부 TMS 보고서, ${DISPLAY_METRICS.docSpeed.value} 만에 완성`,
    highlights: [
      '일일 배출량 보고서 자동 생성',
      '월간 환경 관리 보고서',
      'CleanSYS 데이터 연동',
      '법적 기준 자동 비교',
    ],
    targetAudience: ['환경설비 기업', '제조업체', '발전소', '소각시설'],
  },
  metadata: {
    version: '1.0.0',
    createdAt: '2026-01-22',
    updatedAt: '2026-01-22',
  },
}

export const SMART_FACTORY_PACKAGE: SkillPackage = {
  id: 'pkg-smart-factory',
  name: 'Smart Factory Package',
  nameKo: '스마트공장 패키지',
  description: '중기부 스마트공장 사업 완전 패키지 - 신청서, 정산, MES/OEE 분석',
  domains: ['MANUFACTURING'],
  subEngineIds: ['sf-application', 'sf-settlement', 'sf-mes-oee'],
  minimumTier: 'starter',
  pricing: {
    oneTime: 700000, // 70만원
    monthly: 70000,  // 7만원/월
    yearly: 700000,  // 70만원/년
  },
  stats: {
    templateCount: 3,
    estimatedTokens: 21000,
    avgGenerationTime: 75,
  },
  marketing: {
    tagline: `스마트공장 신청서, 반려율 ${DISPLAY_METRICS.rejectionReduction.value} 감소`,
    highlights: [
      '기업마당 공고 기반 신청서',
      '정산 보고서 자동화',
      'MES 데이터 기반 OEE 분석',
      '중기부 양식 100% 준수',
    ],
    targetAudience: ['제조 중소기업', '스마트공장 공급기업', '설비업체'],
  },
  metadata: {
    version: '1.0.0',
    createdAt: '2026-01-22',
    updatedAt: '2026-01-22',
  },
}

export const AI_VOUCHER_PACKAGE: SkillPackage = {
  id: 'pkg-ai-voucher',
  name: 'AI Voucher Package',
  nameKo: 'AI바우처 패키지',
  description: 'NIPA AI바우처 완전 패키지 - 공급/수요기업 신청서, 실적 보고서',
  domains: ['DIGITAL'],
  subEngineIds: ['aiv-supply', 'aiv-demand', 'aiv-performance'],
  minimumTier: 'starter',
  pricing: {
    oneTime: 600000, // 60만원
    monthly: 60000,  // 6만원/월
    yearly: 600000,  // 60만원/년
  },
  stats: {
    templateCount: 3,
    estimatedTokens: 21000,
    avgGenerationTime: 75,
  },
  marketing: {
    tagline: `AI바우처 공급기업 등록, ${DISPLAY_METRICS.timeSaved.value} 시간 단축`,
    highlights: [
      '공급기업 등록 신청서 자동 생성',
      '수요기업 신청서 템플릿',
      '실적 보고서 자동화',
      'NIPA 양식 100% 준수',
    ],
    targetAudience: ['AI 솔루션 기업', 'AI 도입 희망 기업', 'SW 개발사'],
  },
  metadata: {
    version: '1.0.0',
    createdAt: '2026-01-22',
    updatedAt: '2026-01-22',
  },
}

export const GLOBAL_TENDER_PACKAGE: SkillPackage = {
  id: 'pkg-global-tender',
  name: 'Global Tender Package',
  nameKo: '글로벌 입찰 패키지',
  description: '해외 정부 조달 입찰 패키지 - SAM.gov, UNGM 제안서',
  domains: ['EXPORT'],
  subEngineIds: ['gt-sam', 'gt-ungm'],
  minimumTier: 'growth', // Growth 이상
  pricing: {
    oneTime: 1000000, // 100만원
    monthly: 100000,  // 10만원/월
    yearly: 1000000,  // 100만원/년
  },
  stats: {
    templateCount: 2,
    estimatedTokens: 22000,
    avgGenerationTime: 165,
  },
  marketing: {
    tagline: `${DISPLAY_METRICS.globalTenders.value} 해외 입찰, 영문 제안서 자동 생성`,
    highlights: [
      'SAM.gov 제안서 템플릿',
      'UNGM 제안서 템플릿',
      '영문 비즈니스 라이팅',
      `해외 입찰 DB ${DISPLAY_METRICS.globalTenders.value} 검색`,
    ],
    targetAudience: ['수출 기업', '해외 진출 기업', 'IT 서비스 기업'],
  },
  metadata: {
    version: '1.0.0',
    createdAt: '2026-01-22',
    updatedAt: '2026-01-22',
  },
}

export const GOV_SUPPORT_PACKAGE: SkillPackage = {
  id: 'pkg-gov-support',
  name: 'Government Support Basic Package',
  nameKo: '정부지원 기본 패키지',
  description: '기업마당/소상공인24 공통 템플릿 - 정책자금, 창업지원, 컨설팅',
  domains: ['CROSS_DOMAIN'],
  subEngineIds: ['gov-policy-fund', 'gov-startup-pre', 'gov-startup-early', 'gov-sme-consulting'],
  minimumTier: 'free', // 무료 티어에서도 일부 제공!
  pricing: {
    oneTime: 0,     // 무료 (일부 기능)
    monthly: 30000, // 3만원/월 (전체)
    yearly: 300000, // 30만원/년
  },
  stats: {
    templateCount: 4,
    estimatedTokens: 28000,
    avgGenerationTime: 94,
  },
  marketing: {
    tagline: '기업마당 공고 기반, 정부지원 신청 한방에',
    highlights: [
      '정책자금 신청서 (기업마당 연동)',
      '예비창업패키지 신청서',
      '초기창업패키지 신청서',
      '소상공인 컨설팅 신청서',
    ],
    targetAudience: ['소상공인', '예비창업자', '초기 스타트업', '중소기업'],
  },
  metadata: {
    version: '1.0.0',
    createdAt: '2026-01-22',
    updatedAt: '2026-01-22',
  },
}

// ============================================
// 번들 패키지 (다중 도메인)
// ============================================

export const MANUFACTURING_BUNDLE: SkillPackage = {
  id: 'bundle-manufacturing',
  name: 'Manufacturing Complete Bundle',
  nameKo: '제조업 완전 번들',
  description: 'TMS + 스마트공장 + 정부지원 - 제조/설비 기업 필수 패키지',
  domains: ['ENVIRONMENT', 'MANUFACTURING', 'CROSS_DOMAIN'],
  subEngineIds: [
    'tms-daily', 'tms-monthly', 'tms-cleansys',
    'sf-application', 'sf-settlement', 'sf-mes-oee',
    'gov-policy-fund', 'gov-sme-consulting',
  ],
  minimumTier: 'growth',
  pricing: {
    oneTime: 1500000,  // 150만원 (30% 할인)
    monthly: 150000,   // 15만원/월
    yearly: 1500000,   // 150만원/년
  },
  stats: {
    templateCount: 8,
    estimatedTokens: 49000,
    avgGenerationTime: 68,
  },
  marketing: {
    tagline: '제조업 사장님을 위한 올인원 패키지',
    highlights: [
      '환경부 TMS 보고서 자동화',
      '중기부 스마트공장 신청/정산',
      '정책자금 신청서 자동 생성',
      `8시간 → 30분, ${DISPLAY_METRICS.timeSaved.value} 시간 단축`,
    ],
    targetAudience: ['제조업 중소기업', '설비업체', '환경설비 기업'],
  },
  metadata: {
    version: '1.0.0',
    createdAt: '2026-01-22',
    updatedAt: '2026-01-22',
  },
}

export const STARTUP_BUNDLE: SkillPackage = {
  id: 'bundle-startup',
  name: 'Startup Complete Bundle',
  nameKo: '스타트업 완전 번들',
  description: 'AI바우처 + 정부지원 - 스타트업 성장 패키지',
  domains: ['DIGITAL', 'CROSS_DOMAIN'],
  subEngineIds: [
    'aiv-supply', 'aiv-demand', 'aiv-performance',
    'gov-policy-fund', 'gov-startup-pre', 'gov-startup-early',
  ],
  minimumTier: 'growth',
  pricing: {
    oneTime: 1000000,  // 100만원 (25% 할인)
    monthly: 100000,   // 10만원/월
    yearly: 1000000,   // 100만원/년
  },
  stats: {
    templateCount: 6,
    estimatedTokens: 43000,
    avgGenerationTime: 83,
  },
  marketing: {
    tagline: '스타트업 정부지원, 처음부터 끝까지',
    highlights: [
      'AI바우처 공급/수요기업 신청',
      '예비창업패키지 신청서',
      '초기창업패키지 신청서',
      '케이스타트업 양식 100% 준수',
    ],
    targetAudience: ['예비창업자', '초기 스타트업', 'AI 기업'],
  },
  metadata: {
    version: '1.0.0',
    createdAt: '2026-01-22',
    updatedAt: '2026-01-22',
  },
}

export const ENTERPRISE_BUNDLE: SkillPackage = {
  id: 'bundle-enterprise',
  name: 'Enterprise All-in-One',
  nameKo: '엔터프라이즈 올인원',
  description: '모든 도메인 + 모든 서브엔진 + 커스텀 개발',
  domains: ['ENVIRONMENT', 'MANUFACTURING', 'DIGITAL', 'EXPORT', 'CROSS_DOMAIN'],
  subEngineIds: ALL_SUB_ENGINES.map((e) => e.id),
  minimumTier: 'enterprise',
  pricing: {
    oneTime: 0,        // 별도 협의
    monthly: 0,        // 별도 협의
    yearly: 0,         // 별도 협의
  },
  stats: {
    templateCount: ALL_SUB_ENGINES.reduce((sum, e) => sum + e.templates.length, 0),
    estimatedTokens: ALL_SUB_ENGINES.reduce((sum, e) => sum + e.requiredPromptTokens, 0),
    avgGenerationTime: 80,
  },
  marketing: {
    tagline: 'QETTA 전체 역량, 파트너 전용',
    highlights: [
      '모든 도메인 엔진 무제한 사용',
      '화이트라벨 (QETTA 브랜드 제거)',
      '커스텀 도메인 엔진 개발',
      '온프레미스 설치 옵션',
      '전담 매니저 + 24/7 지원',
    ],
    targetAudience: ['대기업', '정부기관', '컨설팅 회사', 'B2B2B 파트너'],
  },
  metadata: {
    version: '1.0.0',
    createdAt: '2026-01-22',
    updatedAt: '2026-01-22',
  },
}

// ============================================
// 패키지 레지스트리
// ============================================

export const ALL_PACKAGES: SkillPackage[] = [
  // 도메인별 패키지
  TMS_PACKAGE,
  SMART_FACTORY_PACKAGE,
  AI_VOUCHER_PACKAGE,
  GLOBAL_TENDER_PACKAGE,
  GOV_SUPPORT_PACKAGE,
  // 번들 패키지
  MANUFACTURING_BUNDLE,
  STARTUP_BUNDLE,
  ENTERPRISE_BUNDLE,
]

// ============================================
// 레지스트리 API
// ============================================

export class SkillPackageRegistry {
  private packages: Map<string, SkillPackage>
  private subEngines: Map<string, SubEngine>

  constructor() {
    this.packages = new Map(ALL_PACKAGES.map((p) => [p.id, p]))
    this.subEngines = new Map(ALL_SUB_ENGINES.map((e) => [e.id, e]))
  }

  // 패키지 조회
  getPackage(id: string): SkillPackage | undefined {
    return this.packages.get(id)
  }

  getAllPackages(): SkillPackage[] {
    return Array.from(this.packages.values())
  }

  getPackagesByTier(tier: MonetizationTier): SkillPackage[] {
    const tierPriority: Record<MonetizationTier, number> = {
      free: 0,
      starter: 1,
      growth: 2,
      enterprise: 3,
    }
    const currentPriority = tierPriority[tier]
    return this.getAllPackages().filter(
      (p) => tierPriority[p.minimumTier] <= currentPriority
    )
  }

  getPackagesByDomain(domain: EnginePresetType | 'CROSS_DOMAIN'): SkillPackage[] {
    return this.getAllPackages().filter((p) => p.domains.includes(domain))
  }

  // 서브엔진 조회
  getSubEngine(id: string): SubEngine | undefined {
    return this.subEngines.get(id)
  }

  getSubEnginesForPackage(packageId: string): SubEngine[] {
    const pkg = this.getPackage(packageId)
    if (!pkg) return []
    return pkg.subEngineIds
      .map((id) => this.subEngines.get(id))
      .filter((e): e is SubEngine => e !== undefined)
  }

  // 사용자 접근 권한 체크
  canAccessPackage(subscription: UserSubscription, packageId: string): boolean {
    const pkg = this.getPackage(packageId)
    if (!pkg) return false

    const tierPriority: Record<MonetizationTier, number> = {
      free: 0,
      starter: 1,
      growth: 2,
      enterprise: 3,
    }

    return tierPriority[subscription.tier] >= tierPriority[pkg.minimumTier]
  }

  canAccessSubEngine(subscription: UserSubscription, subEngineId: string): boolean {
    // 활성화된 서브엔진 목록에 있는지 확인
    return subscription.activeSubEngines.includes(subEngineId)
  }

  // 사용량 체크
  checkUsageLimits(subscription: UserSubscription): {
    canGenerateDocument: boolean
    canCallApi: boolean
    documentsRemaining: number | 'unlimited'
    apiCallsRemaining: number | 'unlimited'
  } {
    const tierConfig = getTierConfig(subscription.tier)
    const { limits } = tierConfig
    const { usage } = subscription

    const documentsRemaining =
      limits.documentsPerMonth === 'unlimited'
        ? 'unlimited'
        : limits.documentsPerMonth - usage.documentsThisMonth

    const apiCallsRemaining =
      limits.apiCallsPerDay === 'unlimited'
        ? 'unlimited'
        : limits.apiCallsPerDay - usage.apiCallsToday

    return {
      canGenerateDocument:
        documentsRemaining === 'unlimited' || documentsRemaining > 0,
      canCallApi:
        apiCallsRemaining === 'unlimited' || apiCallsRemaining > 0,
      documentsRemaining,
      apiCallsRemaining,
    }
  }

  // 추천 패키지
  recommendPackages(userProfile: {
    industry: string
    companySize: '소상공인' | '중소기업' | '중견기업' | '스타트업'
    needs: string[]
  }): SkillPackage[] {
    const recommendations: SkillPackage[] = []

    // 산업별 추천
    if (
      userProfile.industry.includes('제조') ||
      userProfile.industry.includes('설비')
    ) {
      recommendations.push(MANUFACTURING_BUNDLE)
    }

    if (
      userProfile.industry.includes('IT') ||
      userProfile.industry.includes('AI') ||
      userProfile.industry.includes('SW')
    ) {
      recommendations.push(AI_VOUCHER_PACKAGE)
    }

    if (userProfile.industry.includes('환경')) {
      recommendations.push(TMS_PACKAGE)
    }

    // 기업 규모별 추천
    if (
      userProfile.companySize === '스타트업' ||
      userProfile.companySize === '소상공인'
    ) {
      recommendations.push(GOV_SUPPORT_PACKAGE)
      recommendations.push(STARTUP_BUNDLE)
    }

    // 니즈별 추천
    if (userProfile.needs.includes('해외진출')) {
      recommendations.push(GLOBAL_TENDER_PACKAGE)
    }

    // 중복 제거
    return [...new Set(recommendations)]
  }

  // 가격 계산
  calculatePackagePrice(
    packageId: string,
    isYearly: boolean,
    applyGovSupport: boolean = true
  ): number {
    const pkg = this.getPackage(packageId)
    if (!pkg) return 0

    const basePrice = isYearly ? pkg.pricing.yearly : pkg.pricing.monthly
    if (!applyGovSupport) return basePrice

    // 정부지원 50% 적용
    return Math.round(basePrice * 0.5)
  }

  // 통계
  getRegistryStats(): {
    totalPackages: number
    totalSubEngines: number
    totalTemplates: number
    byTier: Record<MonetizationTier, number>
    byDomain: Record<string, number>
  } {
    const byTier: Record<MonetizationTier, number> = {
      free: 0,
      starter: 0,
      growth: 0,
      enterprise: 0,
    }
    const byDomain: Record<string, number> = {}

    let totalTemplates = 0

    for (const pkg of this.getAllPackages()) {
      byTier[pkg.minimumTier]++
      totalTemplates += pkg.stats.templateCount

      for (const domain of pkg.domains) {
        byDomain[domain] = (byDomain[domain] || 0) + 1
      }
    }

    return {
      totalPackages: this.packages.size,
      totalSubEngines: this.subEngines.size,
      totalTemplates,
      byTier,
      byDomain,
    }
  }
}

// 싱글톤 인스턴스
export const skillPackageRegistry = new SkillPackageRegistry()

// ============================================
// 편의 함수
// ============================================

export {
  ALL_SUB_ENGINES,
  MONETIZATION_TIERS,
  CORE_ANNOUNCEMENT_PORTALS,
  getSubEnginesByDomain,
  getSubEnginesByTier,
  getTierConfig,
  calculateActualPrice,
}
