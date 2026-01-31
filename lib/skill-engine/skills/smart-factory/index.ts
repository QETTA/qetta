/**
 * @deprecated v4.0 — Use `EnginePreset` + `PRESETS.MANUFACTURING` from `@/lib/skill-engine`.
 *
 * QETTA Smart Factory Domain Skills
 *
 * 중기부 스마트공장 도메인
 *
 * 출력물:
 * - MES 기반 정산 보고서
 * - OEE 분석 리포트
 * - 4M1E 변경점 기록
 * - 설비 이력 보고서
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
import { logger } from '@/lib/api/logger'

// ============================================
// Smart Factory Terminology (핵심 용어집)
// ============================================

export const SMART_FACTORY_TERMINOLOGY = {
  // 시스템
  systems: {
    MES: {
      korean: '생산실행시스템',
      english: 'Manufacturing Execution System',
      description: '생산 현장의 실시간 모니터링 및 제어 시스템',
    },
    PLC: {
      korean: '프로그래머블 로직 컨트롤러',
      english: 'Programmable Logic Controller',
      description: '산업용 제어 장치',
    },
    OPCUA: {
      korean: 'OPC 통합 아키텍처',
      english: 'Open Platform Communications Unified Architecture',
      description: '산업 자동화 데이터 교환 프로토콜',
    },
    SCADA: {
      korean: '원격감시제어시스템',
      english: 'Supervisory Control and Data Acquisition',
      description: '대규모 시설 원격 감시 및 제어',
    },
    ERP: {
      korean: '전사적자원관리',
      english: 'Enterprise Resource Planning',
      description: '기업 전체 자원 통합 관리 시스템',
    },
  },

  // OEE 지표
  oee: {
    availability: {
      korean: '가동률',
      english: 'Availability',
      description: '계획 운전시간 대비 실제 운전시간',
      formula: '(운전시간 - 정지시간) / 계획시간 × 100%',
      worldClass: 90, // 세계적 수준 (%)
    },
    performance: {
      korean: '성능효율',
      english: 'Performance',
      description: '이론 사이클타임 대비 실제 생산량',
      formula: '(이론 사이클타임 × 생산량) / 운전시간 × 100%',
      worldClass: 95,
    },
    quality: {
      korean: '품질률',
      english: 'Quality',
      description: '양품 비율',
      formula: '양품수 / 총생산수 × 100%',
      worldClass: 99.9,
    },
    oee: {
      korean: '설비종합효율',
      english: 'Overall Equipment Effectiveness',
      description: '가동률 × 성능효율 × 품질률',
      formula: 'Availability × Performance × Quality',
      worldClass: 85,
    },
  },

  // 4M1E
  fourM1E: {
    man: {
      korean: '작업자',
      english: 'Man',
      description: '작업자 변경, 교육, 숙련도',
      changeFactors: ['신규 배치', '교대 변경', '교육 완료', '자격 취득'],
    },
    machine: {
      korean: '설비',
      english: 'Machine',
      description: '설비 변경, 정비, 개조',
      changeFactors: ['신규 도입', '부품 교체', '정기 점검', '이상 발생'],
    },
    material: {
      korean: '재료',
      english: 'Material',
      description: '원자재 변경, 공급처 변경',
      changeFactors: ['공급처 변경', '규격 변경', '신규 재료', 'LOT 변경'],
    },
    method: {
      korean: '방법',
      english: 'Method',
      description: '작업 방법, 공정 변경',
      changeFactors: ['작업표준 개정', '공정 변경', '툴 변경', '조건 변경'],
    },
    environment: {
      korean: '환경',
      english: 'Environment',
      description: '작업 환경 변화',
      changeFactors: ['온습도 변화', '청정도 변화', '조명 변경', '레이아웃 변경'],
    },
  },

  // 스마트공장 수준
  levels: {
    basic: {
      korean: '기초',
      english: 'Basic',
      description: '생산 이력 추적 가능 (레벨 1)',
      criteria: ['바코드/QR 도입', '생산 실적 전산화', '품질 데이터 수집'],
    },
    intermediate1: {
      korean: '중간1',
      english: 'Intermediate 1',
      description: '실시간 모니터링 (레벨 2)',
      criteria: ['실시간 공정 모니터링', 'MES 도입', '설비 연동'],
    },
    intermediate2: {
      korean: '중간2',
      english: 'Intermediate 2',
      description: '자동 제어 (레벨 3)',
      criteria: ['자동 품질 검사', 'PLC 연동', '이상 감지 알림'],
    },
    advanced: {
      korean: '고도화',
      english: 'Advanced',
      description: 'AI 기반 최적화 (레벨 4)',
      criteria: ['AI 불량 예측', '자율 운영', '디지털 트윈'],
    },
  },

  // 문서 양식
  documents: {
    settlementReport: {
      korean: '정산 보고서',
      english: 'Settlement Report',
      format: 'HWP',
      sections: ['사업 개요', '추진 실적', '비용 집행 내역', '성과 지표', '증빙 자료'],
    },
    oeeReport: {
      korean: 'OEE 분석 리포트',
      english: 'OEE Analysis Report',
      format: 'XLSX',
      sections: ['설비별 OEE', '시간대별 추이', '손실 분석', '개선 과제'],
    },
    changeRecord: {
      korean: '4M1E 변경점 기록',
      english: '4M1E Change Record',
      format: 'HWP',
      sections: ['변경 일시', '변경 유형', '변경 내용', '영향 분석', '승인 이력'],
    },
    equipmentHistory: {
      korean: '설비 이력 보고서',
      english: 'Equipment History Report',
      format: 'HWP',
      sections: ['설비 정보', '정비 이력', '고장 이력', '부품 교체 이력'],
    },
  },
} as const

// ============================================
// Smart Factory Document Templates
// ============================================

export const SMART_FACTORY_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'sf-settlement-report',
    name: '스마트공장 정산 보고서',
    domain: 'MANUFACTURING',
    sections: [
      '1. 사업 개요',
      '  1.1 사업 목표',
      '  1.2 추진 기간',
      '  1.3 참여 기업',
      '2. 추진 실적',
      '  2.1 도입 시스템',
      '  2.2 구축 현황',
      '  2.3 스마트공장 수준 달성',
      '3. 비용 집행 내역',
      '  3.1 구분별 집행 현황',
      '  3.2 정부 지원금 사용 내역',
      '  3.3 자부담금 사용 내역',
      '4. 성과 지표',
      '  4.1 OEE 향상',
      '  4.2 불량률 감소',
      '  4.3 생산성 향상',
      '5. 증빙 자료 목록',
    ],
    estimatedGenerationTime: 120,
  },
  {
    id: 'sf-oee-report',
    name: 'OEE 분석 리포트',
    domain: 'MANUFACTURING',
    sections: [
      '1. 요약 (Executive Summary)',
      '2. 설비별 OEE 현황',
      '  2.1 가동률 (Availability)',
      '  2.2 성능효율 (Performance)',
      '  2.3 품질률 (Quality)',
      '  2.4 종합 OEE',
      '3. 시간대별 추이 분석',
      '  3.1 일별 추이',
      '  3.2 주간 패턴',
      '  3.3 이상 구간 분석',
      '4. 6대 손실 분석',
      '  4.1 고장 손실',
      '  4.2 셋업/조정 손실',
      '  4.3 공회전/순간정지 손실',
      '  4.4 속도 저하 손실',
      '  4.5 불량/재작업 손실',
      '  4.6 수율 손실',
      '5. 개선 과제',
    ],
    estimatedGenerationTime: 90,
  },
  {
    id: 'sf-4m1e-record',
    name: '4M1E 변경점 기록',
    domain: 'MANUFACTURING',
    sections: [
      '변경 일시',
      '변경 유형 (Man/Machine/Material/Method/Environment)',
      '변경 전 상태',
      '변경 후 상태',
      '변경 사유',
      '영향 범위',
      '품질 영향 분석',
      '검증 결과',
      '승인자',
    ],
    estimatedGenerationTime: 30,
  },
  {
    id: 'sf-equipment-history',
    name: '설비 이력 보고서',
    domain: 'MANUFACTURING',
    sections: [
      '1. 설비 기본 정보',
      '2. 정비 이력',
      '  2.1 예방 정비',
      '  2.2 사후 정비',
      '  2.3 개량 정비',
      '3. 고장 이력',
      '  3.1 고장 유형 분류',
      '  3.2 MTBF/MTTR 분석',
      '4. 부품 교체 이력',
      '5. 성능 추이',
    ],
    estimatedGenerationTime: 60,
  },
]

// ============================================
// Smart Factory Skills Definition
// ============================================

export const SMART_FACTORY_SKILLS: DocumentSkill[] = [
  {
    id: 'sf-settlement-report',
    name: 'Settlement Report Generator',
    nameKo: '스마트공장 정산 보고서 생성',
    category: 'document_generation',
    description: 'Generate settlement report for smart factory government support program',
    version: '1.0.0',
    domains: ['MANUFACTURING'],
    requiredPromptTokens: 15000,
    outputFormats: ['HWP', 'DOCX', 'PDF'],
    templates: [SMART_FACTORY_TEMPLATES[0]],
  },
  {
    id: 'sf-oee-analysis',
    name: 'OEE Analysis Report',
    nameKo: 'OEE 분석 리포트 생성',
    category: 'document_generation',
    description: 'Generate OEE analysis report with loss analysis',
    version: '1.0.0',
    domains: ['MANUFACTURING'],
    requiredPromptTokens: 12000,
    outputFormats: ['XLSX', 'PDF'],
    templates: [SMART_FACTORY_TEMPLATES[1]],
  },
  {
    id: 'sf-4m1e-tracking',
    name: '4M1E Change Tracker',
    nameKo: '4M1E 변경점 추적',
    category: 'document_generation',
    description: 'Track and document 4M1E changes for quality management',
    version: '1.0.0',
    domains: ['MANUFACTURING'],
    requiredPromptTokens: 6000,
    outputFormats: ['HWP', 'XLSX'],
    templates: [SMART_FACTORY_TEMPLATES[2]],
  },
]

// ============================================
// Smart Factory Utility Skills (Non-Document)
// ============================================

/**
 * MES 데이터 파서 유틸리티
 * 문서 생성이 아닌 데이터 처리 스킬 (BaseSkill 타입)
 */
