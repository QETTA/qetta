/**
 * QETTA Core Metrics Constants
 *
 * Single Source of Truth for all QETTA business metrics
 * @see generators/gov-support/data/qetta-super-model.json
 * @see lib/super-model/loader.ts
 */

import { getMetrics } from '@/lib/super-model/loader'

const metrics = getMetrics()

export const QETTA_METRICS = {
  TIME_REDUCTION: metrics.timeReduction,
  REJECTION_REDUCTION: metrics.rejectionReduction,
  GENERATION_SPEED: metrics.generationSpeed,
  API_UPTIME: metrics.apiUptime,
  ACCURACY: metrics.accuracy,
  GLOBAL_TENDER_DB: metrics.globalTenderDB,
} as const

// Typed metric labels for UI display
export const METRIC_LABELS = {
  TIME_REDUCTION: '시간 단축',
  REJECTION_REDUCTION: '반려 감소',
  GENERATION_SPEED: '생성 속도',
  API_UPTIME: '가용성',
  ACCURACY: '정확도',
  GLOBAL_TENDER_DB: '글로벌 DB',
} as const

// Metric display order for dashboard
export const METRIC_ORDER = [
  'TIME_REDUCTION',
  'REJECTION_REDUCTION',
  'GENERATION_SPEED',
  'API_UPTIME',
  'ACCURACY',
  'GLOBAL_TENDER_DB',
] as const

// Metric descriptions (for tooltips)
export const METRIC_DESCRIPTIONS = {
  TIME_REDUCTION: '문서 작성 시간 단축 (8시간 → 30분)',
  REJECTION_REDUCTION: '문서 반려율 감소 (인건비 95% 절감)',
  GENERATION_SPEED: '문서 자동 생성 속도 (API 기준)',
  API_UPTIME: 'API 서비스 가용성 (SLA 보장)',
  ACCURACY: '용어 매핑 정확도 (도메인 엔진)',
  GLOBAL_TENDER_DB: '글로벌 입찰 DB 규모 (SAM.gov, UNGM 등)',
} as const

// ============================================================================
// 도메인 엔진 상수
// ============================================================================

export const ENGINE_PRESETS = {
  MANUFACTURING: {
    id: 'MANUFACTURING',
    name: 'Manufacturing',
    nameKo: '제조/스마트공장',
    description: 'MES, PLC, OEE',
    color: {
      light: 'bg-blue-100 text-blue-700',
      dark: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
      accent: 'blue',
    },
    terms: ['MES', 'PLC', 'OPC-UA', '4M1E', 'OEE'],
    output: 'Settlement',
    agencies: ['중기부', '산업부'],
  },
  ENVIRONMENT: {
    id: 'ENVIRONMENT',
    name: 'Environment',
    nameKo: '환경/TMS',
    description: 'NOx, SOx, PM',
    color: {
      light: 'bg-emerald-100 text-emerald-700',
      dark: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
      accent: 'emerald',
    },
    terms: ['NOx', 'SOx', 'PM', 'CleanSYS', 'TMS'],
    output: 'Daily/Monthly',
    agencies: ['환경부'],
  },
  DIGITAL: {
    id: 'DIGITAL',
    name: 'Digital',
    nameKo: 'AI/SW',
    description: 'AI Voucher, Cloud',
    color: {
      light: 'bg-violet-100 text-violet-700',
      dark: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
      accent: 'violet',
    },
    terms: ['AI바우처', '공급기업', '수요기업', 'NIPA'],
    output: 'Performance',
    agencies: ['과기정통부'],
  },
  FINANCE: {
    id: 'FINANCE',
    name: 'Finance',
    nameKo: '융자/보증',
    description: 'Loan, Guarantee',
    color: {
      light: 'bg-indigo-100 text-indigo-700',
      dark: 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20',
      accent: 'indigo',
    },
    terms: ['기보', '신보', '소진공', '융자'],
    output: 'Application',
    agencies: ['중기부', '금융위'],
  },
  STARTUP: {
    id: 'STARTUP',
    name: 'Startup',
    nameKo: '창업지원',
    description: 'TIPS, Accelerating',
    color: {
      light: 'bg-fuchsia-100 text-fuchsia-700',
      dark: 'bg-fuchsia-500/10 text-fuchsia-400 ring-1 ring-fuchsia-500/20',
      accent: 'fuchsia',
    },
    terms: ['TIPS', '액셀러레이팅', 'IR덱'],
    output: 'Business Plan',
    agencies: ['중기부'],
  },
  EXPORT: {
    id: 'EXPORT',
    name: 'Export',
    nameKo: '수출/글로벌',
    description: '630K+ Bids',
    color: {
      light: 'bg-amber-100 text-amber-700',
      dark: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
      accent: 'amber',
    },
    terms: ['SAM.gov', 'UNGM', 'Goszakup', 'RFP'],
    output: 'Proposals',
    agencies: ['산업부', 'KOTRA'],
  },
} as const

