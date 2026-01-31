/**
 * @deprecated v4.0 — Use `EnginePreset` + `PRESETS.DIGITAL` from `@/lib/skill-engine`.
 *
 * QETTA AI Voucher Domain Skills
 *
 * NIPA AI 바우처 도메인
 *
 * 출력물:
 * - 공급기업 실적 보고서
 * - 수요기업 매칭 분석
 * - 바우처 정산 명세서
 * - 솔루션 적합성 보고서
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import type { DocumentSkill, DocumentTemplate, SkillPackage, EnginePresetFeedback } from '../../types'

// ============================================
// AI Voucher Terminology (핵심 용어집)
// ============================================

export const AI_VOUCHER_TERMINOLOGY = {
  // 기업 유형
  companyTypes: {
    supplier: {
      korean: '공급기업',
      english: 'AI Solution Supplier',
      description: 'NIPA 등록 AI 솔루션 제공 기업',
      requirements: ['AI 관련 매출 실적', 'NIPA 공급기업 등록', '솔루션 검증'],
    },
    demander: {
      korean: '수요기업',
      english: 'AI Solution Demander',
      description: 'AI 솔루션 도입 희망 기업',
      requirements: ['국내 사업자등록', 'AI 도입 계획', '자부담 가능'],
    },
    collaboration: {
      korean: '컨소시엄',
      english: 'Consortium',
      description: '공급-수요 기업 협력체',
      requirements: ['공급기업 1개 이상', '수요기업 1개 이상', '협약 체결'],
    },
  },

  // 솔루션 카테고리
  solutionCategories: {
    vision: {
      korean: '영상인식',
      english: 'Computer Vision',
      description: '이미지/영상 분석, 객체 검출, OCR 등',
      useCases: ['불량 검출', '문서 자동화', '안전 모니터링', '재고 관리'],
    },
    nlp: {
      korean: '자연어처리',
      english: 'Natural Language Processing',
      description: '텍스트 분석, 챗봇, 문서 요약 등',
      useCases: ['고객 상담 자동화', '계약서 분석', '감정 분석', '번역'],
    },
    prediction: {
      korean: '예측분석',
      english: 'Predictive Analytics',
      description: '수요 예측, 이상 탐지, 추천 시스템 등',
      useCases: ['수요 예측', '설비 고장 예측', '고객 이탈 예측', '가격 최적화'],
    },
    optimization: {
      korean: '최적화',
      english: 'Optimization',
      description: '스케줄링, 자원 배분, 경로 최적화 등',
      useCases: ['생산 스케줄링', '물류 최적화', '에너지 관리', '인력 배치'],
    },
    speech: {
      korean: '음성인식',
      english: 'Speech Recognition',
      description: '음성-텍스트 변환, 화자 인식 등',
      useCases: ['회의록 자동화', '콜센터 분석', '음성 명령', '품질 검사'],
    },
    robotics: {
      korean: '로보틱스',
      english: 'Robotics AI',
      description: '로봇 제어, 자율 주행 등',
      useCases: ['물류 로봇', '제조 로봇', '서비스 로봇', '드론'],
    },
  },

  // 지원 금액
  supportAmount: {
    basic: {
      korean: '일반형',
      english: 'Basic',
      maxAmount: 30000000, // 3천만원
      governmentRatio: 0.7, // 정부 70%
      selfRatio: 0.3, // 자부담 30%
    },
    growth: {
      korean: '성장형',
      english: 'Growth',
      maxAmount: 100000000, // 1억원
      governmentRatio: 0.7,
      selfRatio: 0.3,
    },
    enterprise: {
      korean: '대기업형',
      english: 'Enterprise',
      maxAmount: 200000000, // 2억원
      governmentRatio: 0.5, // 정부 50%
      selfRatio: 0.5, // 자부담 50%
    },
  },

  // 평가 기준
  evaluationCriteria: {
    solutionFit: {
      korean: '솔루션 적합도',
      english: 'Solution Fit',
      weight: 30,
      description: '수요기업 니즈와 솔루션 매칭 정도',
    },
    supplierCapability: {
      korean: '공급기업 역량',
      english: 'Supplier Capability',
      weight: 25,
      description: '기술력, 실적, 지원 체계',
    },
    demandAnalysis: {
      korean: '수요기업 분석',
      english: 'Demand Analysis',
      weight: 20,
      description: 'AI 도입 필요성 및 준비도',
    },
    expectedEffect: {
      korean: '기대효과',
      english: 'Expected Effect',
      weight: 15,
      description: '비용 절감, 생산성 향상 등 정량적 효과',
    },
    sustainability: {
      korean: '지속가능성',
      english: 'Sustainability',
      weight: 10,
      description: '사업 종료 후 자체 운영 가능성',
    },
  },

  // 문서 양식
  documents: {
    performanceReport: {
      korean: '실적 보고서',
      english: 'Performance Report',
      format: 'HWP',
      sections: ['사업 개요', '솔루션 도입 현황', '성과 지표', '고객 만족도', '향후 계획'],
    },
    matchingAnalysis: {
      korean: '매칭 분석서',
      english: 'Matching Analysis',
      format: 'DOCX',
      sections: ['수요 분석', '솔루션 후보', '매칭 점수', '추천 순위', '협업 제안'],
    },
    settlementStatement: {
      korean: '정산 명세서',
      english: 'Settlement Statement',
      format: 'XLSX',
      sections: ['비용 항목', '정부 지원금', '자부담금', '증빙 목록'],
    },
  },
} as const

// ============================================
// AI Voucher Document Templates
// ============================================

export const AI_VOUCHER_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'aiv-performance-report',
    name: '공급기업 실적 보고서',
    domain: 'DIGITAL',
    sections: [
      '1. 사업 개요',
      '  1.1 공급기업 정보',
      '  1.2 사업 기간',
      '  1.3 지원 규모',
      '2. 솔루션 도입 현황',
      '  2.1 수요기업 목록',
      '  2.2 솔루션 카테고리',
      '  2.3 도입 완료율',
      '3. 성과 지표',
      '  3.1 고객사 수',
      '  3.2 계약 금액',
      '  3.3 재계약률',
      '  3.4 만족도 점수',
      '4. 주요 성공 사례',
      '5. 향후 계획',
      '  5.1 신규 솔루션 개발',
      '  5.2 고객 확대 전략',
      '6. 증빙 자료 목록',
    ],
    estimatedGenerationTime: 90,
  },
  {
    id: 'aiv-matching-analysis',
    name: '수요기업 매칭 분석서',
    domain: 'DIGITAL',
    sections: [
      '1. 수요기업 분석',
      '  1.1 기업 현황',
      '  1.2 AI 도입 목적',
      '  1.3 현재 시스템 현황',
      '  1.4 데이터 준비도',
      '2. 니즈 분석',
      '  2.1 핵심 요구사항',
      '  2.2 우선순위',
      '  2.3 예산 범위',
      '3. 솔루션 후보',
      '  3.1 후보 공급기업 목록',
      '  3.2 솔루션 상세',
      '4. 매칭 점수',
      '  4.1 솔루션 적합도',
      '  4.2 공급기업 역량',
      '  4.3 가격 경쟁력',
      '  4.4 기술 지원 체계',
      '5. 최종 추천',
      '  5.1 추천 순위',
      '  5.2 추천 사유',
      '  5.3 협업 제안',
    ],
    estimatedGenerationTime: 120,
  },
  {
    id: 'aiv-settlement-statement',
    name: '바우처 정산 명세서',
    domain: 'DIGITAL',
    sections: [
      '1. 정산 개요',
      '  1.1 사업 정보',
      '  1.2 정산 기간',
      '2. 비용 집행 내역',
      '  2.1 솔루션 도입비',
      '  2.2 컨설팅비',
      '  2.3 교육훈련비',
      '  2.4 기타 비용',
      '3. 지원금 내역',
      '  3.1 정부 지원금',
      '  3.2 수요기업 자부담',
      '4. 증빙 서류 목록',
      '5. 정산 확인서',
    ],
    estimatedGenerationTime: 60,
  },
  {
    id: 'aiv-solution-fitness',
    name: '솔루션 적합성 보고서',
    domain: 'DIGITAL',
    sections: [
      '1. 솔루션 개요',
      '2. 수요기업 요구사항 분석',
      '3. 기능 매칭 분석',
      '  3.1 필수 기능 충족도',
      '  3.2 선택 기능 충족도',
      '4. 기술 호환성',
      '  4.1 시스템 연동',
      '  4.2 데이터 호환',
      '5. ROI 분석',
      '  5.1 비용 절감 효과',
      '  5.2 생산성 향상 효과',
      '  5.3 투자 회수 기간',
      '6. 리스크 분석',
      '7. 종합 평가',
    ],
    estimatedGenerationTime: 90,
  },
]

// ============================================
// AI Voucher Skills Definition
// ============================================

export const AI_VOUCHER_SKILLS: DocumentSkill[] = [
  {
    id: 'aiv-performance-report',
    name: 'Supplier Performance Report',
    nameKo: '공급기업 실적 보고서 생성',
    category: 'document_generation',
    description: 'Generate performance report for AI voucher supplier company',
    version: '1.0.0',
    domains: ['DIGITAL'],
    requiredPromptTokens: 12000,
    outputFormats: ['HWP', 'DOCX', 'PDF'],
    templates: [AI_VOUCHER_TEMPLATES[0]],
  },
  {
    id: 'aiv-matching-analysis',
    name: 'Demand-Supply Matching Analysis',
    nameKo: '수요-공급 매칭 분석',
    category: 'document_generation',
    description: 'Analyze and recommend best matching between demanders and suppliers',
    version: '1.0.0',
    domains: ['DIGITAL'],
    requiredPromptTokens: 15000,
    outputFormats: ['DOCX', 'PDF'],
    templates: [AI_VOUCHER_TEMPLATES[1]],
  },
  {
    id: 'aiv-settlement',
    name: 'Voucher Settlement Statement',
    nameKo: '바우처 정산 명세서 생성',
    category: 'document_generation',
    description: 'Generate settlement statement for voucher program',
    version: '1.0.0',
    domains: ['DIGITAL'],
    requiredPromptTokens: 8000,
    outputFormats: ['XLSX', 'PDF'],
    templates: [AI_VOUCHER_TEMPLATES[2]],
  },
  {
    id: 'aiv-solution-fitness',
    name: 'Solution Fitness Analysis',
    nameKo: '솔루션 적합성 분석',
    category: 'document_generation',
    description: 'Analyze solution fitness for specific demander requirements',
    version: '1.0.0',
    domains: ['DIGITAL'],
    requiredPromptTokens: 10000,
    outputFormats: ['DOCX', 'PDF'],
    templates: [AI_VOUCHER_TEMPLATES[3]],
  },
]

// ============================================
// AI Voucher Skill Package
// ============================================

export const AI_VOUCHER_SKILL_PACKAGE: SkillPackage = {
  id: 'pkg-ai-voucher-complete',
  name: 'AI Voucher Complete Package',
  nameKo: 'AI 바우처 완전 패키지',
  description: 'NIPA AI 바우처 모든 보고서 생성 및 매칭 분석',
  skills: AI_VOUCHER_SKILLS.map((s) => s.id),
  domain: 'DIGITAL',
  tier: 'domain',
  estimatedCost: {
    perDocument: 0.20,
    perMonth: 60,
    cacheEfficiency: 85,
  },
  metadata: {
    createdAt: '2026-01-24',
    updatedAt: '2026-01-24',
    usageCount: 0,
    rating: 0,
  },
}

// ============================================
// Matching Engine Types
// ============================================

export interface SupplierProfile {
  id: string
  companyName: string
  registrationNumber: string
  nipaRegistered: boolean
  solutionCategories: (keyof typeof AI_VOUCHER_TERMINOLOGY.solutionCategories)[]
  solutions: Solution[]
  yearlyRevenue: number
  aiRevenue: number
  employeeCount: number
  certifications: string[]
  customerCount: number
  averageSatisfaction: number
  region: string
}

export interface Solution {
  id: string
  name: string
  category: keyof typeof AI_VOUCHER_TERMINOLOGY.solutionCategories
  description: string
  features: string[]
  targetIndustries: string[]
  minPrice: number
  maxPrice: number
  deploymentTime: number // 도입 기간 (일)
  supportLevel: 'basic' | 'standard' | 'premium'
  references: number // 도입 사례 수
}

export interface DemanderProfile {
  id: string
  companyName: string
  registrationNumber: string
  industry: string
  employeeCount: number
  yearlyRevenue: number
  currentSystems: string[]
  aiReadiness: {
    dataAvailability: 'none' | 'partial' | 'ready'
    itInfrastructure: 'legacy' | 'modernizing' | 'modern'
    aiExperience: 'none' | 'pilot' | 'production'
    budget: number
  }
  requirements: DemanderRequirement[]
  region: string
}

export interface DemanderRequirement {
  category: keyof typeof AI_VOUCHER_TERMINOLOGY.solutionCategories
  priority: 'must' | 'nice-to-have'
  description: string
  expectedEffect: string
  budgetRange: {
    min: number
    max: number
  }
}

export interface MatchingResult {
  demanderId: string
  demanderName: string
  supplierId: string
  supplierName: string
  solutionId: string
  solutionName: string
  matchingScore: number
  breakdown: {
    solutionFit: number
    supplierCapability: number
    demandAnalysis: number
    expectedEffect: number
    sustainability: number
  }
  recommendation: 'highly_recommended' | 'recommended' | 'conditional' | 'not_recommended'
  reasonsFor: string[]
  reasonsAgainst: string[]
  estimatedROI: {
    costReduction: number
    productivityGain: number
    paybackPeriod: number // 개월
  }
}

// ============================================
// Matching Engine
// ============================================

/**
 * 공급-수요 기업 매칭 엔진
 *
 * 평가 기준:
 * - 솔루션 적합도 (30%)
 * - 공급기업 역량 (25%)
 * - 수요기업 분석 (20%)
 * - 기대효과 (15%)
 * - 지속가능성 (10%)
 */
