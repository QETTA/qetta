'use client'

/**
 * Billing Client Component
 *
 * Client-side billing UI interactions
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  CreditCard,
  Calendar,
  FileText,
  AlertTriangle,
  Check,
  Star,
  Zap,
  Crown,
  Infinity,
} from 'lucide-react'
import type { PlanId } from '@/lib/payment/types'

// ============================================
// Types
// ============================================

interface BillingData {
  subscription: {
    id: string
    plan: PlanId
    planName: string
    status: string
    isActive: boolean
    isTrialing: boolean
    daysRemaining: number
    hasBillingKey: boolean
    currentPeriodStart: Date
    currentPeriodEnd: Date
    trialEndsAt: Date | null
    canceledAt: Date | null
  }
  quota: {
    documentLimit: number
    used: number
    remaining: number
    isUnlimited: boolean
    usagePercent: number
  }
  warning: {
    hasWarning: boolean
    usagePercent: number
    message?: string
  }
  plans: Array<{
    id: PlanId
    name: string
    nameKo: string
    price: number
    priceYearly: number
    documentLimit: number
    features: string[]
    recommended?: boolean
  }>
  payments: Array<{
    id: string
    orderId: string
    orderName: string
    amount: number
    status: string
    approvedAt: Date | null
    receiptUrl: string | null
  }>
}

// ============================================
// Plan Icons
// ============================================

const PLAN_ICONS: Record<string, React.ReactNode> = {
  TRIAL: <FileText className="h-5 w-5" />,
  STARTER: <Zap className="h-5 w-5" />,
  GROWTH: <Star className="h-5 w-5" />,
  SCALE: <Crown className="h-5 w-5" />,
  UNLIMITED: <Infinity className="h-5 w-5" />,
}

// ============================================
// Main Component
// ============================================

export function BillingClient({ data }: { data: BillingData }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date))

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price / 1000)

  const handleUpgrade = async (planId: PlanId) => {
    setIsLoading(true)
    setSelectedPlan(planId)

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, billingCycle: 'monthly' }),
      })

      const result = await res.json()

      if (result.success) {
        // Redirect to Toss payment window
        // Uses @tosspayments/tosspayments-sdk
        const { orderId, amount, orderName, customerKey, clientKey, successUrl, failUrl } = result.data

        // Simple implementation: pass via query parameters
        const checkoutUrl = `/settings/billing/checkout?${new URLSearchParams({
          orderId,
          amount: amount.toString(),
          orderName,
          customerKey: customerKey || '',
          plan: planId,
        })}`

        router.push(checkoutUrl)
      } else {
        alert(result.error?.message || 'Payment preparation failed')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('An error occurred')
    } finally {
      setIsLoading(false)
      setSelectedPlan(null)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)

    try {
      const res = await fetch('/api/payments/subscription', {
        method: 'DELETE',
      })

      const result = await res.json()

      if (result.success) {
        alert(result.data.message)
        router.refresh()
      } else {
        alert(result.error?.message || 'Subscription cancellation failed')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      alert('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current subscription status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {PLAN_ICONS[data.subscription.plan]}
              <div>
                <CardTitle className="text-xl">{data.subscription.planName} Plan</CardTitle>
                <CardDescription>
                  {data.subscription.isTrialing
                    ? `Trial period: ${data.subscription.daysRemaining} days remaining`
                    : data.subscription.isActive
                      ? `Next billing: ${formatDate(data.subscription.currentPeriodEnd)}`
                      : 'Inactive'}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={
                data.subscription.status === 'ACTIVE'
                  ? 'default'
                  : data.subscription.status === 'TRIALING'
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {data.subscription.status === 'ACTIVE'
                ? 'Active'
                : data.subscription.status === 'TRIALING'
                  ? 'Trial'
                  : data.subscription.status === 'CANCELED'
                    ? 'Canceled'
                    : 'Payment required'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Documents generated this month</span>
              <span>
                {data.quota.isUnlimited
                  ? `${data.quota.used} (Unlimited)`
                  : `${data.quota.used} / ${data.quota.documentLimit}`}
              </span>
            </div>
            {!data.quota.isUnlimited && (
              <Progress value={data.quota.usagePercent} className="h-2" />
            )}
            {data.warning.hasWarning && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{data.warning.message}</span>
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="flex items-center justify-between py-3 border-t">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {data.subscription.hasBillingKey ? 'Payment method registered' : 'No payment method'}
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/settings/billing/payment-method">
                {data.subscription.hasBillingKey ? 'Change' : 'Add'}
              </a>
            </Button>
          </div>

          {/* Cancel subscription button */}
          {data.subscription.isActive && data.subscription.plan !== 'TRIAL' && !data.subscription.canceledAt && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Cancel subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You can continue using the service until {formatDate(data.subscription.currentPeriodEnd)}.
                    After that, your account will be downgraded to the free trial.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep subscription</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Cancel subscription'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>

      {/* Plan selection */}
      <Card>
        <CardHeader>
          <CardTitle>Change plan</CardTitle>
          <CardDescription>Choose the plan that fits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.recommended ? 'border-primary' : ''} ${data.subscription.plan === plan.id ? 'bg-muted' : ''}`}
              >
                {plan.recommended && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">Recommended</Badge>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {PLAN_ICONS[plan.id]}
                    <CardTitle className="text-lg">{plan.nameKo}</CardTitle>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.documentLimit === -1 ? 'Unlimited' : `${plan.documentLimit} docs/mo`}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1 text-sm">
                    {plan.features.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={data.subscription.plan === plan.id ? 'secondary' : 'default'}
                    disabled={data.subscription.plan === plan.id || isLoading}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {data.subscription.plan === plan.id
                      ? 'Current plan'
                      : isLoading && selectedPlan === plan.id
                        ? 'Processing...'
                        : 'Select'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment history */}
      {data.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{payment.orderName}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.approvedAt && formatDate(payment.approvedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(payment.amount)}</p>
                    {payment.receiptUrl && (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Receipt
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
