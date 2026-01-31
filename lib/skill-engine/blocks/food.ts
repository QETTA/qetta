/**
 * FOOD Industry BLOCK
 * Category: manufacturing
 * KSIC: 10, 11 (식품/음료 제조)
 */
import type { EnrichedIndustryBlock } from './types'

export const FOOD_BLOCK: EnrichedIndustryBlock = {
  id: 'FOOD',
  name: 'Food & Beverage Manufacturing',
  nameKo: '식품/음료 제조',
  category: 'manufacturing',
  description: 'Food safety compliance, HACCP certification, cold chain management for Korean food industry standards',
  descriptionKo: '식품 안전 준수, HACCP 인증, 콜드체인 관리, 국내 식품 산업 표준 준수',

  terminology: [
    {
      id: 'haccp',
      korean: '식품안전관리인증기준',
      english: 'Hazard Analysis Critical Control Point',
      category: 'standard',
      description: '식품의 원료 관리, 제조/가공/조리/유통 전 과정에서 위해 요소 분석 및 관리',
      aliases: ['HACCP', '해썹', '식품안전인증'],
      regulatoryRef: '식품위생법 제48조',
      examples: ['CCP 모니터링', '한계기준 설정', '개선조치'],
    },
    {
      id: 'gmp-food',
      korean: '식품 제조 기준',
      english: 'Good Manufacturing Practice',
      category: 'standard',
      description: '식품 제조 시설 및 위생 관리 기준',
      aliases: ['GMP', '우수제조기준'],
      regulatoryRef: '식품의약품안전처 고시',
      examples: ['제조시설 기준', '위생관리 기준'],
    },
    {
      id: 'cold-chain',
      korean: '콜드체인',
      english: 'Cold Chain',
      category: 'logistics',
      description: '저온 유통 시스템 (온도 이력 관리)',
      aliases: ['저온유통', '냉장물류', '온도관리'],
      validationRange: { min: -30, max: 10 },
      examples: ['온도 이력 기록', '냉장/냉동 보관'],
    },
    {
      id: 'lot-tracking',
      korean: 'LOT 추적',
      english: 'Lot Tracking',
      category: 'traceability',
      description: '원료부터 완제품까지 이력 추적',
      aliases: ['LOT 관리', '이력추적', '트레이서빌리티'],
      examples: ['원료 입고 LOT', '생산 LOT', '출하 LOT'],
    },
    {
      id: 'shelf-life',
      korean: '유통기한',
      english: 'Shelf Life',
      category: 'quality',
      description: '제품의 품질 유지 가능 기간',
      aliases: ['소비기한', '품질유지기한'],
      examples: ['유통기한 설정 시험', '가속 시험'],
    },
    {
      id: 'allergen',
      korean: '알레르겐',
      english: 'Allergen',
      category: 'safety',
      description: '식품 알레르기 유발 물질 관리',
      aliases: ['알레르기 유발물질', '식품 알레르기'],
      regulatoryRef: '식품등의 표시·광고에 관한 법률',
      examples: ['밀', '계란', '우유', '땅콩', '대두'],
    },
  ],

  templates: [
    {
      id: 'haccp-self-evaluation',
      name: 'HACCP Self-Evaluation Report',
      nameKo: 'HACCP 자가점검표',
      format: 'XLSX',
      sections: [
        'HACCP 팀 구성',
        '선행요건 관리',
        'CCP 모니터링 기록',
        '검증 활동',
        '개선조치 기록',
      ],
      estimatedGenerationTime: 45,
    },
    {
      id: 'cold-chain-temperature-log',
      name: 'Cold Chain Temperature Log',
      nameKo: '콜드체인 온도 이력 기록',
      format: 'XLSX',
      sections: [
        '일자별 온도 기록',
        '이상 온도 발생 기록',
        '조치 내역',
        '설비 점검 기록',
      ],
      estimatedGenerationTime: 30,
    },
    {
      id: 'food-safety-certification',
      name: 'Food Safety Certification Application',
      nameKo: '식품안전인증 신청서',
      format: 'DOCX',
      sections: [
        '업체 개요',
        '제조 공정도',
        'HACCP 계획서',
        '위생관리 계획',
        '시설 도면',
      ],
      estimatedGenerationTime: 90,
    },
  ],

  rules: [
    {
      id: 'haccp-ccp-monitoring',
      name: 'CCP Monitoring Requirement',
      description: 'CCP(중요관리점)는 연속 모니터링 필수',
      condition: 'ccp_point = true',
      action: 'Monitor and record CCP parameters at specified frequency',
      severity: 'error',
      regulatoryRef: '식품위생법 시행규칙 별표17',
    },
    {
      id: 'temperature-deviation',
      name: 'Temperature Deviation Alert',
      description: '설정 온도 이탈 시 즉시 조치',
      condition: 'temperature > limit OR temperature < limit',
      action: 'Initiate corrective action and document deviation',
      severity: 'error',
      regulatoryRef: 'HACCP 관리기준',
    },
    {
      id: 'allergen-labeling',
      name: 'Allergen Labeling Requirement',
      description: '알레르기 유발물질 표시 의무',
      condition: 'contains_allergen = true',
      action: 'Display allergen information on product label',
      severity: 'error',
      regulatoryRef: '식품등의 표시·광고에 관한 법률',
    },
  ],

  keywords: ['HACCP', 'GMP', '식품안전', '콜드체인', 'LOT', '유통기한', '알레르겐', 'KSIC 10-11'],
  regulatoryBodies: ['식품의약품안전처', '농림축산식품부', '국립농산물품질관리원'],
  color: 'orange',

  tokenBudget: {
    metadata: 50,
    terminology: 500,
    full: 2000,
  },
}