export const SMART_FACTORY_UTILITY_SKILLS: BaseSkill[] = [
  {
    id: 'sf-mes-parser',
    name: 'MES Data Parser',
    nameKo: 'MES 데이터 파싱',
    category: 'verification', // 데이터 검증/처리
    description: 'Parse and normalize MES data from various formats',
    version: '1.0.0',
    domains: ['MANUFACTURING'],
    requiredPromptTokens: 4000,
  },
]

// ============================================
// Smart Factory Skill Package
// ============================================

export const SMART_FACTORY_SKILL_PACKAGE: SkillPackage = {
  id: 'pkg-smart-factory-complete',
  name: 'Smart Factory Complete Package',
  nameKo: '스마트공장 완전 패키지',
  description: '중기부 스마트공장 지원사업 모든 보고서 생성 및 MES 연동',
  skills: SMART_FACTORY_SKILLS.map((s) => s.id),
  domain: 'MANUFACTURING',
  tier: 'domain',
  estimatedCost: {
    perDocument: 0.18,
    perMonth: 54,
    cacheEfficiency: 88,
  },
  metadata: {
    createdAt: '2026-01-24',
    updatedAt: '2026-01-24',
    usageCount: 0,
    rating: 0,
  },
}

// ============================================
// OEE Calculation Engine
// ============================================

