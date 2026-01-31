import { Suspense } from 'react'
import type { Metadata } from 'next'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset password | QETTA',
  description: 'Set your new password.',
}

function ResetPasswordSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse space-y-6">
      <div className="h-8 w-40 mx-auto bg-zinc-800 rounded" />
      <div className="h-6 w-48 mx-auto bg-zinc-800 rounded" />
      <div className="space-y-4">
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <GlassCard variant="linear" padding="xl" className="w-full max-w-md">
      <Suspense fallback={<ResetPasswordSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </GlassCard>
  )
}
