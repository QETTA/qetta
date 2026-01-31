/**
 * AUTOMOTIVE Industry BLOCK
 * Category: manufacturing
 */
import type { EnrichedIndustryBlock } from './types'

export const AUTOMOTIVE_BLOCK: EnrichedIndustryBlock = {
  id: 'AUTOMOTIVE',
  name: 'Automotive Manufacturing',
  nameKo: '자동차 제조',
  category: 'manufacturing',
  description: 'Automotive manufacturing compliance, quality control, and production reporting for Korean automotive industry standards',
  descriptionKo: '자동차 제조 품질 관리, 생산 보고, 국내 자동차 산업 표준 준수',

  terminology: [
    {
      id: 'ppap',
      korean: '생산 부품 승인 절차',
      english: 'Production Part Approval Process',
      category: 'quality',
      description: '자동차 부품 공급 전 품질 승인 절차 (AIAG 표준)',
      aliases: ['PPAP', '부품 승인'],
      examples: ['샘플 제출', '측정 데이터', '공정 FMEA'],
    },
    {
      id: 'apqp',
      korean: '선행 제품 품질 계획',
      english: 'Advanced Product Quality Planning',
      category: 'quality',
      description: '제품 개발 단계별 품질 계획 수립',
      aliases: ['APQP', '품질 계획'],
      examples: ['개발 단계별 게이트', '품질 목표 설정'],
    },
    {
      id: 'iatf16949',
      korean: 'IATF 16949',
      english: 'IATF 16949',
      category: 'standard',
      description: '자동차 산업 품질경영시스템 국제 표준',
      aliases: ['IATF16949', 'ISO/TS 16949'],
      regulatoryRef: 'IATF 16949:2016',
      examples: ['품질경영시스템 인증', '공급망 관리'],
    },
    {
      id: 'cpk',
      korean: '공정 능력 지수',
      english: 'Process Capability Index',
      category: 'metric',
      description: '공정의 품질 능력을 나타내는 통계적 지표',
      aliases: ['Cpk', 'Cp', '공정능력'],
      validationRange: { min: 0, max: 3 },
      examples: ['Cpk ≥ 1.33 (양산 기준)', 'Cpk ≥ 1.67 (목표)'],
    },
    {
      id: 'spc',
      korean: '통계적 공정 관리',
      english: 'Statistical Process Control',
      category: 'method',
      description: '통계적 방법으로 공정 변동 관리',
      aliases: ['SPC', '관리도'],
      examples: ['X-bar R 관리도', 'P 관리도'],
    },
    {
      id: 'fmea',
      korean: '고장 모드 영향 분석',
      english: 'Failure Mode and Effects Analysis',
      category: 'method',
      description: '잠재적 고장 모드와 영향 분석',
      aliases: ['FMEA', 'DFMEA', 'PFMEA'],
      examples: ['설계 FMEA', '공정 FMEA'],
    },
    {
      id: 'just-in-time',
      korean: '적시 생산',
      english: 'Just-In-Time',
      category: 'production',
      description: '필요한 때에 필요한 만큼만 생산',
      aliases: ['JIT', 'Just-in-Time', '적시생산'],
      examples: ['재고 최소화', '납기 준수율'],
    },
  ],

  templates: [
    {
      id: 'ppap-submission',
      name: 'PPAP Submission Package',
      nameKo: 'PPAP 제출 패키지',
      format: 'PDF',
      sections: [
        'Part Submission Warrant (PSW)',
        'Dimensional Results',
        'Material Test Results',
        'Performance Test Results',
        'Process Flow Diagram',
        'FMEA',
        'Control Plan',
      ],
      estimatedGenerationTime: 120,
    },
    {
      id: 'monthly-production-report',
      name: 'Monthly Production Report',
      nameKo: '월간 생산 보고서',
      format: 'XLSX',
      sections: [
        '생산 수량',
        '품질 지표 (PPM, Cpk)',
        '설비 가동률',
        '불량률 분석',
        '개선 활동',
      ],
      estimatedGenerationTime: 60,
    },
    {
      id: 'quality-audit-report',
      name: 'Quality Audit Report',
      nameKo: '품질 감사 보고서',
      format: 'DOCX',
      sections: [
        '감사 개요',
        'IATF 16949 적합성 평가',
        '부적합 사항',
        '시정 조치 계획',
        '후속 조치',
      ],
      estimatedGenerationTime: 90,
    },
  ],

  rules: [
    {
      id: 'ppap-level-requirement',
      name: 'PPAP Level Requirement',
      description: 'PPAP 제출 레벨 결정 (고객 요구 기준)',
      condition: 'new_part = true OR engineering_change = true',
      action: 'Determine PPAP level (1-5) based on customer requirements',
      severity: 'error',
      regulatoryRef: 'AIAG PPAP Manual 4th Edition',
    },
    {
      id: 'cpk-threshold',
      name: 'Cpk Minimum Threshold',
      description: 'Cpk ≥ 1.33 미달 시 양산 불가',
      condition: 'Cpk < 1.33',
      action: 'Reject for production, require process improvement',
      severity: 'error',
      regulatoryRef: 'IATF 16949:2016 Section 8.6.2',
    },
    {
      id: 'layered-process-audit',
      name: 'Layered Process Audit',
      description: '일일 공정 감사 수행 (LPA)',
      condition: 'production_day = true',
      action: 'Conduct daily layered process audit by multiple levels',
      severity: 'warning',
      regulatoryRef: 'IATF 16949:2016 Section 9.2.2.3',
    },
  ],

  keywords: ['PPAP', 'APQP', 'IATF 16949', 'Cpk', 'SPC', 'automotive', '자동차', '품질'],
  regulatoryBodies: ['산업통상자원부', 'IATF', 'AIAG', 'VDA'],
  color: 'blue',

  tokenBudget: {
    metadata: 50,
    terminology: 500,
    full: 2000,
  },
}
