import { Suspense } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'

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

// Code-split auth form for better bundle size
const LoginForm = dynamic(
  () => import('@/components/auth/login-form').then(m => ({ default: m.LoginForm })),
  {
    loading: () => <LoginFormSkeleton />,
    ssr: false, // Auth forms don't need SSR
  }
)

export default function LoginPage() {
  return (
    <GlassCard variant="linear" padding="xl" className="w-full max-w-md">
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </GlassCard>
  )
}
