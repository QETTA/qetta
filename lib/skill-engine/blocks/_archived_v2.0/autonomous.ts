/**
 * AUTONOMOUS Industry BLOCK
 * Category: advancedTech
 */
import type { EnrichedIndustryBlock } from './types'

export const AUTONOMOUS_BLOCK: EnrichedIndustryBlock = {
  id: 'AUTONOMOUS',
  name: 'Autonomous Driving',
  nameKo: '자율주행',
  category: 'advancedTech',
  description: 'Autonomous vehicle development, ADAS testing, sensor fusion, and road safety compliance reporting',
  descriptionKo: '자율주행차 개발, ADAS 테스트, 센서 융합, 도로 안전 규제 보고서',

  terminology: [
    {
      id: 'sae-level',
      korean: 'SAE 자율주행 레벨',
      english: 'SAE Automation Level',
      category: 'standard',
      description: 'SAE J3016 자율주행 단계 분류 (Level 0~5)',
      aliases: ['SAE Level', '자율주행 단계'],
      regulatoryRef: 'SAE J3016',
      validationRange: { min: 0, max: 5 },
      examples: ['Level 2 (부분 자동화)', 'Level 4 (고도 자동화)'],
    },
    {
      id: 'adas',
      korean: '첨단 운전자 보조 시스템',
      english: 'Advanced Driver Assistance Systems',
      category: 'system',
      description: '운전자 보조 안전 시스템',
      aliases: ['ADAS', '운전자 보조'],
      examples: ['차선 유지', '충돌 회피', 'ACC'],
    },
    {
      id: 'lidar',
      korean: '라이다',
      english: 'Light Detection and Ranging',
      category: 'sensor',
      description: '레이저 기반 거리 측정 센서',
      aliases: ['LiDAR', '라이다'],
      examples: ['3D point cloud', '360도 스캔'],
    },
    {
      id: 'sensor-fusion',
      korean: '센서 융합',
      english: 'Sensor Fusion',
      category: 'technology',
      description: '다중 센서 데이터 통합 처리',
      aliases: ['fusion', '센서 퓨전'],
      examples: ['카메라 + 라이다', '레이더 + 초음파'],
    },
    {
      id: 'v2x',
      korean: '차량 통신',
      english: 'Vehicle-to-Everything',
      category: 'communication',
      description: '차량과 외부 통신 기술',
      aliases: ['V2X', 'V2V', 'V2I'],
      examples: ['V2V (차량간)', 'V2I (인프라)'],
    },
    {
      id: 'ota',
      korean: '무선 업데이트',
      english: 'Over-the-Air Update',
      category: 'technology',
      description: '차량 소프트웨어 무선 업데이트',
      aliases: ['OTA', '원격 업데이트'],
      examples: ['펌웨어 업데이트', '기능 추가'],
    },
    {
      id: 'mil-sil-hil',
      korean: '시뮬레이션 테스트',
      english: 'Model/Software/Hardware-in-the-Loop',
      category: 'testing',
      description: '단계별 시뮬레이션 검증',
      aliases: ['MIL', 'SIL', 'HIL'],
      examples: ['MIL (모델)', 'SIL (소프트웨어)', 'HIL (하드웨어)'],
    },
  ],

  templates: [
    {
      id: 'adas-validation-report',
      name: 'ADAS Validation Report',
      nameKo: 'ADAS 검증 보고서',
      format: 'PDF',
      sections: [
        'Test Scenario',
        'Sensor Performance',
        'Algorithm Accuracy',
        'Safety Validation',
        'Euro NCAP Compliance',
      ],
      estimatedGenerationTime: 120,
    },
    {
      id: 'sensor-calibration-report',
      name: 'Sensor Calibration Report',
      nameKo: '센서 캘리브레이션 보고서',
      format: 'DOCX',
      sections: [
        '카메라 캘리브레이션',
        '라이다 정렬',
        '레이더 조정',
        '센서 융합 검증',
        '오차 분석',
      ],
      estimatedGenerationTime: 90,
    },
    {
      id: 'autonomous-test-log',
      name: 'Autonomous Driving Test Log',
      nameKo: '자율주행 테스트 로그',
      format: 'XLSX',
      sections: [
        '주행 거리',
        'Disengagement 이력',
        '안전 운전자 개입',
        '환경 조건 (날씨, 도로)',
        '이벤트 로그',
      ],
      estimatedGenerationTime: 60,
    },
  ],

  rules: [
    {
      id: 'sae-level-certification',
      name: 'SAE Level Certification',
      description: 'SAE 자율주행 레벨 인증 요구사항',
      condition: 'autonomous_feature_enabled = true',
      action: 'Certify SAE level and validate safety compliance',
      severity: 'error',
      regulatoryRef: 'SAE J3016',
    },
    {
      id: 'disengagement-reporting',
      name: 'Disengagement Reporting (California DMV)',
      description: '자율주행 해제 사례 보고 의무',
      condition: 'testing_in_california = true',
      action: 'Report all disengagements to California DMV annually',
      severity: 'error',
      regulatoryRef: 'California DMV Autonomous Vehicle Tester Program',
    },
    {
      id: 'sensor-redundancy',
      name: 'Sensor Redundancy Requirement',
      description: 'Level 3+ 자율주행 센서 이중화 필수',
      condition: 'sae_level >= 3',
      action: 'Ensure redundant sensors for critical functions',
      severity: 'error',
      regulatoryRef: 'ISO 26262 (ASIL-D)',
    },
  ],

  keywords: ['ADAS', 'LiDAR', 'sensor fusion', 'V2X', 'SAE level', '자율주행', 'autonomous'],
  regulatoryBodies: ['국토교통부', 'SAE International', 'California DMV', 'Euro NCAP'],
  color: 'violet',

  tokenBudget: {
    metadata: 50,
    terminology: 500,
    full: 2000,
  },
}
