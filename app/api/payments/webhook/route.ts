/**
 * Toss Payments Webhook Handler
 *
 * 결제 상태 변경, 자동결제 등 비동기 이벤트 처리
 *
 * POST /api/payments/webhook - Webhook 수신
 *
 * P0-FIX-2: 멱등성 보장
 * - Event ID 기반 중복 감지
 * - 이미 처리된 이벤트는 즉시 200 반환 (재시도 방지)
 *
 * @see https://docs.tosspayments.com/reference/webhook
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyWebhookSignature } from '@/lib/payment/toss-client'
import { logger } from '@/lib/api/logger'
import type {
  TossWebhookPayload,
  TossPaymentResponse,
  TossBillingPaymentData,
} from '@/lib/payment/types'
import { hasEventId, hasBillingCustomerKey } from '@/lib/payment/types'
import type { PaymentStatus } from '@prisma/client'

// ============================================
// Helper: Event ID 생성
// ============================================

/**
 * Webhook 이벤트의 고유 ID 생성
 * Toss가 eventId를 제공하면 사용, 아니면 생성
 */
function generateEventId(payload: TossWebhookPayload): string {
  // Toss에서 제공하는 eventId가 있으면 사용 (타입 가드 사용)
  if (hasEventId(payload)) {
    return payload.eventId
  }

  // 없으면 이벤트 타입 + paymentKey로 생성
  const data = payload.data as TossPaymentResponse
  if (data?.paymentKey) {
    return `${payload.eventType}-${data.paymentKey}`
  }

  // 최후의 수단: 타임스탬프 + 랜덤
  return `${payload.eventType}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// ============================================
// Webhook Handler
// ============================================

export async function POST(request: Request) {
  try {
    // 1. Raw body 읽기 (서명 검증용)
    const rawBody = await request.text()
    const signature = request.headers.get('Toss-Signature') || ''

    // 2. 서명 검증
    if (!verifyWebhookSignature(rawBody, signature)) {
      logger.error('[Webhook] Invalid signature')
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // 3. Payload 파싱
    const payload: TossWebhookPayload = JSON.parse(rawBody)
    const eventId = generateEventId(payload)
    logger.info(`[Webhook] Received event: ${payload.eventType}, eventId: ${eventId}`)

    // P0-FIX-2: 멱등성 체크 - 이미 처리된 이벤트인지 확인
    const existingEvent = await prisma.processedWebhookEvent.findUnique({
      where: { eventId },
    })

    if (existingEvent) {
      logger.debug(`[Webhook] Duplicate event ignored: ${eventId}`)
      // 200 반환으로 재시도 방지
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // 4. 이벤트 타입별 처리
    switch (payload.eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChanged(payload.data as TossPaymentResponse)
        break

      case 'BILLING_PAYMENT':
        // Billing payment data includes customerKey
        if (!hasBillingCustomerKey(payload.data)) {
          logger.warn('[Webhook] BILLING_PAYMENT missing customerKey')
          break
        }
        await handleBillingPayment(payload.data)
        break

      case 'CUSTOMER_BILLING_KEY_DELETED':
        // Billing key deletion also includes customerKey
        if (!hasBillingCustomerKey(payload.data)) {
          logger.warn('[Webhook] CUSTOMER_BILLING_KEY_DELETED missing customerKey')
          break
        }
        await handleBillingKeyDeleted(payload.data)
        break

      case 'VIRTUAL_ACCOUNT_DEPOSIT_CALLBACK':
        await handleVirtualAccountDeposit(payload.data as TossPaymentResponse)
        break

      default:
        logger.warn(`[Webhook] Unknown event type: ${payload.eventType}`)
    }

    // P0-FIX-2: 처리 완료 후 이벤트 기록
    await prisma.processedWebhookEvent.create({
      data: {
        eventId,
        eventType: payload.eventType,
        metadata: {
          paymentKey: (payload.data as TossPaymentResponse)?.paymentKey,
          status: (payload.data as TossPaymentResponse)?.status,
        },
      },
    })

    // Toss는 200 응답을 기대
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[Webhook] Processing error:', error)
    // 500 응답 시 Toss가 재시도
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}

// ============================================
// Event Handlers
// ============================================

/**
 * 결제 상태 변경 처리
 */
async function handlePaymentStatusChanged(data: TossPaymentResponse) {
  const { paymentKey, status, orderId } = data

  // DB에서 결제 정보 조회
  const payment = await prisma.payment.findFirst({
    where: { paymentKey },
    include: { subscription: true },
  })

  if (!payment) {
    logger.warn(`[Webhook] Payment not found: ${paymentKey}`)
    return
  }

  // 상태 매핑
  const statusMap: Record<string, PaymentStatus> = {
    DONE: 'DONE',
    CANCELED: 'CANCELED',
    PARTIAL_CANCELED: 'PARTIAL_CANCELED',
    ABORTED: 'ABORTED',
    EXPIRED: 'EXPIRED',
  }

  const newStatus = statusMap[status]
  if (!newStatus) return

  // 결제 상태 업데이트
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newStatus,
      ...(data.approvedAt && { approvedAt: new Date(data.approvedAt) }),
      ...(data.receipt?.url && { receiptUrl: data.receipt.url }),
    },
  })

  // 결제 취소 시 구독 상태 변경
  if (status === 'CANCELED' || status === 'ABORTED') {
    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: 'PAST_DUE' },
    })
  }

  logger.info(`[Webhook] Payment ${paymentKey} status updated: ${newStatus}`)
}

/**
 * 자동결제 (빌링) 완료 처리
 * @param data - TossBillingPaymentData (타입 가드로 검증됨)
 */
async function handleBillingPayment(data: TossBillingPaymentData) {
  const { paymentKey, orderId, totalAmount, approvedAt, card, receipt, status, customerKey } = data

  const subscription = await prisma.subscription.findFirst({
    where: { customerKey },
  })

  if (!subscription) {
    logger.warn(`[Webhook] Subscription not found for customerKey: ${customerKey}`)
    return
  }

  // 결제 기록 생성
  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      paymentKey,
      orderId,
      orderName: `QETTA ${subscription.plan} 플랜 (자동결제)`,
      method: 'CARD',
      status: status === 'DONE' ? 'DONE' : 'ABORTED',
      amount: totalAmount,
      approvedAt: approvedAt ? new Date(approvedAt) : new Date(),
      receiptUrl: receipt?.url,
      cardNumber: card?.number,
      cardCompany: card?.company,
    },
  })

  // 성공 시 구독 기간 갱신
  if (status === 'DONE') {
    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30일

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    })

    logger.info(`[Webhook] Subscription ${subscription.id} renewed via billing`)
  } else {
    // 실패 시 PAST_DUE로 변경
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' },
    })

    logger.warn(`[Webhook] Billing payment failed for subscription ${subscription.id}`)
  }
}

/**
 * 빌링키 삭제 처리
 * @param data - TossBillingPaymentData (타입 가드로 검증됨)
 */
async function handleBillingKeyDeleted(data: TossBillingPaymentData) {
  const { customerKey } = data

  const subscription = await prisma.subscription.findFirst({
    where: { customerKey },
  })

  if (!subscription) {
    logger.warn(`[Webhook] Subscription not found for billing key deletion: ${customerKey}`)
    return
  }

  // 빌링키 제거
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { billingKey: null },
  })

  logger.info(`[Webhook] Billing key deleted for subscription ${subscription.id}`)
}

/**
 * 가상계좌 입금 처리
 */
async function handleVirtualAccountDeposit(data: TossPaymentResponse) {
  const { paymentKey, status } = data

  if (status !== 'DONE') return

  const payment = await prisma.payment.findFirst({
    where: { paymentKey },
    include: { subscription: true },
  })

  if (!payment) return

  // 결제 완료 처리
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'DONE',
      approvedAt: new Date(),
    },
  })

  // 구독 활성화
  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  await prisma.subscription.update({
    where: { id: payment.subscriptionId },
    data: {
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  })

  logger.info(`[Webhook] Virtual account deposit confirmed: ${paymentKey}`)
}