export function matchSupplierToDemander(
  demander: DemanderProfile,
  suppliers: SupplierProfile[]
): MatchingResult[] {
  const results: MatchingResult[] = []

  for (const supplier of suppliers) {
    // 각 솔루션에 대해 매칭 점수 계산
    for (const solution of supplier.solutions) {
      // 요구사항과 카테고리 매칭 확인
      const matchingRequirement = demander.requirements.find((r) => r.category === solution.category)

      if (!matchingRequirement) continue

      // 예산 범위 확인
      if (solution.minPrice > matchingRequirement.budgetRange.max) continue

      const breakdown = calculateMatchingBreakdown(demander, supplier, solution, matchingRequirement)
      const totalScore =
        breakdown.solutionFit * (AI_VOUCHER_TERMINOLOGY.evaluationCriteria.solutionFit.weight / 100) +
        breakdown.supplierCapability * (AI_VOUCHER_TERMINOLOGY.evaluationCriteria.supplierCapability.weight / 100) +
        breakdown.demandAnalysis * (AI_VOUCHER_TERMINOLOGY.evaluationCriteria.demandAnalysis.weight / 100) +
        breakdown.expectedEffect * (AI_VOUCHER_TERMINOLOGY.evaluationCriteria.expectedEffect.weight / 100) +
        breakdown.sustainability * (AI_VOUCHER_TERMINOLOGY.evaluationCriteria.sustainability.weight / 100)

      const { reasonsFor, reasonsAgainst } = generateMatchingReasons(demander, supplier, solution, breakdown)

      results.push({
        demanderId: demander.id,
        demanderName: demander.companyName,
        supplierId: supplier.id,
        supplierName: supplier.companyName,
        solutionId: solution.id,
        solutionName: solution.name,
        matchingScore: Math.round(totalScore * 100) / 100,
        breakdown,
        recommendation: getRecommendationLevel(totalScore),
        reasonsFor,
        reasonsAgainst,
        estimatedROI: calculateROI(demander, solution),
      })
    }
  }

  // 점수 순 정렬
  return results.sort((a, b) => b.matchingScore - a.matchingScore)
}

