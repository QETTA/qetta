import { Suspense } from 'react'
import type { Metadata } from 'next'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign in | QETTA',
  description: 'Sign in to your QETTA account.',
}

function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse space-y-6">
      <div className="h-8 w-24 mx-auto bg-zinc-800 rounded" />
      <div className="h-6 w-32 mx-auto bg-zinc-800 rounded" />
      <div className="space-y-4">
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <GlassCard variant="linear" padding="xl" className="w-full max-w-md">
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </GlassCard>
  )
}
