import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Link } from '@/components/ui/link'
import { Badge } from '@/components/catalyst/badge'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'
import { AnimatedSection } from '@/components/landing/blocks/shared/AnimatedSection'
import { MinimalCTASection } from '@/components/landing/blocks/MinimalCTASection'
import { SectionSkeleton } from '@/components/landing/blocks/shared/SectionSkeleton'
import { DetailPageHero } from '@/components/landing/blocks/DetailPageHero'
import { GradientOrb, DynamicBackground } from '@/components/linear'
import {
  AcademicCapIcon,
  ShoppingCartIcon,
  TruckIcon,
  ArrowRightIcon,
  CubeTransparentIcon,
} from '@heroicons/react/24/outline'

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

const partnerTypes = [
  {
    type: 'Consultants',
    href: '/partners/consultants',
    icon: AcademicCapIcon,
    description: 'Add AI automation to consulting services',
    benefits: [
      '93.8% time savings per client',
      '6x increase in concurrent clients',
      'Focus on high-value strategic consulting',
      'Additional revenue through revenue share model',
    ],
    color: 'zinc' as const,
  },
  {
    type: 'Buyers',
    href: '/partners/buyers',
    icon: ShoppingCartIcon,
    description: 'Add government funding matching to procurement',
    benefits: [
      'Increase customer purchasing power (grant linkage)',
      'Differentiated value-added services',
      'Expand transaction volume and size',
      'Auto-matching via API integration',
    ],
    color: 'emerald' as const,
  },
  {
    type: 'Suppliers',
    href: '/partners/suppliers',
    icon: TruckIcon,
    description: 'Add financing solutions for suppliers',
    benefits: [
      'Boost sales with customer financing support',
      'Easier long-term contract acquisition',
      'Reduced receivables risk',
      'Strengthen brand with whitelabel',
    ],
    color: 'blue' as const,
  },
]

const whitelabelFeatures = [
  {
    title: 'Full Branding',
    description: 'Logo, colors, domain - delivered under your brand',
  },
  {
    title: 'API Integration',
    description: 'Seamless integration with existing systems (RESTful API, Webhook)',
  },
  {
    title: 'Customizable',
    description: 'Per-industry and per-customer configurations and templates',
  },
  {
    title: 'Revenue Share',
    description: '30-40% rebate on customer subscription fees',
  },
]

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
        {/* Hero */}
        <section className="relative">
          <GradientOrb color="fuchsia" position="top-left" size="xl" blur={80} opacity={40} />
          <DetailPageHero
            badge="For Partners"
            badgeColor="fuchsia"
            showStatusPing
            statusPingColor="zinc"
            heading={
              <>
                Under Your Brand
                <br />
                <span className="mt-2 block bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
                  Government Compliance Platform
                </span>
              </>
            }
            subheading="Deliver differentiated value to customers with B2B2B whitelabel platform. API integration, custom branding, revenue share model."
            rightContent={
              <div className="relative w-full max-w-md">
                <GlassCard variant="linear" padding="lg" microAnimate>
                <div className="space-y-6">
                  {/* Partner Types */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-500/10">
                      <AcademicCapIcon className="h-6 w-6 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Consultants</p>
                      <p className="text-xs text-zinc-400">6x client increase</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <ShoppingCartIcon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Buyers</p>
                      <p className="text-xs text-zinc-400">Purchasing power boost</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <TruckIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Suppliers</p>
                      <p className="text-xs text-zinc-400">Sales acceleration</p>
                    </div>
                  </div>

                  {/* Whitelabel Preview */}
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                      <CubeTransparentIcon className="h-5 w-5 text-zinc-400" />
                      <p className="text-sm font-medium text-white">Whitelabel Platform</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-zinc-300">30-40%</p>
                      <p className="text-sm text-zinc-400">subscription rebate</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          }
        />
        </section>

        {/* Partner Types Hub */}
        <section className="relative px-6 py-16">
          <DynamicBackground blur={15} gradient="radial" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Partner Types
            </h2>
            <div className="grid gap-8 lg:grid-cols-3">
              {partnerTypes.map((partner, index) => (
                <AnimatedSection key={partner.type} delay={index * 0.15}>
                  <Link href={partner.href}>
                    <GlassCard
                      variant="linearHover"
                      padding="lg"
                      className="h-full group"
                      microAnimate
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 group-hover:ring-zinc-500/50 transition-all">
                          <partner.icon className="h-6 w-6 text-zinc-400" />
                        </div>
                        <ArrowRightIcon className="h-5 w-5 text-zinc-400 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
                      </div>

                      <h3 className="text-xl font-semibold text-white">
                        {partner.type}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-400">
                        {partner.description}
                      </p>

                      <ul className="mt-4 space-y-2">
                        {partner.benefits.map((benefit) => (
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

                      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-zinc-400 group-hover:text-zinc-300">
                        Learn More
                        <ArrowRightIcon className="h-4 w-4" />
                      </div>
                    </GlassCard>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Whitelabel Platform */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Whitelabel Platform
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {whitelabelFeatures.map((feature, index) => (
                <AnimatedSection key={feature.title} delay={index * 0.1}>
                  <GlassCard variant="linearGlow" padding="lg" microAnimate>
                    <h3 className="text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      {feature.description}
                    </p>
                  </GlassCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Revenue Model */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Revenue Share Model
            </h2>
            <AnimatedSection>
              <GlassCard variant="linear" padding="xl" microAnimate>
                <div className="grid gap-8 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-zinc-300">30-40%</div>
                    <div className="mt-2 text-sm text-zinc-400">
                      Subscription Rebate
                      <br />
                      <span className="text-xs text-zinc-500">
                        (Varies by partner type)
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-emerald-500">100%</div>
                    <div className="mt-2 text-sm text-zinc-400">
                      Value-Added Services
                      <br />
                      <span className="text-xs text-zinc-500">
                        (Direct services like consulting)
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-500">∞</div>
                    <div className="mt-2 text-sm text-zinc-400">
                      Unlimited Customers
                      <br />
                      <span className="text-xs text-zinc-500">
                        (Scalable platform)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                  <p className="text-sm text-zinc-400">
                    Example: 100 customers x $100/mo subscription x 35% rebate ={' '}
                    <span className="font-semibold text-white">
                      $3,500/mo
                    </span>{' '}
                    additional revenue
                  </p>
                </div>
              </GlassCard>
            </AnimatedSection>
          </div>
        </section>

        {/* API Documentation Preview */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              API & Integration
            </h2>
            <AnimatedSection>
              <GlassCard variant="linear" padding="lg" microAnimate>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      RESTful API
                    </h3>
                    <ul className="space-y-2 text-sm text-zinc-300">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        Document Generation API
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        Tender Search API
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        Validation API
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        User Management API
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Webhook & Events
                    </h3>
                    <ul className="space-y-2 text-sm text-zinc-300">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        Document Generation Complete
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        Tender Deadline Alerts
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        Validation Error Detection
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        Payment Events
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                  <a
                    href="/docs/api"
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
                  >
                    View API Docs
                    <ArrowRightIcon className="h-4 w-4" />
                  </a>
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
