import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Badge } from '@/components/catalyst/badge'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'
import { AnimatedSection } from '@/components/landing/blocks/shared/AnimatedSection'
import { MinimalCTASection } from '@/components/landing/blocks/MinimalCTASection'
import { SectionSkeleton } from '@/components/landing/blocks/shared/SectionSkeleton'
import { DetailPageHero } from '@/components/landing/blocks/DetailPageHero'
import { GradientOrb, DynamicBackground } from '@/components/linear'
import { BuildingOfficeIcon, BanknotesIcon, DocumentCheckIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'For Companies - QETTA',
  description:
    'Government compliance automation for enterprises. Apply for R&D grants, funding, certifications in 3 minutes.',
  openGraph: {
    title: 'For Companies - QETTA',
    description:
      'Government compliance automation for enterprises. Apply for R&D grants, funding, certifications in 3 minutes.',
  },
}

export const revalidate = 3600

const useCases = [
  {
    title: 'R&D Grant Applications',
    pain: 'Avg 125 hours required, specialized staff needed, high rejection rate',
    solution: 'AI auto-generation in 3 min, compliance validation, 91% error reduction',
    roi: '15-20 applications/year (from 2-3)',
  },
  {
    title: 'Policy Funding',
    pain: 'Complex documents, long review periods, low approval rate',
    solution: 'Optimal tender matching, company profile-based recommendations',
    roi: 'Approval rate: 35% → 68% (customer average)',
  },
  {
    title: 'Certifications (ISO, Innobiz, etc.)',
    pain: 'High consulting costs, document preparation challenges',
    solution: 'Auto-mapping of certification requirements, required document generation',
    roi: '70% consulting cost reduction ($5K → $1.5K avg)',
  },
]

const benefits = [
  {
    title: 'Time Saved',
    value: '93.8%',
    description: '125hrs → 7.8hrs',
    icon: '⏱️',
    color: 'emerald',
  },
  {
    title: 'Error Reduction',
    value: '91%',
    description: 'Document rejection reduced',
    icon: '✅',
    color: 'blue',
  },
  {
    title: 'Cost Savings',
    value: '70%',
    description: 'Consulting cost reduced',
    icon: '💰',
    color: 'zinc',
  },
  {
    title: 'Success Rate',
    value: '+33%p',
    description: '35% → 68% approval',
    icon: '📈',
    color: 'zinc',
  },
] as const

export default function CompaniesPage() {
  return (
    <div className="bg-zinc-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-zinc-900"
      >
        Skip to main content
      </a>

      <main id="main-content">
        {/* Hero */}
        <section className="relative">
          <GradientOrb color="emerald" position="top-right" size="xl" blur={80} opacity={40} />
          <DetailPageHero
            badge="For Companies"
            badgeColor="emerald"
            showStatusPing
            statusPingColor="emerald"
            heading={
              <>
                From Compliance to Funding
                <br />
                <span className="mt-2 block bg-gradient-to-r from-emerald-200 via-emerald-400 to-zinc-500 bg-clip-text text-transparent">
                  All Automated
                </span>
              </>
            }
            subheading="R&D grants, policy funding, certifications - AI completes documents in 3 min. 93.8% time saved, 91% error reduction, 70% cost savings."
            rightContent={
              <div className="relative w-full max-w-md">
                <GlassCard variant="linear" padding="lg" microAnimate>
                <div className="space-y-6">
                  {/* Use Cases */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-500/10">
                      <DocumentCheckIcon className="h-6 w-6 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">R&D Grants</p>
                      <p className="text-xs text-zinc-400">15-20 apps/year</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <BanknotesIcon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Policy Funding</p>
                      <p className="text-xs text-zinc-400">68% approval rate</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <BuildingOfficeIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Certifications</p>
                      <p className="text-xs text-zinc-400">70% cost savings</p>
                    </div>
                  </div>

                  {/* ROI Preview */}
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-zinc-400 mb-2">Annual Savings Estimate</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-emerald-500">$69.5K</p>
                      <p className="text-sm text-zinc-400">(80% reduced)</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          }
        />
        </section>

        {/* Benefits Grid */}
        <section className="relative px-6 py-16">
          <DynamicBackground blur={15} gradient="radial" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit, index) => {
                const colorClass = {
                  emerald: 'text-emerald-500',
                  blue: 'text-blue-500',
                  zinc: 'text-zinc-400',
                }[benefit.color]

                return (
                  <AnimatedSection key={benefit.title} delay={index * 0.1}>
                    <GlassCard variant="linearGlow" padding="lg" className="text-center" microAnimate>
                      <div className="text-4xl mb-3">{benefit.icon}</div>
                      <div className={`text-3xl font-bold ${colorClass}`}>
                        {benefit.value}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white">
                        {benefit.title}
                      </div>
                      <div className="mt-1 text-xs text-zinc-400">
                        {benefit.description}
                      </div>
                    </GlassCard>
                  </AnimatedSection>
                )
              })}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Key Use Cases
            </h2>
            <div className="grid gap-8 lg:grid-cols-3">
              {useCases.map((useCase, index) => (
                <AnimatedSection key={useCase.title} delay={index * 0.15}>
                  <GlassCard variant="linearHover" padding="lg" className="h-full" microAnimate>
                    <h3 className="text-xl font-semibold text-white">
                      {useCase.title}
                    </h3>

                    <div className="mt-4">
                      <div className="text-xs font-medium text-red-400 uppercase tracking-wide">
                        Current Pain Points
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">{useCase.pain}</p>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                        QETTA Solution
                      </div>
                      <p className="mt-1 text-sm text-zinc-300">
                        {useCase.solution}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                        ROI Impact
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {useCase.roi}
                      </p>
                    </div>
                  </GlassCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ROI Calculator Preview */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Expected ROI
            </h2>
            <AnimatedSection>
              <GlassCard variant="linear" padding="xl" microAnimate>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Traditional Method (Annual)
                    </h3>
                    <ul className="space-y-3 text-sm text-zinc-300">
                      <li className="flex justify-between">
                        <span>Labor cost (dedicated staff)</span>
                        <span className="text-red-400">$60,000</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Consulting fees (3 projects)</span>
                        <span className="text-red-400">$15,000</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Opportunity cost (rejections)</span>
                        <span className="text-red-400">$12,000</span>
                      </li>
                      <li className="flex justify-between pt-3 border-t border-white/5 font-semibold">
                        <span>Total Cost</span>
                        <span className="text-red-500">$87,000</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      With QETTA (Annual)
                    </h3>
                    <ul className="space-y-3 text-sm text-zinc-300">
                      <li className="flex justify-between">
                        <span>QETTA subscription</span>
                        <span className="text-emerald-400">$12,000</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Consulting (optional)</span>
                        <span className="text-emerald-400">$4,500</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Opportunity cost (minimal)</span>
                        <span className="text-emerald-400">$1,000</span>
                      </li>
                      <li className="flex justify-between pt-3 border-t border-white/5 font-semibold">
                        <span>Total Cost</span>
                        <span className="text-emerald-500">$17,500</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                  <div className="text-3xl font-bold text-zinc-300">
                    $69,500 Annual Savings
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    80% cost reduction + 6x more applications (3 → 18)
                  </p>
                </div>
              </GlassCard>
            </AnimatedSection>
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
