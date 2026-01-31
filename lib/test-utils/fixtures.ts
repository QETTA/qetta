/**
 * Test Fixtures
 *
 * 테스트 데이터 팩토리
 * - 일관된 테스트 데이터 생성
 * - 타입 안전성 보장
 */

import type { IndustryBlock, SubscriptionPlan, SubscriptionStatus } from '@prisma/client'

// ============================================
// User Fixtures
// ============================================

export interface MockUser {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

let userCounter = 0

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  userCounter++
  return {
    id: `user-${userCounter}`,
    email: `user${userCounter}@test.com`,
    name: `Test User ${userCounter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// ============================================
// Subscription Fixtures
// ============================================

export interface MockSubscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  createdAt: Date
  updatedAt: Date
}

let subscriptionCounter = 0

export function createMockSubscription(
  overrides: Partial<MockSubscription> = {}
): MockSubscription {
  subscriptionCounter++
  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  return {
    id: `sub-${subscriptionCounter}`,
    userId: `user-${subscriptionCounter}`,
    plan: 'GROWTH',
    status: 'ACTIVE',
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

// ============================================
// CompanyBlock Fixtures
// ============================================

export interface MockCompanyBlock {
  id: string
  userId: string
  companyName: string
  businessNumber: string
  industryBlock: IndustryBlock
  profile: Record<string, unknown>
  originalTokens: number
  compressedTokens: number
  compressionRatio: number
  createdAt: Date
  updatedAt: Date
}

let companyBlockCounter = 0

export function createMockCompanyBlock(
  overrides: Partial<MockCompanyBlock> = {}
): MockCompanyBlock {
  companyBlockCounter++
  return {
    id: `cb-${companyBlockCounter}`,
    userId: `user-${companyBlockCounter}`,
    companyName: `테스트 기업 ${companyBlockCounter}`,
    businessNumber: `123-45-${String(companyBlockCounter).padStart(5, '0')}`,
    industryBlock: 'GENERAL',
    profile: {
      employees: 50,
      revenue: 5000000000,
      founded: 2020,
      technologies: ['React', 'Node.js', 'Python'],
    },
    originalTokens: 5000,
    compressedTokens: 1000,
    compressionRatio: 0.8,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// ============================================
// CompanyFact Fixtures
// ============================================

export interface MockCompanyFact {
  id: string
  companyBlockId: string
  category: string
  key: string
  value: string
  confidence: number
  source: string
  priority: number
  createdAt: Date
}

let factCounter = 0

export function createMockCompanyFact(overrides: Partial<MockCompanyFact> = {}): MockCompanyFact {
  factCounter++
  return {
    id: `fact-${factCounter}`,
    companyBlockId: `cb-1`,
    category: 'capability',
    key: `fact_key_${factCounter}`,
    value: `Fact value ${factCounter}`,
    confidence: 0.9,
    source: 'user_input',
    priority: factCounter,
    createdAt: new Date(),
    ...overrides,
  }
}

// ============================================
// ProposalJob Fixtures
// ============================================

export interface MockProposalJob {
  id: string
  userId: string
  companyBlockId: string
  programId: string
  programName: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  resultContent: string | null
  resultSections: string[] | null
  tokensUsed: number | null
  modelUsed: string | null
  errorCode: string | null
  errorMessage: string | null
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
}

let jobCounter = 0

export function createMockProposalJob(
  overrides: Partial<MockProposalJob> = {}
): MockProposalJob {
  jobCounter++
  return {
    id: `job-${jobCounter}`,
    userId: `user-1`,
    companyBlockId: `cb-1`,
    programId: `PROG-${jobCounter}`,
    programName: `AI 바우처 ${jobCounter}`,
    status: 'PENDING',
    resultContent: null,
    resultSections: null,
    tokensUsed: null,
    modelUsed: null,
    errorCode: null,
    errorMessage: null,
    createdAt: new Date(),
    startedAt: null,
    completedAt: null,
    ...overrides,
  }
}

// ============================================
// Payment Fixtures
// ============================================

export interface MockPayment {
  id: string
  userId: string
  subscriptionId: string
  amount: number
  currency: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  paymentKey: string
  orderId: string
  createdAt: Date
}

let paymentCounter = 0

export function createMockPayment(overrides: Partial<MockPayment> = {}): MockPayment {
  paymentCounter++
  return {
    id: `pay-${paymentCounter}`,
    userId: `user-1`,
    subscriptionId: `sub-1`,
    amount: 199000,
    currency: 'KRW',
    status: 'COMPLETED',
    paymentKey: `pk_${paymentCounter}`,
    orderId: `order_${paymentCounter}`,
    createdAt: new Date(),
    ...overrides,
  }
}

// ============================================
// Reset Counters (for test isolation)
// ============================================

export function resetFixtureCounters() {
  userCounter = 0
  subscriptionCounter = 0
  companyBlockCounter = 0
  factCounter = 0
  jobCounter = 0
  paymentCounter = 0
}
