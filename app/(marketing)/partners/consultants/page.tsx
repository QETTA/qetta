'use client'

/**
 * Consultants Partner Page
 *
 * CSS-based animations (framer-motion replacement)
 *
 * @module partners/consultants
 */

import {
  UserGroupIcon,
  CubeIcon,
  RocketLaunchIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { Container } from '@/components/ui/container'
import { STRUCTURE_METRICS, DISPLAY_METRICS } from '@/constants/metrics'
import { CARD_VARIANTS } from '@/constants/card-styles'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { cn } from '@/lib/utils'
import {
  PartnerHero,
  PainVsSolution,
  BenefitsGrid,
  StepsSection,
  PricingCTA,
  FinalCTA,
  type BenefitItem,
} from '@/components/landing/partners/shared'

const benefits: BenefitItem[] = [
  {
    icon: CubeIcon,
    title: 'BLOCK Composition System',
    description: `Build custom AI per client by composing ${STRUCTURE_METRICS.industryBlocks} industry BLOCKs`,
    detail: `${STRUCTURE_METRICS.terminologyMappings} terminology mappings for automotive, semiconductor, medical, energy`,
  },
  {
    icon: RocketLaunchIcon,
    title: 'Fast Customization',
    description: 'Dramatically reduce proposal writing burden',
    detail: 'Configure demo by selecting BLOCKs - attach to proposals',
  },
  {
    icon: SparklesIcon,
    title: 'Whitelabel Platform',
    description: 'Launch as "[Client Name] AI" without QETTA branding',
    detail: 'Clients experience it as their own dedicated AI',
  },
  {
    icon: UserGroupIcon,
    title: 'Partner Success Support',
    description: 'Technical support, sales materials, co-marketing',
    detail: 'Tech review and pricing support for government proposals',
  },
]

const painPoints = [
  'Time-consuming custom proposal writing per client',
  'Hard to build trust due to lack of industry expertise',
  'Building AI platform in-house is costly and time-consuming',
  'Difficult to respond when clients request new features',
]

const solutions = [
  `BLOCK composition: Custom AI by selecting ${STRUCTURE_METRICS.industryBlocks} industry BLOCKs`,
  `Industry expertise: Build trust with ${DISPLAY_METRICS.termAccuracy.value} terminology accuracy`,
  'Whitelabel: QETTA stays hidden, launch under client brand',
  'Flexible extension: Add/modify BLOCKs to extend features',
]

const whitelabelExamples = [
  { client: 'Accounting Firm', block: 'FINANCE + STARTUP', result: '[Firm Name] Gov Grant AI' },
  { client: 'Smart Factory Consulting', block: 'MANUFACTURING + ENVIRONMENT', result: '[Consulting Name] Factory AI' },
  { client: 'Environmental Solutions', block: 'ENVIRONMENT + EXPORT', result: '[Solution Name] CleanTech AI' },
]

const steps = [
  { step: '1', title: 'Partner Signup', desc: 'Register consulting firm info (sales materials provided)' },
  { step: '2', title: 'Select BLOCKs', desc: 'Compose BLOCKs matching client industry' },
  { step: '3', title: 'Branding', desc: 'Customize logo, domain, colors' },
  { step: '4', title: 'Launch', desc: 'Whitelabel launch as "[Client Name] AI"' },
]

export default function ConsultantsPage() {
  const { ref: examplesRef, isVisible: examplesVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <div className="bg-zinc-950 min-h-screen">
      {/* Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-zinc-600/15 via-zinc-500/8 to-transparent rounded-full blur-3xl" />
      </div>

      <PartnerHero
        badgeIcon={UserGroupIcon}
        badgeText="Solution for Consultants"
        headline="QETTA Stays Hidden,"
        headlineGradient="You Shine"
        subheadline={
          <>
            B2B2B partnership for accounting firms and government consulting.
            <br />
            Quickly build custom AI per client with BLOCK composition.
          </>
        }
        primaryCta="Become a Partner"
      />

      <PainVsSolution painPoints={painPoints} solutions={solutions} />

      <BenefitsGrid
        title="Partner Benefits"
        subtitle="B2B2B Whitelabel - Select BLOCKs. Build Intelligence."
        benefits={benefits}
      />

      {/* Whitelabel Examples (unique to consultants) */}
      <section className="py-16 sm:py-20 border-y border-white/5">
        <Container>
          <h2 className="text-3xl font-semibold text-white text-center mb-12">Whitelabel Examples</h2>
          <div ref={examplesRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whitelabelExamples.map((example, i) => (
              <div
                key={example.client}
                className={cn(
                  `${CARD_VARIANTS.glass} p-6 backdrop-blur-lg`,
                  'transition-all duration-300 ease-out',
                  'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
                  examplesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                )}
                style={{ transitionDelay: examplesVisible ? `${i * 50}ms` : '0ms' }}
              >
                <p className="text-sm text-zinc-500 mb-2">{example.client}</p>
                <p className="text-zinc-400 text-sm mb-4">
                  <span className="text-zinc-300 font-mono">{example.block}</span>
                </p>
                <div className="rounded-lg bg-zinc-400/10 px-4 py-3 text-center">
                  <p className="text-white font-semibold">{example.result}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-zinc-500 mt-8">
            Clients never see QETTA. They only see your brand.
          </p>
        </Container>
      </section>

      <StepsSection title="Partner Process" steps={steps} />

      <PricingCTA />

      <FinalCTA
        headline="Become a Partner"
        description={
          <>
            Free support for your first 3 clients.
            <br />
            Sales materials, tech review, and co-marketing included.
          </>
        }
        ctaText="Apply for Partner Program"
      />
    </div>
  )
}
