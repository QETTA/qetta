/**
 * Subscription Management
 *
 * 구독 생성, 업그레이드, 취소 관리
 *
 * @see prisma/schema.prisma (Subscription model)
 * @see lib/payment/types.ts (PlanConfig)
 */

import { prisma } from '@/lib/db/prisma'
import type { Subscription, SubscriptionPlan, SubscriptionStatus } from '@prisma/client'
import { PLAN_CONFIGS, type PlanId, PaymentError, PAYMENT_ERROR_CODES } from './types'
import { getTossClient, generateOrderId, generateCustomerKey } from './toss-client'

// ============================================
// Subscription CRUD
// ============================================

/**
 * 사용자 구독 조회
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  return prisma.subscription.findUnique({
    where: { userId },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })
}

/**
 * 구독 생성 (체험판)
 */
export async function createTrialSubscription(userId: string): Promise<Subscription> {
  const now = new Date()
  const trialEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14일 후

  return prisma.subscription.create({
    data: {
      userId,
      plan: 'TRIAL',
      status: 'TRIALING',
      customerKey: generateCustomerKey(userId),
      currentPeriodStart: now,
      currentPeriodEnd: trialEndDate,
      trialEndsAt: trialEndDate,
    },
  })
}

/**
 * 구독 생성 또는 조회
 * 없으면 체험판 자동 생성
 */
export async function getOrCreateSubscription(userId: string): Promise<Subscription> {
  const existing = await getSubscription(userId)
  if (existing) return existing

  return createTrialSubscription(userId)
}

// ============================================
// Plan Management
// ============================================

/**
 * 플랜 업그레이드/변경
 */
export async function changePlan(
  userId: string,
  newPlan: PlanId,
  billingKey?: string
): Promise<Subscription> {
  const subscription = await getOrCreateSubscription(userId)
  const planConfig = PLAN_CONFIGS[newPlan]

  if (!planConfig) {
    throw new PaymentError(PAYMENT_ERROR_CODES.PLAN_NOT_FOUND, `Plan not found: ${newPlan}`)
  }

  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30일 후

  // 유료 플랜이면 결제 처리
  if (planConfig.price > 0) {
    if (!billingKey && !subscription.billingKey) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.PAYMENT_FAILED,
        '결제 수단이 등록되지 않았습니다'
      )
    }

    const client = getTossClient()
    const orderId = generateOrderId('SUB')

    // 빌링키 결제
    const paymentResult = await client.payWithBillingKey({
      billingKey: billingKey || subscription.billingKey!,
      customerKey: subscription.customerKey!,
      amount: planConfig.price,
      orderId,
      orderName: `QETTA ${planConfig.nameKo} 플랜 (월간)`,
    })

    // 결제 기록 저장
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        userId,
        paymentKey: paymentResult.paymentKey,
        orderId,
        orderName: `QETTA ${planConfig.nameKo} 플랜`,
        method: 'CARD',
        status: 'DONE',
        amount: planConfig.price,
        approvedAt: paymentResult.approvedAt ? new Date(paymentResult.approvedAt) : now,
        receiptUrl: paymentResult.receipt?.url,
        cardNumber: paymentResult.card?.number,
        cardCompany: paymentResult.card?.company,
      },
    })
  }

  // 구독 업데이트
  return prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan: newPlan as SubscriptionPlan,
      status: 'ACTIVE',
      billingKey: billingKey || subscription.billingKey,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialEndsAt: null,
      canceledAt: null,
      cancelReason: null,
    },
  })
}

/**
 * 빌링키 등록 (자동결제 카드 등록)
 */
export async function registerBillingKey(
  userId: string,
  authKey: string
): Promise<Subscription> {
  const subscription = await getOrCreateSubscription(userId)
  const client = getTossClient()

  // 빌링키 발급
  const billingResult = await client.issueBillingKey({
    customerKey: subscription.customerKey!,
    authKey,
  })

  // 구독에 빌링키 저장
  return prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      billingKey: billingResult.billingKey,
    },
  })
}

/**
 * 구독 취소
 */
export async function cancelSubscription(
  userId: string,
  reason?: string
): Promise<Subscription> {
  const subscription = await getSubscription(userId)

  if (!subscription) {
    throw new PaymentError(
      PAYMENT_ERROR_CODES.SUBSCRIPTION_NOT_FOUND,
      '구독 정보를 찾을 수 없습니다'
    )
  }

  // 빌링키가 있으면 삭제
  if (subscription.billingKey && subscription.customerKey) {
    try {
      const client = getTossClient()
      await client.deleteBillingKey(subscription.billingKey, subscription.customerKey)
    } catch (error) {
      console.error('Failed to delete billing key:', error)
      // 빌링키 삭제 실패해도 취소는 진행
    }
  }

  return prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      cancelReason: reason || '사용자 요청',
      billingKey: null,
    },
  })
}

// ============================================
// Status Checks
// ============================================

/**
 * 구독 상태 확인
 */
export async function checkSubscriptionStatus(
  userId: string
): Promise<{
  isActive: boolean
  plan: PlanId
  status: SubscriptionStatus
  daysRemaining: number
  isTrialing: boolean
}> {
  const subscription = await getOrCreateSubscription(userId)
  const now = new Date()

  const isActive =
    subscription.status === 'ACTIVE' ||
    subscription.status === 'TRIALING' ||
    (subscription.status === 'PAST_DUE' && now < subscription.currentPeriodEnd)

  const daysRemaining = Math.max(
    0,
    Math.ceil((subscription.currentPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  )

  const isTrialing =
    subscription.status === 'TRIALING' &&
    subscription.trialEndsAt !== null &&
    now < subscription.trialEndsAt

  return {
    isActive,
    plan: subscription.plan as PlanId,
    status: subscription.status,
    daysRemaining,
    isTrialing,
  }
}

/**
 * 플랜 제한 확인
 */
export function getPlanLimits(plan: PlanId): {
  documentLimit: number
  isUnlimited: boolean
} {
  const config = PLAN_CONFIGS[plan]
  return {
    documentLimit: config.documentLimit,
    isUnlimited: config.documentLimit === -1,
  }
}

// ============================================
// Billing Cycle
// ============================================

/**
 * 만료된 구독 처리 (Cron Job용)
 */
export async function processExpiredSubscriptions(): Promise<number> {
  const now = new Date()

  // 만료된 체험판 → 만료 처리
  const expiredTrials = await prisma.subscription.updateMany({
    where: {
      status: 'TRIALING',
      trialEndsAt: { lt: now },
    },
    data: {
      status: 'UNPAID',
    },
  })

  // 결제 기간 만료된 구독 → 자동 갱신 시도
  const expiredActive = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      currentPeriodEnd: { lt: now },
      billingKey: { not: null },
    },
  })

  let renewedCount = 0
  for (const sub of expiredActive) {
    try {
      await changePlan(sub.userId, sub.plan as PlanId)
      renewedCount++
    } catch (error) {
      console.error(`Failed to renew subscription ${sub.id}:`, error)
      // 갱신 실패 → PAST_DUE 상태로 변경
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'PAST_DUE' },
      })
    }
  }

  return expiredTrials.count + renewedCount
}
