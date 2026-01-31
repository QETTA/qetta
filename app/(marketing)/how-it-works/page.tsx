import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Badge } from '@/components/catalyst/badge'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'
import { AnimatedSection } from '@/components/landing/blocks/shared/AnimatedSection'
import { MinimalCTASection } from '@/components/landing/blocks/MinimalCTASection'
import { SectionSkeleton } from '@/components/landing/blocks/shared/SectionSkeleton'
import { DetailPageHero } from '@/components/landing/blocks/DetailPageHero'
import { GradientOrb, DynamicBackground } from '@/components/linear'
import { ClockIcon, CpuChipIcon, DocumentCheckIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'How it Works - QETTA',
  description: 'Complete government tender applications in 3 steps. Automated from search to submission.',
  openGraph: {
    title: 'How it Works - QETTA',
    description: '3-step process: Search → AI Analysis → Document Generation → Submit',
  },
}

export const revalidate = 3600

const steps = [
  {
    step: 1,
    title: 'Search & Match',
    description: 'Automatic recommendation of optimal tenders based on company profile',
    details: [
      'K-Startup, NIPA AI voucher, R&D grants (domestic)',
      'SAM.gov, UNGM, Goszakup (global)',
      'Auto-calculated eligibility score (industry, revenue, employees)',
      'Deadline alerts and submission schedule management',
    ],
    duration: '1-2 min',
    color: 'zinc' as const,
  },
  {
    step: 2,
    title: 'AI Analysis & BLOCK Selection',
    description: 'Select industry BLOCKs to compose customized content',
    details: [
      'Automotive, semiconductor, energy, healthcare industry BLOCKs',
      'Manufacturing, environment, digital, finance, startup, export domain engines',
      'Auto-parsing and mapping of tender requirements',
      'Improved templates from past submission history',
    ],
    duration: '2-3 min',
    color: 'emerald' as const,
  },
  {
    step: 3,
    title: 'Document Generation',
    description: 'AI auto-generates business plans and technical proposals',
    details: [
      'Avg 3-minute document completion (from 125hrs to 7.8hrs)',
      'SHA-256 hash chain integrity verification',
      'Auto compliance validation (91% error reduction)',
      'Multi-language support (Korean, English, Russian, etc.)',
    ],
    duration: '3 min',
    color: 'blue' as const,
  },
  {
    step: 4,
    title: 'Review & Submit',
    description: 'Final review then online submission or PDF download',
    details: [
      'Real-time progress tracking on dashboard',
      'Consultant review option (partner connection)',
      'Online submission API integration (per system)',
      'Auto-saved submission history and analytics',
    ],
    duration: '5-10 min',
    color: 'zinc' as const,
  },
]

const faqs = [
  {
    question: 'How accurate are AI-generated documents?',
    answer:
      'Trained on 630,000+ global tender data with SHA-256 hash chain integrity verification. Proven 91% reduction in document rejection rates.',
  },
  {
    question: 'Which government programs are supported?',
    answer:
      'K-Startup, NIPA AI voucher, R&D grants (domestic) and SAM.gov, UNGM, Goszakup (international). Continuously expanding coverage.',
  },
  {
    question: 'Can I upload existing documents for improvement?',
    answer:
      'Yes, upload existing documents and AI will analyze, suggest improvements, and validate compliance.',
  },
  {
    question: 'Can multiple team members collaborate?',
    answer:
      'Team plans include collaborative features like simultaneous editing, comments, and version control.',
  },
]

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
        {/* Hero */}
        <section className="relative">
          <GradientOrb color="emerald" position="top-left" size="xl" blur={80} opacity={40} />
          <DetailPageHero
            badge="How it Works"
            badgeColor="emerald"
            showStatusPing
            statusPingColor="emerald"
            heading={
              <>
                Complete in 3 Steps
                <br />
                <span className="mt-2 block bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                  Government Tender Applications
                </span>
              </>
            }
            subheading="AI automates the entire process from tender search to document submission. 125 hours reduced to 7.8 hours - 93.8% time saved."
            rightContent={
              <div className="relative w-full max-w-md">
                <GlassCard variant="linear" padding="lg" microAnimate>
                <div className="space-y-6">
                  {/* Process Steps Preview */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Search & Match</p>
                      <p className="text-xs text-zinc-400">1-2 min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-bold">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">AI Analysis & BLOCK Selection</p>
                      <p className="text-xs text-zinc-400">2-3 min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-500/10 text-zinc-400 font-bold">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Document Generation</p>
                      <p className="text-xs text-zinc-400">3 min</p>
                    </div>
                  </div>

                  {/* Time Comparison */}
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-400">Traditional</p>
                        <p className="text-lg font-bold text-red-400">125 hrs</p>
                      </div>
                      <svg className="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <div>
                        <p className="text-xs text-zinc-400">QETTA</p>
                        <p className="text-lg font-bold text-emerald-400">7.8 hrs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          }
        />
        </section>

        {/* Process Timeline */}
        <section className="relative px-6 py-16">
          <DynamicBackground blur={15} gradient="radial" />
          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="space-y-12">
              {steps.map((item, index) => (
                <AnimatedSection key={item.step} delay={index * 0.2}>
                  <div className="relative">
                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-6 top-16 h-full w-0.5 bg-gradient-to-b from-white/20 to-transparent" />
                    )}

                    <GlassCard variant="linearHover" padding="lg" microAnimate>
                      <div className="flex items-start gap-4">
                        {/* Step number */}
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-zinc-500/10 ring-2 ring-zinc-500/50">
                          <span className="text-xl font-bold text-zinc-400">
                            {item.step}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-white">
                              {item.title}
                            </h3>
                            <Badge color={item.color} className="ml-2">
                              {item.duration}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-zinc-400">
                            {item.description}
                          </p>

                          <ul className="mt-4 space-y-2">
                            {item.details.map((detail) => (
                              <li
                                key={detail}
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
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Total Time Saved */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <AnimatedSection>
              <GlassCard variant="linearGlow" padding="xl" microAnimate>
                <div className="text-center">
                  <div className="text-5xl font-bold text-zinc-300">
                    Total 15-20 min
                  </div>
                  <p className="mt-4 text-lg text-zinc-300">
                    From 125 hours to 7.8 hours with QETTA (93.8% time saved)
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-8 text-sm text-zinc-400">
                    <div>
                      <span className="text-red-400">125 hrs</span>
                      <br />
                      Manual Process
                    </div>
                    <svg
                      className="h-8 w-8 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    <div>
                      <span className="text-emerald-400">7.8 hrs</span>
                      <br />
                      QETTA Automation
                    </div>
                  </div>
                </div>
              </GlassCard>
            </AnimatedSection>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <AnimatedSection key={faq.question} delay={index * 0.1}>
                  <GlassCard variant="linearHover" padding="lg" microAnimate>
                    <h3 className="text-lg font-semibold text-white">
                      {faq.question}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400">{faq.answer}</p>
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
