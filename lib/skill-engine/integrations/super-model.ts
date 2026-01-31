/**
 * QETTA Super Model Integration
 *
 * Single Source of Truth (qetta-super-model.json)를 skill-engine에 연동
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import superModel from '@/generators/gov-support/data/qetta-super-model.json'
import { DISPLAY_METRICS, STRUCTURE_METRICS } from '@/constants/metrics'

// ============================================
// Types (슈퍼모델 구조)
// ============================================

export interface QettaSuperModel {
  id: string
  version: string
  updatedAt: string
  slogan: {
    primary: string
    english: string
    tagline: string
  }
  coreTechnology: {
    name: string
    description: string
    differentiator: string
    dometrainQuote: string
  }
  vision: {
    short: string
    mid: string
    long: string
  }
  businessViability: {
    model: string
    targetCustomer: string
    valueProposition: string
    competitiveAdvantage: string
  }
  profitability: {
    revenueStreams: string[]
    pricing: string
    unitEconomics: string
    scalability: string
  }
  technicalExcellence: {
    architecture: string
    keyComponents: string[]
    innovation: string
  }
  keyInsights: {
    synergyAnalysis: Record<string, string>
    competitiveEdge: Record<string, string>
    platformEvolution: Record<string, string>
  }
  forbiddenTerms: Record<string, string>
  claudeEcosystemIntegration: {
    overview: {
      summary: string
      currentScore: number
      targetScore: number
      differentiator: string
    }
    modelSelection: Record<string, {
      usage: string
      monthlyCost: string
      tasks: string[]
    }>
    costOptimization: {
      currentMonthly: string
      scenarios: Record<string, {
        cost: string
        description: string
        reduction: string
        recommended?: boolean
      }>
    }
  }
}

// ============================================
// Export Super Model Data
// ============================================

export const QETTA_SUPER_MODEL = superModel as unknown as QettaSuperModel

// ============================================
// QETTA Company Profile (사전 검증용)
// ============================================

export const QETTA_COMPANY_PROFILE = {
  name: 'QETTA (큐에타)',
  id: 'qetta-2024',

  // 기본 정보 (예비창업 기준)
  basic: {
    age: 0, // 예비창업자
    employees: 3,
    revenue: 0, // 매출 0
    region: '부산광역시',
    industry: '소프트웨어 개발업',
    certifications: [], // 아직 없음
  },

  // 슈퍼모델 기반 핵심 정보
  fromSuperModel: {
    slogan: QETTA_SUPER_MODEL.slogan.primary,
    sloganEn: QETTA_SUPER_MODEL.slogan.english,
    tagline: QETTA_SUPER_MODEL.slogan.tagline,
    coreTech: QETTA_SUPER_MODEL.coreTechnology.name,
    coreTechDescription: QETTA_SUPER_MODEL.coreTechnology.description,
    differentiator: QETTA_SUPER_MODEL.coreTechnology.differentiator,
    businessModel: QETTA_SUPER_MODEL.businessViability.model,
    targetCustomer: QETTA_SUPER_MODEL.businessViability.targetCustomer,
    valueProposition: QETTA_SUPER_MODEL.businessViability.valueProposition,
  },

  // 트랙션
  traction: [
    { name: '웰컴투 동남권 TIPS', year: 2025, type: 'selection' },
    { name: 'SNU SNACK TOP 3', year: 2025, type: 'award' },
    { name: 'AIFC 핀테크 프로그램', year: 2025, type: 'selection' },
    { name: 'UNGM 등록', year: 2025, type: 'registration' },
    { name: 'SAM.gov 등록', year: 2025, type: 'registration' },
  ],

  // 팀 구성
  team: [
    {
      name: '황OO',
      role: 'CEO',
      initial: 'H',
      experience: '물류 B2B 플랫폼 창업 경험',
      relevance: '정부지원사업 10건+ 신청 경험으로 Pain Point 직접 체험',
    },
    {
      name: '서OO',
      role: 'CTO',
      initial: 'S',
      experience: 'Claude Code 기반 풀스택 개발',
      relevance: 'Extended Thinking, Prompt Caching 등 Claude API 네이티브 통합',
    },
    {
      name: '장OO',
      role: 'COO',
      initial: 'J',
      experience: '제조업 도메인 전문가',
      relevance: 'TMS, 스마트공장 현장 경험으로 도메인 용어 DB 구축',
    },
  ],
}

// ============================================
// 핵심 수치 (UI/사업계획서용)
// ============================================

export const QETTA_METRICS = {
  // 슈퍼모델 핵심 KPI (constants/metrics.ts 기반)
  timeReduction: {
    value: DISPLAY_METRICS.timeSaved.value,
    label: DISPLAY_METRICS.timeSaved.label,
    detail: DISPLAY_METRICS.timeSaved.detail,
  },
  rejectionReduction: {
    value: DISPLAY_METRICS.rejectionReduction.value,
    label: DISPLAY_METRICS.rejectionReduction.label,
    detail: '도메인 엔진 용어 매핑',
  },
  docSpeed: {
    value: DISPLAY_METRICS.docSpeed.value,
    label: DISPLAY_METRICS.docSpeed.label,
    detail: DISPLAY_METRICS.docSpeed.detail,
  },
  apiUptime: {
    value: DISPLAY_METRICS.apiUptime.value,
    label: DISPLAY_METRICS.apiUptime.label,
    detail: DISPLAY_METRICS.apiUptime.detail,
  },
  termAccuracy: {
    value: DISPLAY_METRICS.termAccuracy.value,
    label: DISPLAY_METRICS.termAccuracy.label,
    detail: `${STRUCTURE_METRICS.terminologyMappings} 산업 용어 매핑`,
  },
  globalTenderDB: {
    value: DISPLAY_METRICS.globalTenders.value,
    label: DISPLAY_METRICS.globalTenders.label,
    detail: DISPLAY_METRICS.globalTenders.detail,
  },

  // Claude 생태계 통합
  claude: {
    currentScore: QETTA_SUPER_MODEL.claudeEcosystemIntegration.overview.currentScore,
    targetScore: QETTA_SUPER_MODEL.claudeEcosystemIntegration.overview.targetScore,
    costOptimization: '63%', // $150 → $55
    promptCacheEfficiency: '90%', // 목표
  },
}

// ============================================
// 도메인 엔진 정보
// ============================================

export const QETTA_ENGINE_PRESETS = {
  TMS: {
    id: 'ENVIRONMENT',
    name: '환경부 TMS',
    nameEn: 'Tele-Monitoring System',
    ministry: '환경부',
    terminology: ['NOx', 'SOx', 'PM', 'CleanSYS'],
    outputs: ['일일 보고서', '월간 보고서', '측정기록부'],
    color: 'emerald',
  },
  SMART_FACTORY: {
    id: 'MANUFACTURING',
    name: '스마트공장',
    nameEn: 'Smart Factory',
    ministry: '중소벤처기업부',
    terminology: ['MES', 'PLC', 'OPC-UA', '4M1E', 'OEE'],
    outputs: ['정산 보고서', '실적 보고서'],
    color: 'blue',
  },
  AI_VOUCHER: {
    id: 'DIGITAL',
    name: 'AI 바우처',
    nameEn: 'AI Voucher',
    ministry: 'NIPA',
    terminology: ['공급기업', '수요기업', '바우처'],
    outputs: ['실적 보고서', '성과 보고서'],
    color: 'violet',
  },
  GLOBAL_TENDER: {
    id: 'EXPORT',
    name: '해외 입찰',
    nameEn: 'Global Tender',
    ministry: 'Global',
    terminology: ['G2B', 'SAM.gov', 'UNGM', 'Goszakup'],
    outputs: ['제안서 초안', '입찰 문서'],
    color: 'amber',
  },
}

// ============================================
// 금지 용어 검사
// ============================================

export function checkForbiddenTerms(text: string): {
  hasForbidden: boolean
  found: Array<{ term: string; replacement: string; position: number }>
} {
  const forbidden = QETTA_SUPER_MODEL.forbiddenTerms
  const found: Array<{ term: string; replacement: string; position: number }> = []

  // 블록체인 검사
  const blockchainMatch = text.match(/블록체인/gi)
  if (blockchainMatch) {
    found.push({
      term: '블록체인',
      replacement: forbidden.blockchain,
      position: text.indexOf('블록체인'),
    })
  }

  // 혁신적/획기적 검사
  const innovativeMatch = text.match(/혁신적|획기적|혁신/gi)
  if (innovativeMatch) {
    innovativeMatch.forEach((match) => {
      found.push({
        term: match,
        replacement: forbidden.innovative,
        position: text.indexOf(match),
      })
    })
  }

  // 100% 보장 검사
  const guaranteeMatch = text.match(/100%\s*보장|완벽하게/gi)
  if (guaranteeMatch) {
    guaranteeMatch.forEach((match) => {
      found.push({
        term: match,
        replacement: forbidden.guarantee,
        position: text.indexOf(match),
      })
    })
  }

  return {
    hasForbidden: found.length > 0,
    found,
  }
}

// ============================================
// 사업계획서 컨텍스트 생성 (QETTA용)
// ============================================

export function generateQettaBusinessPlanContext() {
  return {
    itemName: 'QETTA (큐에타) - 도메인 엔진 기반 AI 증빙 자동화 플랫폼',

    problemStatement: `
국내 중소제조업의 78%가 수작업 문서 작성에 월 40시간 이상을 소요합니다.
환경부 TMS 측정기록부, 중기부 스마트공장 정산보고서, NIPA AI바우처 실적보고서 등
각 기관마다 다른 양식과 전문 용어로 인해 문서 반려율이 높고,
대기업은 전담 인력을 두지만 중소기업은 대표자가 직접 작성해야 하는 상황입니다.

범용 AI(ChatGPT, Claude)는 'NOx', '4M1E', '공급기업' 같은 산업 전문 용어를 혼동하여
정확한 문서 생성이 불가능합니다. ${QETTA_SUPER_MODEL.coreTechnology.dometrainQuote}
`.trim(),

    solutionSummary: QETTA_SUPER_MODEL.coreTechnology.description,

    differentiation: [
      '도메인 엔진: 12 BLOCK × 50+ 용어 = 600+ 매핑으로 반려율 91% 감소',
      'B2B2B 화이트라벨: 파트너가 자사 브랜드로 공급, QETTA는 숨고',
      'HW+SW+HR 완전 번들: 센서만 달면 즉시 공급기업 자격 획득',
      '정부 50% 지원 활용: 수요기업 실부담 50만원~',
    ],

    marketSize: {
      tam: { value: 2, unit: 'B (한국)', source: '국내 산업 증빙 문서 시장' },
      sam: { value: 500, unit: 'M', source: '중소제조업 + 정부사업 참여 기업' },
      som: { value: 50, unit: 'M', source: '6개 도메인 엔진 타겟' },
    },

    businessModel: {
      type: 'subscription',
      pricing: 'Starter 99만원(5개 고객사), Growth 290만원(20개 고객사)',
      cac: 500000, // 50만원
      ltv: 3500000, // 350만원 (12개월 x 29만원)
    },

    team: QETTA_COMPANY_PROFILE.team,

    milestones: [
      { month: 1, milestone: 'MVP 런칭', kpi: '파일럿 고객 3개사' },
      { month: 2, milestone: 'TMS 엔진 정식 출시', kpi: '파트너 10개사' },
      { month: 4, milestone: '스마트공장 엔진 출시', kpi: '파트너 20개사' },
      { month: 6, milestone: 'AI바우처 엔진 출시', kpi: '파트너 30개사' },
      { month: 8, milestone: '해외입찰 엔진 출시', kpi: '파트너 40개사' },
      { month: 10, milestone: '목표 달성', kpi: '파트너 50개사, MRR 5000만원' },
    ],

    metrics: QETTA_METRICS,
    traction: QETTA_COMPANY_PROFILE.traction,
  }
}

// ============================================
// API에서 사용할 QETTA 회사 정보
// ============================================

export function getQettaCompanyForMatching() {
  return {
    age: QETTA_COMPANY_PROFILE.basic.age,
    employees: QETTA_COMPANY_PROFILE.basic.employees,
    revenue: QETTA_COMPANY_PROFILE.basic.revenue,
    region: QETTA_COMPANY_PROFILE.basic.region,
    certifications: QETTA_COMPANY_PROFILE.basic.certifications,
  }
}
