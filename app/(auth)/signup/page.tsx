import { Suspense } from 'react'
import type { Metadata } from 'next'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata: Metadata = {
  title: 'Sign up | QETTA',
  description: 'Create your QETTA account.',
}

function SignupFormSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse space-y-6">
      <div className="h-8 w-24 mx-auto bg-zinc-800 rounded" />
      <div className="h-6 w-48 mx-auto bg-zinc-800 rounded" />
      <div className="space-y-4">
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <GlassCard variant="linear" padding="xl" className="w-full max-w-md">
      <Suspense fallback={<SignupFormSkeleton />}>
        <SignupForm />
      </Suspense>
    </GlassCard>
  )
}
