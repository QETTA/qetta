/**
 * @deprecated v4.0 — Use `EnginePreset` + `PRESETS.ENVIRONMENT` from `@/lib/skill-engine`.
 *
 * QETTA TMS Domain Skills
 *
 * 환경부 원격 모니터링 시스템 도메인
 *
 * 출력물:
 * - 일일 배출량 보고서
 * - 월간 환경 관리 보고서
 * - 측정기록부
 * - CleanSYS 연동 보고서
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import type {
  DocumentSkill,
  DocumentTemplate,
  SkillPackage,
  EnginePresetFeedback,
} from '../../types'

// ============================================
// TMS Terminology (핵심 용어집)
// ============================================

export const TMS_TERMINOLOGY = {
  // 오염물질
  pollutants: {
    NOx: {
      korean: '질소산화물',
      english: 'Nitrogen Oxides',
      unit: 'ppm',
      legalLimit: 200, // 법적 기준치 (ppm)
      description: '연소 과정에서 발생하는 질소 화합물',
    },
    SOx: {
      korean: '황산화물',
      english: 'Sulfur Oxides',
      unit: 'ppm',
      legalLimit: 150,
      description: '황을 포함한 연료 연소 시 발생',
    },
    PM: {
      korean: '미세먼지',
      english: 'Particulate Matter',
      unit: 'mg/m³',
      legalLimit: 30,
      description: '대기 중 부유하는 미세한 입자',
    },
    PM10: {
      korean: '미세먼지 (10μm)',
      english: 'PM10',
      unit: 'μg/m³',
      legalLimit: 100,
      description: '직경 10μm 이하 입자',
    },
    PM25: {
      korean: '초미세먼지 (2.5μm)',
      english: 'PM2.5',
      unit: 'μg/m³',
      legalLimit: 50,
      description: '직경 2.5μm 이하 입자',
    },
    CO: {
      korean: '일산화탄소',
      english: 'Carbon Monoxide',
      unit: 'ppm',
      legalLimit: 50,
      description: '불완전 연소 시 발생',
    },
    O3: {
      korean: '오존',
      english: 'Ozone',
      unit: 'ppm',
      legalLimit: 0.1,
      description: '광화학 반응으로 생성',
    },
  },

  // 시스템
  systems: {
    TMS: {
      korean: '원격 모니터링 시스템',
      english: 'Tele-Monitoring System',
      description: '환경부 굴뚝 원격 감시 시스템',
    },
    CleanSYS: {
      korean: '클린시스',
      english: 'CleanSYS',
      description: '환경부 대기오염물질 배출정보 관리 시스템',
      url: 'https://cleansys.or.kr',
    },
    CEMS: {
      korean: '연속측정장치',
      english: 'Continuous Emission Monitoring System',
      description: '굴뚝 배출가스 연속 측정 장치',
    },
  },

  // 문서 양식
  documents: {
    dailyReport: {
      korean: '일일 배출량 보고서',
      english: 'Daily Emission Report',
      format: 'HWP',
      sections: ['측정 개요', '오염물질별 배출량', '법적 기준 비교', '이상치 분석', '조치 사항'],
    },
    monthlyReport: {
      korean: '월간 환경 관리 보고서',
      english: 'Monthly Environmental Report',
      format: 'HWP',
      sections: ['월간 요약', '일별 추이 분석', '법규 준수 현황', '개선 계획', '증빙 자료'],
    },
    measurementRecord: {
      korean: '측정기록부',
      english: 'Measurement Record',
      format: 'HWP',
      sections: ['측정 일시', '측정 항목', '측정값', '측정자', '비고'],
    },
  },

  // 법규
  regulations: {
    cleanAirAct: {
      korean: '대기환경보전법',
      english: 'Clean Air Conservation Act',
      description: '대기오염물질 배출 및 관리에 관한 법률',
    },
    emissionStandard: {
      korean: '배출허용기준',
      english: 'Emission Standard',
      description: '사업장별 오염물질 배출 허용 한도',
    },
  },
} as const

// ============================================
// TMS Document Templates
// ============================================

export const TMS_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'tms-daily-report',
    name: '일일 배출량 보고서',
    domain: 'ENVIRONMENT',
    sections: [
      '1. 측정 개요',
      '2. 오염물질별 배출량',
      '  2.1 NOx (질소산화물)',
      '  2.2 SOx (황산화물)',
      '  2.3 PM (미세먼지)',
      '  2.4 CO (일산화탄소)',
      '3. 법적 기준 대비 분석',
      '4. 이상치 발생 현황',
      '5. 조치 사항 및 개선 계획',
      '6. 첨부: 측정 데이터',
    ],
    estimatedGenerationTime: 45,
  },
  {
    id: 'tms-monthly-report',
    name: '월간 환경 관리 보고서',
    domain: 'ENVIRONMENT',
    sections: [
      '1. 요약 (Executive Summary)',
      '2. 월간 배출량 현황',
      '  2.1 오염물질별 총 배출량',
      '  2.2 일별 추이 분석',
      '  2.3 전월 대비 증감',
      '3. 법규 준수 현황',
      '  3.1 배출허용기준 준수율',
      '  3.2 초과 발생 이력',
      '4. 설비 운영 현황',
      '  4.1 방지시설 가동률',
      '  4.2 정비 이력',
      '5. 개선 계획',
      '6. 증빙 자료 목록',
    ],
    estimatedGenerationTime: 90,
  },
  {
    id: 'tms-measurement-record',
    name: '측정기록부',
    domain: 'ENVIRONMENT',
    sections: [
      '측정 일시',
      '측정 지점',
      '측정 항목',
      '측정값',
      '측정 방법',
      '측정자',
      '검토자',
      '비고',
    ],
    estimatedGenerationTime: 30,
  },
  {
    id: 'tms-cleansys-sync',
    name: 'CleanSYS 연동 보고서',
    domain: 'ENVIRONMENT',
    sections: ['1. 연동 현황', '2. 전송 데이터 요약', '3. 오류 발생 이력', '4. 데이터 정합성 검증'],
    estimatedGenerationTime: 20,
  },
]

// ============================================
// TMS Skills Definition
// ============================================

export const TMS_SKILLS: DocumentSkill[] = [
  {
    id: 'tms-daily-emission',
    name: 'Daily Emission Report',
    nameKo: '일일 배출량 보고서 생성',
    category: 'document_generation',
    description: 'Generate daily emission report for environmental compliance',
    version: '1.0.0',
    domains: ['ENVIRONMENT'],
    requiredPromptTokens: 8000, // 시스템 프롬프트 + 용어집
    outputFormats: ['HWP', 'DOCX', 'PDF'],
    templates: [TMS_TEMPLATES[0]],
  },
  {
    id: 'tms-monthly-report',
    name: 'Monthly Environmental Report',
    nameKo: '월간 환경 관리 보고서 생성',
    category: 'document_generation',
    description: 'Generate monthly environmental management report',
    version: '1.0.0',
    domains: ['ENVIRONMENT'],
    requiredPromptTokens: 12000,
    outputFormats: ['HWP', 'DOCX', 'PDF'],
    templates: [TMS_TEMPLATES[1]],
  },
  {
    id: 'tms-measurement-record',
    name: 'Measurement Record',
    nameKo: '측정기록부 생성',
    category: 'document_generation',
    description: 'Generate official measurement record for regulatory submission',
    version: '1.0.0',
    domains: ['ENVIRONMENT'],
    requiredPromptTokens: 5000,
    outputFormats: ['HWP', 'XLSX'],
    templates: [TMS_TEMPLATES[2]],
  },
]

// ============================================
// TMS Skill Package
// ============================================

export const TMS_SKILL_PACKAGE: SkillPackage = {
  id: 'pkg-tms-complete',
  name: 'TMS Complete Package',
  nameKo: 'TMS 환경부 완전 패키지',
  description: '환경부 모든 보고서 생성 및 CleanSYS 연동',
  skills: TMS_SKILLS.map((s) => s.id),
  domain: 'ENVIRONMENT',
  tier: 'domain',
  estimatedCost: {
    perDocument: 0.15, // $0.15/건 (Prompt Caching 적용)
    perMonth: 45, // 월 300건 기준
    cacheEfficiency: 90, // 90% 캐싱 효율
  },
  metadata: {
    createdAt: '2026-01-22',
    updatedAt: '2026-01-22',
    usageCount: 0,
    rating: 0,
  },
}

// ============================================
// TMS Document Generator
// ============================================

export interface TMSEmissionData {
  date: string
  facilityName: string
  facilityId: string
  measurements: {
    pollutant: keyof typeof TMS_TERMINOLOGY.pollutants
    value: number
    unit: string
    legalLimit: number
    status: 'normal' | 'warning' | 'exceeded'
  }[]
  operator: string
  notes?: string
}

export function generateDailyReportContent(data: TMSEmissionData): string {
  const { date, facilityName, facilityId, measurements, operator, notes } = data

  // 법적 기준 초과 여부 확인
  const exceededItems = measurements.filter((m) => m.status === 'exceeded')
  const warningItems = measurements.filter((m) => m.status === 'warning')

  const content = `
# 일일 배출량 보고서

## 1. 측정 개요

| 항목 | 내용 |
|------|------|
| 측정일 | ${date} |
| 사업장명 | ${facilityName} |
| 사업장 ID | ${facilityId} |
| 측정자 | ${operator} |

## 2. 오염물질별 배출량

| 오염물질 | 측정값 | 단위 | 법적 기준 | 상태 |
|----------|--------|------|-----------|------|
${measurements
  .map((m) => {
    const pollutantInfo = TMS_TERMINOLOGY.pollutants[m.pollutant]
    const statusEmoji = m.status === 'normal' ? '✅' : m.status === 'warning' ? '⚠️' : '🚨'
    return `| ${pollutantInfo.korean} (${m.pollutant}) | ${m.value} | ${m.unit} | ${m.legalLimit} | ${statusEmoji} ${m.status} |`
  })
  .join('\n')}

## 3. 법적 기준 대비 분석

${
  exceededItems.length > 0
    ? `### 🚨 기준 초과 항목 (${exceededItems.length}건)
${exceededItems.map((m) => `- **${TMS_TERMINOLOGY.pollutants[m.pollutant].korean}**: ${m.value}${m.unit} (기준: ${m.legalLimit}${m.unit})`).join('\n')}`
    : '✅ 모든 항목이 법적 기준 이내입니다.'
}

${
  warningItems.length > 0
    ? `### ⚠️ 주의 항목 (${warningItems.length}건)
${warningItems.map((m) => `- **${TMS_TERMINOLOGY.pollutants[m.pollutant].korean}**: ${m.value}${m.unit} (기준의 80% 이상)`).join('\n')}`
    : ''
}

## 4. 조치 사항

${
  exceededItems.length > 0
    ? `- 즉시 방지시설 점검 필요
- CleanSYS 초과 사유서 제출 (24시간 이내)
- 관할 환경청 보고`
    : `- 정상 운영 유지
- 정기 점검 일정 확인`
}

${notes ? `## 5. 비고\n\n${notes}` : ''}

---
*본 보고서는 QETTA TMS 엔진에 의해 자동 생성되었습니다.*
*생성일시: ${new Date().toISOString()}*
`

  return content.trim()
}

// ============================================
// TMS Validation Rules
// ============================================

export const TMS_VALIDATION_RULES = {
  // 측정값 유효 범위
  measurementRange: {
    NOx: { min: 0, max: 1000 },
    SOx: { min: 0, max: 500 },
    PM: { min: 0, max: 200 },
    PM10: { min: 0, max: 500 },
    PM25: { min: 0, max: 300 },
    CO: { min: 0, max: 200 },
    O3: { min: 0, max: 0.5 },
  },

  // 경고 임계값 (법적 기준의 X%)
  warningThreshold: 0.8, // 80%

  // 필수 측정 항목
  requiredMeasurements: ['NOx', 'SOx', 'PM'],

  // 측정 주기 (분)
  measurementInterval: {
    continuous: 5, // 연속측정
    periodic: 60, // 수시측정
  },
}

export function validateTMSData(data: TMSEmissionData): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // 필수 항목 체크
  const measuredPollutants = data.measurements.map((m) => m.pollutant)
  for (const required of TMS_VALIDATION_RULES.requiredMeasurements) {
    if (!measuredPollutants.includes(required as keyof typeof TMS_TERMINOLOGY.pollutants)) {
      errors.push(`필수 측정 항목 누락: ${required}`)
    }
  }

  // 유효 범위 체크
  for (const measurement of data.measurements) {
    const range = TMS_VALIDATION_RULES.measurementRange[measurement.pollutant]
    if (range) {
      if (measurement.value < range.min || measurement.value > range.max) {
        errors.push(
          `${measurement.pollutant} 측정값 범위 초과: ${measurement.value} (유효: ${range.min}~${range.max})`
        )
      }
    }

    // 경고 임계값 체크
    const ratio = measurement.value / measurement.legalLimit
    if (ratio >= TMS_VALIDATION_RULES.warningThreshold && ratio < 1) {
      warnings.push(`${measurement.pollutant} 법적 기준 ${Math.round(ratio * 100)}% 도달`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================
// TMS Feedback Generator
// ============================================

export function generateTMSFeedback(
  data: TMSEmissionData,
  _validation: ReturnType<typeof validateTMSData> // Reserved for future validation-based feedback
): EnginePresetFeedback | null {
  // 초과 발생 시 패턴 업데이트
  const exceededItems = data.measurements.filter((m) => m.status === 'exceeded')

  if (exceededItems.length === 0) {
    return null
  }

  return {
    domain: 'ENVIRONMENT',
    type: 'stat_update',
    statUpdate: {
      metric: 'exceeded_count',
      value: exceededItems.length,
      timestamp: new Date().toISOString(),
    },
    metadata: {
      inferredAt: new Date().toISOString(),
      agentRole: 'writer',
      reasoningTokens: 0,
      confidence: 1.0,
    },
  }
}
