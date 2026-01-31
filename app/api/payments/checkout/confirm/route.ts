/**
 * Payment Confirm API
 *
 * 결제 승인 처리
 *
 * POST /api/payments/checkout/confirm - 결제 승인
 *
 * P0-FIX-1: TOCTOU 취약점 수정
 * - PendingPaymentOrder에서 금액 조회
 * - 클라이언트 금액과 대조하여 조작 방지
 */

import { NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/api/middleware'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { getOrCreateSubscription, changePlan } from '@/lib/payment/subscription'
import { getTossClient } from '@/lib/payment/toss-client'
import { PLAN_CONFIGS, type PlanId, PaymentError, PAYMENT_ERROR_CODES } from '@/lib/payment/types'
import type { SubscriptionPlan } from '@prisma/client'

// ============================================
// Schema
// ============================================

const confirmRequestSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  amount: z.number(),
  // plan과 billingCycle은 더 이상 클라이언트에서 받지 않음 (DB에서 조회)
})

// ============================================
// POST /api/payments/checkout/confirm
// ============================================

export const POST = withApiMiddleware(
  async (request, session) => {
    const body = await request.json()
    const { paymentKey, orderId, amount } = confirmRequestSchema.parse(body)

    const userId = session.user.id

    // P0-FIX-1: PendingPaymentOrder에서 금액 및 플랜 정보 조회
    const pendingOrder = await prisma.pendingPaymentOrder.findUnique({
      where: { orderId },
    })

    if (!pendingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: '주문 정보를 찾을 수 없습니다. 결제를 다시 시도해주세요.',
          },
        },
        { status: 404 }
      )
    }

    // 소유권 검증
    if (pendingOrder.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '접근 권한이 없습니다',
          },
        },
        { status: 403 }
      )
    }

    // 만료 확인
    if (new Date() > pendingOrder.expiresAt) {
      await prisma.pendingPaymentOrder.update({
        where: { orderId },
        data: { status: 'EXPIRED' },
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_EXPIRED',
            message: '결제 세션이 만료되었습니다. 다시 시도해주세요.',
          },
        },
        { status: 400 }
      )
    }

    // 이미 처리된 주문인지 확인
    if (pendingOrder.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_ALREADY_PROCESSED',
            message: '이미 처리된 주문입니다.',
          },
        },
        { status: 400 }
      )
    }

    // P0-FIX-1: 핵심 - DB 금액과 클라이언트 금액 대조 (TOCTOU 방지)
    if (amount !== pendingOrder.amount) {
      console.error(
        `[Payment] Amount mismatch! DB: ${pendingOrder.amount}, Client: ${amount}, orderId: ${orderId}`
      )
      return NextResponse.json(
        {
          success: false,
          error: {
            code: PAYMENT_ERROR_CODES.INVALID_REQUEST,
            message: '결제 금액이 일치하지 않습니다. 결제를 다시 시도해주세요.',
          },
        },
        { status: 400 }
      )
    }

    const plan = pendingOrder.plan as PlanId
    const billingCycle = pendingOrder.billingCycle as 'monthly' | 'yearly'
    const planConfig = PLAN_CONFIGS[plan]

    const subscription = await getOrCreateSubscription(userId)
    const toss = getTossClient()

    try {
      // 1. Toss API로 결제 승인 요청
      const paymentResult = await toss.confirmPayment({
        paymentKey,
        orderId,
        amount: pendingOrder.amount, // DB 금액 사용
      })

      // 2. PendingPaymentOrder 상태 업데이트
      await prisma.pendingPaymentOrder.update({
        where: { orderId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      })

      // 3. 결제 기록 저장
      const now = new Date()
      const periodEnd = new Date(
        now.getTime() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      )

      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          userId,
          paymentKey,
          orderId,
          orderName: `QETTA ${planConfig.nameKo} 플랜 (${billingCycle === 'yearly' ? '연간' : '월간'})`,
          method: 'CARD',
          status: 'DONE',
          amount: pendingOrder.amount,
          approvedAt: paymentResult.approvedAt ? new Date(paymentResult.approvedAt) : now,
          receiptUrl: paymentResult.receipt?.url,
          cardNumber: paymentResult.card?.number,
          cardCompany: paymentResult.card?.company,
        },
      })

      // 4. 구독 업데이트
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: plan as SubscriptionPlan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          trialEndsAt: null,
          canceledAt: null,
          cancelReason: null,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          subscription: {
            id: updatedSubscription.id,
            plan: updatedSubscription.plan,
            status: updatedSubscription.status,
            currentPeriodEnd: updatedSubscription.currentPeriodEnd,
          },
          payment: {
            paymentKey,
            orderId,
            amount: pendingOrder.amount,
            approvedAt: paymentResult.approvedAt,
            receiptUrl: paymentResult.receipt?.url,
          },
        },
      })
    } catch (error) {
      console.error('Payment confirmation failed:', error)

      if (error instanceof PaymentError) {
        return NextResponse.json(
          { success: false, error: { code: error.code, message: error.message } },
          { status: error.statusCode }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: PAYMENT_ERROR_CODES.PAYMENT_FAILED,
            message: '결제 승인에 실패했습니다',
          },
        },
        { status: 500 }
      )
    }
  },
  { endpoint: 'payments' }
)
