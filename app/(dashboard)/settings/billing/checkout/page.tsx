'use client'

/**
 * Checkout Page
 *
 * Toss Payments checkout integration
 * Using @tosspayments/tosspayments-sdk
 */

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Toss SDK is loaded dynamically on the client
interface TossPaymentsInstance {
  requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const orderName = searchParams.get('orderName')
  const customerKey = searchParams.get('customerKey')
  const plan = searchParams.get('plan')

  useEffect(() => {
    // Load Toss SDK script
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.async = true
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const handlePayment = async () => {
    if (!orderId || !amount || !orderName) {
      setError('Invalid payment information')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get client key
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billingCycle: 'monthly' }),
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Payment preparation failed')
      }

      const { clientKey, successUrl, failUrl } = result.data

      // Call Toss payment window
      const tossPayments = window.TossPayments?.(clientKey)

      if (!tossPayments) {
        throw new Error('Failed to load payment module')
      }

      await tossPayments.requestPayment('카드', {
        amount: parseInt(amount),
        orderId,
        orderName,
        customerKey,
        successUrl,
        failUrl,
      })
    } catch (error) {
      console.error('Payment error:', error)
      const message = error instanceof Error ? error.message : 'An error occurred during payment'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!orderId || !amount) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Invalid payment information. Please try again.</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push('/settings/billing')}>
          Back to Billing
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Checkout
          </CardTitle>
          <CardDescription>Review payment details and proceed with payment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order info */}
          <div className="bg-muted space-y-3 rounded-lg p-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium">{orderName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-sm">{orderId}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Amount</span>
              <span>
                {new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: 'KRW',
                }).format(parseInt(amount))}
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Payment Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Payment button */}
          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={handlePayment} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/settings/billing')}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>

          {/* Help text */}
          <p className="text-muted-foreground text-center text-xs">
            Payment is securely processed by Toss Payments.
            <br />
            Service is activated immediately after payment.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-lg px-4 py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
