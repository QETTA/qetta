import type { Metadata } from 'next'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { MinimalCTASection } from '@/components/landing/blocks/MinimalCTASection'
import { SectionSkeleton } from '@/components/landing/blocks/shared/SectionSkeleton'

export const metadata: Metadata = {
  title: 'For Partners - QETTA',
  description:
    'B2B2B whitelabel platform to provide value-added services. Partnerships for consultants, buyers, and suppliers.',
  openGraph: {
    title: 'For Partners - QETTA',
    description:
      'B2B2B whitelabel platform for consultants, buyers, and suppliers. Provide government compliance automation under your brand.',
  },
}

export const revalidate = 3600

// Code-split content component for better bundle size
const PartnersContent = dynamic(
  () => import('./partners-content').then(m => ({ default: m.PartnersContent })),
  {
    loading: () => (
      <div className="bg-zinc-950">
        <SectionSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    ),
    ssr: true, // SEO 유지
  }
)

export default function PartnersPage() {
  return (
    <div className="bg-zinc-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-zinc-900"
      >
        Skip to main content
      </a>

      <main id="main-content">
        <PartnersContent />

        {/* CTA */}
        <Suspense fallback={<SectionSkeleton />}>
          <MinimalCTASection />
        </Suspense>
      </main>
    </div>
  )
}