function calculateMatchingBreakdown(
  demander: DemanderProfile,
  supplier: SupplierProfile,
  solution: Solution,
  requirement: DemanderRequirement
): MatchingResult['breakdown'] {
  // 솔루션 적합도 (0-100)
  const solutionFit = calculateSolutionFit(demander, solution, requirement)

  // 공급기업 역량 (0-100)
  const supplierCapability = calculateSupplierCapability(supplier)

  // 수요기업 분석 (0-100)
  const demandAnalysis = calculateDemandAnalysis(demander)

  // 기대효과 (0-100)
  const expectedEffect = calculateExpectedEffect(demander, solution)

  // 지속가능성 (0-100)
  const sustainability = calculateSustainability(demander, supplier, solution)

  return {
    solutionFit,
    supplierCapability,
    demandAnalysis,
    expectedEffect,
    sustainability,
  }
}

function calculateSolutionFit(
  demander: DemanderProfile,
  solution: Solution,
  requirement: DemanderRequirement
): number {
  let score = 60 // 기본 점수 (카테고리 매칭)

  // 산업 매칭
  if (solution.targetIndustries.includes(demander.industry)) {
    score += 20
  }

  // 예산 적합성
  const avgPrice = (solution.minPrice + solution.maxPrice) / 2
  const budgetFit = 1 - Math.abs(avgPrice - (requirement.budgetRange.min + requirement.budgetRange.max) / 2) / requirement.budgetRange.max
  score += budgetFit * 10

  // 도입 실적
  if (solution.references >= 10) score += 10
  else if (solution.references >= 5) score += 5

  return Math.min(100, Math.max(0, score))
}

