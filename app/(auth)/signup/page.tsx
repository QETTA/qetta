import { Suspense } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'

export const metadata: Metadata = {
  title: 'Join Beta | QETTA',
  description: 'Get instant access to QETTA beta. Free trial for enterprises.',
}

function BetaFormSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse space-y-6">
      <div className="h-8 w-32 mx-auto bg-zinc-800 rounded" />
      <div className="h-6 w-48 mx-auto bg-zinc-800 rounded" />
      <div className="space-y-4">
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-11 bg-zinc-800 rounded" />
      </div>
    </div>
  )
}

// Code-split beta form for better bundle size
const BetaSignupForm = dynamic(
  () => import('@/components/landing/beta-signup-form').then(m => ({ default: m.BetaSignupForm })),
  {
    loading: () => <BetaFormSkeleton />,
    ssr: false,
  }
)

export default function SignupPage() {
  return (
    <GlassCard variant="linear" padding="xl" className="w-full max-w-md">
      <Suspense fallback={<BetaFormSkeleton />}>
        <BetaSignupForm />
      </Suspense>
    </GlassCard>
  )
}