export interface OEEInput {
  /** 설비 ID */
  equipmentId: string
  /** 설비명 */
  equipmentName: string
  /** 측정 기간 */
  period: {
    start: Date
    end: Date
  }
  /** 계획 운전시간 (분) */
  plannedTime: number
  /** 실제 운전시간 (분) */
  operatingTime: number
  /** 정지시간 (분) */
  downtime: number
  /** 이론 사이클타임 (초/개) */
  idealCycleTime: number
  /** 총 생산수량 */
  totalProduced: number
  /** 양품수량 */
  goodProducts: number
}

export interface OEEResult {
  equipmentId: string
  equipmentName: string
  period: {
    start: Date
    end: Date
  }
  availability: number
  performance: number
  quality: number
  oee: number
  worldClassComparison: {
    availability: 'below' | 'meets' | 'exceeds'
    performance: 'below' | 'meets' | 'exceeds'
    quality: 'below' | 'meets' | 'exceeds'
    oee: 'below' | 'meets' | 'exceeds'
  }
  sixLosses: {
    breakdownLoss: number
    setupLoss: number
    idlingLoss: number
    speedLoss: number
    defectLoss: number
    yieldLoss: number
  }
}

/**
 * OEE 계산
 *
 * OEE = 가동률 × 성능효율 × 품질률
 * - 가동률 = (계획시간 - 정지시간) / 계획시간
 * - 성능효율 = (이론 사이클타임 × 생산량) / 운전시간
 * - 품질률 = 양품수 / 총생산수
 */
