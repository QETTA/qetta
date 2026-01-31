/**
 * Toss Payments API Client
 *
 * Toss Payments REST API 래퍼
 *
 * @see https://docs.tosspayments.com/reference
 */

import type {
  TossPaymentConfig,
  TossPaymentConfirm,
  TossPaymentResponse,
  TossBillingKeyRequest,
  TossBillingKeyResponse,
  TossBillingPaymentRequest,
  TossCancelResponse,
} from './types'
import { PaymentError, PAYMENT_ERROR_CODES } from './types'

// ============================================
// Configuration
// ============================================

const getConfig = (): TossPaymentConfig => ({
  clientKey: process.env.TOSS_CLIENT_KEY || process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '',
  secretKey: process.env.TOSS_SECRET_KEY || '',
  baseUrl: process.env.TOSS_API_URL || 'https://api.tosspayments.com/v1',
})

// ============================================
// API Client
// ============================================

class TossPaymentsClient {
  private config: TossPaymentConfig

  constructor(config?: Partial<TossPaymentConfig>) {
    this.config = { ...getConfig(), ...config }
  }

  /**
   * Basic Auth 헤더 생성
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.config.secretKey}:`).toString('base64')
    return `Basic ${credentials}`
  }

  /**
   * API 요청 공통 로직
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      Authorization: this.getAuthHeader(),
      'Content-Type': 'application/json',
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)
      const data = await response.json()

      if (!response.ok) {
        throw new PaymentError(
          data.code || PAYMENT_ERROR_CODES.PROVIDER_ERROR,
          data.message || 'Toss API error',
          response.status
        )
      }

      return data as T
    } catch (error) {
      if (error instanceof PaymentError) throw error

      throw new PaymentError(
        PAYMENT_ERROR_CODES.PROVIDER_ERROR,
        error instanceof Error ? error.message : 'Unknown error',
        500
      )
    }
  }

  // ============================================
  // 결제 승인
  // ============================================

  /**
   * 결제 승인
   * 클라이언트에서 결제 요청 후 서버에서 승인 처리
   */
  async confirmPayment(params: TossPaymentConfirm): Promise<TossPaymentResponse> {
    return this.request<TossPaymentResponse>('POST', '/payments/confirm', params)
  }

  /**
   * 결제 조회
   */
  async getPayment(paymentKey: string): Promise<TossPaymentResponse> {
    return this.request<TossPaymentResponse>('GET', `/payments/${paymentKey}`)
  }

  /**
   * 주문번호로 결제 조회
   */
  async getPaymentByOrderId(orderId: string): Promise<TossPaymentResponse> {
    return this.request<TossPaymentResponse>('GET', `/payments/orders/${orderId}`)
  }

  // ============================================
  // 결제 취소
  // ============================================

  /**
   * 결제 취소
   */
  async cancelPayment(
    paymentKey: string,
    cancelReason: string,
    cancelAmount?: number
  ): Promise<TossCancelResponse> {
    const body: { cancelReason: string; cancelAmount?: number } = { cancelReason }
    if (cancelAmount !== undefined) {
      body.cancelAmount = cancelAmount
    }

    return this.request<TossCancelResponse>('POST', `/payments/${paymentKey}/cancel`, body)
  }

  // ============================================
  // 빌링 (자동결제)
  // ============================================

  /**
   * 빌링키 발급
   * 카드 정보 등록 후 자동결제용 빌링키 발급
   */
  async issueBillingKey(params: TossBillingKeyRequest): Promise<TossBillingKeyResponse> {
    return this.request<TossBillingKeyResponse>('POST', '/billing/authorizations/issue', params)
  }

  /**
   * 빌링키로 자동결제
   */
  async payWithBillingKey(params: TossBillingPaymentRequest): Promise<TossPaymentResponse> {
    return this.request<TossPaymentResponse>(
      'POST',
      `/billing/${params.billingKey}`,
      params
    )
  }

  /**
   * 빌링키 삭제 (자동결제 해지)
   */
  async deleteBillingKey(billingKey: string, customerKey: string): Promise<void> {
    await this.request<void>('DELETE', `/billing/${billingKey}?customerKey=${customerKey}`)
  }

  // ============================================
  // 유틸리티
  // ============================================

  /**
   * 환경설정 확인
   */
  isConfigured(): boolean {
    return !!(this.config.clientKey && this.config.secretKey)
  }

  /**
   * 클라이언트 키 반환 (프론트엔드용)
   */
  getClientKey(): string {
    return this.config.clientKey
  }
}

// ============================================
// Singleton Instance
// ============================================

let clientInstance: TossPaymentsClient | null = null

export function getTossClient(): TossPaymentsClient {
  if (!clientInstance) {
    clientInstance = new TossPaymentsClient()
  }
  return clientInstance
}

// ============================================
// Webhook Signature Verification
// ============================================

import { createHmac } from 'crypto'

/**
 * Toss Webhook 서명 검증
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  const webhookSecret = secret || process.env.TOSS_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.warn('TOSS_WEBHOOK_SECRET not configured')
    return false
  }

  const expectedSignature = createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('base64')

  return signature === expectedSignature
}

// ============================================
// Helper Functions
// ============================================

/**
 * 주문 ID 생성
 */
export function generateOrderId(prefix: string = 'QETTA'): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}`.toUpperCase()
}

/**
 * 고객 키 생성 (빌링용)
 */
export function generateCustomerKey(userId: string): string {
  return `qetta_${userId}`
}

// ============================================
// Export
// ============================================

export { TossPaymentsClient }
export default getTossClient
