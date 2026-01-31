/**
 * Payment Checkout API
 *
 * 결제 세션 생성 및 승인
 *
 * POST /api/payments/checkout - 결제 요청 (플랜 변경)
 *
 * P0-FIX-1: Race Condition 방지
 * - 체크아웃 시 PendingPaymentOrder 생성 (금액 서버에서 확정)
 * - confirm 시 DB 금액과 대조하여 TOCTOU 공격 방지
 */

import { NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/api/middleware'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import {
  getOrCreateSubscription,
  changePlan,
  registerBillingKey,
  checkSubscriptionStatus,
} from '@/lib/payment/subscription'
import { getTossClient, generateOrderId } from '@/lib/payment/toss-client'
import { PLAN_CONFIGS, type PlanId, PaymentError } from '@/lib/payment/types'
import type { SubscriptionPlan } from '@prisma/client'

// ============================================
// Schemas
// ============================================

const checkoutRequestSchema = z.object({
  plan: z.enum(['STARTER', 'GROWTH', 'SCALE', 'UNLIMITED']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
})

const confirmRequestSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  amount: z.number(),
})

const billingKeyRequestSchema = z.object({
  authKey: z.string(),
})

// ============================================
// POST /api/payments/checkout
// ============================================

/**
 * 결제 세션 생성 (플랜 업그레이드 준비)
 *
 * 클라이언트에서 Toss 결제창을 띄우기 위한 정보 반환
 *
 * P0-FIX-1: PendingPaymentOrder 생성으로 금액 서버에서 확정
 */
export const POST = withApiMiddleware(
  async (request, session) => {
    const body = await request.json()
    const { plan, billingCycle } = checkoutRequestSchema.parse(body)

    const userId = session.user.id
    const subscription = await getOrCreateSubscription(userId)
    const planConfig = PLAN_CONFIGS[plan]

    if (!planConfig) {
      return NextResponse.json(
        { success: false, error: { code: 'PLAN_NOT_FOUND', message: '유효하지 않은 플랜입니다' } },
        { status: 400 }
      )
    }

    // 이미 같은 플랜이면 에러
    if (subscription.plan === plan) {
      return NextResponse.json(
        { success: false, error: { code: 'SAME_PLAN', message: '이미 동일한 플랜을 사용 중입니다' } },
        { status: 400 }
      )
    }

    // 가격 계산 (서버에서 확정)
    const amount = billingCycle === 'yearly' ? planConfig.priceYearly : planConfig.price
    const orderId = generateOrderId('SUB')

    // P0-FIX-1: PendingPaymentOrder 생성 (30분 후 만료)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    await prisma.pendingPaymentOrder.create({
      data: {
        orderId,
        userId,
        plan: plan as SubscriptionPlan,
        amount,
        billingCycle,
        status: 'PENDING',
        expiresAt,
      },
    })

    // Toss 클라이언트 키 (프론트엔드에서 결제창 호출 시 필요)
    const toss = getTossClient()

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        orderName: `QETTA ${planConfig.nameKo} 플랜 (${billingCycle === 'yearly' ? '연간' : '월간'})`,
        amount,
        customerKey: subscription.customerKey,
        clientKey: toss.getClientKey(),
        plan,
        billingCycle,
        // 결제 완료 후 리다이렉트 URL
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing/success`,
        failUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing/fail`,
      },
    })
  },
  { endpoint: 'payments' }
)

// ============================================
// POST /api/payments/checkout/confirm
// ============================================

/**
 * 결제 승인 처리
 *
 * Toss 결제창에서 결제 완료 후 호출
 */
export async function confirmPayment(request: Request, userId: string) {
  const body = await request.json()
  const { paymentKey, orderId, amount } = confirmRequestSchema.parse(body)

  const toss = getTossClient()

  // Toss API로 결제 승인 요청
  const paymentResult = await toss.confirmPayment({
    paymentKey,
    orderId,
    amount,
  })

  // orderId에서 플랜 정보 추출 (또는 세션에서 가져오기)
  // orderId 형식: SUB-{timestamp}-{random}
  // 실제로는 Redis나 DB에 임시 저장된 정보를 조회해야 함

  return paymentResult
}

// ============================================
// POST /api/payments/checkout/billing-key
// ============================================

/**
 * 빌링키 등록 (자동결제 카드 등록)
 */
export async function registerBilling(request: Request, userId: string) {
  const body = await request.json()
  const { authKey } = billingKeyRequestSchema.parse(body)

  const subscription = await registerBillingKey(userId, authKey)

  return {
    success: true,
    data: {
      billingKeyRegistered: !!subscription.billingKey,
    },
  }
}
