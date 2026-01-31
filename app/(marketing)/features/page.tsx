import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'
import { AnimatedSection } from '@/components/landing/blocks/shared/AnimatedSection'
import { MinimalCTASection } from '@/components/landing/blocks/MinimalCTASection'
import { SectionSkeleton } from '@/components/landing/blocks/shared/SectionSkeleton'
import { DetailPageHero } from '@/components/landing/blocks/DetailPageHero'
import { StatsGrid } from '@/components/landing/blocks/shared'
import { DISPLAY_METRICS } from '@/constants/metrics'
import { GradientOrb, DynamicBackground } from '@/components/linear'
import {
  SparklesIcon,
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon,
  BoltIcon,
  ChartBarIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'Features - QETTA',
  description:
    'AI-powered document auto-generation, compliance validation, and government tender matching. 93.8% time saved, 91% error reduction.',
  openGraph: {
    title: 'Features - QETTA',
    description: 'AI-powered government compliance features: Auto-generation, validation, matching',
  },
}

export const revalidate = 3600 // ISR: Revalidate every hour

const features = [
  {
    icon: SparklesIcon,
    title: 'AI Document Generation',
    description: 'Complete business plans in under 3 minutes by selecting industry BLOCKs',
    benefits: [
      'Trained on 630,000+ global tender data',
      '6 domain engines (Manufacturing/Environment/Digital/Finance/Startup/Export)',
      'SHA-256 hash chain verification for integrity',
    ],
    color: 'zinc' as const,
  },
  {
    icon: DocumentMagnifyingGlassIcon,
    title: 'Compliance Validation',
    description: '91% error reduction with pre-submission validation',
    benefits: [
      'Real-time regulatory requirement matching',
      'Automatic form/template checking',
      'Missing item detection and alerts',
    ],
    color: 'emerald' as const,
  },
  {
    icon: ShieldCheckIcon,
    title: 'Government Tender Matching',
    description: 'Optimal tender recommendations based on company profile',
    benefits: [
      'K-Startup, NIPA AI voucher integration',
      'SAM.gov, UNGM, Goszakup global data',
      'Automatic eligibility score calculation',
    ],
    color: 'blue' as const,
  },
  {
    icon: BoltIcon,
    title: 'Ultra-Fast Processing',
    description: 'Avg 3-minute document generation, 99.9% API uptime',
    benefits: [
      'Parallel processing for large documents',
      'CDN-based global deployment',
      '24/7 monitoring and auto-recovery',
    ],
    color: 'amber' as const,
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics & Insights',
    description: 'Visualize submission history, success rates, improvement areas',
    benefits: [
      'Dashboard for at-a-glance status overview',
      'Industry benchmarking data',
      'Auto-generated improvement suggestions',
    ],
    color: 'cyan' as const,
  },
  {
    icon: GlobeAltIcon,
    title: 'B2B2B Whitelabel',
    description: 'Provide platform under partner brands',
    benefits: [
      'API-based full customization',
      'Consultant/Buyer/Supplier partnerships',
      'Revenue sharing model',
    ],
    color: 'zinc' as const,
  },
]

export default function FeaturesPage() {
  return (
    <div className="bg-zinc-950">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-zinc-900"
      >
        Skip to main content
      </a>

      <main id="main-content">
        {/* Hero Section */}
        <section className="relative">
          <GradientOrb color="zinc" position="top-right" size="xl" blur={80} opacity={40} />
          <DetailPageHero
            badge="All Features"
            badgeColor="zinc"
            showStatusPing
            statusPingColor="zinc"
            heading={
              <>
                Complete Platform for
                <br />
                <span className="mt-2 block bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
                  Government Support
                </span>
              </>
            }
            subheading="AI-powered automation, compliance validation, and global tender matching - all in one platform"
            rightContent={
              <div className="relative w-full max-w-md">
                <GlassCard variant="linear" padding="lg" microAnimate>
                  <div className="space-y-6">
                  {/* Feature Highlights */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-500/10">
                      <SparklesIcon className="h-6 w-6 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">AI Generation</p>
                      <p className="text-xs text-zinc-400">Under 3 min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <ShieldCheckIcon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Compliance Check</p>
                      <p className="text-xs text-zinc-400">91% error reduction</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <GlobeAltIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Global Matching</p>
                      <p className="text-xs text-zinc-400">630K+ tenders</p>
                    </div>
                  </div>

                  {/* Mini Stats */}
                  <div className="pt-4 border-t border-white/5">
                    <StatsGrid
                      stats={[
                        { value: DISPLAY_METRICS.timeSaved.value, label: 'Time Saved', detail: '' },
                        { value: DISPLAY_METRICS.rejectionReduction.value, label: 'Error Reduction', detail: '' },
                      ]}
                      columns={2}
                    />
                  </div>
                </div>
              </GlassCard>
            </div>
          }
        />
        </section>

        {/* Features Grid */}
        <section className="relative px-6 py-16">
          <DynamicBackground blur={15} gradient="radial" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <AnimatedSection key={feature.title} delay={index * 0.1} viewport={false}>
                  <GlassCard variant="linearHover" padding="lg" className="h-full" microAnimate>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                      <feature.icon className="h-6 w-6 text-zinc-400" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      {feature.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {feature.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-start gap-2 text-sm text-zinc-300"
                        >
                          <svg
                            className="h-5 w-5 text-emerald-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>


        {/* CTA */}
        <Suspense fallback={<SectionSkeleton />}>
          <MinimalCTASection />
        </Suspense>
      </main>
    </div>
  )
}
