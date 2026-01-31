'use client'

/**
 * Payment Fail Page
 *
 * Payment failure notification
 */

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'

// Toss error code → user message mapping
const ERROR_MESSAGES: Record<string, string> = {
  PAY_PROCESS_CANCELED: 'Payment was canceled',
  PAY_PROCESS_ABORTED: 'Payment was aborted',
  REJECT_CARD_COMPANY: 'Card rejected by issuer. Please try a different card',
  EXCEED_MAX_DAILY_PAYMENT_COUNT: 'Daily payment limit exceeded',
  EXCEED_MAX_PAYMENT_AMOUNT: 'Payment limit exceeded',
  INVALID_CARD_NUMBER: 'Invalid card number',
  INVALID_CARD_EXPIRATION: 'Invalid card expiration date',
  INVALID_STOPPED_CARD: 'Card has been suspended',
  INVALID_CARD_LOST_OR_STOLEN: 'Card reported as lost or stolen',
  NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT:
    'Installment payment not supported for this card',
  FAILED_INTERNAL_SYSTEM_PROCESSING: 'System error. Please try again later',
}

function FailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const code = searchParams.get('code') || 'UNKNOWN_ERROR'
  const message = searchParams.get('message') || 'Payment failed'
  const orderId = searchParams.get('orderId')

  const userMessage = ERROR_MESSAGES[code] || message

  return (
    <div className="container mx-auto py-8 px-4 max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
          <CardDescription>{userMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error details */}
          <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Error Code</span>
              <span className="font-mono">{code}</span>
            </div>
            {orderId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono">{orderId}</span>
              </div>
            )}
          </div>

          {/* Help text */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p>If payment failed:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Please verify your card information</li>
              <li>Make sure you have sufficient balance</li>
              <li>Try a different payment method</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Button onClick={() => router.back()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button variant="outline" onClick={() => router.push('/settings/billing')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Billing
            </Button>
          </div>

          {/* Customer support */}
          <p className="text-xs text-center text-muted-foreground">
            If the problem persists, contact{' '}
            <a href="mailto:support@qetta.io" className="text-primary hover:underline">
              support@qetta.io
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function FailPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 px-4 max-w-lg">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <FailContent />
    </Suspense>
  )
}
