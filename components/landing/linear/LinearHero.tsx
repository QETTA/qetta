'use client'

import Link from 'next/link'
import { LinearCodeDiff } from './LinearCodeDiff'
import { LinearButton } from './LinearButton'

/**
 * LinearHero - Linear Reviews 100% benchmarked Hero section
 * Minimal design: code diff + headline + subtitle + CTA button only
 */
export function LinearHero() {
  return (
    <section
      className="relative pt-24 pb-32 px-6 bg-[var(--background)]"
      aria-labelledby="hero-heading"
    >
      <div className="relative z-10 max-w-[1200px] mx-auto">
        {/* Code Diff Section - positioned at top */}
        <LinearCodeDiff />

        {/* Linear "Think diff" style headline + animation */}
        <div className="mt-20 text-center animate-fade-in-up">
          <h1
            id="hero-heading"
            className="font-serif text-hero-sm md:text-hero text-[var(--foreground)]"
          >
            Proposals,
            <br />
            <span className="text-[var(--foreground-secondary)]">Faster</span>
          </h1>

          {/* Subtitle - Linear style */}
          <p className="mt-10 text-[17px] leading-[1.7] text-[var(--foreground-secondary)] max-w-[600px] mx-auto">
            Government proposal writing is changing rapidly. In the era of AI-generated drafts,
            the bottleneck has shifted to review and refinement. QETTA puts your judgment and
            expertise at the center. A fast, modern proposal experience created together by humans and AI.
          </p>

          {/* Invite-only notice */}
          <p className="mt-10 text-[15px] font-medium text-[var(--foreground)]">
            QETTA is currently available by invitation only.
          </p>
          <p className="mt-1 text-[14px] text-[var(--foreground-secondary)]">
            Join the waitlist for early access.
          </p>

          {/* CTA Button - Linear style titanium deep gray button */}
          <div className="mt-8">
            <Link href="/signup">
              <LinearButton>Request Early Access</LinearButton>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
