import type { Metadata } from 'next'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { MinimalCTASection } from '@/components/landing/blocks/MinimalCTASection'
import { SectionSkeleton } from '@/components/landing/blocks/shared/SectionSkeleton'

export const metadata: Metadata = {
  title: 'How it Works - QETTA',
  description: 'Complete government tender applications in 3 steps. Automated from search to submission.',
  openGraph: {
    title: 'How it Works - QETTA',
    description: '3-step process: Search → AI Analysis → Document Generation → Submit',
  },
}

export const revalidate = 3600

// 코드 스플리팅: 무거운 콘텐츠 컴포넌트 지연 로딩
const HowItWorksContent = dynamic(
  () => import('./how-it-works-content').then(m => ({ default: m.HowItWorksContent })),
  {
    loading: () => (
      <div className="bg-zinc-950">
        <SectionSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    ),
    ssr: true, // SEO 유지
  }
)

export default function HowItWorksPage() {
  return (
    <div className="bg-zinc-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-zinc-900"
      >
        Skip to main content
      </a>

      <main id="main-content">
        <HowItWorksContent />

        {/* CTA */}
        <Suspense fallback={<SectionSkeleton />}>
          <MinimalCTASection />
        </Suspense>
      </main>
    </div>
  )
}
