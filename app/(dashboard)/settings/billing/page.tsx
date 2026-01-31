/**
 * Billing Settings Page
 *
 * Subscription management, payment methods, usage UI
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getSubscription, getOrCreateSubscription, checkSubscriptionStatus } from '@/lib/payment/subscription'
import { getUsageQuota, checkUsageWarning } from '@/lib/payment/usage'
import { PLAN_CONFIGS, type PlanId } from '@/lib/payment/types'
import { prisma } from '@/lib/db/prisma'
import { BillingClient } from './billing-client'

export const metadata = {
  title: 'Billing - QETTA',
  description: 'Manage subscription plans and payment information',
}

async function getBillingData(userId: string) {
  const [subscription, status, quota, warning] = await Promise.all([
    getOrCreateSubscription(userId),
    checkSubscriptionStatus(userId),
    getUsageQuota(userId),
    checkUsageWarning(userId),
  ])

  // Fetch payment history separately
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      orderId: true,
      orderName: true,
      amount: true,
      status: true,
      approvedAt: true,
      receiptUrl: true,
    },
  })

  const planConfig = PLAN_CONFIGS[status.plan as PlanId]

  return {
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
      usagePercent: warning.usagePercent,
    },
    warning,
    plans: Object.values(PLAN_CONFIGS).filter((p) => p.id !== 'TRIAL') as typeof PLAN_CONFIGS[PlanId][],
    payments,
  }
}

export default async function BillingPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const billingData = await getBillingData(session.user.id)

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription plan and payment information
        </p>
      </div>

      <Suspense fallback={<BillingSkeleton />}>
        <BillingClient data={billingData} />
      </Suspense>
    </div>
  )
}

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 bg-muted animate-pulse rounded-lg" />
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  )
}
