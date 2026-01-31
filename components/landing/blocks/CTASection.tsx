import { memo } from 'react'
import { Button } from '@/components/catalyst/button'
import { DISPLAY_METRICS } from '@/constants/metrics'
import { CTA_LABELS } from '@/constants/messages'
import { AnimatedSection } from './shared/AnimatedSection'
import { StatsGrid, ChecklistItem } from './shared'

const TRUST_INDICATORS = [
  '30-day free trial',
  'No credit card required',
  'Cancel anytime',
] as const

/**
 * CTASection - 서버 컴포넌트로 정적 콘텐츠 렌더링
 *
 * B2B2B 화이트라벨 CTA 섹션입니다.
 */
export const CTASection = memo(function CTASection() {
  return (
    <section
      className="relative overflow-hidden bg-zinc-950 px-6 py-32 lg:px-8"
      aria-labelledby="cta-heading"
      aria-describedby="cta-description"
      role="region"
    >
      <div className="mx-auto max-w-7xl">
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 px-8 py-16 ring-1 ring-white/10 sm:px-16 lg:px-24 lg:py-24">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -left-16 -top-16 h-32 w-32 sm:h-64 sm:w-64 rounded-full bg-zinc-500/10 blur-3xl" />
              <div className="absolute -right-16 -bottom-16 h-32 w-32 sm:h-64 sm:w-64 rounded-full bg-blue-500/10 blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative mx-auto max-w-3xl text-center">
              <h2 id="cta-heading" className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                QETTA hides.
                <br />
                Your brand shines.
              </h2>

              <p id="cta-description" className="mt-6 text-lg text-zinc-400">
                Leverage QETTA's B2B2B whitelabel platform to power your business.
                <br />
                {DISPLAY_METRICS.timeSaved.value} time saved. {DISPLAY_METRICS.rejectionReduction.value} error reduction. Your brand, your clients, our engine.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button href="/partners/consultants" className="w-full sm:w-auto bg-white text-zinc-950 hover:bg-zinc-100 border-white">
                  {CTA_LABELS.PARTNER}
                </Button>
                <Button href="/login" outline className="w-full sm:w-auto">
                  {CTA_LABELS.FREE_TRIAL}
                </Button>
              </div>

              {/* Trust Indicators */}
              <ul className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8">
                {TRUST_INDICATORS.map((text, index) => (
                  <div key={text} className="flex items-center gap-4">
                    <ChecklistItem label={text} color="emerald" className="text-sm" />
                    {index < TRUST_INDICATORS.length - 1 && (
                      <span className="hidden text-zinc-700 sm:block">•</span>
                    )}
                  </div>
                ))}
              </ul>
            </div>

            {/* Stats Bar */}
            <StatsGrid
              className="relative mt-16 border-t border-white/5 pt-8"
              stats={[
                { value: DISPLAY_METRICS.timeSaved.value, label: DISPLAY_METRICS.timeSaved.labelEn },
                { value: DISPLAY_METRICS.rejectionReduction.value, label: 'Error reduction' },
                { value: DISPLAY_METRICS.docSpeed.valueEn ?? '45s', label: 'Per document' },
                { value: DISPLAY_METRICS.apiUptime.value, label: DISPLAY_METRICS.apiUptime.labelEn },
              ]}
              columns={4}
              variant="centered"
            />
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
})
