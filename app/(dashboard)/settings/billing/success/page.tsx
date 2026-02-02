'use client'

/**
 * Payment Success Page
 *
 * Payment confirmation after success
 */

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import confetti from 'canvas-confetti'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)

  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')

  // Validate params early (derived state)
  const hasValidParams = !!(paymentKey && orderId && amount)

  useEffect(() => {
    if (!hasValidParams) {
      return
    }

    const confirmPayment = async () => {
      try {
        // Extract plan info from URL (stored orderId info or session)
        // Simple implementation: get from localStorage
        const plan = localStorage.getItem('checkout_plan') || 'GROWTH'

        const res = await fetch('/api/payments/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
            plan,
            billingCycle: 'monthly',
          }),
        })

        const result = await res.json()

        if (result.success) {
          setStatus('success')
          setReceiptUrl(result.data.payment?.receiptUrl || null)

          // Celebration effect
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          })
        } else {
          setStatus('error')
          setError(result.error?.message || 'Payment confirmation failed')
        }
      } catch (error) {
        console.error('Confirm error:', error)
        setStatus('error')
        const message =
          error instanceof Error ? error.message : 'An error occurred during payment confirmation'
        setError(message)
      }
    }

    confirmPayment()
  }, [paymentKey, orderId, amount, hasValidParams])

  // Handle invalid params (early return)
  if (!hasValidParams) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Invalid Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Missing required payment parameters</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => router.push('/settings/billing')}>
              Back to Billing
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="text-primary h-12 w-12 animate-spin" />
            <p className="text-lg font-medium">Confirming payment...</p>
            <p className="text-muted-foreground text-sm">Please wait</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Payment Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/settings/billing')}>
                Back to Billing
              </Button>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Complete!</CardTitle>
          <CardDescription>Thank you for using QETTA Premium services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted space-y-2 rounded-lg p-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-sm">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">
                {new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: 'KRW',
                }).format(parseInt(amount || '0'))}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {receiptUrl && (
              <Button variant="outline" asChild>
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                  View Receipt
                </a>
              </Button>
            )}
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuccessPage() {
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
      <SuccessContent />
    </Suspense>
  )
}
