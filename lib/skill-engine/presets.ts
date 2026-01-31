/**
 * QETTA Domain Engine Presets
 *
 * 6 predefined BLOCK combinations mapping to EnginePresetType.
 * "Select BLOCKs. Build Intelligence."
 *
 * @example
 * ```ts
 * import { EnginePreset } from './core/domain-engine'
 * import { PRESETS, getPresetBlocks } from './presets'
 *
 * const engine = new EnginePreset()
 * engine.load(PRESETS.MANUFACTURING) // 4 BLOCKs → 제조 전문
 * engine.load(PRESETS.FINANCE)       // 12 BLOCKs → 금융 범용
 * engine.load(getPresetBlocks('ENVIRONMENT')) // 3 BLOCKs
 * ```
 */

import type { EnginePresetType } from '@/types/inbox'
import type { IndustryBlockType } from '@/lib/super-model'
import { ALL_BLOCK_IDS } from './blocks/types'
import { DISPLAY_METRICS } from '@/constants/metrics'

// ============================================
// Preset Definitions
// ============================================

/**
 * PRESETS - v2.1 (10개 블록 기반)
 *
 * 각 EnginePreset에 해당하는 Industry Block 매핑
 */
export const PRESETS: Record<EnginePresetType, IndustryBlockType[]> = {
  /** 제조/스마트공장 — 4 BLOCKs (중기부/산업부) */
  MANUFACTURING: ['AUTOMOTIVE', 'ELECTRONICS', 'MACHINERY', 'METAL'],

  /** 환경/TMS — 2 BLOCKs (환경부) */
  ENVIRONMENT: ['ENVIRONMENT', 'CHEMICAL'],

  /** AI/SW 바우처 — 4 BLOCKs (과기정통부/NIPA) */
  DIGITAL: ['ELECTRONICS', 'BIO_PHARMA', 'FOOD', 'TEXTILE'],

  /** 융자/보증 — 전 산업 (중기부/금융위) */
  FINANCE: [...ALL_BLOCK_IDS],

  /** 창업지원 — 전 산업 (중기부/창업진흥원) */
  STARTUP: [...ALL_BLOCK_IDS],

  /** 수출/글로벌 — 전 산업 (KOTRA/산업부) */
  EXPORT: [...ALL_BLOCK_IDS],
} as const

// ============================================
// Preset Metadata
// ============================================

export interface PresetInfo {
  id: EnginePresetType
  name: string
  nameKo: string
  blockCount: number
  blockIds: IndustryBlockType[]
  ministry: string
  color: string
  description: string
}

/**
 * PRESET_INFO - v2.1
 *
 * 각 프리셋에 대한 메타데이터
 */
export const PRESET_INFO: Record<EnginePresetType, PresetInfo> = {
  MANUFACTURING: {
    id: 'MANUFACTURING',
    name: 'Manufacturing',
    nameKo: '제조/스마트공장',
    blockCount: 4,
    blockIds: [...PRESETS.MANUFACTURING],
    ministry: '중기부/산업부',
    color: 'blue',
    description: 'MES, PLC, OEE 기반 정산보고서 자동화',
  },
  ENVIRONMENT: {
    id: 'ENVIRONMENT',
    name: 'Environment',
    nameKo: '환경/TMS',
    blockCount: 2,
    blockIds: [...PRESETS.ENVIRONMENT],
    ministry: '환경부',
    color: 'emerald',
    description: 'NOx, SOx, PM 배출 모니터링 및 보고',
  },
  DIGITAL: {
    id: 'DIGITAL',
    name: 'Digital',
    nameKo: 'AI/SW 바우처',
    blockCount: 4,
    blockIds: [...PRESETS.DIGITAL],
    ministry: '과기정통부/NIPA',
    color: 'violet',
    description: 'AI 바우처 공급/수요기업 매칭 및 정산',
  },
  FINANCE: {
    id: 'FINANCE',
    name: 'Finance',
    nameKo: '융자/보증',
    blockCount: ALL_BLOCK_IDS.length,
    blockIds: [...ALL_BLOCK_IDS],
    ministry: '중기부/금융위',
    color: 'indigo',
    description: '기보/신보/소진공 융자 및 보증 신청 자동화',
  },
  STARTUP: {
    id: 'STARTUP',
    name: 'Startup',
    nameKo: '창업지원',
    blockCount: ALL_BLOCK_IDS.length,
    blockIds: [...ALL_BLOCK_IDS],
    ministry: '중기부/창업진흥원',
    color: 'fuchsia',
    description: 'TIPS, 예비창업패키지, IR덱 자동 생성',
  },
  EXPORT: {
    id: 'EXPORT',
    name: 'Export',
    nameKo: '수출/글로벌',
    blockCount: ALL_BLOCK_IDS.length,
    blockIds: [...ALL_BLOCK_IDS],
    ministry: 'KOTRA/산업부',
    color: 'amber',
    description: `SAM.gov, UNGM ${DISPLAY_METRICS.globalTenders.value} 글로벌 입찰 매칭`,
  },
}

// ============================================
// Helper Functions
// ============================================

/** Get BLOCK IDs for a preset. */
export function getPresetBlocks(preset: EnginePresetType): IndustryBlockType[] {
  return [...PRESETS[preset]]
}

/** Get preset info by ID. */
export function getPresetInfo(preset: EnginePresetType): PresetInfo {
  return PRESET_INFO[preset]
}

/** Find which presets contain a specific BLOCK. */
export function findPresetsForBlock(blockId: IndustryBlockType): EnginePresetType[] {
  return (Object.entries(PRESETS) as [EnginePresetType, readonly IndustryBlockType[]][])
    .filter(([, blocks]) => blocks.includes(blockId))
    .map(([id]) => id)
}

/** Get all preset IDs. */
export function getAllPresetIds(): EnginePresetType[] {
  return Object.keys(PRESETS) as EnginePresetType[]
}
