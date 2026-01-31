'use client'

/**
 * StatsSection
 *
 * CSS-based animation (framer-motion alternative)
 * A statistics section component that visualizes QETTA key performance metrics.
 *
 * @module landing/StatsSection
 */

import { useState, useEffect } from 'react'
import { DISPLAY_METRICS } from '@/constants/metrics'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { cn } from '@/lib/utils'

// ============================================================================
// Types & Constants
// ============================================================================

/** Individual stat item structure */
interface StatItem {
  value: string
  label: string
  description: string
}

/**
 * Core statistics data - SSOT (Single Source of Truth)
 *
 * Fetches values from `DISPLAY_METRICS` to ensure consistency.
 * To change values, only modify `constants/metrics.ts`.
 *
 * @see {@link DISPLAY_METRICS} Metric constant definitions
 */
const stats: StatItem[] = [
  {
    value: DISPLAY_METRICS.timeSaved.value,
    label: DISPLAY_METRICS.timeSaved.labelEn ?? 'Time Saved',
    description: DISPLAY_METRICS.timeSaved.detailEn ?? 'vs manual work',
  },
  {
    value: '10+',
    label: 'Industry Domains',
    description: 'Industry Blocks',
  },
  {
    value: DISPLAY_METRICS.docSpeed.valueEn ?? DISPLAY_METRICS.docSpeed.value,
    label: DISPLAY_METRICS.docSpeed.labelEn ?? 'Doc Speed',
    description: 'AI-powered generation',
  },
  {
    value: DISPLAY_METRICS.apiUptime.value,
    label: 'Document Integrity',
    description: `${DISPLAY_METRICS.apiUptime.labelEn ?? 'API Uptime'} + Hash Chain`,
  },
]

// ============================================================================
// Component
// ============================================================================

/**
 * StatsSection
 *
 * ## Core Features
 * - **4 Key Metrics**: Time saved, domain count, generation speed, integrity verification
 * - **SSOT Integration**: Fetches values from `constants/metrics.ts`
 * - **Scroll Animation**: CSS transition + IntersectionObserver
 * - **TIPS Badge**: Highlights Welcome to Southeast TIPS selected company
 *
 * @see {@link DISPLAY_METRICS} Core metric constants
 */
export function StatsSection() {
  const { ref, isVisible } = useIntersectionObserver<HTMLElement>({
    threshold: 0.1,
    triggerOnce: true,
  })
  const [showBadge, setShowBadge] = useState(false)

  // Delayed TIPS badge display (after card animation)
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowBadge(true), 600)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  return (
    <section ref={ref} className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div
          className={cn(
            'text-center mb-12 md:mb-16 transition-all duration-500 ease-out',
            'motion-reduce:transition-none',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-5'
          )}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Proven by Real Results
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            QETTA transforms your government support application process through manufacturing-specialized AI document automation.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                'relative p-6 rounded-2xl bg-zinc-900/50 border border-white/5',
                'hover:border-white/10 transition-all duration-500 ease-out group',
                'motion-reduce:transition-none',
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-5'
              )}
              style={{
                transitionDelay: isVisible ? `${index * 100}ms` : '0ms',
              }}
            >
              {/* Background glow (on hover) */}
              <div className="absolute inset-0 rounded-2xl bg-zinc-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Value - scale animation */}
              <div
                className={cn(
                  'text-3xl md:text-4xl font-bold text-white mb-2',
                  'transition-transform duration-500 ease-out',
                  'motion-reduce:transition-none',
                  isVisible ? 'scale-100' : 'scale-50'
                )}
                style={{
                  transitionDelay: isVisible ? `${index * 100 + 200}ms` : '0ms',
                }}
              >
                {stat.value}
              </div>

              {/* Label */}
              <div className="text-sm font-medium text-zinc-300 mb-1">
                {stat.label}
              </div>

              {/* Description */}
              <div className="text-xs text-zinc-500">
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Additional highlight - TIPS Badge */}
        <div
          className={cn(
            'mt-12 text-center transition-opacity duration-500',
            'motion-reduce:transition-none',
            showBadge ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-500/10 border border-zinc-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-zinc-300">
              <span className="text-white font-medium">Welcome to Southeast</span> TIPS Selected Company
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