export function calculateOEE(input: OEEInput): OEEResult {
  const { plannedTime, operatingTime, downtime, idealCycleTime, totalProduced, goodProducts } = input

  // 가동률 계산 (%)
  const availability = ((plannedTime - downtime) / plannedTime) * 100

  // 성능효율 계산 (%)
  // 운전시간을 초로 변환하여 계산
  const operatingTimeSeconds = operatingTime * 60
  const performance = ((idealCycleTime * totalProduced) / operatingTimeSeconds) * 100

  // 품질률 계산 (%)
  const quality = totalProduced > 0 ? (goodProducts / totalProduced) * 100 : 100

  // OEE 계산 (%)
  const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100

  // 세계적 수준 비교
  const worldClassComparison = {
    availability: compareToWorldClass(availability, SMART_FACTORY_TERMINOLOGY.oee.availability.worldClass),
    performance: compareToWorldClass(performance, SMART_FACTORY_TERMINOLOGY.oee.performance.worldClass),
    quality: compareToWorldClass(quality, SMART_FACTORY_TERMINOLOGY.oee.quality.worldClass),
    oee: compareToWorldClass(oee, SMART_FACTORY_TERMINOLOGY.oee.oee.worldClass),
  }

  // 6대 손실 계산 (분 단위)
  const defectProducts = totalProduced - goodProducts
  const sixLosses = {
    breakdownLoss: downtime * 0.4, // 고장 손실 (예시: 정지시간의 40%)
    setupLoss: downtime * 0.3, // 셋업 손실 (예시: 정지시간의 30%)
    idlingLoss: downtime * 0.15, // 공회전 손실
    speedLoss: downtime * 0.15, // 속도 저하 손실
    defectLoss: (idealCycleTime * defectProducts) / 60, // 불량 손실 (분)
    yieldLoss: 0, // 수율 손실 (별도 계산 필요)
  }

  return {
    equipmentId: input.equipmentId,
    equipmentName: input.equipmentName,
    period: input.period,
    availability: Math.round(availability * 100) / 100,
    performance: Math.round(performance * 100) / 100,
    quality: Math.round(quality * 100) / 100,
    oee: Math.round(oee * 100) / 100,
    worldClassComparison,
    sixLosses,
  }
}

function compareToWorldClass(value: number, worldClass: number): 'below' | 'meets' | 'exceeds' {
  if (value >= worldClass * 1.05) return 'exceeds'
  if (value >= worldClass * 0.95) return 'meets'
  return 'below'
}

