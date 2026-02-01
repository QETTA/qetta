/**
 * Usage Tracking
 *
 * 사용량 추적 및 제한 관리
 *
 * @see prisma/schema.prisma (UsageRecord model)
 * @see lib/payment/types.ts (UsageQuota)
 */

import { prisma } from '@/lib/db/prisma'
import type { UsageResourceType } from '@prisma/client'
import { getOrCreateSubscription, getPlanLimits } from './subscription'
import type { PlanId, UsageQuota, UsageCheckResult } from './types'
import { PaymentError, PAYMENT_ERROR_CODES } from './types'

// ============================================
// Usage Recording
// ============================================

/**
 * 사용량 기록
 */
export async function recordUsage(
  userId: string,
  resourceType: UsageResourceType,
  quantity: number = 1,
  metadata?: Record<string, unknown>
): Promise<void> {
  const subscription = await getOrCreateSubscription(userId)

  await prisma.usageRecord.create({
    data: {
      subscriptionId: subscription.id,
      userId,
      resourceType,
      quantity,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  })
}

/**
 * 현재 기간 사용량 조회
 */
export async function getCurrentUsage(
  userId: string,
  resourceType: UsageResourceType
): Promise<number> {
  const subscription = await getOrCreateSubscription(userId)

  const result = await prisma.usageRecord.aggregate({
    where: {
      userId,
      resourceType,
      periodStart: { gte: subscription.currentPeriodStart },
      periodEnd: { lte: subscription.currentPeriodEnd },
    },
    _sum: {
      quantity: true,
    },
  })

  return result._sum.quantity || 0
}

/**
 * 전체 사용량 요약
 */
export async function getUsageSummary(
  userId: string
): Promise<Record<UsageResourceType, number>> {
  const subscription = await getOrCreateSubscription(userId)

  const records = await prisma.usageRecord.groupBy({
    by: ['resourceType'],
    where: {
      userId,
      periodStart: { gte: subscription.currentPeriodStart },
      periodEnd: { lte: subscription.currentPeriodEnd },
    },
    _sum: {
      quantity: true,
    },
  })

  const summary: Record<string, number> = {}
  for (const record of records) {
    summary[record.resourceType] = record._sum.quantity || 0
  }

  return summary as Record<UsageResourceType, number>
}

// ============================================
// Usage Limits
// ============================================

/**
 * 사용량 할당량 조회
 */
export async function getUsageQuota(
  userId: string,
  resourceType: UsageResourceType = 'DOCUMENT_GENERATION'
): Promise<UsageQuota> {
  const subscription = await getOrCreateSubscription(userId)
  const plan = subscription.plan as PlanId
  const limits = getPlanLimits(plan)
  const used = await getCurrentUsage(userId, resourceType)

  const remaining = limits.isUnlimited ? Infinity : Math.max(0, limits.documentLimit - used)

  return {
    plan,
    documentLimit: limits.documentLimit,
    used,
    remaining,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    isUnlimited: limits.isUnlimited,
  }
}

/**
 * 사용량 제한 확인
 * 작업 수행 전 호출하여 제한 초과 여부 확인
 */
export async function checkUsageLimit(
  userId: string,
  resourceType: UsageResourceType = 'DOCUMENT_GENERATION',
  requestedQuantity: number = 1
): Promise<UsageCheckResult> {
  const subscription = await getOrCreateSubscription(userId)
  const quota = await getUsageQuota(userId, resourceType)

  // 구독 상태 확인
  if (subscription.status === 'CANCELED') {
    return {
      allowed: false,
      quota,
      reason: 'SUBSCRIPTION_CANCELED',
    }
  }

  const now = new Date()
  if (now > subscription.currentPeriodEnd) {
    return {
      allowed: false,
      quota,
      reason: 'SUBSCRIPTION_EXPIRED',
    }
  }

  // 무제한 플랜
  if (quota.isUnlimited) {
    return { allowed: true, quota }
  }

  // 제한 확인
  if (quota.remaining < requestedQuantity) {
    return {
      allowed: false,
      quota,
      reason: 'LIMIT_EXCEEDED',
    }
  }

  return { allowed: true, quota }
}

/**
 * 사용량 제한 확인 및 기록 (트랜잭션)
 * 작업 수행 시 호출 - 확인 후 즉시 기록
 */
export async function checkAndRecordUsage(
  userId: string,
  resourceType: UsageResourceType,
  quantity: number = 1,
  metadata?: Record<string, unknown>
): Promise<UsageCheckResult> {
  const checkResult = await checkUsageLimit(userId, resourceType, quantity)

  if (!checkResult.allowed) {
    return checkResult
  }

  // 사용량 기록
  await recordUsage(userId, resourceType, quantity, metadata)

  // 최신 quota 반환
  const updatedQuota = await getUsageQuota(userId, resourceType)
  return { allowed: true, quota: updatedQuota }
}

// ============================================
// Usage Reports
// ============================================

/**
 * 기간별 사용량 조회
 */
export async function getUsageHistory(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{
  date: string
  resourceType: UsageResourceType
  quantity: number
}>> {
  const records = await prisma.usageRecord.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      resourceType: true,
      quantity: true,
      createdAt: true,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma types unavailable without prisma generate
  return records.map((r: any) => ({
    date: r.createdAt.toISOString().split('T')[0],
    resourceType: r.resourceType,
    quantity: r.quantity,
  }))
}

/**
 * 사용량 초과 경고 확인
 * 80% 이상 사용 시 경고
 */
export async function checkUsageWarning(
  userId: string
): Promise<{
  hasWarning: boolean
  usagePercent: number
  message?: string
}> {
  const quota = await getUsageQuota(userId)

  if (quota.isUnlimited) {
    return { hasWarning: false, usagePercent: 0 }
  }

  const usagePercent = Math.round((quota.used / quota.documentLimit) * 100)

  if (usagePercent >= 100) {
    return {
      hasWarning: true,
      usagePercent,
      message: '이번 달 사용량을 모두 소진했습니다. 플랜 업그레이드를 고려해주세요.',
    }
  }

  if (usagePercent >= 80) {
    return {
      hasWarning: true,
      usagePercent,
      message: `이번 달 사용량의 ${usagePercent}%를 사용했습니다.`,
    }
  }

  return { hasWarning: false, usagePercent }
}

// ============================================
// Middleware Helper
// ============================================

/**
 * API 라우트용 사용량 체크 미들웨어 헬퍼
 */
export async function requireUsageQuota(
  userId: string,
  resourceType: UsageResourceType = 'DOCUMENT_GENERATION'
): Promise<void> {
  const result = await checkUsageLimit(userId, resourceType)

  if (!result.allowed) {
    const messages: Record<string, string> = {
      LIMIT_EXCEEDED: '이번 달 사용량을 초과했습니다. 플랜을 업그레이드해주세요.',
      SUBSCRIPTION_EXPIRED: '구독이 만료되었습니다. 결제를 진행해주세요.',
      SUBSCRIPTION_CANCELED: '구독이 취소되었습니다.',
    }

    throw new PaymentError(
      PAYMENT_ERROR_CODES.USAGE_LIMIT_EXCEEDED,
      messages[result.reason!] || '사용량 제한을 초과했습니다',
      403
    )
  }
}
