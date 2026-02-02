/**
 * QETTA Government Support Skills
 *
 * 정부지원사업 도메인 - 공고 및 정책 기반 지능적 문서 생성
 *
 * 지원 프로그램:
 * - 예비창업 패키지 (창업진흥원)
 * - 초기창업 패키지 (창업진흥원)
 * - TIPS 프로그램
 * - 창업도약 패키지
 * - R&D 바우처
 * - AI 바우처 (NIPA)
 * - 스마트공장 (중기부)
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import type { DocumentSkill, SkillPackage, GovernmentProgram, FundingSource } from '../../types'
import { DISPLAY_METRICS } from '@/constants/metrics'

// ============================================
// 정부지원사업 프로그램 DB
// ============================================

export type StartupStage =
  | 'pre_startup' // 예비창업 (사업자등록 전)
  | 'early_startup' // 초기창업 (3년 이내)
  | 'growth_startup' // 창업도약 (3~7년)
  | 'scale_up' // 스케일업 (7년+)

export type ProgramCategory =
  | 'startup_package' // 창업 패키지
  | 'tips' // TIPS
  | 'rnd' // R&D 지원
  | 'voucher' // 바우처
  | 'smart_factory' // 스마트공장
  | 'export' // 수출 지원
  | 'loan' // 정책 융자
  | 'guarantee' // 보증 지원

export interface GovSupportProgram extends GovernmentProgram {
  stage: StartupStage[]
  category: ProgramCategory

  // 신청서 구조 (공고 기반)
  applicationStructure: {
    sections: ApplicationSection[]
    maxPages?: number
    fontRequirements?: {
      family: string
      size: number
      lineSpacing: number
    }
  }

  // 평가 기준 (공고 기반)
  evaluationCriteria: EvaluationCriterion[]

  // 탈락 주요 사유 (학습된 패턴)
  commonRejections: string[]

  // 키워드 (매칭용)
  keywords: string[]
}

export interface ApplicationSection {
  id: string
  title: string
  titleEn?: string
  maxLength?: number // 글자 수 또는 페이지
  required: boolean
  weight?: number // 배점
  tips: string[] // 작성 팁
  examples?: string[] // 예시 문구
  checklist: string[] // 자체 점검 항목
}

export interface EvaluationCriterion {
  category: string
  weight: number // %
  subCriteria: {
    name: string
    points: number
    description: string
    goodExample?: string
    badExample?: string
  }[]
}

// ============================================
// 예비창업 패키지 (가장 많은 지원자)
// ============================================

export const PRE_STARTUP_PACKAGE: GovSupportProgram = {
  id: 'pre-startup-2026',
  name: '2026년 예비창업패키지',
  nameEn: 'Pre-Startup Package 2026',
  source: 'MSS' as FundingSource,
  type: 'grant',
  domain: 'general',
  stage: ['pre_startup'],
  category: 'startup_package',

  eligibility: {
    companyAge: { max: 0 }, // 사업자등록 전
    employeeCount: { max: 0 },
    revenue: { max: 0 },
    regions: ['전국'],
  },

  support: {
    maxAmount: 10000, // 1억원
    matchingRatio: 0, // 자부담 0%
    duration: 10, // 10개월
  },

  schedule: {
    announcementDate: '2026-01-15',
    applicationStart: '2026-02-01',
    applicationEnd: '2026-03-15',
    selectionDate: '2026-04-30',
    contractDate: '2026-05-15',
  },

  metadata: {
    url: 'https://www.k-startup.go.kr',
    lastUpdated: '2026-01-22',
    popularity: 50, // 50:1 경쟁률
    selectionRate: 2, // 2%
  },

  keywords: ['예비창업', '사업화', '시제품', '초기창업', '1억'],

  // ========== 신청서 구조 (공고 기반) ==========
  applicationStructure: {
    maxPages: 15,
    fontRequirements: {
      family: '맑은고딕',
      size: 11,
      lineSpacing: 160,
    },
    sections: [
      {
        id: 'exec-summary',
        title: '1. 창업아이템 요약',
        required: true,
        maxLength: 500, // 글자
        weight: 0,
        tips: [
          '한 문장으로 핵심 가치 전달',
          '타겟 고객과 해결 문제 명시',
          '차별점을 구체적 수치로 표현',
        ],
        checklist: [
          '아이템명이 명확한가?',
          '목표 시장이 명시되었는가?',
          '핵심 기술/서비스가 요약되었는가?',
        ],
      },
      {
        id: 'problem',
        title: '2. 문제 인식 (Problem)',
        required: true,
        weight: 15,
        tips: [
          '고객 인터뷰 등 실제 데이터 인용',
          '현재 대안의 한계점 구체화',
          '문제의 심각성을 수치로 표현',
          '개인 경험보다 시장 관점에서 서술',
        ],
        examples: [
          '국내 중소제조업의 78%가 수작업 문서 작성에 월 40시간 이상 소요 (2025 중기부 실태조사)',
        ],
        checklist: [
          '문제가 실제 존재하는가? (검증)',
          '문제의 규모가 충분히 큰가?',
          '해당 문제를 겪는 고객군이 명확한가?',
          '기존 해결책의 한계가 명시되었는가?',
        ],
      },
      {
        id: 'solution',
        title: '3. 해결 방안 (Solution)',
        required: true,
        weight: 20,
        tips: [
          '기술보다 고객 가치 먼저',
          'Before/After 시각화',
          '차별점 3가지 이내로 집중',
          '실현 가능성 입증 (프로토타입, 특허)',
        ],
        examples: [
          `기존: 8시간 수작업 → QETTA: 30분 자동화 (${DISPLAY_METRICS.timeSaved.value} 단축)`,
        ],
        checklist: [
          '솔루션이 문제를 직접 해결하는가?',
          '기술적 실현 가능성이 있는가?',
          '차별점이 명확한가?',
          '고객 가치가 수치화되었는가?',
        ],
      },
      {
        id: 'market',
        title: '4. 시장 분석',
        required: true,
        weight: 15,
        tips: [
          'TAM-SAM-SOM 구조 활용',
          '공인된 시장 조사 자료 인용',
          '경쟁사 대비 포지셔닝 맵',
          '진입 장벽 및 대응 전략',
        ],
        checklist: [
          'TAM/SAM/SOM이 논리적으로 연결되는가?',
          '시장 성장률이 명시되었는가?',
          '경쟁사 분석이 포함되었는가?',
          '시장 진입 전략이 있는가?',
        ],
      },
      {
        id: 'business-model',
        title: '5. 비즈니스 모델',
        required: true,
        weight: 15,
        tips: [
          '수익 모델 구체화 (구독, 건당, 라이센스)',
          '고객 획득 비용(CAC) vs 생애가치(LTV)',
          '파이프라인 고객 명시',
          '가격 정책 근거',
        ],
        checklist: [
          '수익 모델이 명확한가?',
          '가격 책정 근거가 있는가?',
          '고객 확보 전략이 있는가?',
          '확장 가능성이 있는가?',
        ],
      },
      {
        id: 'team',
        title: '6. 팀 구성',
        required: true,
        weight: 20,
        tips: [
          '대표자 관련 경험 강조',
          '핵심 역량의 보완성',
          '창업 동기와 진정성',
          '부족한 역량 보완 계획',
        ],
        checklist: [
          '대표자 역량이 아이템과 연결되는가?',
          '팀 구성이 균형 잡혔는가?',
          '각 역할이 명확한가?',
          '창업 동기가 진정성 있는가?',
        ],
      },
      {
        id: 'execution-plan',
        title: '7. 사업화 계획',
        required: true,
        weight: 15,
        tips: [
          '마일스톤 기반 10개월 로드맵',
          '예산 항목별 타당성',
          '위험 요소 및 대응 방안',
          '측정 가능한 KPI 설정',
        ],
        checklist: [
          '일정이 현실적인가?',
          '예산 배분이 적정한가?',
          'KPI가 측정 가능한가?',
          '리스크 대응 계획이 있는가?',
        ],
      },
    ],
  },

  // ========== 평가 기준 (2026 공고 기반) ==========
  evaluationCriteria: [
    {
      category: '문제 인식 및 해결 방안',
      weight: 35,
      subCriteria: [
        {
          name: '문제 정의의 명확성',
          points: 15,
          description: '목표 고객의 문제를 구체적으로 정의하고 시장 검증 여부',
          goodExample: '중소제조업 품질관리 담당자 100명 인터뷰 결과, 87%가 문서화 어려움 호소',
          badExample: '많은 기업들이 문서 작성에 어려움을 겪고 있음',
        },
        {
          name: '해결 방안의 혁신성',
          points: 20,
          description: '기존 대안 대비 차별화된 접근, 기술적 실현 가능성',
          goodExample: `도메인 특화 LLM으로 ${DISPLAY_METRICS.timeSaved.value} 시간 단축 (8시간→30분), 특허 출원 완료`,
          badExample: 'AI를 활용한 혁신적인 솔루션',
        },
      ],
    },
    {
      category: '시장성 및 사업화 가능성',
      weight: 30,
      subCriteria: [
        {
          name: '목표 시장 규모',
          points: 15,
          description: 'TAM-SAM-SOM의 논리적 연결, 성장 가능성',
          goodExample: 'TAM $2B (글로벌 문서자동화) → SAM $200M (한국) → SOM $20M (정부사업)',
          badExample: '시장 규모가 매우 큼',
        },
        {
          name: '비즈니스 모델',
          points: 15,
          description: '수익 모델의 구체성, 지속 가능성',
          goodExample: 'B2B SaaS 월 99만원, CAC 50만원, LTV 2,400만원 (24개월)',
          badExample: '구독 모델로 수익 창출',
        },
      ],
    },
    {
      category: '팀 역량',
      weight: 20,
      subCriteria: [
        {
          name: '대표자 적합성',
          points: 12,
          description: '아이템 관련 경험, 전문성, 창업 동기',
          goodExample: '삼성전자 MES 개발 5년, 스마트공장 프로젝트 리드 경험',
          badExample: 'IT 분야 경력 다수',
        },
        {
          name: '팀 구성',
          points: 8,
          description: '역할 분담, 보완적 역량 구성',
          goodExample: 'CEO(사업), CTO(기술), CSO(영업) 각각 10년+ 경력, 이전 협업 경험',
          badExample: '열정적인 팀원들로 구성',
        },
      ],
    },
    {
      category: '사업화 계획',
      weight: 15,
      subCriteria: [
        {
          name: '실행 계획의 구체성',
          points: 10,
          description: '마일스톤, 예산 계획, KPI',
          goodExample: 'M1-3: MVP 개발, M4-6: 베타 테스트 (10개사), M7-10: 정식 출시, MAU 500 목표',
          badExample: '제품 개발 후 마케팅 진행 예정',
        },
        {
          name: '위험 관리',
          points: 5,
          description: '예상 리스크 및 대응 방안',
        },
      ],
    },
  ],

  // ========== 탈락 주요 사유 (학습된 패턴) ==========
  commonRejections: [
    '문제 정의가 추상적이고 시장 검증 부재',
    '솔루션의 차별점이 불명확 (기존 대비 우위 미입증)',
    '시장 규모 산정 근거 불충분',
    '대표자 경험과 아이템의 연관성 부족',
    '사업화 계획이 비현실적 (일정, 예산)',
    '비즈니스 모델의 수익성 불투명',
    '팀 구성의 불균형 (기술 또는 사업 역량 부재)',
    '경쟁사 분석 부재 또는 피상적',
  ],
}

// ============================================
// 초기창업 패키지
// ============================================

export const EARLY_STARTUP_PACKAGE: GovSupportProgram = {
  id: 'early-startup-2026',
  name: '2026년 초기창업패키지',
  nameEn: 'Early Startup Package 2026',
  source: 'MSS' as FundingSource,
  type: 'grant',
  domain: 'general',
  stage: ['early_startup'],
  category: 'startup_package',

  eligibility: {
    companyAge: { min: 0, max: 3 }, // 3년 이내
    employeeCount: { max: 10 },
    revenue: { max: 10 }, // 10억 이하
    regions: ['전국'],
  },

  support: {
    maxAmount: 10000, // 1억원
    matchingRatio: 10, // 자부담 10%
    duration: 10,
  },

  schedule: {
    announcementDate: '2026-02-01',
    applicationStart: '2026-03-01',
    applicationEnd: '2026-04-15',
    selectionDate: '2026-05-31',
    contractDate: '2026-06-15',
  },

  metadata: {
    url: 'https://www.k-startup.go.kr',
    lastUpdated: '2026-01-22',
    popularity: 30,
    selectionRate: 3.3,
  },

  keywords: ['초기창업', '스케일업', '사업화', '매출', '3년이내'],

  applicationStructure: {
    maxPages: 20,
    fontRequirements: {
      family: '맑은고딕',
      size: 11,
      lineSpacing: 160,
    },
    sections: [
      {
        id: 'exec-summary',
        title: '1. 사업 요약',
        required: true,
        weight: 0,
        tips: ['현재까지의 성과 강조', '지원금 활용 후 목표 명시', '스케일업 가능성 어필'],
        checklist: ['창업 이후 성과가 요약되었는가?', '이번 지원의 목적이 명확한가?'],
      },
      {
        id: 'current-status',
        title: '2. 현재 사업 현황',
        required: true,
        weight: 15,
        tips: [
          '매출, 고객 수 등 정량 지표',
          '피벗 이력이 있다면 학습 포인트',
          '기존 투자 유치 현황',
        ],
        checklist: [
          '현재 매출/고객 현황이 있는가?',
          '제품/서비스가 시장에 출시되었는가?',
          '초기 트랙션이 있는가?',
        ],
      },
      {
        id: 'growth-strategy',
        title: '3. 성장 전략',
        required: true,
        weight: 25,
        tips: ['현재 → 목표까지 구체적 경로', '고객 확대 채널 전략', '예상 매출 성장 곡선'],
        checklist: ['성장 목표가 수치화되었는가?', '전략이 구체적인가?', '실현 가능성이 있는가?'],
      },
      // ... 예비창업과 유사한 섹션 + 트랙션 강조
    ],
  },

  evaluationCriteria: PRE_STARTUP_PACKAGE.evaluationCriteria, // 유사

  commonRejections: [
    '창업 이후 유의미한 트랙션 부재',
    '성장 전략의 구체성 부족',
    '예비창업 수준의 계획서 (초기창업에 미달)',
    '자부담 10% 준비 미흡',
    '기존 성과와 지원금 활용 계획의 연결성 부족',
  ],
}

// ============================================
// TIPS 프로그램
// ============================================

export const TIPS_PROGRAM: GovSupportProgram = {
  id: 'tips-2026',
  name: '2026년 TIPS 프로그램',
  nameEn: 'TIPS Program 2026',
  source: 'MSS' as FundingSource,
  type: 'grant',
  domain: 'general',
  stage: ['early_startup', 'growth_startup'],
  category: 'tips',

  eligibility: {
    companyAge: { max: 7 },
    employeeCount: { max: 30 },
    revenue: { max: 100 },
    certifications: ['벤처기업'],
  },

  support: {
    maxAmount: 50000, // 5억원 (R&D 최대)
    matchingRatio: 0,
    duration: 24,
  },

  schedule: {
    announcementDate: '2026-01-01',
    applicationStart: '2026-01-15',
    applicationEnd: '2026-12-31', // 연중 상시
    selectionDate: undefined, // 운영사별
    contractDate: undefined,
  },

  metadata: {
    url: 'https://www.jointips.or.kr',
    lastUpdated: '2026-01-22',
    popularity: 100, // 매우 높음
    selectionRate: 1, // 1%
  },

  keywords: ['TIPS', '5억', 'R&D', '운영사', '엔젤', '기술창업'],

  applicationStructure: {
    maxPages: 30,
    sections: [
      {
        id: 'tech-innovation',
        title: '1. 기술 혁신성',
        required: true,
        weight: 40, // TIPS는 기술 비중 높음
        tips: [
          '특허, 논문 등 IP 현황',
          '기술 수준 대비 글로벌 경쟁력',
          '기술 로드맵 (현재 → 3년 후)',
          '핵심 기술 인력 역량',
        ],
        checklist: [
          '핵심 기술이 명확한가?',
          'IP 확보 현황 또는 계획이 있는가?',
          '기술 인력 구성이 적정한가?',
          '기술 로드맵이 현실적인가?',
        ],
      },
      {
        id: 'global-potential',
        title: '2. 글로벌 시장성',
        required: true,
        weight: 30,
        tips: ['글로벌 진출 전략 구체화', '해외 경쟁사 대비 포지셔닝', '해외 PoC/파일럿 계획'],
        checklist: [
          '글로벌 시장 규모가 산정되었는가?',
          '해외 진출 전략이 있는가?',
          '해외 레퍼런스 확보 계획이 있는가?',
        ],
      },
      // ... TIPS 특화 섹션
    ],
  },

  evaluationCriteria: [
    {
      category: '기술 혁신성',
      weight: 40,
      subCriteria: [
        { name: '기술의 독창성', points: 20, description: '특허, 논문, 기술 격차' },
        { name: '기술 실현 가능성', points: 10, description: '프로토타입, 검증 현황' },
        { name: '기술 인력', points: 10, description: '핵심 인력 역량 및 경험' },
      ],
    },
    {
      category: '글로벌 시장성',
      weight: 30,
      subCriteria: [
        { name: '글로벌 시장 규모', points: 15, description: 'TAM 규모 및 성장성' },
        { name: '글로벌 경쟁력', points: 15, description: '경쟁사 대비 우위' },
      ],
    },
    {
      category: '팀 역량',
      weight: 20,
      subCriteria: [
        { name: '대표자/CTO 역량', points: 15, description: '기술 배경, 창업 경험' },
        { name: '팀 구성', points: 5, description: '보완적 역량' },
      ],
    },
    {
      category: '사업화 전략',
      weight: 10,
      subCriteria: [{ name: '사업화 계획', points: 10, description: '매출 계획, 마일스톤' }],
    },
  ],

  commonRejections: [
    '기술 혁신성 부족 (me-too 기술)',
    '글로벌 시장성 미입증',
    '핵심 기술 인력 부재',
    'IP 확보 전략 부재',
    '운영사 추천 기준 미달',
    '기존 TIPS 탈락 사유 미개선',
  ],
}

// ============================================
// All Programs Database
// ============================================

export const GOV_SUPPORT_PROGRAMS: GovSupportProgram[] = [
  PRE_STARTUP_PACKAGE,
  EARLY_STARTUP_PACKAGE,
  TIPS_PROGRAM,
]

// ============================================
// Skills Definition
// ============================================

export const GOV_SUPPORT_SKILLS: DocumentSkill[] = [
  {
    id: 'gov-pre-startup-plan',
    name: 'Pre-Startup Business Plan',
    nameKo: '예비창업 사업계획서 생성',
    category: 'document_generation',
    description: 'Generate business plan optimized for Pre-Startup Package evaluation criteria',
    version: '1.0.0',
    domains: ['DIGITAL', 'MANUFACTURING', 'ENVIRONMENT', 'EXPORT'],
    requiredPromptTokens: 15000, // 평가기준 + 섹션 가이드 포함
    outputFormats: ['DOCX', 'PDF'],
    templates: PRE_STARTUP_PACKAGE.applicationStructure.sections.map((s) => ({
      id: `pre-startup-${s.id}`,
      name: s.title,
      domain: 'DIGITAL' as const,
      sections: s.checklist,
      estimatedGenerationTime: 60,
    })),
  },
  {
    id: 'gov-early-startup-plan',
    name: 'Early Startup Business Plan',
    nameKo: '초기창업 사업계획서 생성',
    category: 'document_generation',
    description: 'Generate business plan for Early Startup Package with traction focus',
    version: '1.0.0',
    domains: ['DIGITAL', 'MANUFACTURING', 'ENVIRONMENT', 'EXPORT'],
    requiredPromptTokens: 15000,
    outputFormats: ['DOCX', 'PDF'],
    templates: [],
  },
  {
    id: 'gov-tips-plan',
    name: 'TIPS Business Plan',
    nameKo: 'TIPS 사업계획서 생성',
    category: 'document_generation',
    description: 'Generate TIPS application with tech innovation and global focus',
    version: '1.0.0',
    domains: ['DIGITAL', 'MANUFACTURING', 'ENVIRONMENT', 'EXPORT'],
    requiredPromptTokens: 20000,
    outputFormats: ['DOCX', 'PDF'],
    templates: [],
  },
  {
    id: 'gov-pre-validation',
    name: 'Application Pre-Validation',
    nameKo: '신청서 사전 검증',
    category: 'document_generation', // DocumentSkill은 document_generation만 허용
    description: 'Pre-validate application against known rejection patterns',
    version: '1.0.0',
    domains: ['DIGITAL', 'MANUFACTURING', 'ENVIRONMENT', 'EXPORT'],
    requiredPromptTokens: 10000,
    outputFormats: ['DOCX'],
    templates: [],
  },
]

// ============================================
// Skill Package
// ============================================

export const GOV_SUPPORT_SKILL_PACKAGE: SkillPackage = {
  id: 'pkg-gov-support-complete',
  name: 'Government Support Complete Package',
  nameKo: '정부지원사업 완전 패키지',
  description: '예비창업/초기창업/TIPS 사업계획서 생성 및 검증',
  skills: GOV_SUPPORT_SKILLS.map((s) => s.id),
  domain: 'general',
  tier: 'composite',
  estimatedCost: {
    perDocument: 0.5, // 복잡한 문서
    perMonth: 150,
    cacheEfficiency: 85,
  },
  metadata: {
    createdAt: '2026-01-22',
    updatedAt: '2026-01-22',
    usageCount: 0,
    rating: 0,
  },
}

// ============================================
// Document Generator Functions
// ============================================

export interface BusinessPlanContext {
  companyName: string
  founderName: string
  itemName: string
  itemDescription: string
  targetCustomer: string
  problemStatement: string
  solutionDescription: string
  differentiation: string[]
  marketSize: {
    tam: { value: number; unit: string; source: string }
    sam: { value: number; unit: string }
    som: { value: number; unit: string }
  }
  businessModel: {
    type: 'subscription' | 'transaction' | 'license' | 'hybrid'
    pricing: string
    cac?: number
    ltv?: number
  }
  team: Array<{
    name: string
    role: string
    experience: string
    relevance: string
  }>
  traction?: {
    revenue?: number
    customers?: number
    growth?: string
  }
  milestones: Array<{
    month: number
    milestone: string
    kpi: string
  }>
}

export function generatePreStartupPlan(
  context: BusinessPlanContext,
  program: GovSupportProgram = PRE_STARTUP_PACKAGE
): string {
  const content = `
# ${program.name} 사업계획서

**아이템명**: ${context.itemName}
**신청자**: ${context.founderName}
**기업명**: ${context.companyName || '(예비)'}

---

## 1. 창업아이템 요약

**아이템명**: ${context.itemName}

${context.itemDescription}

**타겟 고객**: ${context.targetCustomer}

**핵심 차별점**:
${context.differentiation.map((d, i) => `${i + 1}. ${d}`).join('\n')}

---

## 2. 문제 인식 (Problem)

### 2.1 목표 고객이 겪는 문제

${context.problemStatement}

### 2.2 기존 해결책의 한계

(이 섹션에서 기존 대안이 왜 불충분한지 설명)

---

## 3. 해결 방안 (Solution)

### 3.1 솔루션 개요

${context.solutionDescription}

### 3.2 차별화 포인트

| 구분 | 기존 방식 | ${context.itemName} |
|------|----------|-------------------|
${context.differentiation.map((d) => `| ${d.split(':')[0] || d} | - | ✅ |`).join('\n')}

---

## 4. 시장 분석

### 4.1 시장 규모 (TAM-SAM-SOM)

| 구분 | 규모 | 설명 |
|------|------|------|
| TAM | ${context.marketSize.tam.value}${context.marketSize.tam.unit} | ${context.marketSize.tam.source} |
| SAM | ${context.marketSize.sam.value}${context.marketSize.sam.unit} | 국내 목표 시장 |
| SOM | ${context.marketSize.som.value}${context.marketSize.som.unit} | 3년 내 확보 목표 |

### 4.2 경쟁사 분석

(경쟁사 대비 포지셔닝 맵 삽입)

---

## 5. 비즈니스 모델

**수익 모델**: ${context.businessModel.type === 'subscription' ? '구독형 SaaS' : context.businessModel.type}

**가격 정책**: ${context.businessModel.pricing}

${
  context.businessModel.cac && context.businessModel.ltv
    ? `
**Unit Economics**:
- 고객 획득 비용 (CAC): ${context.businessModel.cac.toLocaleString()}원
- 고객 생애 가치 (LTV): ${context.businessModel.ltv.toLocaleString()}원
- LTV/CAC: ${(context.businessModel.ltv / context.businessModel.cac).toFixed(1)}x
`
    : ''
}

---

## 6. 팀 구성

| 이름 | 역할 | 주요 경력 | 아이템 연관성 |
|------|------|----------|--------------|
${context.team.map((t) => `| ${t.name} | ${t.role} | ${t.experience} | ${t.relevance} |`).join('\n')}

---

## 7. 사업화 계획

### 7.1 마일스톤

| 월차 | 마일스톤 | 핵심 KPI |
|------|----------|----------|
${context.milestones.map((m) => `| M${m.month} | ${m.milestone} | ${m.kpi} |`).join('\n')}

### 7.2 예산 계획

(상세 예산 계획 삽입)

### 7.3 위험 관리

| 위험 요소 | 발생 가능성 | 대응 방안 |
|----------|------------|----------|
| 기술 개발 지연 | 중 | 외부 전문가 자문 확보 |
| 고객 확보 부진 | 중 | 파일럿 고객 사전 확보 |
| 경쟁 심화 | 고 | 핵심 기술 IP 확보 |

---

## 첨부 자료

1. 시제품/프로토타입 스크린샷
2. 고객 인터뷰 결과
3. 시장 조사 자료
4. 팀원 이력서

---

*본 사업계획서는 QETTA Gov Support 엔진에 의해 생성되었습니다.*
*${program.name} 평가기준 기반 최적화*
*생성일: ${new Date().toISOString().split('T')[0]}*
`

  return content.trim()
}

// ============================================
// Pre-Validation Function
// ============================================

export function preValidateApplication(
  context: BusinessPlanContext,
  _program: GovSupportProgram // Reserved for future program-specific validation rules
): {
  score: number
  breakdown: Record<string, number>
  warnings: string[]
  suggestions: string[]
  rejectionRisks: string[]
} {
  const warnings: string[] = []
  const suggestions: string[] = []
  const rejectionRisks: string[] = []
  const breakdown: Record<string, number> = {}

  let totalScore = 0

  // 문제 인식 검증
  if (!context.problemStatement || context.problemStatement.length < 200) {
    warnings.push('문제 인식 섹션이 너무 짧습니다')
    suggestions.push('구체적인 시장 데이터와 고객 인터뷰 결과를 추가하세요')
    rejectionRisks.push('문제 정의가 추상적이고 시장 검증 부재')
    breakdown['problem'] = 50
  } else {
    breakdown['problem'] = 80
  }
  totalScore += breakdown['problem'] * 0.15

  // 차별점 검증
  if (context.differentiation.length < 2) {
    warnings.push('차별점이 2개 미만입니다')
    suggestions.push('최소 3개의 명확한 차별점을 제시하세요')
    rejectionRisks.push('솔루션의 차별점이 불명확')
    breakdown['differentiation'] = 40
  } else {
    breakdown['differentiation'] = 85
  }
  totalScore += breakdown['differentiation'] * 0.2

  // 시장 규모 검증
  if (!context.marketSize.tam.source) {
    warnings.push('시장 규모 출처가 없습니다')
    suggestions.push('공인된 시장 조사 기관 자료를 인용하세요')
    rejectionRisks.push('시장 규모 산정 근거 불충분')
    breakdown['market'] = 50
  } else {
    breakdown['market'] = 80
  }
  totalScore += breakdown['market'] * 0.15

  // 팀 검증
  if (context.team.length < 2) {
    warnings.push('팀 구성이 부족합니다')
    suggestions.push('핵심 역할(기술, 사업)별 인력을 확보하세요')
    breakdown['team'] = 50
  } else {
    const hasRelevance = context.team.every((t) => t.relevance && t.relevance.length > 20)
    if (!hasRelevance) {
      warnings.push('팀원의 아이템 연관성 설명이 부족합니다')
      rejectionRisks.push('대표자 경험과 아이템의 연관성 부족')
      breakdown['team'] = 60
    } else {
      breakdown['team'] = 90
    }
  }
  totalScore += breakdown['team'] * 0.2

  // 비즈니스 모델 검증
  if (!context.businessModel.pricing) {
    warnings.push('가격 정책이 명시되지 않았습니다')
    rejectionRisks.push('비즈니스 모델의 수익성 불투명')
    breakdown['business_model'] = 40
  } else if (!context.businessModel.cac || !context.businessModel.ltv) {
    warnings.push('Unit Economics (CAC, LTV)가 없습니다')
    suggestions.push('고객 획득 비용과 생애 가치를 추정하세요')
    breakdown['business_model'] = 65
  } else {
    breakdown['business_model'] = 85
  }
  totalScore += breakdown['business_model'] * 0.15

  // 마일스톤 검증
  if (context.milestones.length < 5) {
    warnings.push('마일스톤이 5개 미만입니다')
    suggestions.push('10개월 로드맵을 상세히 작성하세요')
    rejectionRisks.push('사업화 계획이 비현실적')
    breakdown['milestones'] = 50
  } else {
    breakdown['milestones'] = 80
  }
  totalScore += breakdown['milestones'] * 0.15

  return {
    score: Math.round(totalScore),
    breakdown,
    warnings,
    suggestions,
    rejectionRisks,
  }
}

// ============================================
// Find Best Matching Programs
// ============================================

export function findMatchingPrograms(
  company: {
    age: number // 업력 (년)
    employees: number
    revenue: number // 억원
    region: string
    certifications: string[]
  },
  preferredCategories?: ProgramCategory[]
): Array<{
  program: GovSupportProgram
  matchScore: number
  eligibilityIssues: string[]
}> {
  const results: Array<{
    program: GovSupportProgram
    matchScore: number
    eligibilityIssues: string[]
  }> = []

  for (const program of GOV_SUPPORT_PROGRAMS) {
    let matchScore = 100
    const eligibilityIssues: string[] = []

    // 업력 체크
    const { companyAge } = program.eligibility
    if (companyAge?.max !== undefined && company.age > companyAge.max) {
      matchScore -= 50
      eligibilityIssues.push(`업력 초과: ${company.age}년 > ${companyAge.max}년`)
    }
    if (companyAge?.min !== undefined && company.age < companyAge.min) {
      matchScore -= 30
      eligibilityIssues.push(`업력 미달: ${company.age}년 < ${companyAge.min}년`)
    }

    // 매출 체크
    const { revenue } = program.eligibility
    if (revenue?.max !== undefined && company.revenue > revenue.max) {
      matchScore -= 40
      eligibilityIssues.push(`매출 초과: ${company.revenue}억 > ${revenue.max}억`)
    }

    // 종업원 체크
    const { employeeCount } = program.eligibility
    if (employeeCount?.max !== undefined && company.employees > employeeCount.max) {
      matchScore -= 40
      eligibilityIssues.push(`종업원 초과: ${company.employees}명 > ${employeeCount.max}명`)
    }

    // 인증 체크
    const { certifications } = program.eligibility
    if (certifications) {
      const missing = certifications.filter((c) => !company.certifications.includes(c))
      if (missing.length > 0) {
        matchScore -= 20 * missing.length
        eligibilityIssues.push(`인증 누락: ${missing.join(', ')}`)
      }
    }

    // 카테고리 선호도
    if (preferredCategories && !preferredCategories.includes(program.category)) {
      matchScore -= 10
    }

    results.push({
      program,
      matchScore: Math.max(0, matchScore),
      eligibilityIssues,
    })
  }

  // 점수순 정렬
  return results.sort((a, b) => b.matchScore - a.matchScore)
}
