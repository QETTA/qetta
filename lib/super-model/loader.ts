/**
 * QETTA Super-Model v4.0 Loader
 *
 * Single Source of Truth for all QETTA business data
 * @see data/qetta-super-model.json
 */

import superModelData from '@/data/qetta-super-model.json'

// Export raw data
export const SUPER_MODEL = superModelData

// ============================================
// Core Metrics (6개)
// ============================================

export interface CoreMetrics {
  timeReduction: string
  rejectionReduction: string
  generationSpeed: string
  apiUptime: string
  accuracy: string
  globalTenderDB: string
}

export function getMetrics(): CoreMetrics {
  return {
    timeReduction: '93.8%',
    rejectionReduction: '91%',
    generationSpeed: '45초/건',
    apiUptime: '99.9%',
    accuracy: '99.2%',
    globalTenderDB: '630,000+',
  }
}

// Constant export for backward compatibility
export const QETTA_METRICS = {
  TIME_REDUCTION: '93.8%',
  REJECTION_REDUCTION: '91%',
  GENERATION_SPEED: '45초/건',
  API_UPTIME: '99.9%',
  ACCURACY: '99.2%',
  GLOBAL_TENDER_DB: '630,000+',
} as const

// ============================================
// Engine Presets (6개)
// ============================================

// 6 v4.0 Engine Presets (1 EnginePreset × 12 BLOCKs × 6 Presets)
export type EnginePresetType =
  | 'MANUFACTURING'
  | 'ENVIRONMENT'
  | 'DIGITAL'
  | 'FINANCE'
  | 'STARTUP'
  | 'EXPORT'

export interface EnginePreset {
  id: string
  name: string
  color: string
  description: string
  industryBlocks: string[]
  templates: string[]
  regulatoryBody: string
}

export function getEnginePresets(): EnginePreset[] {
  return [
    {
      id: 'MANUFACTURING',
      name: '제조/스마트공장',
      color: 'blue',
      description: '중기부 스마트공장 정산보고서. MES, PLC, OEE.',
      industryBlocks: ['AUTOMOTIVE', 'ELECTRONICS', 'MACHINERY', 'METAL'],
      templates: ['MES 정산보고서', 'PLC 데이터 수집 양식', 'OEE 계산 보고서', '4M1E 분석서'],
      regulatoryBody: '중기부, 산업부',
    },
    {
      id: 'ENVIRONMENT',
      name: '환경/TMS',
      color: 'emerald',
      description: '환경부 TMS 일일보고서. NOx, SOx, PM.',
      industryBlocks: ['ENVIRONMENT', 'CHEMICAL'],
      templates: ['TMS 일일보고서', 'NOx/SOx 배출량', '탄소중립 실적', 'CleanSYS 연동'],
      regulatoryBody: '환경부',
    },
    {
      id: 'DIGITAL',
      name: 'AI/SW 바우처',
      color: 'violet',
      description: 'NIPA AI바우처 공급기업 정산.',
      industryBlocks: ['ELECTRONICS', 'BIO_PHARMA', 'FOOD', 'TEXTILE'],
      templates: ['공급기업 등록서', '수요기업 계약서', '실적보고서', '정산서류'],
      regulatoryBody: '과기정통부, NIPA',
    },
    {
      id: 'FINANCE',
      name: '융자/보증',
      color: 'indigo',
      description: '중기부/금융위 융자 및 보증 지원 신청.',
      industryBlocks: ['ALL'],
      templates: ['기보 신청서', '신보 보증서', '정책자금 계획서', '기술평가서', '사업성 평가서'],
      regulatoryBody: '중기부, 기보, 신보',
    },
    {
      id: 'STARTUP',
      name: '창업지원',
      color: 'fuchsia',
      description: '중기부 TIPS, 액셀러레이팅 프로그램.',
      industryBlocks: ['ALL'],
      templates: ['TIPS 사업계획서', 'IR 덱', '예비창업패키지', '초기창업패키지', '스케일업 계획서'],
      regulatoryBody: '중기부, 창업진흥원',
    },
    {
      id: 'EXPORT',
      name: '수출/글로벌',
      color: 'amber',
      description: '해외 입찰 (SAM.gov, UNGM, Goszakup). 63만+ DB.',
      industryBlocks: ['ALL'],
      templates: ['SAM.gov 제안서', 'UNGM 입찰서', 'Goszakup RFP', 'KOTRA 지원서', '수출바우처'],
      regulatoryBody: 'KOTRA, 산업부',
    },
  ]
}

