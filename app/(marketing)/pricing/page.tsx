import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { DISPLAY_METRICS, STRUCTURE_METRICS } from '@/constants/metrics'
import { StatusPing, StatsGrid } from '@/components/landing/blocks/shared'

export const metadata: Metadata = {
  title: 'Pricing - QETTA',
  description: `QETTA platform pricing plans. Experience ${DISPLAY_METRICS.timeSaved.value} time savings with a 30-day free trial.`,
  alternates: {
    canonical: 'https://qetta.io/pricing',
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
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <div className="bg-zinc-950 min-h-screen">
      {/* Hero Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-zinc-300 ring-1 ring-white/10 backdrop-blur-lg">
  <StatusPing color="zinc" size="md" />
                <span>Experience {DISPLAY_METRICS.timeSaved.value} time savings with 30-day free trial</span>
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl font-semibold text-white sm:text-6xl tracking-tight">
              Pricing
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg text-zinc-400 sm:text-xl max-w-2xl mx-auto">
              {DISPLAY_METRICS.timeSaved.detailEn}. <br />
              Choose the plan that fits your industry.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-8 backdrop-blur-lg ${
                  tier.highlight
                    ? 'bg-gradient-to-br from-zinc-400/10 via-zinc-500/5 to-transparent ring-2 ring-zinc-400/20'
                    : 'bg-white/5 ring-1 ring-white/10'
                }`}
              >
                {/* Popular Badge */}
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-zinc-400 px-4 py-1 text-xs font-semibold text-zinc-950">
                    Popular
                  </div>
                )}

                {/* Tier Name */}
                <h3 className="text-xl font-semibold text-white">
                  {tier.name}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm text-zinc-400">
                  {tier.description}
                </p>

                {/* Price */}
                <div className="mt-6">
                  <span className="text-4xl font-bold text-white">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="ml-2 text-sm text-zinc-400">
                      / {tier.period}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircleIcon className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  href="/login"
                  className={`mt-8 block w-full rounded-full py-3 text-center text-sm font-semibold transition-all ${
                    tier.highlight
                      ? 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-lg'
                      : 'bg-transparent text-white border border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-24 text-center">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl mb-12">
              Proven Results
            </h2>
<StatsGrid
              stats={[
                { value: DISPLAY_METRICS.timeSaved.value, label: DISPLAY_METRICS.timeSaved.labelEn },
                { value: DISPLAY_METRICS.rejectionReduction.value, label: DISPLAY_METRICS.rejectionReduction.labelEn },
                { value: DISPLAY_METRICS.docSpeed.valueEn ?? DISPLAY_METRICS.docSpeed.value, label: DISPLAY_METRICS.docSpeed.labelEn },
                { value: DISPLAY_METRICS.apiUptime.value, label: DISPLAY_METRICS.apiUptime.labelEn },
              ]}
              columns={4}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