function calculateSupplierCapability(supplier: SupplierProfile): number {
  let score = 50 // 기본 점수 (NIPA 등록)

  // 매출 기준
  if (supplier.aiRevenue >= 1000000000) score += 15
  else if (supplier.aiRevenue >= 500000000) score += 10
  else if (supplier.aiRevenue >= 100000000) score += 5

  // 고객 수
  if (supplier.customerCount >= 50) score += 15
  else if (supplier.customerCount >= 20) score += 10
  else if (supplier.customerCount >= 10) score += 5

  // 만족도
  if (supplier.averageSatisfaction >= 4.5) score += 10
  else if (supplier.averageSatisfaction >= 4.0) score += 5

  // 인증
  score += Math.min(10, supplier.certifications.length * 2)

  return Math.min(100, Math.max(0, score))
}

function calculateDemandAnalysis(demander: DemanderProfile): number {
  let score = 50 // 기본 점수

  // 데이터 준비도
  if (demander.aiReadiness.dataAvailability === 'ready') score += 20
  else if (demander.aiReadiness.dataAvailability === 'partial') score += 10

  // IT 인프라
  if (demander.aiReadiness.itInfrastructure === 'modern') score += 15
  else if (demander.aiReadiness.itInfrastructure === 'modernizing') score += 8

  // AI 경험
  if (demander.aiReadiness.aiExperience === 'production') score += 15
  else if (demander.aiReadiness.aiExperience === 'pilot') score += 8

  return Math.min(100, Math.max(0, score))
}

