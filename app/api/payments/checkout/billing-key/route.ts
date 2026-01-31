/**
 * Billing Key Registration API
 *
 * 자동결제용 빌링키 등록
 *
 * POST /api/payments/checkout/billing-key - 빌링키 등록
 * DELETE /api/payments/checkout/billing-key - 빌링키 삭제
 */

import { NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/api/middleware'
import { z } from 'zod'
import { registerBillingKey, getSubscription, cancelSubscription } from '@/lib/payment/subscription'
import { getTossClient } from '@/lib/payment/toss-client'
import { PaymentError, PAYMENT_ERROR_CODES } from '@/lib/payment/types'

// ============================================
// Schema
// ============================================

const billingKeyRequestSchema = z.object({
  authKey: z.string().min(1, 'authKey는 필수입니다'),
})

// ============================================
// POST /api/payments/checkout/billing-key
// ============================================

/**
 * 빌링키 등록
 *
 * Toss 카드 등록 완료 후 authKey로 빌링키 발급
 */
export const POST = withApiMiddleware(
  async (request, session) => {
    const body = await request.json()
    const { authKey } = billingKeyRequestSchema.parse(body)

    const userId = session.user.id

    try {
      const subscription = await registerBillingKey(userId, authKey)

      return NextResponse.json({
        success: true,
        data: {
          billingKeyRegistered: true,
          message: '결제 수단이 등록되었습니다',
        },
      })
    } catch (error) {
      console.error('Billing key registration failed:', error)

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
            message: '결제 수단 등록에 실패했습니다',
          },
        },
        { status: 500 }
      )
    }
  },
  { endpoint: 'payments' }
)

// ============================================
// DELETE /api/payments/checkout/billing-key
// ============================================

/**
 * 빌링키 삭제 (자동결제 해지)
 */
export const DELETE = withApiMiddleware(
  async (request, session) => {
    const userId = session.user.id
    const subscription = await getSubscription(userId)

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: PAYMENT_ERROR_CODES.SUBSCRIPTION_NOT_FOUND,
            message: '구독 정보를 찾을 수 없습니다',
          },
        },
        { status: 404 }
      )
    }

    if (!subscription.billingKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: PAYMENT_ERROR_CODES.INVALID_REQUEST,
            message: '등록된 결제 수단이 없습니다',
          },
        },
        { status: 400 }
      )
    }

    try {
      // Toss에서 빌링키 삭제
      if (subscription.customerKey) {
        const toss = getTossClient()
        await toss.deleteBillingKey(subscription.billingKey, subscription.customerKey)
      }

      // DB에서 빌링키 제거 (구독은 유지)
      const { prisma } = await import('@/lib/db/prisma')
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { billingKey: null },
      })

      return NextResponse.json({
        success: true,
        data: {
          billingKeyDeleted: true,
          message: '결제 수단이 삭제되었습니다. 자동 갱신이 중지됩니다.',
        },
      })
    } catch (error) {
      console.error('Billing key deletion failed:', error)

      return NextResponse.json(
        {
          success: false,
          error: {
            code: PAYMENT_ERROR_CODES.PROVIDER_ERROR,
            message: '결제 수단 삭제에 실패했습니다',
          },
        },
        { status: 500 }
      )
    }
  },
  { endpoint: 'payments' }
)
