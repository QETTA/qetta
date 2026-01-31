import { memo } from 'react'
import { DISPLAY_METRICS } from '@/constants/metrics'

/**
 * TrustSection - Customer outcome badges + trust signals
 *
 * Outcome-first: Show results customers care about, not technical specs
 * - Time saved (93.8%)
 * - Rejection reduction (91%)
 * - Document verification
 * - Uptime SLA
 */

const TRUST_BADGES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Time Saved',
    value: DISPLAY_METRICS.timeSaved.value,
    detail: '8h → 30min',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    label: 'Less Rejection',
    value: DISPLAY_METRICS.rejectionReduction.value,
    detail: 'Auto-analysis',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    label: 'Verified',
    value: 'SHA-256',
    detail: 'Hash-chain',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Uptime',
    value: DISPLAY_METRICS.apiUptime.value,
    detail: 'SLA Guaranteed',
  },
] as const

export const TrustSection = memo(function TrustSection() {
  return (
    <section className="relative py-16 px-6 lg:px-8 bg-zinc-950 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Trusted by Government Consultants
          </h2>
          <p className="mt-3 text-zinc-400">
            Enterprise-grade reliability for mission-critical documents
          </p>
        </div>

        {/* Trust Badges Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.label}
              className="group relative p-5 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-white/20 transition-colors"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors mb-3">
                {badge.icon}
              </div>

              {/* Value */}
              <div className="text-2xl font-semibold text-white mb-1">
                {badge.value}
              </div>

              {/* Label */}
              <div className="text-sm text-zinc-400">
                {badge.label}
              </div>

              {/* Detail */}
              <div className="text-xs text-zinc-500 mt-1">
                {badge.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Global Database Stats */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-zinc-400">
              <span className="text-white font-medium">{DISPLAY_METRICS.globalTenders.value}</span>
              {' '}tenders monitored globally
            </span>
          </div>
        </div>
      </div>
    </section>
  )
})