// ============================================
// MES Data Parser
// ============================================

export interface MESRawData {
  /** 데이터 소스 */
  source: 'csv' | 'json' | 'xml' | 'opcua'
  /** 원본 데이터 */
  rawContent: string | object
  /** 설비 ID 매핑 */
  equipmentIdField?: string
  /** 타임스탬프 필드 */
  timestampField?: string
  /** 생산수량 필드 */
  productionField?: string
  /** 품질 필드 */
  qualityField?: string
}

export interface MESParsedData {
  timestamp: Date
  equipmentId: string
  productionCount: number
  goodCount: number
  defectCount: number
  cycleTime: number
  status: 'running' | 'idle' | 'breakdown' | 'setup'
  parameters: Record<string, number | string>
}

/**
 * MES 데이터 파싱
 *
 * 다양한 형식의 MES 데이터를 표준화된 형식으로 변환
 */
export function parseMESData(input: MESRawData): MESParsedData[] {
  const results: MESParsedData[] = []

  switch (input.source) {
    case 'json':
      return parseMESJSON(input)
    case 'csv':
      return parseMESCSV(input)
    case 'xml':
      return parseMESXML(input)
    case 'opcua':
      return parseMESOPCUA(input)
    default:
      throw new Error(`Unsupported MES data source: ${input.source}`)
  }

  return results
}

function parseMESJSON(input: MESRawData): MESParsedData[] {
  const data = typeof input.rawContent === 'string' ? JSON.parse(input.rawContent) : input.rawContent

  if (!Array.isArray(data)) {
    throw new Error('JSON data must be an array')
  }

  return data.map((item: Record<string, unknown>) => ({
    timestamp: new Date(item[input.timestampField || 'timestamp'] as string),
    equipmentId: String(item[input.equipmentIdField || 'equipment_id']),
    productionCount: Number(item[input.productionField || 'production_count'] || 0),
    goodCount: Number(item['good_count'] || item[input.productionField || 'production_count'] || 0),
    defectCount: Number(item['defect_count'] || 0),
    cycleTime: Number(item['cycle_time'] || 0),
    status: mapMESStatus(item['status']),
    parameters: extractParameters(item),
  }))
}

function parseMESCSV(input: MESRawData): MESParsedData[] {
  if (typeof input.rawContent !== 'string') {
    throw new Error('CSV data must be a string')
  }

  const lines = input.rawContent.trim().split('\n')
  if (lines.length < 2) {
    return []
  }

  const headers = lines[0].split(',').map((h) => h.trim())
  const results: MESParsedData[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || ''
    })

    results.push({
      timestamp: new Date(row[input.timestampField || 'timestamp']),
      equipmentId: row[input.equipmentIdField || 'equipment_id'],
      productionCount: Number(row[input.productionField || 'production_count'] || 0),
      goodCount: Number(row['good_count'] || row[input.productionField || 'production_count'] || 0),
      defectCount: Number(row['defect_count'] || 0),
      cycleTime: Number(row['cycle_time'] || 0),
      status: mapMESStatus(row['status']),
      parameters: {},
    })
  }

  return results
}

function parseMESXML(_input: MESRawData): MESParsedData[] {
  // XML 파싱은 실제 구현 시 xml2js 등의 라이브러리 사용
  logger.warn('XML parsing requires xml2js library - returning empty array')
  return []
}

function parseMESOPCUA(_input: MESRawData): MESParsedData[] {
  // OPC-UA 파싱은 실제 구현 시 node-opcua 라이브러리 사용
  logger.warn('OPC-UA parsing requires node-opcua library - returning empty array')
  return []
}