export type EnginePresetId = keyof typeof ENGINE_PRESETS

// ============================================================================
// 금지 용어 매핑
// ============================================================================

export const FORBIDDEN_TERMS: Record<string, string> = {
  '블록체인': '해시체인',
  '혁신적': '93.8% 효율 향상',
  '획기적': '구체적 수치로 대체',
  'TIPS 5억': '웰컴투 동남권 TIPS 선정',
  '100% 보장': '99.9% 가용성',
}

// ============================================================================
// 브랜드 상수
// ============================================================================

export const BRAND = {
  name: 'QETTA',
  philosophy: 'in·ev·it·able',
  philosophyKo: '필연',
  slogan: 'Your Industry, Your Intelligence.',
  sloganLegacy: '데이터가 흐르면, 증빙이 따라온다.',
  tagline: 'Select BLOCKs. Build Intelligence.',
  taglineKo: 'QETTA는 숨고, 파트너가 빛난다.',
  year: 2026,
} as const

// ============================================================================
// 검증 이력
// ============================================================================

export const TRACTION = {
  TIPS: '웰컴투 동남권 TIPS 선정',
  SNACK: 'SNU SNACK TOP 3',
  AIFC: 'AIFC 핀테크',
  UNGM: 'UNGM 등록',
  SAM: 'SAM.gov 등록',
} as const

// ============================================================================
// 구조 메트릭스 (슈퍼모델 v4.0 기반)
// ============================================================================

export const STRUCTURE_METRICS = {
  industryBlocks: 12,
  enginePresets: 6,
  terminologyMappings: '600+',
  templates: '50+',
  governmentAgencies: 8,
} as const

// ============================================================================
// 디스플레이 메트릭스 (UI 컴포넌트용 i18n 지원)
// ============================================================================

export const DISPLAY_METRICS = {
  timeSaved: {
    value: '93.8%',
    label: '시간 단축',
    labelEn: 'Time Saved',
    detail: '8시간 → 30분',
    detailEn: '8h → 30min',
  },
  rejectionReduction: {
    value: '91%',
    label: '반려율 감소',
    labelEn: 'Rejection Reduction',
    detail: '인건비 95% 절감',
    detailEn: '95% labor cost saved',
  },
  docSpeed: {
    value: '45초/건',
    valueEn: '45s/doc',
    label: '문서 생성 속도',
    labelEn: 'Doc Generation Speed',
    detail: 'API 기준',
    detailEn: 'API-based',
  },
  apiUptime: {
    value: '99.9%',
    label: 'API 가용성',
    labelEn: 'API Uptime',
    detail: 'SLA 보장',
    detailEn: 'SLA guaranteed',
  },
  termAccuracy: {
    value: '99.2%',
    label: '용어 매핑 정확도',
    labelEn: 'Term Mapping Accuracy',
    detail: '도메인 엔진',
    detailEn: 'Domain Engine',
  },
  globalTenders: {
    value: '630,000+',
    label: '글로벌 입찰 DB',
    labelEn: 'Global Tender DB',
    detail: 'SAM.gov, UNGM 등',
    detailEn: 'SAM.gov, UNGM, etc.',
  },
} as const

export type DisplayMetricKey = keyof typeof DISPLAY_METRICS

// Hero 섹션용 stats 배열 헬퍼
export const getHeroStats = () => [
  { value: DISPLAY_METRICS.timeSaved.value, label: DISPLAY_METRICS.timeSaved.label },
  { value: DISPLAY_METRICS.rejectionReduction.value, label: DISPLAY_METRICS.rejectionReduction.label },
  { value: DISPLAY_METRICS.docSpeed.value, label: DISPLAY_METRICS.docSpeed.label },
  { value: DISPLAY_METRICS.apiUptime.value, label: DISPLAY_METRICS.apiUptime.label },
]

// CTA 섹션용 stats 배열 헬퍼
export const getCTAStats = () => [
  { value: DISPLAY_METRICS.timeSaved.value, label: DISPLAY_METRICS.timeSaved.label, detail: DISPLAY_METRICS.timeSaved.detail },
  { value: DISPLAY_METRICS.termAccuracy.value, label: DISPLAY_METRICS.termAccuracy.label, detail: DISPLAY_METRICS.termAccuracy.detail },
  { value: DISPLAY_METRICS.globalTenders.value, label: DISPLAY_METRICS.globalTenders.label, detail: DISPLAY_METRICS.globalTenders.detail },
]
