/**
 * Payment & Subscription Types
 *
 * Toss Payments API 연동을 위한 타입 정의
 *
 * @see https://docs.tosspayments.com/reference
 */

// ============================================
// Plan Configuration
// ============================================

export interface PlanConfig {
  id: PlanId
  name: string
  nameKo: string
  price: number // 월 가격 (원)
  priceYearly: number // 연 가격 (원) - 20% 할인
  documentLimit: number // 월 문서 생성 한도 (-1 = 무제한)
  trialDays: number // 체험 기간 (일)
  features: string[]
  recommended?: boolean
}

export type PlanId = 'TRIAL' | 'STARTER' | 'GROWTH' | 'SCALE' | 'UNLIMITED'

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  TRIAL: {
    id: 'TRIAL',
    name: 'Trial',
    nameKo: '체험',
    price: 0,
    priceYearly: 0,
    documentLimit: 15,
    trialDays: 14,
    features: [
      '14일 무료 체험',
      '월 15건 문서 생성',
      '4개 산업 BLOCK',
      '기본 Engine Preset',
      '이메일 지원',
    ],
  },
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    nameKo: '스타터',
    price: 99000,
    priceYearly: 948000, // 99000 * 12 * 0.8
    documentLimit: 50,
    trialDays: 0,
    features: [
      '월 50건 문서 생성',
      '6개 산업 BLOCK',
      '4개 Engine Preset',
      '해시체인 검증',
      '채팅 지원',
    ],
  },
  GROWTH: {
    id: 'GROWTH',
    name: 'Growth',
    nameKo: '그로스',
    price: 199000,
    priceYearly: 1908000, // 199000 * 12 * 0.8
    documentLimit: 150,
    trialDays: 0,
    features: [
      '월 150건 문서 생성',
      '10개 산업 BLOCK',
      '6개 Engine Preset',
      '해시체인 검증 + QR 코드',
      '우선 지원',
      'API 액세스',
    ],
    recommended: true,
  },
  SCALE: {
    id: 'SCALE',
    name: 'Scale',
    nameKo: '스케일',
    price: 499000,
    priceYearly: 4788000, // 499000 * 12 * 0.8
    documentLimit: 500,
    trialDays: 0,
    features: [
      '월 500건 문서 생성',
      '10개 산업 BLOCK + 커스텀',
      '전체 Engine Preset',
      '전담 매니저',
      '화이트라벨 옵션',
      'SLA 99.9%',
    ],
  },
  UNLIMITED: {
    id: 'UNLIMITED',
    name: 'Unlimited',
    nameKo: '언리미티드',
    price: 990000,
    priceYearly: 9504000, // 990000 * 12 * 0.8
    documentLimit: -1, // 무제한
    trialDays: 0,
    features: [
      '무제한 문서 생성',
      '전체 기능 이용',
      '커스텀 산업 BLOCK',
      '전용 Engine Preset',
      '24/7 프리미엄 지원',
      'On-premise 옵션',
    ],
  },
}

// ============================================
// Toss Payments Types
// ============================================

export interface TossPaymentConfig {
  clientKey: string
  secretKey: string
  baseUrl: string
}

export interface TossPaymentRequest {
  amount: number
  orderId: string
  orderName: string
  customerEmail?: string
  customerName?: string
  customerMobilePhone?: string
  successUrl: string
  failUrl: string
}

export interface TossPaymentConfirm {
  paymentKey: string
  orderId: string
  amount: number
}

export interface TossPaymentResponse {
  mId: string
  version: string
  paymentKey: string
  orderId: string
  orderName: string
  status: TossPaymentStatus
  requestedAt: string
  approvedAt?: string
  useEscrow: boolean
  cultureExpense: boolean
  card?: TossCardInfo
  virtualAccount?: TossVirtualAccountInfo
  transfer?: TossTransferInfo
  mobilePhone?: TossMobilePhoneInfo
  easyPay?: TossEasyPayInfo
  country: string
  failure?: TossFailure
  isPartialCancelable: boolean
  receipt?: TossReceipt
  checkout?: TossCheckout
  currency: string
  totalAmount: number
  balanceAmount: number
  suppliedAmount: number
  vat: number
  taxFreeAmount: number
  method?: string
  secret?: string
}

export type TossPaymentStatus =
  | 'READY'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_DEPOSIT'
  | 'DONE'
  | 'CANCELED'
  | 'PARTIAL_CANCELED'
  | 'ABORTED'
  | 'EXPIRED'