function mapMESStatus(status: unknown): 'running' | 'idle' | 'breakdown' | 'setup' {
  const statusStr = String(status).toLowerCase()
  if (statusStr.includes('run') || statusStr === '1' || statusStr === 'on') return 'running'
  if (statusStr.includes('idle') || statusStr === '0' || statusStr === 'standby') return 'idle'
  if (statusStr.includes('break') || statusStr.includes('fault') || statusStr === 'error') return 'breakdown'
  if (statusStr.includes('setup') || statusStr.includes('change')) return 'setup'
  return 'idle'
}

function extractParameters(item: Record<string, unknown>): Record<string, number | string> {
  const params: Record<string, number | string> = {}
  const excludeKeys = ['timestamp', 'equipment_id', 'production_count', 'good_count', 'defect_count', 'cycle_time', 'status']

  for (const [key, value] of Object.entries(item)) {
    if (!excludeKeys.includes(key) && (typeof value === 'number' || typeof value === 'string')) {
      params[key] = value
    }
  }

  return params
}

// ============================================
// 4M1E Change Record
// ============================================

export interface FourM1EChange {
  id: string
  timestamp: Date
  type: 'man' | 'machine' | 'material' | 'method' | 'environment'
  factor: string
  beforeState: string
  afterState: string
  reason: string
  impactScope: string[]
  qualityImpact: 'none' | 'low' | 'medium' | 'high'
  verificationResult?: {
    verified: boolean
    verifiedBy: string
    verifiedAt: Date
    notes?: string
  }
  approver?: {
    name: string
    approvedAt: Date
  }
}

export function createFourM1ERecord(change: FourM1EChange): string {
  const typeInfo = SMART_FACTORY_TERMINOLOGY.fourM1E[change.type]

  return `
# 4M1E 변경점 기록

## 1. 변경 기본 정보

| 항목 | 내용 |
|------|------|
| 변경 ID | ${change.id} |
| 변경 일시 | ${change.timestamp.toISOString()} |
| 변경 유형 | ${typeInfo.korean} (${typeInfo.english}) |
| 변경 요소 | ${change.factor} |

## 2. 변경 내용

### 변경 전 상태
${change.beforeState}

### 변경 후 상태
${change.afterState}

### 변경 사유
${change.reason}

## 3. 영향 분석

### 영향 범위
${change.impactScope.map((s) => `- ${s}`).join('\n')}

### 품질 영향도
**${change.qualityImpact.toUpperCase()}** ${getQualityImpactEmoji(change.qualityImpact)}

${
  change.verificationResult
    ? `## 4. 검증 결과

| 항목 | 내용 |
|------|------|
| 검증 결과 | ${change.verificationResult.verified ? '✅ 적합' : '❌ 부적합'} |
| 검증자 | ${change.verificationResult.verifiedBy} |
| 검증 일시 | ${change.verificationResult.verifiedAt.toISOString()} |
${change.verificationResult.notes ? `| 비고 | ${change.verificationResult.notes} |` : ''}`
    : ''
}

${
  change.approver
    ? `## 5. 승인 정보

| 항목 | 내용 |
|------|------|
| 승인자 | ${change.approver.name} |
| 승인 일시 | ${change.approver.approvedAt.toISOString()} |`
    : ''
}

---
*본 기록은 QETTA Smart Factory 엔진에 의해 자동 생성되었습니다.*
*생성일시: ${new Date().toISOString()}*
`.trim()
}

function getQualityImpactEmoji(impact: string): string {
  switch (impact) {
    case 'none':
      return '⚪'
    case 'low':
      return '🟢'
    case 'medium':
      return '🟡'
    case 'high':
      return '🔴'
    default:
      return '⚪'
  }
}

// ============================================
// OEE Report Generator
// ============================================

