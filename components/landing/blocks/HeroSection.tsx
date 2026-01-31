import { memo } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/catalyst/badge'
import { Button } from '@/components/catalyst/button'
import { DISPLAY_METRICS } from '@/constants/metrics'
import { CTA_LABELS } from '@/constants/messages'
import { HeroAnimatedContent, HeroProductAnimated } from './hero/HeroAnimatedContent'
import { StatusPing, StatsGrid, type StatItem } from './shared'
import { GradientOrb, DynamicBackground } from '@/components/linear'

/**
 * HeroSection - Server component for static content rendering
 *
 * Animations are separated into HeroAnimatedContent client component
 * so CSS animations are only loaded where needed.
 */
export const HeroSection = memo(function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      aria-describedby="hero-description"
      role="banner"
      className="relative min-h-screen bg-zinc-950 px-6 pt-32 pb-20 lg:px-8"
    >
      {/* Linear-style decorative orb */}
      <GradientOrb color="zinc" position="top-right" size="xl" blur={100} opacity={30} />
      <DynamicBackground blur={10} gradient="radial" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column - Content */}
          <div className="lg:col-span-7">
            <HeroAnimatedContent>
              {/* Status Badge */}
              <Badge color="zinc" className="mb-8">
                <span className="flex items-center gap-2">
                  <StatusPing color="emerald" size="md" />
                  Welcome to Southeast TIPS Selected
                </span>
              </Badge>

              {/* Hero Headline - Super-Model Aligned */}
              <h1 id="hero-heading" className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                <span className="block">Your Industry,</span>
                <span className="mt-2 block bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  Your Intelligence.
                </span>
              </h1>

              {/* Subheadline - Super-Model Tagline */}
              <p id="hero-description" className="mt-8 text-lg text-zinc-400 sm:text-xl max-w-2xl">
                Select BLOCKs. Build Intelligence.
                <br />
                {DISPLAY_METRICS.timeSaved.value} time saved on government compliance documents. Transform {DISPLAY_METRICS.timeSaved.detail}.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
                <Button href="/pricing" className="bg-white text-zinc-950 hover:bg-zinc-100 border-white">
                  {CTA_LABELS.PARTNER}
                </Button>
                <Button href="/login" outline>
                  {CTA_LABELS.FREE_TRIAL}
                </Button>
              </div>

              {/* Stats - QETTA Core Metrics from constants */}
              <StatsGrid
                className="mt-16"
                stats={[
                  { value: DISPLAY_METRICS.timeSaved.value, label: DISPLAY_METRICS.timeSaved.labelEn, detail: DISPLAY_METRICS.timeSaved.detailEn },
                  { value: DISPLAY_METRICS.rejectionReduction.value, label: DISPLAY_METRICS.rejectionReduction.labelEn, detail: 'Rejection rate' },
                  { value: DISPLAY_METRICS.docSpeed.valueEn ?? DISPLAY_METRICS.docSpeed.value, label: 'Generation', detail: 'Per document' },
                  { value: DISPLAY_METRICS.apiUptime.value, label: DISPLAY_METRICS.apiUptime.labelEn, detail: DISPLAY_METRICS.apiUptime.detailEn },
                ] satisfies StatItem[]}
                columns={4}
              />
            </HeroAnimatedContent>
          </div>

          {/* Right Column - Product Screenshot */}
          <div className="lg:col-span-5">
            <HeroProductAnimated className="relative lg:mt-12">
              {/* Product UI - Linear Style with Perspective */}
              <div className="relative" style={{ perspective: '1200px' }}>
                {/* Main Screenshot */}
                <div
                  className="relative overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/15 shadow-2xl shadow-black/50"
                  style={{ transform: 'rotateY(-3deg) rotateX(2deg)' }}
                >
                  <Image
                    src="/screenshots/product-docs.webp"
                    alt="QETTA DOCS — 45-second document generation"
                    width={768}
                    height={436}
                    className="w-full"
                    priority
                  />
                </div>

                {/* Floating Verification Badge */}
                <div className="absolute -bottom-4 -left-4 rounded-lg bg-zinc-900 ring-1 ring-white/15 shadow-xl px-4 py-3">
                  <Badge color="green">
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      SHA-256 Verified
                    </span>
                  </Badge>
                </div>

                {/* Floating Stats Badge */}
                <div className="absolute -top-3 -right-3 rounded-lg bg-zinc-900 ring-1 ring-white/15 shadow-xl px-3 py-2">
                  <p className="text-xs font-medium text-zinc-400">Generated in</p>
                  <p className="text-lg font-semibold text-white">45s</p>
                </div>
              </div>
            </HeroProductAnimated>
          </div>
        </div>
      </div>
    </section>
  )
})
