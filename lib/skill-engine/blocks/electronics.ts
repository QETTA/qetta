/**
 * ELECTRONICS Industry BLOCK
 * Category: manufacturing
 * KSIC: 26, 27 (전자/반도체 제조)
 *
 * v2.1: SEMICONDUCTOR 블록 흡수
 */
import type { EnrichedIndustryBlock } from './types'

export const ELECTRONICS_BLOCK: EnrichedIndustryBlock = {
  id: 'ELECTRONICS',
  name: 'Electronics & Semiconductor',
  nameKo: '전자/반도체',
  category: 'manufacturing',
  description: 'Electronics manufacturing, PCB assembly, semiconductor fabrication, display production, and quality compliance reporting',
  descriptionKo: '전자 제품 제조, PCB 조립, 반도체 공정, 디스플레이 생산, 품질 준수 보고서',

  terminology: [
    // === PCB/SMT 관련 ===
    {
      id: 'smt',
      korean: '표면 실장 기술',
      english: 'Surface Mount Technology',
      category: 'process',
      description: 'PCB 표면에 부품을 직접 실장하는 기술',
      aliases: ['SMT', '표면실장', 'surface mount'],
      examples: ['SMT 라인', '리플로우', '솔더링'],
    },
    {
      id: 'aoi',
      korean: '자동 광학 검사',
      english: 'Automated Optical Inspection',
      category: 'quality',
      description: '광학 카메라를 이용한 자동 검사',
      aliases: ['AOI', '광학검사'],
      examples: ['PCB 결함 검사', '솔더 검사'],
    },
    {
      id: 'dppm',
      korean: '백만분율 불량률',
      english: 'Defects Per Million',
      category: 'metric',
      unit: 'ppm',
      description: '백만 개당 불량 개수',
      aliases: ['DPPM', 'ppm', '불량률'],
      validationRange: { min: 0, max: 10000 },
      examples: ['< 100 ppm 목표', 'Six Sigma 수준'],
    },
    {
      id: 'first-pass-yield',
      korean: '일회 합격률',
      english: 'First Pass Yield',
      category: 'metric',
      unit: '%',
      description: '재작업 없이 일회 합격한 비율',
      aliases: ['FPY', 'first-time yield'],
      validationRange: { min: 0, max: 100 },
      examples: ['95% FPY', '99% 목표'],
    },
    {
      id: 'rohs',
      korean: '유해물질 제한 지침',
      english: 'Restriction of Hazardous Substances',
      category: 'regulation',
      description: 'EU 전자제품 유해물질 사용 제한',
      aliases: ['RoHS', 'RoHS 2.0'],
      regulatoryRef: 'EU Directive 2011/65/EU',
      examples: ['납 프리', '친환경 인증'],
    },
    {
      id: 'esd',
      korean: '정전기 방전',
      english: 'Electrostatic Discharge',
      category: 'protection',
      description: '정전기로 인한 전자부품 손상 방지',
      aliases: ['ESD', '정전기'],
      examples: ['ESD 보호복', '접지 매트'],
    },
    {
      id: 'msl',
      korean: '습기 민감도 등급',
      english: 'Moisture Sensitivity Level',
      category: 'handling',
      description: '부품의 습기 민감도 분류',
      aliases: ['MSL', '습기등급'],
      examples: ['MSL 3 (168시간)', 'MSL 1 (무제한)'],
    },
    // === 반도체 관련 (SEMICONDUCTOR 흡수) ===
    {
      id: 'wafer-yield',
      korean: '웨이퍼 수율',
      english: 'Wafer Yield',
      category: 'metric',
      unit: '%',
      description: '전체 웨이퍼 중 양품 비율',
      aliases: ['yield', '수율', 'good die'],
      validationRange: { min: 0, max: 100 },
      examples: ['70% 수율', '85% 목표'],
    },
    {
      id: 'cleanroom',
      korean: '클린룸',
      english: 'Cleanroom',
      category: 'facility',
      description: '반도체 제조를 위한 청정 환경',
      aliases: ['클린룸', 'clean room', '청정실'],
      regulatoryRef: 'ISO 14644-1',
      examples: ['Class 1 클린룸', '파티클 관리'],
    },
    {
      id: 'fab-process',
      korean: 'FAB 공정',
      english: 'Fabrication Process',
      category: 'process',
      description: '반도체 칩 제조 공정',
      aliases: ['FAB', 'fabrication', '팹'],
      examples: ['전공정', '후공정', '패키징'],
    },
    {
      id: 'spc',
      korean: '통계적 공정 관리',
      english: 'Statistical Process Control',
      category: 'quality',
      description: '공정 변동 통계적 모니터링',
      aliases: ['SPC', '관리도'],
      examples: ['UCL/LCL', 'Cp/Cpk'],
    },
  ],

  templates: [
    {
      id: 'pcb-production-report',
      name: 'PCB Production Report',
      nameKo: 'PCB 생산 보고서',
      format: 'XLSX',
      sections: [
        '생산 수량',
        'FPY (일회 합격률)',
        'AOI 검출 불량',
        '재작업 내역',
        'DPPM 추이',
      ],
      estimatedGenerationTime: 60,
    },
    {
      id: 'rohs-compliance-report',
      name: 'RoHS Compliance Report',
      nameKo: 'RoHS 준수 보고서',
      format: 'PDF',
      sections: [
        'RoHS 적합성 선언',
        '유해물질 분석 결과',
        '부품 공급사 인증서',
        '테스트 레포트 (XRF)',
      ],
      estimatedGenerationTime: 90,
    },
    {
      id: 'esd-audit-checklist',
      name: 'ESD Audit Checklist',
      nameKo: 'ESD 감사 체크리스트',
      format: 'DOCX',
      sections: [
        '작업장 접지 상태',
        'ESD 보호 장비 착용',
        '정전기 측정 결과',
        '부적합 사항',
        '시정 조치',
      ],
      estimatedGenerationTime: 45,
    },
  ],

  rules: [
    {
      id: 'rohs-compliance',
      name: 'RoHS Compliance Requirement',
      description: 'RoHS 제한 물질 사용 금지',
      condition: 'export_to_eu = true',
      action: 'Require RoHS compliance certificate for all components',
      severity: 'error',
      regulatoryRef: 'EU Directive 2011/65/EU',
    },
    {
      id: 'aoi-defect-threshold',
      name: 'AOI Defect Threshold',
      description: 'AOI 불량률 5% 초과 시 라인 정지',
      condition: 'aoi_defect_rate > 5%',
      action: 'Stop production line and conduct process review',
      severity: 'error',
      regulatoryRef: 'IPC-A-610 Class 2',
    },
    {
      id: 'msl-floor-life',
      name: 'MSL Floor Life Management',
      description: 'MSL 등급별 작업 시간 제한 준수',
      condition: 'msl_exposure_time > allowed_floor_life',
      action: 'Bake component before reflow soldering',
      severity: 'warning',
      regulatoryRef: 'IPC/JEDEC J-STD-033',
    },
  ],

  keywords: ['SMT', 'PCB', 'AOI', 'RoHS', 'ESD', 'FPY', 'DPPM', 'Wafer', 'FAB', '클린룸', 'SPC', '전자', '반도체', 'KSIC 26-27'],
  regulatoryBodies: ['산업통상자원부', 'IPC', 'JEDEC', 'EU', 'SEMI', 'ISO'],
  color: 'cyan',

  tokenBudget: {
    metadata: 50,
    terminology: 500,
    full: 2000,
  },
}