// Constant export
export const ENGINE_PRESETS = getEnginePresets()

// ============================================
// Industry BLOCKs (10개) - v2.1 KSIC 기반
// ============================================

/**
 * v2.1 Industry Block Types (10개)
 *
 * KSIC(한국표준산업분류) 기반 재설계
 * - v2.0에서 삭제: SEMICONDUCTOR→ELECTRONICS, ENERGY→ENVIRONMENT,
 *   HEALTHCARE→BIO_PHARMA, AUTONOMOUS, LOGISTICS, CONSTRUCTION
 * - v2.1에서 추가: FOOD, TEXTILE, METAL, GENERAL
 */
export type IndustryBlockType =
  | 'FOOD'        // 식품/음료 (KSIC 10, 11)
  | 'TEXTILE'     // 섬유/의류 (KSIC 13, 14)
  | 'METAL'       // 금속/철강 (KSIC 24, 25)
  | 'CHEMICAL'    // 화학/소재 (KSIC 20, 22)
  | 'ELECTRONICS' // 전자/반도체 (KSIC 26, 27) - SEMICONDUCTOR 흡수
  | 'MACHINERY'   // 기계/장비 (KSIC 28, 29)
  | 'AUTOMOTIVE'  // 자동차/부품 (KSIC 30)
  | 'BIO_PHARMA'  // 바이오/제약 (KSIC 21) - HEALTHCARE 흡수
  | 'ENVIRONMENT' // 환경/에너지 (KSIC 35, 38) - ENERGY 흡수
  | 'GENERAL'     // 일반제조 (기타)

export interface IndustryBlock {
  id: string
  name: string
  category: string
  description: string
  templates: string[]
  keywords: string[]
  regulatoryBodies: string[]
  color: string
}

