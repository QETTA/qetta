import { Suspense } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'

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

// Code-split auth form for better bundle size
const SignupForm = dynamic(
  () => import('@/components/auth/signup-form').then(m => ({ default: m.SignupForm })),
  {
    loading: () => <SignupFormSkeleton />,
    ssr: false, // Auth forms don't need SSR
  }
)

export default function SignupPage() {
  return (
    <GlassCard variant="linear" padding="xl" className="w-full max-w-md">
      <Suspense fallback={<SignupFormSkeleton />}>
        <SignupForm />
      </Suspense>
    </GlassCard>
  )
}