function calculateExpectedEffect(_demander: DemanderProfile, solution: Solution): number {
  let score = 50 // 기본 점수

  // 솔루션 참조 사례 기반 효과 추정
  if (solution.references >= 10) score += 20
  else if (solution.references >= 5) score += 10

  // 지원 수준
  if (solution.supportLevel === 'premium') score += 15
  else if (solution.supportLevel === 'standard') score += 8

  // 도입 기간 (빠를수록 좋음)
  if (solution.deploymentTime <= 30) score += 15
  else if (solution.deploymentTime <= 60) score += 10
  else if (solution.deploymentTime <= 90) score += 5

  return Math.min(100, Math.max(0, score))
}

function calculateSustainability(
  demander: DemanderProfile,
  supplier: SupplierProfile,
  solution: Solution
): number {
  let score = 50 // 기본 점수

  // 지역 근접성 (지원 용이)
  if (demander.region === supplier.region) score += 20

  // 지원 수준
  if (solution.supportLevel === 'premium') score += 15
  else if (solution.supportLevel === 'standard') score += 8

  // 공급기업 규모 (안정성)
  if (supplier.employeeCount >= 50) score += 15
  else if (supplier.employeeCount >= 20) score += 10

  return Math.min(100, Math.max(0, score))
}

function getRecommendationLevel(score: number): MatchingResult['recommendation'] {
  if (score >= 80) return 'highly_recommended'
  if (score >= 65) return 'recommended'
  if (score >= 50) return 'conditional'
  return 'not_recommended'
}

