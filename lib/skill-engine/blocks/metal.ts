/**
 * METAL Industry BLOCK
 * Category: manufacturing
 * KSIC: 24, 25 (금속/철강 제조)
 */
import type { EnrichedIndustryBlock } from './types'

export const METAL_BLOCK: EnrichedIndustryBlock = {
  id: 'METAL',
  name: 'Metal & Steel Manufacturing',
  nameKo: '금속/철강 제조',
  category: 'manufacturing',
  description: 'Metal processing, heat treatment, surface coating for Korean metal industry standards',
  descriptionKo: '금속 가공, 열처리, 표면 코팅, 국내 금속 산업 표준 준수',

  terminology: [
    {
      id: 'heat-treatment',
      korean: '열처리',
      english: 'Heat Treatment',
      category: 'process',
      description: '금속의 물리적 특성 변화를 위한 가열/냉각 공정',
      aliases: ['열처리 공정', 'HT', 'Thermal Treatment'],
      examples: ['담금질(Quenching)', '뜨임(Tempering)', '소둔(Annealing)'],
    },
    {
      id: 'plating',
      korean: '도금',
      english: 'Plating',
      category: 'process',
      description: '금속 표면에 다른 금속 피막 형성',
      aliases: ['표면처리', '코팅', 'Surface Coating'],
      examples: ['아연도금', '니켈도금', '크롬도금'],
    },
    {
      id: 'hardness',
      korean: '경도',
      english: 'Hardness',
      category: 'property',
      description: '금속의 단단함 정도 (HRC, HV 등)',
      aliases: ['경도 측정', 'Hardness Test'],
      unit: 'HRC/HV',
      validationRange: { min: 0, max: 70 },
      examples: ['HRC 40-45', 'HV 500'],
    },
    {
      id: 'die-mold',
      korean: '금형',
      english: 'Die/Mold',
      category: 'tooling',
      description: '제품 성형을 위한 금속 틀',
      aliases: ['몰드', '프레스 금형', '사출 금형'],
      examples: ['프레스 금형', '사출 금형', '다이캐스팅 금형'],
    },
    {
      id: 'press-forming',
      korean: '프레스 성형',
      english: 'Press Forming',
      category: 'process',
      description: '금형을 이용한 금속 판재 성형',
      aliases: ['프레스 가공', '판금 성형', 'Stamping'],
      examples: ['블랭킹', '드로잉', '벤딩'],
    },
    {
      id: 'tensile-strength',
      korean: '인장강도',
      english: 'Tensile Strength',
      category: 'property',
      description: '금속이 늘어나기 전까지 버틸 수 있는 최대 응력',
      aliases: ['인장 강도', 'TS', 'Ultimate Tensile Strength'],
      unit: 'MPa',
      validationRange: { min: 100, max: 2000 },
      examples: ['SS400: 400-510 MPa', 'STS304: 520 MPa'],
    },
  ],

  templates: [
    {
      id: 'heat-treatment-report',
      name: 'Heat Treatment Process Report',
      nameKo: '열처리 공정 보고서',
      format: 'XLSX',
      sections: [
        '처리 조건 (온도, 시간)',
        '경도 측정 결과',
        '미세조직 검사',
        '품질 합격 판정',
      ],
      estimatedGenerationTime: 45,
    },
    {
      id: 'plating-quality-report',
      name: 'Plating Quality Report',
      nameKo: '도금 품질 보고서',
      format: 'XLSX',
      sections: [
        '도금 두께 측정',
        '밀착력 시험',
        '내식성 시험',
        '외관 검사',
      ],
      estimatedGenerationTime: 45,
    },
    {
      id: 'die-mold-management',
      name: 'Die/Mold Management Report',
      nameKo: '금형 관리 대장',
      format: 'XLSX',
      sections: [
        '금형 이력',
        '타수 관리',
        '수리 이력',
        '예방 정비 일정',
      ],
      estimatedGenerationTime: 30,
    },
  ],

  rules: [
    {
      id: 'hardness-specification',
      name: 'Hardness Specification Check',
      description: '열처리 후 경도가 사양 범위 내 충족 필요',
      condition: 'hardness < min_spec OR hardness > max_spec',
      action: 'Re-heat treat or reject part',
      severity: 'error',
      regulatoryRef: 'KS D 0027',
    },
    {
      id: 'plating-thickness',
      name: 'Plating Thickness Minimum',
      description: '도금 두께 최소 기준 충족',
      condition: 'plating_thickness < minimum',
      action: 'Re-plate or reject part',
      severity: 'error',
      regulatoryRef: 'KS D 0223',
    },
    {
      id: 'die-life-monitoring',
      name: 'Die Life Monitoring',
      description: '금형 수명 관리 (타수 기준)',
      condition: 'shot_count >= life_limit',
      action: 'Schedule die maintenance or replacement',
      severity: 'warning',
    },
  ],

  keywords: ['열처리', '도금', '금형', '프레스', '경도', '인장강도', 'KSIC 24-25'],
  regulatoryBodies: ['산업통상자원부', '한국금속재료연구원', '안전보건공단'],
  color: 'slate',

  tokenBudget: {
    metadata: 50,
    terminology: 500,
    full: 2000,
  },
}
