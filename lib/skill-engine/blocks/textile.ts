/**
 * TEXTILE Industry BLOCK
 * Category: manufacturing
 * KSIC: 13, 14 (섬유/의류 제조)
 */
import type { EnrichedIndustryBlock } from './types'

export const TEXTILE_BLOCK: EnrichedIndustryBlock = {
  id: 'TEXTILE',
  name: 'Textile & Apparel Manufacturing',
  nameKo: '섬유/의류 제조',
  category: 'manufacturing',
  description: 'Textile production, dyeing process, garment manufacturing for Korean textile industry standards',
  descriptionKo: '섬유 생산, 염색 공정, 의류 제조, 국내 섬유 산업 표준 준수',

  terminology: [
    {
      id: 'fabric-lot',
      korean: '원단 LOT',
      english: 'Fabric Lot',
      category: 'traceability',
      description: '원단의 생산 단위 관리 (동일 조건 생산분)',
      aliases: ['원단 로트', '직물 LOT', 'Lot Number'],
      examples: ['원사 LOT', '직조 LOT', '염색 LOT'],
    },
    {
      id: 'dyeing-recipe',
      korean: '염색 레시피',
      english: 'Dyeing Recipe',
      category: 'process',
      description: '염색 공정의 염료, 조제, 온도, 시간 배합 정보',
      aliases: ['배합표', '염색 배합', 'Color Recipe'],
      examples: ['염료 배합비', '처리 온도', '처리 시간'],
    },
    {
      id: 'gsm',
      korean: '평량',
      english: 'Grams per Square Meter',
      category: 'specification',
      description: '원단의 단위 면적당 무게',
      aliases: ['GSM', 'g/m²', '중량'],
      unit: 'g/m²',
      validationRange: { min: 50, max: 500 },
      examples: ['경량 직물 100 GSM', '중량 직물 300 GSM'],
    },
    {
      id: 'color-fastness',
      korean: '염색 견뢰도',
      english: 'Color Fastness',
      category: 'quality',
      description: '염색의 내구성 (세탁, 마찰, 일광 등)',
      aliases: ['견뢰도', 'Fastness', '색상 견뢰도'],
      validationRange: { min: 1, max: 5 },
      examples: ['세탁 견뢰도', '마찰 견뢰도', '일광 견뢰도'],
    },
    {
      id: 'sewing-spec',
      korean: '봉제 사양',
      english: 'Sewing Specification',
      category: 'specification',
      description: '의류 제작을 위한 봉제 방법 및 기준',
      aliases: ['봉제 스펙', 'Sewing Spec', '재봉 사양'],
      examples: ['땀수', '봉제 여유', '시접 폭'],
    },
    {
      id: 'pattern-making',
      korean: '패턴 제작',
      english: 'Pattern Making',
      category: 'design',
      description: '의류 설계를 위한 패턴 제작',
      aliases: ['패턴', '원형 제작', 'Pattern'],
      examples: ['기본 원형', '그레이딩', '마킹'],
    },
  ],

  templates: [
    {
      id: 'fabric-lot-tracking',
      name: 'Fabric Lot Tracking Report',
      nameKo: '원단 LOT 추적 보고서',
      format: 'XLSX',
      sections: [
        '입고 LOT 정보',
        '검사 결과',
        '사용 이력',
        '재고 현황',
      ],
      estimatedGenerationTime: 45,
    },
    {
      id: 'dyeing-process-report',
      name: 'Dyeing Process Report',
      nameKo: '염색 공정 보고서',
      format: 'XLSX',
      sections: [
        '염색 레시피',
        '공정 조건',
        '품질 검사 결과',
        '재현성 데이터',
      ],
      estimatedGenerationTime: 60,
    },
    {
      id: 'garment-production-report',
      name: 'Garment Production Report',
      nameKo: '의류 생산 보고서',
      format: 'DOCX',
      sections: [
        '생산 수량',
        '불량률 분석',
        '공정별 실적',
        '품질 검사 결과',
      ],
      estimatedGenerationTime: 45,
    },
  ],

  rules: [
    {
      id: 'color-matching',
      name: 'Color Matching Standard',
      description: '기준 색상과 델타E 2.0 이내 일치 필요',
      condition: 'delta_e > 2.0',
      action: 'Reject batch and re-dye or adjust recipe',
      severity: 'error',
      regulatoryRef: 'ISO 105 색차 기준',
    },
    {
      id: 'shrinkage-test',
      name: 'Shrinkage Test Requirement',
      description: '세탁 수축률 기준 충족 필요',
      condition: 'shrinkage > allowance',
      action: 'Document shrinkage rate and apply pre-shrinking if needed',
      severity: 'warning',
      regulatoryRef: 'KS K 0505',
    },
    {
      id: 'azo-dye-restriction',
      name: 'Azo Dye Restriction',
      description: '아조 염료 사용 금지 (유해 아민 생성)',
      condition: 'azo_dye_detected = true',
      action: 'Reject material and notify supplier',
      severity: 'error',
      regulatoryRef: 'EU REACH Annex XVII',
    },
  ],

  keywords: ['원단', '염색', '봉제', '패턴', 'LOT', 'GSM', '견뢰도', 'KSIC 13-14'],
  regulatoryBodies: ['산업통상자원부', '한국섬유개발연구원', '한국의류시험연구원'],
  color: 'pink',

  tokenBudget: {
    metadata: 50,
    terminology: 500,
    full: 2000,
  },
}
