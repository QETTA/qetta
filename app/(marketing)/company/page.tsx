import type { Metadata } from 'next'
import { BuildingOffice2Icon, RocketLaunchIcon, UsersIcon } from '@heroicons/react/24/outline'
import { DISPLAY_METRICS, STRUCTURE_METRICS } from '@/constants/metrics'
import { StatusPing } from '@/components/landing/blocks/shared'

export const metadata: Metadata = {
  title: 'Company - QETTA',
  description: 'QETTA is an industry-specific intelligent document automation platform. Selected for Welcome to Dongnam TIPS.',
  alternates: {
    canonical: 'https://qetta.io/company',
  },
}

export const revalidate = 3600

const milestones = [
  {
    year: '2024',
    title: 'Founded',
    description: 'Started as logistics B2B platform SelfYongdal',
  },
  {
    year: '2025 Q1',
    title: 'Pivot',
    description: '"No proof, no trust" - Pivoted to document automation platform',
  },
  {
    year: '2025 Q3',
    title: 'TIPS Selected',
    description: 'Selected for Welcome to Dongnam TIPS program',
  },
  {
    year: '2026',
    title: 'Product Launch',
    description: `${STRUCTURE_METRICS.enginePresets} domain engines, government compliance automation`,
  },
]

const values = [
  {
    icon: BuildingOffice2Icon,
    title: 'B2B2B Whitelabel',
    description: 'QETTA stays hidden, partners shine. Delivered under your brand.',
  },
  {
    icon: RocketLaunchIcon,
    title: 'Domain Expertise',
    description: `${STRUCTURE_METRICS.enginePresets} industry-specialized engines with ${DISPLAY_METRICS.termAccuracy.value} terminology mapping accuracy.`,
  },
  {
    icon: UsersIcon,
    title: 'Trust & Verification',
    description: 'SHA-256 hash chain ensures document integrity.',
  },
]

export default function CompanyPage() {
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
                <span>Welcome to Dongnam TIPS Selected</span>
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl font-semibold text-white sm:text-6xl lg:text-7xl tracking-tight">
              <span className="block">Your Industry,</span>
              <span className="block mt-2">
                <span className="bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-500 bg-clip-text text-transparent">
                  Your Intelligence.
                </span>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-8 text-lg text-zinc-400 sm:text-xl max-w-2xl mx-auto">
              Domain engines that understand industry terminology and rules <br />
              Auto-generate government compliance documents.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl mb-6">
              Philosophy
            </h2>
            <p className="text-6xl font-semibold text-white mb-8">
              in·ev·it·able
            </p>
            <p className="text-lg text-zinc-400">
              Where data flows, compliance follows. <br />
              This is not a choice, but inevitable.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-20 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Core Values
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:ring-white/20 transition-all backdrop-blur-lg"
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800 ring-1 ring-white/10 mb-6">
                  <value.icon className="w-6 h-6 text-zinc-400" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {value.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-zinc-400">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones Timeline */}
      <section className="py-16 sm:py-20 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Journey
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.year}
                className="relative rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
              >
                {/* Year Badge */}
                <div className="inline-flex items-center rounded-full bg-zinc-400/10 px-3 py-1 text-sm font-semibold text-zinc-300 ring-1 ring-zinc-400/20 mb-4">
                  {milestone.year}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {milestone.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-zinc-400">
                  {milestone.description}
                </p>

                {/* Connector Line (except last) */}
                {index < milestones.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-zinc-400/10 via-zinc-500/5 to-transparent p-12 ring-1 ring-white/10 text-center backdrop-blur-lg">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Select BLOCKs. Build Intelligence.
            </h2>
            <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
              Experience {DISPLAY_METRICS.timeSaved.value} time savings <br />
              with domain engines built for your industry.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <a
                href="/pricing"
                className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-950 shadow-lg hover:bg-zinc-100 transition-colors"
              >
                Become a Partner
              </a>
              <a
                href="/login"
                className="rounded-full bg-zinc-800 px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-700 ring-1 ring-white/10 transition-all"
              >
                30-Day Free Trial
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