function generateMatchingReasons(
  demander: DemanderProfile,
  supplier: SupplierProfile,
  solution: Solution,
  breakdown: MatchingResult['breakdown']
): { reasonsFor: string[]; reasonsAgainst: string[] } {
  const reasonsFor: string[] = []
  const reasonsAgainst: string[] = []

  // 솔루션 적합도
  if (breakdown.solutionFit >= 80) {
    reasonsFor.push('솔루션이 수요기업 요구사항에 매우 적합')
  } else if (breakdown.solutionFit < 60) {
    reasonsAgainst.push('솔루션 적합도 보통 - 상세 검토 필요')
  }

  // 공급기업 역량
  if (breakdown.supplierCapability >= 80) {
    reasonsFor.push(`공급기업 검증된 역량 (고객사 ${supplier.customerCount}개, 만족도 ${supplier.averageSatisfaction})`)
  } else if (breakdown.supplierCapability < 60) {
    reasonsAgainst.push('공급기업 실적 부족 - 레퍼런스 확인 필요')
  }

  // 수요기업 준비도
  if (breakdown.demandAnalysis >= 80) {
    reasonsFor.push('수요기업 AI 도입 준비 완료')
  } else if (breakdown.demandAnalysis < 60) {
    reasonsAgainst.push('수요기업 AI 도입 준비 부족 - 사전 준비 필요')
  }

  // 지역
  if (demander.region === supplier.region) {
    reasonsFor.push('동일 지역 - 원활한 지원 가능')
  }

  // 가격
  const avgPrice = (solution.minPrice + solution.maxPrice) / 2
  if (avgPrice <= demander.aiReadiness.budget * 0.8) {
    reasonsFor.push('예산 범위 내 - 여유 있음')
  } else if (avgPrice > demander.aiReadiness.budget) {
    reasonsAgainst.push('예산 초과 가능성 - 협의 필요')
  }

  return { reasonsFor, reasonsAgainst }
}

function calculateROI(demander: DemanderProfile, solution: Solution): MatchingResult['estimatedROI'] {
  // 간단한 ROI 추정 (실제로는 더 정교한 모델 필요)
  const avgPrice = (solution.minPrice + solution.maxPrice) / 2

  // 카테고리별 평균 효과
  const categoryEffects: Record<string, { costReduction: number; productivityGain: number }> = {
    vision: { costReduction: 0.15, productivityGain: 0.20 },
    nlp: { costReduction: 0.20, productivityGain: 0.25 },
    prediction: { costReduction: 0.18, productivityGain: 0.22 },
    optimization: { costReduction: 0.25, productivityGain: 0.30 },
    speech: { costReduction: 0.10, productivityGain: 0.15 },
    robotics: { costReduction: 0.20, productivityGain: 0.35 },
  }

  const effect = categoryEffects[solution.category] || { costReduction: 0.15, productivityGain: 0.20 }

  // 연간 절감액 추정 (매출의 일정 비율)
  const annualSavings = demander.yearlyRevenue * effect.costReduction * 0.01

  // 투자 회수 기간 (개월)
  const paybackPeriod = annualSavings > 0 ? Math.ceil((avgPrice / annualSavings) * 12) : 36

  return {
    costReduction: Math.round(effect.costReduction * 100),
    productivityGain: Math.round(effect.productivityGain * 100),
    paybackPeriod: Math.min(36, paybackPeriod),
  }
}

// ============================================
// Matching Report Generator
// ============================================