export function generateOEEReportContent(results: OEEResult[]): string {
  if (results.length === 0) {
    return '데이터가 없습니다.'
  }

  // 전체 평균 계산
  const avgOEE = results.reduce((sum, r) => sum + r.oee, 0) / results.length
  const avgAvailability = results.reduce((sum, r) => sum + r.availability, 0) / results.length
  const avgPerformance = results.reduce((sum, r) => sum + r.performance, 0) / results.length
  const avgQuality = results.reduce((sum, r) => sum + r.quality, 0) / results.length

  const period = results[0].period

  return `
# OEE 분석 리포트

## 1. 요약 (Executive Summary)

| 지표 | 평균값 | 세계적 수준 | 상태 |
|------|--------|-------------|------|
| **OEE** | ${avgOEE.toFixed(1)}% | ${SMART_FACTORY_TERMINOLOGY.oee.oee.worldClass}% | ${getStatusEmoji(avgOEE, SMART_FACTORY_TERMINOLOGY.oee.oee.worldClass)} |
| 가동률 | ${avgAvailability.toFixed(1)}% | ${SMART_FACTORY_TERMINOLOGY.oee.availability.worldClass}% | ${getStatusEmoji(avgAvailability, SMART_FACTORY_TERMINOLOGY.oee.availability.worldClass)} |
| 성능효율 | ${avgPerformance.toFixed(1)}% | ${SMART_FACTORY_TERMINOLOGY.oee.performance.worldClass}% | ${getStatusEmoji(avgPerformance, SMART_FACTORY_TERMINOLOGY.oee.performance.worldClass)} |
| 품질률 | ${avgQuality.toFixed(1)}% | ${SMART_FACTORY_TERMINOLOGY.oee.quality.worldClass}% | ${getStatusEmoji(avgQuality, SMART_FACTORY_TERMINOLOGY.oee.quality.worldClass)} |

**분석 기간**: ${period.start.toLocaleDateString()} ~ ${period.end.toLocaleDateString()}

## 2. 설비별 OEE 현황

| 설비 | 가동률 | 성능효율 | 품질률 | **OEE** |
|------|--------|----------|--------|---------|
${results.map((r) => `| ${r.equipmentName} | ${r.availability.toFixed(1)}% | ${r.performance.toFixed(1)}% | ${r.quality.toFixed(1)}% | **${r.oee.toFixed(1)}%** |`).join('\n')}

## 3. 6대 손실 분석 (Top 설비)

${results
  .sort((a, b) => b.sixLosses.breakdownLoss - a.sixLosses.breakdownLoss)
  .slice(0, 3)
  .map(
    (r) => `
### ${r.equipmentName}
| 손실 유형 | 손실 시간(분) |
|-----------|---------------|
| 고장 손실 | ${r.sixLosses.breakdownLoss.toFixed(0)} |
| 셋업 손실 | ${r.sixLosses.setupLoss.toFixed(0)} |
| 공회전 손실 | ${r.sixLosses.idlingLoss.toFixed(0)} |
| 속도 저하 손실 | ${r.sixLosses.speedLoss.toFixed(0)} |
| 불량 손실 | ${r.sixLosses.defectLoss.toFixed(0)} |
`
  )
  .join('\n')}

## 4. 개선 과제

${generateImprovementTasks(results)}

---
*본 리포트는 QETTA Smart Factory OEE 엔진에 의해 자동 생성되었습니다.*
*생성일시: ${new Date().toISOString()}*
`.trim()
}

function getStatusEmoji(value: number, worldClass: number): string {
  if (value >= worldClass * 1.05) return '🏆 초과 달성'
  if (value >= worldClass * 0.95) return '✅ 달성'
  if (value >= worldClass * 0.8) return '🟡 근접'
  return '🔴 미달'
}