export interface TossCardInfo {
  company: string
  number: string
  installmentPlanMonths: number
  isInterestFree: boolean
  approveNo: string
  useCardPoint: boolean
  cardType: 'CREDIT' | 'CHECK' | 'GIFT'
  ownerType: 'PERSONAL' | 'CORPORATE'
  acquireStatus: string
  receiptUrl?: string
}

export interface TossVirtualAccountInfo {
  accountNumber: string
  accountType: 'FIXED' | 'NORMAL'
  bankCode: string
  customerName: string
  dueDate: string
  expired: boolean
  settlementStatus: string
  refundStatus: string
}

export interface TossTransferInfo {
  bankCode: string
  settlementStatus: string
}

export interface TossMobilePhoneInfo {
  carrier: string
  customerMobilePhone: string
  settlementStatus: string
}

export interface TossEasyPayInfo {
  provider: string
  amount: number
  discountAmount: number
}

export interface TossFailure {
  code: string
  message: string
}

export interface TossReceipt {
  url: string
}

export interface TossCheckout {
  url: string
}

// ============================================
// Billing Key (자동결제)
// ============================================

export interface TossBillingKeyRequest {
  customerKey: string
  authKey: string
}

export interface TossBillingKeyResponse {
  mId: string
  customerKey: string
  authenticatedAt: string
  method: 'CARD'
  billingKey: string
  card?: TossCardInfo
}

export interface TossBillingPaymentRequest {
  billingKey: string
  customerKey: string
  amount: number
  orderId: string
  orderName: string
  customerEmail?: string
  customerName?: string
}

// ============================================
// Webhook Types
// ============================================

export interface TossWebhookPayload {
  eventType: TossWebhookEventType
  createdAt: string
  data: TossPaymentResponse | TossCancelResponse | TossBillingPaymentData
}

/**
 * Extended webhook payload that includes optional eventId
 * Toss may include eventId for idempotency support
 */
export interface TossWebhookPayloadWithEventId extends TossWebhookPayload {
  eventId: string
}

/**
 * Type guard to check if webhook payload has eventId
 */
export function hasEventId(
  payload: TossWebhookPayload
): payload is TossWebhookPayloadWithEventId {
  return 'eventId' in payload && typeof (payload as TossWebhookPayloadWithEventId).eventId === 'string'
}

/**
 * Billing payment data includes customerKey for subscription lookup
 */
export interface TossBillingPaymentData extends TossPaymentResponse {
  customerKey: string
}

/**
 * Type guard to check if payment data has customerKey (billing payment)
 */
export function hasBillingCustomerKey(
  data: TossPaymentResponse | TossCancelResponse | TossBillingPaymentData
): data is TossBillingPaymentData {
  return 'customerKey' in data && typeof (data as TossBillingPaymentData).customerKey === 'string'
}

export type TossWebhookEventType =
  | 'PAYMENT_STATUS_CHANGED'
  | 'VIRTUAL_ACCOUNT_DEPOSIT_CALLBACK'
  | 'BILLING_PAYMENT'
  | 'CUSTOMER_BILLING_KEY_DELETED'

export interface TossCancelResponse {
  paymentKey: string
  orderId: string
  cancelAmount: number
  cancelReason: string
  canceledAt: string
  transactionKey: string
}

// ============================================
// Usage Types
// ============================================

export interface UsageQuota {
  plan: PlanId
  documentLimit: number
  used: number
  remaining: number
  periodStart: Date
  periodEnd: Date
  isUnlimited: boolean
}

export interface UsageCheckResult {
  allowed: boolean
  quota: UsageQuota
  reason?: 'LIMIT_EXCEEDED' | 'SUBSCRIPTION_EXPIRED' | 'SUBSCRIPTION_CANCELED'
}

// ============================================
// Error Types
// ============================================

export class PaymentError extends Error {
  code: string
  statusCode: number

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message)
    this.name = 'PaymentError'
    this.code = code
    this.statusCode = statusCode
  }
}

export const PAYMENT_ERROR_CODES = {
  // Toss API 에러
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_API_KEY: 'INVALID_API_KEY',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_PROCESSED: 'ALREADY_PROCESSED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',

  // QETTA 내부 에러
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  USAGE_LIMIT_EXCEEDED: 'USAGE_LIMIT_EXCEEDED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  WEBHOOK_SIGNATURE_INVALID: 'WEBHOOK_SIGNATURE_INVALID',
} as const

export type PaymentErrorCode = (typeof PAYMENT_ERROR_CODES)[keyof typeof PAYMENT_ERROR_CODES]