export function getIndustryBlocks(): IndustryBlock[] {
  return [
    // v2.1 KSIC 기반 10개 블록
    {
      id: 'FOOD',
      name: '식품/음료',
      category: 'manufacturing',
      description: '식품 제조 및 가공. HACCP, GMP, 콜드체인.',
      templates: ['HACCP 적합성 보고서', '식품안전 자가점검표', '콜드체인 온도 이력'],
      keywords: ['HACCP', 'GMP', '콜드체인', '식품안전', 'KSIC 10-11'],
      regulatoryBodies: ['식약처', '농림축산식품부'],
      color: 'orange',
    },
    {
      id: 'TEXTILE',
      name: '섬유/의류',
      category: 'manufacturing',
      description: '섬유 제조, 의류 생산. 원단 LOT 관리.',
      templates: ['원단 LOT 추적 보고서', '염색 레시피 관리', '봉제 공정 보고서'],
      keywords: ['원단 LOT', '염색 레시피', '봉제', '패턴', 'KSIC 13-14'],
      regulatoryBodies: ['산업부', '환경부'],
      color: 'pink',
    },
    {
      id: 'METAL',
      name: '금속/철강',
      category: 'manufacturing',
      description: '금속 제조, 철강 가공. 열처리, 도금.',
      templates: ['열처리 공정 보고서', '도금 품질 보고서', '금형 관리 대장'],
      keywords: ['열처리', '도금', '금형', '프레스', 'KSIC 24-25'],
      regulatoryBodies: ['산업부', '환경부', '안전보건공단'],
      color: 'slate',
    },
    {
      id: 'CHEMICAL',
      name: '화학/소재',
      category: 'manufacturing',
      description: '화학 제품, 소재 제조. MSDS, PSM.',
      templates: ['MSDS 제출서', '화학물질 배출량 보고서', '위험물 저장 일지'],
      keywords: ['배합비', 'MSDS', 'PSM', 'VOC', 'KSIC 20-22'],
      regulatoryBodies: ['환경부', '산업부', '안전보건공단'],
      color: 'amber',
    },
    {
      id: 'ELECTRONICS',
      name: '전자/반도체',
      category: 'manufacturing',
      description: '전자 제품, 반도체 제조. PCB, SMT, FAB 공정.',
      templates: ['SMT 실적 보고서', 'FAB 공정 일지', '클린룸 환경 보고서', '수율 분석 보고서'],
      keywords: ['PCB', 'SMT', '클린룸', 'Wafer', 'FAB', '수율', 'KSIC 26-27'],
      regulatoryBodies: ['산업부', '환경부', '전파연구원', '특허청'],
      color: 'cyan',
    },
    {
      id: 'MACHINERY',
      name: '기계/장비',
      category: 'manufacturing',
      description: '기계 제조, 장비 생산. CNC, PLC, 4M1E.',
      templates: ['4M1E 분석 보고서', '설비 점검 일지', 'CNC 가공 보고서'],
      keywords: ['CNC', 'PLC', '공차', '4M1E', 'KSIC 28-29'],
      regulatoryBodies: ['중기부', '산업부', '안전보건공단'],
      color: 'blue',
    },
    {
      id: 'AUTOMOTIVE',
      name: '자동차/부품',
      category: 'manufacturing',
      description: '완성차 및 부품 제조. IATF 16949, PPAP.',
      templates: ['MES 정산보고서', '공정 품질 보고서', 'IATF 인증 신청서', 'PPAP 제출서'],
      keywords: ['IATF 16949', 'PPAP', 'JIT', 'Tier 1/2/3', 'KSIC 30'],
      regulatoryBodies: ['산업부', '환경부', '자동차안전연구원'],
      color: 'indigo',
    },
    {
      id: 'BIO_PHARMA',
      name: '바이오/제약',
      category: 'healthcare',
      description: '의약품, 백신, 바이오 제조. GMP, 임상시험.',
      templates: ['GMP 적합성 보고서', '임상시험 계획서', 'KFDA 신청서', '의료기기 임상시험 보고서'],
      keywords: ['GMP', 'cGMP', '밸리데이션', '임상', 'KFDA', 'KSIC 21'],
      regulatoryBodies: ['식약처', '복지부', '질병청'],
      color: 'rose',
    },
    {
      id: 'ENVIRONMENT',
      name: '환경/에너지',
      category: 'energyEnvironment',
      description: '환경 모니터링, 에너지 관리. TMS, ESS, 탄소중립.',
      templates: ['TMS 일일보고서', '월간 배출량 집계', 'ESS 운영 일지', '탄소중립 실적 보고서'],
      keywords: ['TMS', '탄소중립', 'NOx', 'SOx', 'PM', 'ESS', 'REC', 'KSIC 35-38'],
      regulatoryBodies: ['환경부', '산업부', '지방환경청', '전력거래소'],
      color: 'emerald',
    },
    {
      id: 'GENERAL',
      name: '일반제조',
      category: 'manufacturing',
      description: '일반 제조업. 4M1E, 생산성, OEE.',
      templates: ['4M1E 분석 보고서', '생산성 보고서', 'OEE 계산 보고서'],
      keywords: ['4M1E', '생산성', 'OEE', '품질관리'],
      regulatoryBodies: ['중기부', '산업부'],
      color: 'gray',
    },
  ]
}

// ============================================
// Color Mapping Utilities
// ============================================

/**
 * v2.1 Industry Block Colors (10개)
 * Tailwind CSS 기반 색상 정의
 */
export const INDUSTRY_BLOCK_COLORS = {
  FOOD: 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20',
  TEXTILE: 'bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/20',
  METAL: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20',
  CHEMICAL: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  ELECTRONICS: 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20',
  MACHINERY: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  AUTOMOTIVE: 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20',
  BIO_PHARMA: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20',
  ENVIRONMENT: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  GENERAL: 'bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20',
} as const

export const ENGINE_PRESET_COLORS = {
  MANUFACTURING: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  ENVIRONMENT: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  DIGITAL: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
  FINANCE: 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20',
  STARTUP: 'bg-fuchsia-500/10 text-fuchsia-400 ring-1 ring-fuchsia-500/20',
  EXPORT: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
} as const
