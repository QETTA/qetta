/**
 * GENERAL Industry BLOCK
 * Category: manufacturing
 * KSIC: 기타 (일반 제조업)
 */
import type { EnrichedIndustryBlock } from './types'

export const GENERAL_BLOCK: EnrichedIndustryBlock = {
  id: 'GENERAL',
  name: 'General Manufacturing',
  nameKo: '일반 제조',
  category: 'manufacturing',
  description: 'General manufacturing best practices, productivity improvement, quality management for various industries',
  descriptionKo: '일반 제조업 모범 사례, 생산성 향상, 품질 관리',

  terminology: [
    {
      id: '4m1e',
      korean: '4M1E',
      english: '4M1E',
      category: 'management',
      description: '품질/생산 관리 5대 요소 (Man, Machine, Material, Method, Environment)',
      aliases: ['4M', '5M1E', '생산 요소'],
      examples: ['작업자 역량', '설비 상태', '원자재 품질', '작업 방법', '작업 환경'],
    },
    {
      id: 'oee',
      korean: '설비종합효율',
      english: 'Overall Equipment Effectiveness',
      category: 'metric',
      description: '설비 가동률 × 성능 × 품질의 종합 지표',
      aliases: ['OEE', '종합설비효율', '설비효율'],
      unit: '%',
      validationRange: { min: 0, max: 100 },
      examples: ['World Class OEE: 85%', '가용률 × 성능률 × 양품률'],
    },
    {
      id: 'productivity',
      korean: '생산성',
      english: 'Productivity',
      category: 'metric',
      description: '투입 대비 산출 효율성',
      aliases: ['노동 생산성', '설비 생산성'],
      examples: ['단위시간당 생산량', '작업자당 생산량'],
    },
    {
      id: 'quality-control',
      korean: '품질관리',
      english: 'Quality Control',
      category: 'management',
      description: '제품 품질 유지 및 개선 활동',
      aliases: ['QC', '품질 검사', 'Quality Management'],
      examples: ['입고 검사', '공정 검사', '출하 검사'],
    },
    {
      id: 'defect-rate',
      korean: '불량률',
      english: 'Defect Rate',
      category: 'metric',
      description: '전체 생산량 대비 불량 비율',
      aliases: ['불량률', '부적합률', 'PPM'],
      unit: '%',
      validationRange: { min: 0, max: 100 },
      examples: ['공정 불량률', '출하 불량률', 'PPM 관리'],
    },
    {
      id: 'inventory-management',
      korean: '재고관리',
      english: 'Inventory Management',
      category: 'management',
      description: '원자재, 재공품, 완제품 재고 관리',
      aliases: ['재고 관리', 'Stock Management'],
      examples: ['안전 재고', '재고 회전율', 'FIFO'],
    },
  ],

  templates: [
    {
      id: '4m1e-analysis-report',
      name: '4M1E Analysis Report',
      nameKo: '4M1E 분석 보고서',
      format: 'XLSX',
      sections: [
        '작업자(Man) 분석',
        '설비(Machine) 분석',
        '재료(Material) 분석',
        '방법(Method) 분석',
        '환경(Environment) 분석',
      ],
      estimatedGenerationTime: 60,
    },
    {
      id: 'oee-calculation-report',
      name: 'OEE Calculation Report',
      nameKo: 'OEE 계산 보고서',
      format: 'XLSX',
      sections: [
        '가용률 계산',
        '성능률 계산',
        '양품률 계산',
        'OEE 종합',
        '손실 분석',
      ],
      estimatedGenerationTime: 45,
    },
    {
      id: 'productivity-report',
      name: 'Productivity Report',
      nameKo: '생산성 보고서',
      format: 'DOCX',
      sections: [
        '생산 실적',
        '생산성 지표',
        '개선 활동',
        '목표 대비 실적',
      ],
      estimatedGenerationTime: 45,
    },
  ],

  rules: [
    {
      id: 'oee-target',
      name: 'OEE Target Achievement',
      description: 'OEE 목표 달성률 모니터링',
      condition: 'oee < target_oee',
      action: 'Analyze loss factors and initiate improvement plan',
      severity: 'warning',
    },
    {
      id: 'defect-rate-limit',
      name: 'Defect Rate Limit',
      description: '불량률 허용 한계 초과 시 공정 중단',
      condition: 'defect_rate > limit',
      action: 'Stop production line and investigate root cause',
      severity: 'error',
    },
    {
      id: 'inventory-level',
      name: 'Inventory Level Alert',
      description: '재고 수준 이상 시 알림',
      condition: 'inventory < safety_stock OR inventory > max_stock',
      action: 'Adjust procurement or production plan',
      severity: 'warning',
    },
  ],

  keywords: ['4M1E', 'OEE', '생산성', '품질관리', '불량률', '재고관리', '일반제조'],
  regulatoryBodies: ['중소벤처기업부', '산업통상자원부'],
  color: 'gray',

  tokenBudget: {
    metadata: 50,
    terminology: 500,
    full: 2000,
  },
}
