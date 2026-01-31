import { Suspense } from 'react'
import type { Metadata } from 'next'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Forgot password | QETTA',
  description: 'Reset your password via email.',
}

function ForgotPasswordSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse space-y-6">
      <div className="h-8 w-32 mx-auto bg-zinc-800 rounded" />
      <div className="h-6 w-64 mx-auto bg-zinc-800 rounded" />
      <div className="space-y-4">
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <GlassCard variant="linear" padding="xl" className="w-full max-w-md">
      <Suspense fallback={<ForgotPasswordSkeleton />}>
        <ForgotPasswordForm />
      </Suspense>
    </GlassCard>
  )
}
