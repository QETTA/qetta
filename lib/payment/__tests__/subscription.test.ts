/**
 * Subscription Management Tests
 *
 * 목표 커버리지: 80%
 * - 구독 CRUD
 * - 플랜 변경
 * - 상태 확인
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PLAN_CONFIGS, PaymentError, PAYMENT_ERROR_CODES } from '../types'
import type { PlanId } from '../types'

// ============================================
// Mocks - 호이스팅을 위해 인라인으로 정의
// ============================================

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
  },
}))

vi.mock('../toss-client', () => ({
  getTossClient: vi.fn(() => ({
    payWithBillingKey: vi.fn(),
    issueBillingKey: vi.fn(),
    deleteBillingKey: vi.fn(),
  })),
  generateOrderId: (prefix: string) => `${prefix}-test-123`,
  generateCustomerKey: (userId: string) => `customer-${userId}`,
}))

// Import after mocks are defined
import { prisma } from '@/lib/db/prisma'
import { getTossClient } from '../toss-client'
import {
  getSubscription,
  createTrialSubscription,
  getOrCreateSubscription,
  changePlan,
  cancelSubscription,
  checkSubscriptionStatus,
  getPlanLimits,
  registerBillingKey,
  processExpiredSubscriptions,
} from '../subscription'

// ============================================
// Test Fixtures
// ============================================

function createMockSubscription(overrides: Record<string, unknown> = {}) {
  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  return {
    id: 'sub-1',
    userId: 'user-1',
    plan: 'GROWTH',
    status: 'ACTIVE',
    customerKey: 'customer-user-1',
    billingKey: 'billing-key-123',
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    trialEndsAt: null,
    canceledAt: null,
    cancelReason: null,
    createdAt: now,
    updatedAt: now,
    payments: [],
    ...overrides,
  }
}

// ============================================
// Tests
// ============================================

describe('Subscription Management', () => {
  const mockPrisma = prisma as unknown as {
    subscription: {
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      updateMany: ReturnType<typeof vi.fn>
      findMany: ReturnType<typeof vi.fn>
    }
    payment: {
      create: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSubscription', () => {
    it('should return subscription for user', async () => {
      const mockSub = createMockSubscription()
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub)

      const result = await getSubscription('user-1')

      expect(result).toEqual(mockSub)
      expect(mockPrisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      })
    })

    it('should return null for non-existent user', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null)

      const result = await getSubscription('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('createTrialSubscription', () => {
    it('should create trial subscription', async () => {
      const mockSub = createMockSubscription({ plan: 'TRIAL', status: 'TRIALING' })
      mockPrisma.subscription.create.mockResolvedValue(mockSub)

      const result = await createTrialSubscription('user-1')

      expect(result.plan).toBe('TRIAL')
      expect(result.status).toBe('TRIALING')
      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          plan: 'TRIAL',
          status: 'TRIALING',
        }),
      })
    })

    it('should set trial end date to 14 days', async () => {
      mockPrisma.subscription.create.mockImplementation(async ({ data }) => ({
        ...createMockSubscription(),
        ...data,
      }))

      await createTrialSubscription('user-1')

      const createCall = mockPrisma.subscription.create.mock.calls[0][0]
      const trialEndsAt = createCall.data.trialEndsAt as Date
      const now = new Date()
      const diffDays = Math.round(
        (trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )

      expect(diffDays).toBe(14)
    })
  })

  describe('getOrCreateSubscription', () => {
    it('should return existing subscription', async () => {
      const mockSub = createMockSubscription()
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub)

      const result = await getOrCreateSubscription('user-1')

      expect(result).toEqual(mockSub)
      expect(mockPrisma.subscription.create).not.toHaveBeenCalled()
    })

    it('should create trial if no subscription exists', async () => {
      const mockSub = createMockSubscription({ plan: 'TRIAL', status: 'TRIALING' })
      mockPrisma.subscription.findUnique.mockResolvedValue(null)
      mockPrisma.subscription.create.mockResolvedValue(mockSub)

      const result = await getOrCreateSubscription('user-1')

      expect(result.plan).toBe('TRIAL')
      expect(mockPrisma.subscription.create).toHaveBeenCalled()
    })
  })

  describe('changePlan', () => {
    it('should throw error for invalid plan', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(createMockSubscription())

      await expect(changePlan('user-1', 'INVALID' as PlanId)).rejects.toThrow(
        PaymentError
      )
    })

    it('should throw error when no billing key for paid plan', async () => {
      const mockSub = createMockSubscription({ billingKey: null })
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub)

      await expect(changePlan('user-1', 'GROWTH')).rejects.toThrow(
        '결제 수단이 등록되지 않았습니다'
      )
    })

    it('should process payment for paid plan', async () => {
      const mockSub = createMockSubscription()
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub)
      mockPrisma.subscription.update.mockResolvedValue({
        ...mockSub,
        plan: 'GROWTH',
      })

      const mockTossClient = {
        payWithBillingKey: vi.fn().mockResolvedValue({
          paymentKey: 'pay-123',
          approvedAt: new Date().toISOString(),
          receipt: { url: 'https://receipt.url' },
          card: { number: '1234', company: 'BC' },
        }),
        issueBillingKey: vi.fn(),
        deleteBillingKey: vi.fn(),
      }
      vi.mocked(getTossClient).mockReturnValue(mockTossClient as unknown as ReturnType<typeof getTossClient>)

      mockPrisma.payment.create.mockResolvedValue({})

      const result = await changePlan('user-1', 'GROWTH')

      // 호출 여부 및 핵심 파라미터 검증
      expect(mockTossClient.payWithBillingKey).toHaveBeenCalledTimes(1)
      const callArgs = mockTossClient.payWithBillingKey.mock.calls[0][0]
      expect(callArgs.billingKey).toBe('billing-key-123')
      expect(callArgs.customerKey).toBe('customer-user-1')
      expect(callArgs.amount).toBe(PLAN_CONFIGS.GROWTH.price)
      expect(callArgs.orderId).toBeDefined()
      expect(typeof callArgs.orderId).toBe('string')
      expect(callArgs.orderName).toContain('그로스') // 한글 플랜명
      expect(mockPrisma.payment.create).toHaveBeenCalled()
      expect(result.plan).toBe('GROWTH')
    })
  })

  describe('cancelSubscription', () => {
    it('should throw error for non-existent subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null)

      await expect(cancelSubscription('user-1')).rejects.toThrow(
        '구독 정보를 찾을 수 없습니다'
      )
    })

    it('should delete billing key and cancel subscription', async () => {
      const mockSub = createMockSubscription()
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub)
      mockPrisma.subscription.update.mockResolvedValue({
        ...mockSub,
        status: 'CANCELED',
        billingKey: null,
      })

      const mockTossClient = {
        payWithBillingKey: vi.fn(),
        issueBillingKey: vi.fn(),
        deleteBillingKey: vi.fn().mockResolvedValue({}),
      }
      vi.mocked(getTossClient).mockReturnValue(mockTossClient as unknown as ReturnType<typeof getTossClient>)

      const result = await cancelSubscription('user-1', '가격이 비싸서')

      expect(mockTossClient.deleteBillingKey).toHaveBeenCalledWith(
        'billing-key-123',
        'customer-user-1'
      )
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({
          status: 'CANCELED',
          cancelReason: '가격이 비싸서',
          billingKey: null,
        }),
      })
      expect(result.status).toBe('CANCELED')
    })
  })

  describe('checkSubscriptionStatus', () => {
    it('should return active status for ACTIVE subscription', async () => {
      const mockSub = createMockSubscription({ status: 'ACTIVE' })
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub)

      const result = await checkSubscriptionStatus('user-1')

      expect(result.isActive).toBe(true)
      expect(result.plan).toBe('GROWTH')
      expect(result.status).toBe('ACTIVE')
      expect(result.isTrialing).toBe(false)
    })

    it('should return trialing status', async () => {
      const now = new Date()
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const mockSub = createMockSubscription({
        plan: 'TRIAL',
        status: 'TRIALING',
        trialEndsAt: trialEnd,
      })
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub)

      const result = await checkSubscriptionStatus('user-1')

      expect(result.isActive).toBe(true)
      expect(result.isTrialing).toBe(true)
    })

    it('should return inactive for CANCELED status', async () => {
      const mockSub = createMockSubscription({ status: 'CANCELED' })
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub)

      const result = await checkSubscriptionStatus('user-1')

      expect(result.isActive).toBe(false)
    })

    it('should calculate days remaining', async () => {
      const now = new Date()
      const periodEnd = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
      const mockSub = createMockSubscription({ currentPeriodEnd: periodEnd })
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub)

      const result = await checkSubscriptionStatus('user-1')

      expect(result.daysRemaining).toBeGreaterThanOrEqual(14)
      expect(result.daysRemaining).toBeLessThanOrEqual(16)
    })
  })

  describe('getPlanLimits', () => {
    it('should return limits for TRIAL plan', () => {
      const limits = getPlanLimits('TRIAL')

      expect(limits.documentLimit).toBe(15)
      expect(limits.isUnlimited).toBe(false)
    })

    it('should return limits for GROWTH plan', () => {
      const limits = getPlanLimits('GROWTH')

      expect(limits.documentLimit).toBe(150)
      expect(limits.isUnlimited).toBe(false)
    })

    it('should return unlimited for UNLIMITED plan', () => {
      const limits = getPlanLimits('UNLIMITED')

      expect(limits.documentLimit).toBe(-1)
      expect(limits.isUnlimited).toBe(true)
    })
  })

  describe('registerBillingKey', () => {
    it('should register billing key', async () => {
      const mockSub = createMockSubscription({ billingKey: null })
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub)

      const mockTossClient = {
        payWithBillingKey: vi.fn(),
        issueBillingKey: vi.fn().mockResolvedValue({ billingKey: 'new-billing-key' }),
        deleteBillingKey: vi.fn(),
      }
      vi.mocked(getTossClient).mockReturnValue(mockTossClient as unknown as ReturnType<typeof getTossClient>)

      mockPrisma.subscription.update.mockResolvedValue({
        ...mockSub,
        billingKey: 'new-billing-key',
      })

      const result = await registerBillingKey('user-1', 'auth-key-123')

      expect(mockTossClient.issueBillingKey).toHaveBeenCalledWith({
        customerKey: 'customer-user-1',
        authKey: 'auth-key-123',
      })
      expect(result.billingKey).toBe('new-billing-key')
    })
  })

  describe('processExpiredSubscriptions', () => {
    it('should process expired trials', async () => {
      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 3 })
      mockPrisma.subscription.findMany.mockResolvedValue([])

      const result = await processExpiredSubscriptions()

      expect(result).toBe(3)
      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'TRIALING',
          trialEndsAt: { lt: expect.any(Date) },
        },
        data: {
          status: 'UNPAID',
        },
      })
    })
  })
})

describe('PLAN_CONFIGS', () => {
  it('should have all required plans', () => {
    expect(PLAN_CONFIGS.TRIAL).toBeDefined()
    expect(PLAN_CONFIGS.STARTER).toBeDefined()
    expect(PLAN_CONFIGS.GROWTH).toBeDefined()
    expect(PLAN_CONFIGS.SCALE).toBeDefined()
    expect(PLAN_CONFIGS.UNLIMITED).toBeDefined()
  })

  it('should have increasing prices', () => {
    expect(PLAN_CONFIGS.TRIAL.price).toBe(0)
    expect(PLAN_CONFIGS.STARTER.price).toBeLessThan(PLAN_CONFIGS.GROWTH.price)
    expect(PLAN_CONFIGS.GROWTH.price).toBeLessThan(PLAN_CONFIGS.SCALE.price)
    expect(PLAN_CONFIGS.SCALE.price).toBeLessThan(PLAN_CONFIGS.UNLIMITED.price)
  })

  it('should have increasing document limits', () => {
    expect(PLAN_CONFIGS.TRIAL.documentLimit).toBeLessThan(
      PLAN_CONFIGS.STARTER.documentLimit
    )
    expect(PLAN_CONFIGS.STARTER.documentLimit).toBeLessThan(
      PLAN_CONFIGS.GROWTH.documentLimit
    )
  })
})

describe('PaymentError', () => {
  it('should create error with code and message', () => {
    const error = new PaymentError(PAYMENT_ERROR_CODES.PAYMENT_FAILED, 'Test error')

    expect(error.code).toBe(PAYMENT_ERROR_CODES.PAYMENT_FAILED)
    expect(error.message).toBe('Test error')
    expect(error.name).toBe('PaymentError')
  })
})
