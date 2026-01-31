import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Badge } from '@/components/catalyst/badge'
import { GlassCard } from '@/components/landing/blocks/shared/GlassCard'
import { AnimatedSection } from '@/components/landing/blocks/shared/AnimatedSection'
import { MinimalCTASection } from '@/components/landing/blocks/MinimalCTASection'
import { SectionSkeleton } from '@/components/landing/blocks/shared/SectionSkeleton'
import { DetailPageHero } from '@/components/landing/blocks/DetailPageHero'
import { GradientOrb, DynamicBackground } from '@/components/linear'
import { CloudIcon, ShieldCheckIcon, CpuChipIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'Product - QETTA',
  description:
    'Government compliance automation delivered as a SaaS platform. 99.9% API availability, SHA-256 hash chain verification.',
  openGraph: {
    title: 'Product - QETTA',
    description: 'Enterprise SaaS platform for government compliance automation',
  },
}

export const revalidate = 3600

export default function ProductPage() {
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
          <GradientOrb color="blue" position="top-left" size="xl" blur={80} opacity={40} />
          <DetailPageHero
            badge="Product"
            badgeColor="blue"
            showStatusPing
            statusPingColor="blue"
            heading={
              <>
                Enterprise-Grade
                <br />
                <span className="mt-2 block bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600 bg-clip-text text-transparent">
                  SaaS Platform
                </span>
              </>
            }
            subheading="A secure and scalable platform for government compliance automation. 99.9% API availability with enterprise-grade security."
            rightContent={
              <div className="relative w-full max-w-md">
                <GlassCard variant="linear" padding="lg" microAnimate>
                <div className="space-y-6">
                  {/* Platform Features */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <CloudIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Cloud Native</p>
                      <p className="text-xs text-zinc-400">99.9% Uptime</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <ShieldCheckIcon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Enterprise Security</p>
                      <p className="text-xs text-zinc-400">SHA-256 Verification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-500/10">
                      <CpuChipIcon className="h-6 w-6 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">AI Engine</p>
                      <p className="text-xs text-zinc-400">6 Domain Engines</p>
                    </div>
                  </div>

                  {/* Tech Stack Preview */}
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-zinc-500 mb-2">Tech Stack</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge color="blue">Next.js 15</Badge>
                      <Badge color="cyan">React 19</Badge>
                      <Badge color="zinc">TypeScript</Badge>
                      <Badge color="green">PostgreSQL</Badge>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          }
        />
        </section>

        {/* Architecture */}
        <section className="relative px-6 py-16">
          <DynamicBackground blur={15} gradient="radial" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Technical Architecture
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              <AnimatedSection delay={0}>
                <GlassCard variant="linearHover" padding="lg" className="h-full" microAnimate>
                  <h3 className="text-xl font-semibold text-white">SaaS Based</h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    Cloud-native architecture for access anywhere, anytime
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      99.9% API availability guaranteed
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      Auto-scaling on demand
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      CDN-based global deployment
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      24/7 monitoring and auto-recovery
                    </li>
                  </ul>
                </GlassCard>
              </AnimatedSection>

              <AnimatedSection delay={0.1}>
                <GlassCard variant="linearHover" padding="lg" className="h-full" microAnimate>
                  <h3 className="text-xl font-semibold text-white">
                    Security & Compliance
                  </h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    Enterprise-grade security and regulatory compliance
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      SHA-256 hash chain integrity verification
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      End-to-end encryption (TLS 1.3)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      GDPR/Privacy law compliant
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      Role-based access control (RBAC)
                    </li>
                  </ul>
                </GlassCard>
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <GlassCard variant="linearHover" padding="lg" className="h-full" microAnimate>
                  <h3 className="text-xl font-semibold text-white">
                    AI & Data Engine
                  </h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    AI model trained on 630,000+ tender data
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      6 domain engines (Manufacturing/Environment/Digital, etc.)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      Real-time tender crawling & parsing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      NLP-based requirement analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      Continuous learning for improved accuracy
                    </li>
                  </ul>
                </GlassCard>
              </AnimatedSection>

              <AnimatedSection delay={0.3}>
                <GlassCard variant="linearHover" padding="lg" className="h-full" microAnimate>
                  <h3 className="text-xl font-semibold text-white">
                    Integration & Scalability
                  </h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    Seamless integration with existing systems
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      RESTful API and Webhook
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      SAP, Oracle ERP integration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      Whitelabel platform (B2B2B)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      Custom domain & SSO
                    </li>
                  </ul>
                </GlassCard>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Performance Metrics
            </h2>
            <AnimatedSection>
              <GlassCard variant="linearGlow" padding="xl" microAnimate>
                <div className="grid gap-8 sm:grid-cols-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-zinc-400">99.9%</div>
                    <div className="mt-2 text-sm text-zinc-400">API Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-emerald-500">&lt;3min</div>
                    <div className="mt-2 text-sm text-zinc-400">Avg Document Generation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-500">630K+</div>
                    <div className="mt-2 text-sm text-zinc-400">Tender Data</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-zinc-300">6</div>
                    <div className="mt-2 text-sm text-zinc-400">Domain Engines</div>
                  </div>
                </div>
              </GlassCard>
            </AnimatedSection>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Tech Stack
            </h2>
            <AnimatedSection>
              <GlassCard variant="linear" padding="lg" microAnimate>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Frontend
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge color="blue">Next.js 15</Badge>
                      <Badge color="cyan">React 19</Badge>
                      <Badge color="zinc">TypeScript</Badge>
                      <Badge color="pink">Tailwind CSS</Badge>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Backend
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge color="green">Node.js</Badge>
                      <Badge color="blue">PostgreSQL</Badge>
                      <Badge color="orange">Redis</Badge>
                      <Badge color="purple">Prisma ORM</Badge>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Infrastructure
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge color="zinc">Vercel</Badge>
                      <Badge color="blue">Cloudflare</Badge>
                      <Badge color="amber">Sentry</Badge>
                      <Badge color="green">Upstash</Badge>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      AI & ML
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge color="zinc">Claude API</Badge>
                      <Badge color="emerald">LangChain</Badge>
                      <Badge color="blue">Vector DB</Badge>
                    </div>
                  </div>
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