export function generateMatchingReportContent(
  demander: DemanderProfile,
  results: MatchingResult[]
): string {
  const topResults = results.slice(0, 5) // 상위 5개

  return `
# 수요기업 매칭 분석서

## 1. 수요기업 분석

### 1.1 기업 현황

| 항목 | 내용 |
|------|------|
| 기업명 | ${demander.companyName} |
| 업종 | ${demander.industry} |
| 종업원 수 | ${demander.employeeCount}명 |
| 연 매출 | ${(demander.yearlyRevenue / 100000000).toFixed(1)}억원 |
| 지역 | ${demander.region} |

### 1.2 AI 도입 준비도

| 항목 | 상태 | 비고 |
|------|------|------|
| 데이터 가용성 | ${getReadinessEmoji(demander.aiReadiness.dataAvailability)} ${demander.aiReadiness.dataAvailability} | - |
| IT 인프라 | ${getInfraEmoji(demander.aiReadiness.itInfrastructure)} ${demander.aiReadiness.itInfrastructure} | - |
| AI 경험 | ${getExperienceEmoji(demander.aiReadiness.aiExperience)} ${demander.aiReadiness.aiExperience} | - |
| 예산 | ${(demander.aiReadiness.budget / 10000000).toFixed(1)}천만원 | - |

### 1.3 요구사항

${demander.requirements.map((r) => `
**${AI_VOUCHER_TERMINOLOGY.solutionCategories[r.category].korean}** (${r.priority === 'must' ? '필수' : '선택'})
- 요구사항: ${r.description}
- 기대효과: ${r.expectedEffect}
- 예산: ${(r.budgetRange.min / 10000000).toFixed(1)}천만원 ~ ${(r.budgetRange.max / 10000000).toFixed(1)}천만원
`).join('\n')}

## 2. 매칭 결과 (상위 ${topResults.length}개)

${topResults.map((r, idx) => `
### ${idx + 1}. ${r.solutionName} (${r.supplierName})

| 항목 | 점수/내용 |
|------|----------|
| **종합 점수** | **${r.matchingScore}점** |
| 솔루션 적합도 | ${r.breakdown.solutionFit}점 |
| 공급기업 역량 | ${r.breakdown.supplierCapability}점 |
| 수요기업 분석 | ${r.breakdown.demandAnalysis}점 |
| 기대효과 | ${r.breakdown.expectedEffect}점 |
| 지속가능성 | ${r.breakdown.sustainability}점 |
| **추천 등급** | ${getRecommendationText(r.recommendation)} |

**추천 이유**
${r.reasonsFor.map((reason) => `- ✅ ${reason}`).join('\n')}

${r.reasonsAgainst.length > 0 ? `**주의 사항**
${r.reasonsAgainst.map((reason) => `- ⚠️ ${reason}`).join('\n')}` : ''}

**예상 ROI**
- 비용 절감: ${r.estimatedROI.costReduction}%
- 생산성 향상: ${r.estimatedROI.productivityGain}%
- 투자 회수: ${r.estimatedROI.paybackPeriod}개월
`).join('\n---\n')}

## 3. 종합 의견

${generateOverallOpinion(demander, results)}

---
*본 보고서는 QETTA AI Voucher 매칭 엔진에 의해 자동 생성되었습니다.*
*생성일시: ${new Date().toISOString()}*
`.trim()
}

function getReadinessEmoji(level: string): string {
  switch (level) {
    case 'ready': return '🟢'
    case 'partial': return '🟡'
    case 'none': return '🔴'
    default: return '⚪'
  }
}

function getInfraEmoji(level: string): string {
  switch (level) {
    case 'modern': return '🟢'
    case 'modernizing': return '🟡'
    case 'legacy': return '🔴'
    default: return '⚪'
  }
}

function getExperienceEmoji(level: string): string {
  switch (level) {
    case 'production': return '🟢'
    case 'pilot': return '🟡'
    case 'none': return '🔴'
    default: return '⚪'
  }
}

function getRecommendationText(level: MatchingResult['recommendation']): string {
  switch (level) {
    case 'highly_recommended': return '🏆 강력 추천'
    case 'recommended': return '✅ 추천'
    case 'conditional': return '🟡 조건부 추천'
    case 'not_recommended': return '❌ 비추천'
  }
}

