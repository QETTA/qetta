import { memo } from 'react'
import { STRUCTURE_METRICS, DISPLAY_METRICS } from '@/constants/metrics'
import { AnimatedSection, AnimatedFeatureCard } from './shared/AnimatedSection'
import { CARD_VARIANTS } from '@/constants/card-styles'
import { FEATURE_CARD_COLORS, type FeatureCardColor } from '@/constants/feature-colors'

const features: {
  name: string
  description: string
  icon: React.ReactNode
  color: FeatureCardColor
}[] = [
  {
    name: 'MANUFACTURING',
    description: 'Smart Factory MES/PLC integration for manufacturing execution. Auto-generate 4M1E performance reports and OEE calculations.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'blue' ,
  },
  {
    name: 'ENVIRONMENT',
    description: 'TMS (Tele-Monitoring System) for environmental compliance. Track NOx, SOx, PM emissions. Connect to CleanSYS API for real-time reporting.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    color: 'emerald' ,
  },
  {
    name: 'DIGITAL',
    description: 'NIPA AI Voucher program support. Track supply/demand company milestones and quarterly performance reporting for AI/SW projects.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
    color: 'zinc' ,
  },
  {
    name: 'FINANCE',
    description: 'KODIT/KIBO loan guarantee documentation. Auto-fill financial statements, collateral reports, and credit evaluation forms.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    color: 'indigo' ,
  },
  {
    name: 'STARTUP',
    description: 'TIPS and K-Startup program support. Track equity, milestones, and investor reporting requirements for early-stage ventures.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    color: 'fuchsia' ,
  },
  {
    name: 'EXPORT',
    description: `Global tender database (SAM.gov, UNGM, Goszakup). AI-powered matching against ${DISPLAY_METRICS.globalTenders.value} international procurement opportunities.`,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    color: 'amber',
  },
]

/**
 * FeaturesSection - 서버 컴포넌트로 정적 콘텐츠 렌더링
 *
 * 6개 도메인 엔진을 소개하는 피처 그리드 섹션입니다.
 */
export const FeaturesSection = memo(function FeaturesSection() {
  return (
    <section
      className="relative bg-zinc-950 px-6 py-32 lg:px-8"
      aria-labelledby="features-heading"
      aria-describedby="features-description"
      role="region"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <AnimatedSection>
            <h2 id="features-heading" className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {STRUCTURE_METRICS.enginePresets} domain engines.
              <br />
              {STRUCTURE_METRICS.terminologyMappings} industry terms.
            </h2>
            <p id="features-description" className="mt-6 text-lg text-zinc-400">
              Purpose-built for Korean government compliance. Each engine understands agency-specific terminology,
              templates, and submission rules. Achieving {DISPLAY_METRICS.termAccuracy.value} mapping accuracy.
            </p>
          </AnimatedSection>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const colors = FEATURE_CARD_COLORS[feature.color]
            return (
              <AnimatedFeatureCard
                key={feature.name}
                index={index}
                className={`group relative overflow-hidden p-6 ${CARD_VARIANTS.glassHover}`}
              >
                {/* Icon */}
                <div className={`mb-4 inline-flex rounded-lg p-3 ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}>
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white">{feature.name}</h3>

                {/* Description */}
                <p className="mt-2 text-sm text-zinc-400">{feature.description}</p>

                {/* Hover Effect */}
                <div
                  className={`absolute inset-x-0 bottom-0 h-px ${colors.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
                />
              </AnimatedFeatureCard>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <AnimatedSection delay={0.4} className="mt-12 text-center">
          <p className="text-sm text-zinc-400">
            Need a custom engine? We build industry-specific plugins for partners.
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
})
