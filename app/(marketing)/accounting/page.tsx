/**
 * Partner Accounting & Settlement Landing Page
 * High-quality design system (same as /features)
 * Target: Partner cafes and accounting firms
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'
import { AnimatedSection } from '@/components/landing/blocks/shared/AnimatedSection'
import { MinimalCTASection } from '@/components/landing/blocks/MinimalCTASection'
import { SectionSkeleton } from '@/components/landing/blocks/shared/SectionSkeleton'
import { DetailPageHero } from '@/components/landing/blocks/DetailPageHero'
import { StatsGrid } from '@/components/landing/blocks/shared'
import { GradientOrb, DynamicBackground } from '@/components/linear'
import {
  BanknotesIcon,
  ChartBarSquareIcon,
  ShieldCheckIcon,
  LinkIcon,
  ClockIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'Partner Accounting & Settlement | QETTA',
  description:
    'Transparent commission tracking and automated monthly payouts for cafe partners. Real-time analytics, 7-day settlement cycle, 5% revenue share.',
  openGraph: {
    title: 'Partner Accounting & Settlement | QETTA',
    description: 'Transparent commission tracking. 5% revenue share. 7-day settlement cycle.',
  },
}

export const revalidate = 3600 // ISR: Revalidate every hour

const features = [
  {
    icon: ChartBarSquareIcon,
    title: 'Real-time Tracking',
    description: 'Monitor referral link clicks, conversions, and commission earnings in real-time',
    benefits: [
      'Instant visibility into revenue stream',
      'Live dashboard with conversion metrics',
      'UTM tracking by campaign/medium/source',
    ],
    color: 'zinc' as const,
  },
  {
    icon: BanknotesIcon,
    title: 'Transparent Payouts',
    description: 'Monthly settlement with full audit trail and snapshot verification',
    benefits: [
      'SHA-256 snapshot prevents tampering',
      'Know exactly what you\'re earning',
      'Draft → Approved → Paid workflow',
    ],
    color: 'emerald' as const,
  },
  {
    icon: LinkIcon,
    title: 'Custom Referral Links',
    description: 'Generate unlimited referral links with UTM tracking',
    benefits: [
      'Short codes like qetta.com/r/ABC123',
      'Track performance by campaign',
      'Unlimited link generation',
    ],
    color: 'blue' as const,
  },
  {
    icon: ShieldCheckIcon,
    title: 'First-touch Attribution',
    description: 'Fair attribution model - first referral link gets credit',
    benefits: [
      '7-day cookie window for tracking',
      'Idempotent attribution (no duplicates)',
      'IP + user agent fallback',
    ],
    color: 'amber' as const,
  },
  {
    icon: DocumentCheckIcon,
    title: 'API Access',
    description: 'RESTful API for integration and programmatic access',
    benefits: [
      'Upload external posts (blog/Instagram)',
      'Permissions-based access control',
      'Rate limiting for API stability',
    ],
    color: 'cyan' as const,
  },
  {
    icon: ClockIcon,
    title: 'Audit Compliance',
    description: 'Immutable snapshot verification with SHA-256 hashing',
    benefits: [
      'Compensating ledger for adjustments',
      'Full audit trail for all actions',
      'Tamper-proof payout calculation',
    ],
    color: 'zinc' as const,
  },
]

const howItWorksSteps = [
  {
    number: 1,
    title: 'Register as Partner',
    description:
      'Submit your organization details and business registration number. Admin approval within 24 hours.',
  },
  {
    number: 2,
    title: 'Get Referral Links',
    description:
      'Receive custom referral links for each cafe location. Short codes like qetta.com/r/ABC123.',
  },
  {
    number: 3,
    title: 'Share & Track',
    description:
      'Share links on social media, blog, or in-store QR codes. Monitor clicks and conversions in real-time.',
  },
  {
    number: 4,
    title: 'Earn Commission',
    description:
      '5% commission on all attributed conversions. Monthly payout with full transparency.',
  },
]

export default function AccountingLandingPage() {
  return (
    <div className="bg-zinc-950">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-zinc-900"
      >
        Skip to main content
      </a>

      <main id="main-content">
        {/* Hero Section */}
        <section className="relative">
          <GradientOrb color="emerald" position="top-right" size="xl" blur={80} opacity={40} />
          <DetailPageHero
            badge="Accounting Partners"
            badgeColor="emerald"
            showStatusPing
            statusPingColor="emerald"
            heading={
              <>
                Partner Accounting &
                <br />
                <span className="mt-2 block bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                  Automated Settlement
                </span>
              </>
            }
            subheading="Transparent commission tracking and automated monthly payouts. Real-time analytics, 7-day settlement cycle, 5% revenue share."
            rightContent={
              <div className="relative w-full max-w-md">
                <GlassCard variant="linear" padding="lg" microAnimate>
                  <div className="space-y-6">
                    {/* Feature Highlights */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                        <BanknotesIcon className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Commission Rate</p>
                        <p className="text-xs text-zinc-400">5% on conversions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <ClockIcon className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Settlement Cycle</p>
                        <p className="text-xs text-zinc-400">7-day fast payout</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                        <ChartBarSquareIcon className="h-6 w-6 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Time Reduction</p>
                        <p className="text-xs text-zinc-400">93.8% saved</p>
                      </div>
                    </div>

                    {/* Mini Stats */}
                    <div className="border-t border-white/5 pt-4">
                      <StatsGrid
                        stats={[
                          { value: '99.9%', label: 'Uptime SLA', detail: '' },
                          { value: '93.8%', label: 'Time Saved', detail: '' },
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

        {/* Stats Section */}
        <section className="relative border-y border-zinc-800 bg-zinc-900/50 px-6 py-16">
          <div className="relative z-10 mx-auto max-w-7xl">
            <StatsGrid
              stats={[
                {
                  value: '93.8%',
                  label: 'Time Reduction',
                  detail: 'From manual tracking to automation',
                },
                {
                  value: '99.9%',
                  label: 'Uptime SLA',
                  detail: 'Guaranteed service availability',
                },
                {
                  value: '5%',
                  label: 'Commission Rate',
                  detail: 'On first-touch attributed conversions',
                },
                {
                  value: '7-day',
                  label: 'Settlement Cycle',
                  detail: 'Fast payout approval process',
                },
              ]}
              columns={4}
            />
          </div>
        </section>

        {/* Features Grid */}
        <section className="relative px-6 py-24">
          <DynamicBackground blur={15} gradient="radial" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Everything you need to track and manage commissions
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-300">
                Built for transparency and speed. No hidden fees, no manual calculations.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <AnimatedSection key={feature.title} delay={index * 0.1} viewport={false}>
                  <GlassCard variant="linearHover" padding="lg" className="h-full" microAnimate>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                      <feature.icon className="h-6 w-6 text-zinc-400" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm text-zinc-400">{feature.description}</p>
                    <ul className="mt-4 space-y-2">
                      {feature.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2 text-sm text-zinc-300">
                          <svg
                            className="h-5 w-5 shrink-0 text-emerald-500"
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

        {/* How It Works Section */}
        <section className="relative border-t border-zinc-800 bg-zinc-900/50 px-6 py-24">
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                How it works
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-300">
                Four simple steps to start earning commission
              </p>
            </div>

            <div className="mx-auto max-w-3xl">
              <div className="grid gap-8 md:grid-cols-2">
                {howItWorksSteps.map((step, index) => (
                  <AnimatedSection key={step.number} delay={index * 0.1} viewport={false}>
                    <GlassCard variant="linear" padding="lg" microAnimate>
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-sm font-semibold text-white">
                          {step.number}
                        </div>
                        <div className="flex-auto">
                          <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                          <p className="mt-2 text-sm text-zinc-400">{step.description}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </AnimatedSection>
                ))}
              </div>
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
