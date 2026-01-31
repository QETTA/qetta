import { memo } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/catalyst/badge'
import { DISPLAY_METRICS, STRUCTURE_METRICS } from '@/constants/metrics'
import { AnimatedSection, StatusPing, ChecklistItem, GlassCard } from './shared'

const timelineColorClasses = {
  zinc: 'bg-zinc-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
} as const

/**
 * ProductSection - 서버 컴포넌트로 정적 콘텐츠 렌더링
 *
 * DOCS와 VERIFY 기능을 소개하는 섹션입니다.
 * 애니메이션은 AnimatedSection 클라이언트 컴포넌트로 분리됩니다.
 */
export const ProductSection = memo(function ProductSection() {
  return (
    <section
      id="product"
      className="relative bg-zinc-950 px-6 py-32 lg:px-8"
      aria-labelledby="product-heading"
      aria-describedby="product-description"
      role="region"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section 1: DOCS - Document Generation */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: Description */}
          <div className="lg:col-span-5">
            <AnimatedSection direction="left">
              <Badge color="green" className="mb-6">
                <span className="flex items-center gap-1.5">
                  <StatusPing color="emerald" size="sm" />
                  Document automation
                </span>
              </Badge>

              <h2 id="product-heading" className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Generate compliance
                <br />
                docs in 45 seconds
              </h2>

              <p id="product-description" className="mt-6 text-lg text-zinc-400">
                Transform raw operational data into government-ready compliance documents.
                Our domain engines understand {STRUCTURE_METRICS.terminologyMappings} industry-specific terminologies across
                {STRUCTURE_METRICS.industryBlocks} industry BLOCKs, powering {STRUCTURE_METRICS.enginePresets} government compliance engines.
              </p>

              <ul className="mt-8 space-y-4">
                <ChecklistItem
                  label="Auto-fill from sensor data"
                  detail="Real-time equipment integration"
                />
                <ChecklistItem
                  label="Terminology mapping"
                  detail={`${DISPLAY_METRICS.termAccuracy.value} accuracy across ${STRUCTURE_METRICS.enginePresets} domains`}
                />
                <ChecklistItem
                  label="Template library"
                  detail={`${STRUCTURE_METRICS.templates} government forms`}
                />
              </ul>
            </AnimatedSection>
          </div>

          {/* Right: Product UI Screenshot */}
          <div className="md:col-span-6 lg:col-span-7">
            <AnimatedSection direction="right" delay={0.2}>
              {/* Document Preview with macOS Chrome */}
              <div className="relative overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/15 shadow-2xl shadow-black/50">
                {/* macOS Window Chrome */}
                <div className="border-b border-white/10 bg-zinc-800/80 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                      <div className="h-3 w-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2 rounded-md bg-zinc-700/50 px-3 py-1.5 max-w-xs">
                        <svg className="h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-xs text-zinc-400">app.qetta.io/docs</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actual Screenshot */}
                <Image
                  src="/screenshots/product-docs.webp"
                  alt="QETTA automatic document generation"
                  width={768}
                  height={436}
                  className="w-full"
                />

                {/* Generation Status Overlay */}
                <div className="absolute bottom-4 right-4">
                  <Badge color="green">
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {`Generated in ${DISPLAY_METRICS.docSpeed.valueEn?.replace('/doc', '') ?? '45s'}`}
                    </span>
                  </Badge>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Section 2: VERIFY - Hash Chain */}
        <div className="mt-32 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: Hash Chain Visualization */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <AnimatedSection direction="left">
              {/* Timeline Visualization */}
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-zinc-500 via-blue-500 to-emerald-500" />

                {/* Timeline Events */}
                <div className="space-y-8">
                  {[
                    { time: '14:32', event: 'Document Created', hash: 'a3b2c1d4...', color: 'zinc' as const },
                    { time: '14:33', event: 'Data Verified', hash: 'e5f6g7h8...', color: 'blue' as const },
                    { time: '14:34', event: 'Approved', hash: 'i9j0k1l2...', color: 'emerald' as const },
                  ].map((item) => (
                    <div key={item.event} className="relative flex items-start gap-6 pl-14">
                      <div className={`absolute left-4 h-5 w-5 rounded-full ${timelineColorClasses[item.color]} ring-4 ring-zinc-950`} />
                      <div className="flex-1 rounded-lg bg-zinc-900 px-4 py-3 ring-1 ring-white/15">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white">{item.event}</p>
                          <p className="text-sm text-zinc-400">{item.time}</p>
                        </div>
                        <p className="mt-1 font-mono text-xs text-zinc-400">SHA-256: {item.hash}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Right: Description */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <AnimatedSection direction="right" delay={0.2}>
              <Badge color="blue" className="mb-6">
                <span className="flex items-center gap-1.5">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Tamper-proof verification
                </span>
              </Badge>

              <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Build trust with
                <br />
                hash chain integrity
              </h2>

              <p className="mt-6 text-lg text-zinc-400">
                Every document modification creates an immutable SHA-256 hash record.
                Auditors can verify document authenticity in seconds, not hours.
              </p>

              <div className="mt-8 space-y-4">
                <GlassCard variant="solid">
                  <p className="font-medium text-white">{DISPLAY_METRICS.apiUptime.value} API uptime</p>
                  <p className="text-sm text-zinc-400 mt-1">SLA-guaranteed verification service</p>
                </GlassCard>
                <GlassCard variant="solid">
                  <p className="font-medium text-white">Instant audit trail</p>
                  <p className="text-sm text-zinc-400 mt-1">Complete revision history in one click</p>
                </GlassCard>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  )
})
