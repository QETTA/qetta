import { Suspense } from 'react'
import type { Metadata } from 'next'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'
import { VerifyEmailForm } from '@/components/auth/verify-email-form'

export const metadata: Metadata = {
  title: 'Verify email | QETTA',
  description: 'Verify your email to activate your account.',
}

function VerifyEmailSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse space-y-6 text-center">
      <div className="h-8 w-32 mx-auto bg-zinc-800 rounded" />
      <div className="h-6 w-48 mx-auto bg-zinc-800 rounded" />
      <div className="h-16 w-16 mx-auto bg-zinc-800 rounded-full" />
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <GlassCard variant="linear" padding="xl" className="w-full max-w-md">
      <Suspense fallback={<VerifyEmailSkeleton />}>
        <VerifyEmailForm />
      </Suspense>
    </GlassCard>
  )
}