function generateOverallOpinion(_demander: DemanderProfile, results: MatchingResult[]): string {
  const topResult = results[0]

  if (!topResult) {
    return '적합한 매칭 결과가 없습니다. 요구사항을 조정하거나 추가 공급기업을 검토해 주세요.'
  }

  if (topResult.matchingScore >= 80) {
    return `**${topResult.supplierName}**의 **${topResult.solutionName}** 솔루션이 가장 적합합니다.
매칭 점수 ${topResult.matchingScore}점으로 높은 적합도를 보이며, 예상 투자 회수 기간은 ${topResult.estimatedROI.paybackPeriod}개월입니다.
빠른 시일 내 공급기업과의 미팅을 권장드립니다.`
  }

  if (topResult.matchingScore >= 65) {
    return `**${topResult.supplierName}**의 **${topResult.solutionName}** 솔루션을 추천드립니다.
매칭 점수 ${topResult.matchingScore}점으로 양호한 수준이며, 상세 협의를 통해 최적의 조건을 도출할 수 있습니다.
${topResult.reasonsAgainst.length > 0 ? `다만, ${topResult.reasonsAgainst[0]} 점은 사전 검토가 필요합니다.` : ''}`
  }

  return `현재 조건에서 완벽히 부합하는 솔루션이 제한적입니다.
상위 매칭 결과 중 **${topResult.solutionName}**(${topResult.matchingScore}점)이 가장 적합하나,
추가 조율이 필요합니다. 요구사항 조정 또는 추가 공급기업 탐색을 권장드립니다.`
}

// ============================================
// AI Voucher Validation Rules
// ============================================

export const AI_VOUCHER_VALIDATION_RULES = {
  // 공급기업 필수 조건
  supplierRequirements: {
    nipaRegistration: true,
    minAiRevenueRatio: 0.1, // AI 매출 비율 10% 이상
    minCustomerCount: 1,
  },

  // 수요기업 필수 조건
  demanderRequirements: {
    registeredBusiness: true,
    minEmployees: 1,
  },

  // 매칭 임계값
  matchingThreshold: {
    recommended: 65,
    conditional: 50,
    minimum: 40,
  },

  // 바우처 한도
  voucherLimits: {
    basic: 30000000,
    growth: 100000000,
    enterprise: 200000000,
  },
}

export function validateSupplier(supplier: SupplierProfile): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (!supplier.nipaRegistered) {
    errors.push('NIPA 공급기업 등록 필요')
  }

  const aiRevenueRatio = supplier.aiRevenue / supplier.yearlyRevenue
  if (aiRevenueRatio < AI_VOUCHER_VALIDATION_RULES.supplierRequirements.minAiRevenueRatio) {
    warnings.push(`AI 매출 비율이 ${(aiRevenueRatio * 100).toFixed(1)}%로 낮음 (권장: 10% 이상)`)
  }

  if (supplier.solutions.length === 0) {
    errors.push('등록된 솔루션 없음')
  }

  if (supplier.customerCount < 3) {
    warnings.push('고객 레퍼런스 부족 - 신뢰도 제고 필요')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

export function validateDemander(demander: DemanderProfile): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (demander.requirements.length === 0) {
    errors.push('요구사항 정의 필요')
  }

  if (demander.aiReadiness.budget <= 0) {
    errors.push('예산 설정 필요')
  }

  if (demander.aiReadiness.dataAvailability === 'none') {
    warnings.push('데이터 준비도 낮음 - 사전 데이터 정비 권장')
  }

  if (demander.aiReadiness.itInfrastructure === 'legacy') {
    warnings.push('레거시 인프라 - 시스템 연동 시 추가 비용 발생 가능')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================
// AI Voucher Feedback Generator
// ============================================

export function generateAIVoucherFeedback(
  matchingResult: MatchingResult,
  _validation: { errors: string[]; warnings: string[] } // Reserved for future validation-based feedback
): EnginePresetFeedback | null {
  // 매칭 점수가 낮은 경우 피드백 생성
  if (matchingResult.matchingScore < AI_VOUCHER_VALIDATION_RULES.matchingThreshold.recommended) {
    return {
      domain: 'DIGITAL',
      type: 'stat_update',
      statUpdate: {
        metric: 'low_matching_score',
        value: matchingResult.matchingScore,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        inferredAt: new Date().toISOString(),
        agentRole: 'matcher',
        reasoningTokens: 0,
        confidence: 0.9,
      },
    }
  }

  return null
}
