/**
 * Pricing Page
 * High-quality design system (same as /features and /accounting)
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { DISPLAY_METRICS, STRUCTURE_METRICS } from '@/constants/metrics'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'
import { AnimatedSection } from '@/components/landing/blocks/shared/AnimatedSection'
import { MinimalCTASection } from '@/components/landing/blocks/MinimalCTASection'
import { SectionSkeleton } from '@/components/landing/blocks/shared/SectionSkeleton'
import { DetailPageHero } from '@/components/landing/blocks/DetailPageHero'
import { StatsGrid } from '@/components/landing/blocks/shared'
import { GradientOrb, DynamicBackground } from '@/components/linear'

export const metadata: Metadata = {
  title: 'Pricing - QETTA',
  description: `QETTA platform pricing plans. Experience ${DISPLAY_METRICS.timeSaved.value} time savings with a 30-day free trial.`,
  alternates: {
    canonical: 'https://qetta.io/pricing',
  },
  openGraph: {
    title: 'Pricing - QETTA',
    description: '30-day free trial. 93.8% time savings. Choose your plan.',
  },
}

export const revalidate = 3600

const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    period: '30 days',
    description: 'Trial plan for individuals and small teams',
    features: [
      '10 documents/month',
      '4 industry BLOCKs + Basic Presets',
      'Hash chain verification',
      'Email support',
    ],
    cta: 'Start Free Trial',
    href: '/login',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$149',
    period: 'month',
    description: 'Optimal plan for growing SMBs',
    features: [
      '100 documents/month',
      `${STRUCTURE_METRICS.industryBlocks} industry BLOCKs + ${STRUCTURE_METRICS.enginePresets} Engine Presets`,
      'Hash chain verification + QR code',
      'Priority support',
      'API access',
      'Whitelabel option',
    ],
    cta: 'Become a Partner',
    href: '/login',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: null,
    description: 'Dedicated plan for large enterprises and government',
    features: [
      'Unlimited documents',
      'Custom industry BLOCKs + Dedicated Engine Presets',
      'Dedicated account manager',
      '24/7 premium support',
      'On-premise deployment option',
      `SLA guaranteed (${DISPLAY_METRICS.apiUptime.value})`,
    ],
    cta: 'Contact Us',
    href: 'mailto:support@qetta.com?subject=Enterprise%20Inquiry',
    highlight: false,
  },
]

export default function PricingPage() {
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
          <GradientOrb color="zinc" position="top-right" size="xl" blur={80} opacity={40} />
          <DetailPageHero
            badge="Transparent Pricing"
            badgeColor="zinc"
            showStatusPing
            statusPingColor="zinc"
            heading={
              <>
                Simple, Transparent
                <br />
                <span className="mt-2 block bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
                  Pricing
                </span>
              </>
            }
            subheading={`Experience ${DISPLAY_METRICS.timeSaved.value} time savings with a 30-day free trial. Choose the plan that fits your industry.`}
            rightContent={
              <div className="relative w-full max-w-md">
                <GlassCard variant="linear" padding="lg" microAnimate>
                  <div className="space-y-4">
                    <div className="border-b border-white/5 pb-4">
                      <p className="text-sm font-medium text-white">30-Day Free Trial</p>
                      <p className="mt-1 text-xs text-zinc-400">No credit card required</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">What's Included</p>
                      <ul className="mt-3 space-y-2">
                        {['10 documents', 'Hash verification', 'Email support'].map((item) => (
                          <li key={item} className="flex items-center gap-2 text-xs text-zinc-400">
                            <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-t border-white/5 pt-4">
                      <StatsGrid
                        stats={[
                          { value: DISPLAY_METRICS.timeSaved.value, label: 'Time Saved', detail: '' },
                          { value: DISPLAY_METRICS.apiUptime.value, label: 'Uptime', detail: '' },
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

        {/* Pricing Cards */}
        <section className="relative px-6 py-16">
          <DynamicBackground blur={15} gradient="radial" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="grid gap-8 md:grid-cols-3">
              {tiers.map((tier, index) => (
                <AnimatedSection key={tier.name} delay={index * 0.1} viewport={false}>
                  <GlassCard
                    variant={tier.highlight ? 'linearHover' : 'linear'}
                    padding="lg"
                    className="relative h-full"
                    microAnimate
                  >
                    {/* Popular Badge */}
                    {tier.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-zinc-400 to-zinc-500 px-4 py-1 text-xs font-semibold text-zinc-950">
                        Popular
                      </div>
                    )}

                    {/* Tier Name */}
                    <h3 className="text-xl font-semibold text-white">{tier.name}</h3>

                    {/* Description */}
                    <p className="mt-2 text-sm text-zinc-400">{tier.description}</p>

                    {/* Price */}
                    <div className="mt-6">
                      <span className="text-4xl font-bold text-white">{tier.price}</span>
                      {tier.period && (
                        <span className="ml-2 text-sm text-zinc-400">/ {tier.period}</span>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="mt-8 space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500" />
                          <span className="text-sm text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Link
                      href={tier.href}
                      className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-all ${
                        tier.highlight
                          ? 'bg-white text-zinc-950 shadow-lg hover:bg-zinc-200'
                          : 'border border-zinc-700 bg-transparent text-white hover:border-zinc-500'
                      }`}
                    >
                      {tier.cta}
                    </Link>
                  </GlassCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative border-y border-zinc-800 bg-zinc-900/50 px-6 py-16">
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Proven Results</h2>
              <p className="mt-4 text-lg text-zinc-400">
                Join thousands of companies saving time and reducing errors
              </p>
            </div>
            <StatsGrid
              stats={[
                {
                  value: DISPLAY_METRICS.timeSaved.value,
                  label: DISPLAY_METRICS.timeSaved.labelEn,
                  detail: DISPLAY_METRICS.timeSaved.detailEn,
                },
                {
                  value: DISPLAY_METRICS.rejectionReduction.value,
                  label: DISPLAY_METRICS.rejectionReduction.labelEn,
                  detail: 'Error reduction rate',
                },
                {
                  value: DISPLAY_METRICS.docSpeed.valueEn ?? DISPLAY_METRICS.docSpeed.value,
                  label: DISPLAY_METRICS.docSpeed.labelEn,
                  detail: DISPLAY_METRICS.docSpeed.detail,
                },
                {
                  value: DISPLAY_METRICS.apiUptime.value,
                  label: DISPLAY_METRICS.apiUptime.labelEn,
                  detail: 'Service availability',
                },
              ]}
              columns={4}
            />
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
