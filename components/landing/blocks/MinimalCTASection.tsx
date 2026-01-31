'use client'

import { Link } from '@/components/ui/link'
import { GlassCard } from './shared/GlassCard'
import { DynamicBackground } from '@/components/linear'
import { SparklesIcon, ArrowPathIcon, CubeIcon } from '@heroicons/react/24/outline'

/**
 * MinimalCTASection - Lightweight CTA with quick links
 *
 * Replaces heavy multi-section homepage with focused conversion
 * and discovery pathways to detailed pages.
 *
 * Performance impact:
 * - Removes 4 heavy sections (Product, Apply, Features, CTA)
 * - Adds single lightweight component
 * - Expected LCP improvement: ~1.5s → ~0.8s
 *
 * @module landing/blocks/MinimalCTASection
 */
export function MinimalCTASection() {
  return (
    <section className="relative px-6 py-24">
      <DynamicBackground blur={15} gradient="radial" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <GlassCard variant="linear" padding="xl" microAnimate>
          {/* Primary CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Get Started Now
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Experience all QETTA features with a free trial
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-zinc-950 bg-white rounded-lg transition-colors hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 text-center"
              >
                Start for Free
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-white bg-transparent rounded-lg border border-zinc-700 transition-colors hover:border-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 text-center"
              >
                View Pricing
              </Link>
            </div>
          </div>

          {/* Quick Discovery Links */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Link
                href="/features"
                className="group flex flex-col items-center gap-3 rounded-lg p-4 transition-colors hover:bg-white/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-500/10 ring-1 ring-zinc-500/20 transition-transform group-hover:scale-110">
                  <SparklesIcon className="h-6 w-6 text-zinc-400" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-zinc-100">View All Features</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    AI document generation, matching, verification
                  </div>
                </div>
              </Link>

              <Link
                href="/how-it-works"
                className="group flex flex-col items-center gap-3 rounded-lg p-4 transition-colors hover:bg-white/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 transition-transform group-hover:scale-110">
                  <ArrowPathIcon className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-zinc-100">How It Works</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    3-step application process
                  </div>
                </div>
              </Link>

              <Link
                href="/product"
                className="group flex flex-col items-center gap-3 rounded-lg p-4 transition-colors hover:bg-white/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20 transition-transform group-hover:scale-110">
                  <CubeIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-zinc-100">Product Details</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    SaaS platform architecture
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span>30-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  )
}
