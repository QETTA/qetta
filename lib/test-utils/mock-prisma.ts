/**
 * Prisma Mock Utilities
 *
 * Prisma 클라이언트 모킹 유틸리티
 * - 각 모델별 CRUD 모킹
 * - 트랜잭션 모킹
 */

import { vi } from 'vitest'

// ============================================
// Types
// ============================================

type MockFn = ReturnType<typeof vi.fn>

interface MockPrismaModel {
  findUnique: MockFn
  findFirst: MockFn
  findMany: MockFn
  create: MockFn
  update: MockFn
  updateMany: MockFn
  delete: MockFn
  deleteMany: MockFn
  count: MockFn
  upsert: MockFn
}

interface MockPrismaClient {
  user: MockPrismaModel
  subscription: MockPrismaModel
  payment: MockPrismaModel
  usageRecord: MockPrismaModel
  companyBlock: MockPrismaModel
  companyFact: MockPrismaModel
  proposalJob: MockPrismaModel
  pendingPaymentOrder: MockPrismaModel
  processedWebhookEvent: MockPrismaModel
  document: MockPrismaModel
  $transaction: MockFn
  $connect: MockFn
  $disconnect: MockFn
}

// ============================================
// Mock Factory
// ============================================

function createMockModel(): MockPrismaModel {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
  }
}

/**
 * Mock Prisma Client 생성
 */
export function createMockPrisma(): MockPrismaClient {
  return {
    user: createMockModel(),
    subscription: createMockModel(),
    payment: createMockModel(),
    usageRecord: createMockModel(),
    companyBlock: createMockModel(),
    companyFact: createMockModel(),
    proposalJob: createMockModel(),
    pendingPaymentOrder: createMockModel(),
    processedWebhookEvent: createMockModel(),
    document: createMockModel(),
    $transaction: vi.fn((callback) => callback(createMockPrisma())),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  }
}

// ============================================
// Global Mock Instance
// ============================================

export const mockPrisma = createMockPrisma()

/**
 * Prisma 모듈 모킹 설정
 *
 * 테스트 파일에서 사용:
 * ```typescript
 * import { setupPrismaMock, mockPrisma } from '@/lib/test-utils'
 *
 * vi.mock('@/lib/db/prisma', () => setupPrismaMock())
 *
 * it('should create user', async () => {
 *   mockPrisma.user.create.mockResolvedValue({ id: '1', ... })
 *   // ...
 * })
 * ```
 */
export function setupPrismaMock() {
  return {
    prisma: mockPrisma,
  }
}

/**
 * 모든 Prisma 모킹 초기화
 */
export function resetPrismaMock() {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((fn) => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
          ;(fn as MockFn).mockReset()
        }
      })
    }
  })
}
