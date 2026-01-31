/**
 * Subscription API
 *
 * 구독 상태 조회 및 관리
 *
 * GET /api/payments/subscription - 현재 구독 조회
 * DELETE /api/payments/subscription - 구독 취소
 */

import { NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/api/middleware'
import { prisma } from '@/lib/db/prisma'
import {
  getOrCreateSubscription,
  checkSubscriptionStatus,
  cancelSubscription,
} from '@/lib/payment/subscription'
import { getUsageQuota, checkUsageWarning } from '@/lib/payment/usage'
import { PLAN_CONFIGS, PaymentError, PAYMENT_ERROR_CODES } from '@/lib/payment/types'

// ============================================
// GET /api/payments/subscription
// ============================================

/**
 * 현재 구독 정보 조회
 */
export const GET = withApiMiddleware(
  async (request, session) => {
    const userId = session.user.id

    // 구독 정보 및 상태
    const [subscription, status, quota, warning, payments] = await Promise.all([
      getOrCreateSubscription(userId),
      checkSubscriptionStatus(userId),
      getUsageQuota(userId),
      checkUsageWarning(userId),
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderId: true,
          orderName: true,
          amount: true,
          status: true,
          approvedAt: true,
          receiptUrl: true,
        },
      }),
    ])

    // 플랜 설정
    const planConfig = PLAN_CONFIGS[status.plan]

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          id: subscription.id,
          plan: status.plan,
          planName: planConfig.nameKo,
          status: status.status,
          isActive: status.isActive,
          isTrialing: status.isTrialing,
          daysRemaining: status.daysRemaining,
          hasBillingKey: !!subscription.billingKey,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          trialEndsAt: subscription.trialEndsAt,
          canceledAt: subscription.canceledAt,
        },
        quota: {
          documentLimit: quota.documentLimit,
          used: quota.used,
          remaining: quota.remaining,
          isUnlimited: quota.isUnlimited,
          periodStart: quota.periodStart,
          periodEnd: quota.periodEnd,
        },
        warning: {
          hasWarning: warning.hasWarning,
          usagePercent: warning.usagePercent,
          message: warning.message,
        },
        plan: {
          id: planConfig.id,
          name: planConfig.name,
          nameKo: planConfig.nameKo,
          price: planConfig.price,
          priceYearly: planConfig.priceYearly,
          features: planConfig.features,
        },
        payments,
      },
    })
  },
  { endpoint: 'payments' }
)

// ============================================
// DELETE /api/payments/subscription
// ============================================

/**
 * 구독 취소
 */
export const DELETE = withApiMiddleware(
  async (request, session) => {
    const userId = session.user.id

    // URL에서 취소 사유 추출
    const url = new URL(request.url)
    const reason = url.searchParams.get('reason') || '사용자 요청'

    try {
      const subscription = await cancelSubscription(userId, reason)

      return NextResponse.json({
        success: true,
        data: {
          message: '구독이 취소되었습니다. 현재 결제 기간이 끝날 때까지 서비스를 이용하실 수 있습니다.',
          subscription: {
            id: subscription.id,
            status: subscription.status,
            canceledAt: subscription.canceledAt,
            currentPeriodEnd: subscription.currentPeriodEnd,
          },
        },
      })
    } catch (error) {
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
            message: '구독 취소에 실패했습니다',
          },
        },
        { status: 500 }
      )
    }
  },
  { endpoint: 'payments' }
)
