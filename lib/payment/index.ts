/**
 * Payment Module
 *
 * QETTA 결제 시스템 (Toss Payments)
 *
 * @example
 * ```typescript
 * import { getSubscription, checkUsageLimit, PLAN_CONFIGS } from '@/lib/payment'
 *
 * // 사용량 확인
 * const result = await checkUsageLimit(userId, 'DOCUMENT_GENERATION')
 * if (!result.allowed) {
 *   throw new Error(result.reason)
 * }
 * ```
 */

// Types
export * from './types'

// Toss Client
export {
  getTossClient,
  TossPaymentsClient,
  verifyWebhookSignature,
  generateOrderId,
  generateCustomerKey,
} from './toss-client'

// Subscription Management
export {
  getSubscription,
  getOrCreateSubscription,
  createTrialSubscription,
  changePlan,
  registerBillingKey,
  cancelSubscription,
  checkSubscriptionStatus,
  getPlanLimits,
  processExpiredSubscriptions,
} from './subscription'

// Usage Tracking
export {
  recordUsage,
  getCurrentUsage,
  getUsageSummary,
  getUsageQuota,
  checkUsageLimit,
  checkAndRecordUsage,
  getUsageHistory,
  checkUsageWarning,
  requireUsageQuota,
} from './usage'