function generateImprovementTasks(results: OEEResult[]): string {
  const tasks: string[] = []

  // 가동률이 낮은 설비
  const lowAvailability = results.filter((r) => r.availability < SMART_FACTORY_TERMINOLOGY.oee.availability.worldClass * 0.9)
  if (lowAvailability.length > 0) {
    tasks.push(`### 가동률 개선 과제\n${lowAvailability.map((r) => `- **${r.equipmentName}**: 예방 정비 강화, 고장 원인 분석 필요`).join('\n')}`)
  }

  // 성능효율이 낮은 설비
  const lowPerformance = results.filter((r) => r.performance < SMART_FACTORY_TERMINOLOGY.oee.performance.worldClass * 0.9)
  if (lowPerformance.length > 0) {
    tasks.push(`### 성능효율 개선 과제\n${lowPerformance.map((r) => `- **${r.equipmentName}**: 사이클타임 최적화, 속도 저하 원인 분석 필요`).join('\n')}`)
  }

  // 품질률이 낮은 설비
  const lowQuality = results.filter((r) => r.quality < SMART_FACTORY_TERMINOLOGY.oee.quality.worldClass * 0.99)
  if (lowQuality.length > 0) {
    tasks.push(`### 품질률 개선 과제\n${lowQuality.map((r) => `- **${r.equipmentName}**: 불량 원인 분석, 공정 조건 최적화 필요`).join('\n')}`)
  }

  return tasks.length > 0 ? tasks.join('\n\n') : '모든 설비가 양호한 상태입니다. 현재 수준 유지에 집중하세요.'
}

// ============================================
// Smart Factory Validation Rules
// ============================================

export const SMART_FACTORY_VALIDATION_RULES = {
  // OEE 유효 범위
  oeeRange: {
    availability: { min: 0, max: 100 },
    performance: { min: 0, max: 150 }, // 성능효율은 100% 초과 가능
    quality: { min: 0, max: 100 },
    oee: { min: 0, max: 100 },
  },

  // 스마트공장 수준별 최소 OEE
  levelMinOEE: {
    basic: 50,
    intermediate1: 60,
    intermediate2: 70,
    advanced: 80,
  },

  // 필수 MES 필드
  requiredMESFields: ['timestamp', 'equipment_id', 'production_count'],

  // 경고 임계값
  warningThreshold: {
    oeeDropRate: 0.1, // 10% 이상 하락 시 경고
    downtimeRatio: 0.2, // 20% 이상 정지 시 경고
    defectRate: 0.01, // 1% 이상 불량 시 경고
  },
}

export function validateOEEResult(result: OEEResult): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // 범위 체크
  if (result.availability < 0 || result.availability > 100) {
    errors.push(`가동률 범위 오류: ${result.availability}%`)
  }
  if (result.performance < 0 || result.performance > 150) {
    errors.push(`성능효율 범위 오류: ${result.performance}%`)
  }
  if (result.quality < 0 || result.quality > 100) {
    errors.push(`품질률 범위 오류: ${result.quality}%`)
  }

  // 경고 체크
  if (result.oee < SMART_FACTORY_TERMINOLOGY.oee.oee.worldClass * 0.7) {
    warnings.push(`OEE가 목표 대비 70% 미만: ${result.oee}%`)
  }

  const downtimeRatio = result.sixLosses.breakdownLoss / (result.sixLosses.breakdownLoss + result.sixLosses.setupLoss + 1)
  if (downtimeRatio > SMART_FACTORY_VALIDATION_RULES.warningThreshold.downtimeRatio) {
    warnings.push(`고장 정지 비율 높음: ${(downtimeRatio * 100).toFixed(1)}%`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================
// Smart Factory Feedback Generator
// ============================================

export function generateSmartFactoryFeedback(
  result: OEEResult,
  _validation: ReturnType<typeof validateOEEResult> // Reserved for future validation-based feedback
): EnginePresetFeedback | null {
  // OEE가 세계적 수준 미달 시 피드백 생성
  if (result.worldClassComparison.oee === 'below') {
    return {
      domain: 'MANUFACTURING',
      type: 'stat_update',
      statUpdate: {
        metric: 'oee_improvement_needed',
        value: SMART_FACTORY_TERMINOLOGY.oee.oee.worldClass - result.oee,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        inferredAt: new Date().toISOString(),
        agentRole: 'analyst',
        reasoningTokens: 0,
        confidence: 0.95,
      },
    }
  }

  return null
}
