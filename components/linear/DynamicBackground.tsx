'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

interface DynamicBackgroundProps {
  /** Blur intensity */
  blur?: number
  /** Gradient overlay type */
  gradient?: 'radial' | 'linear' | 'none'
  /** Add noise texture */
  noise?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * DynamicBackground - Linear App-style section background
 *
 * Adds subtle blur and gradient overlays to sections.
 *
 * @example
 * ```tsx
 * <section className="relative">
 *   <DynamicBackground blur={20} gradient="radial" />
 *   <div className="relative z-10">Content</div>
 * </section>
 * ```
 */
export const DynamicBackground = memo(function DynamicBackground({
  blur = 20,
  gradient = 'radial',
  noise = false,
  className,
}: DynamicBackgroundProps) {
  return (
    <>
      {/* Blur overlay */}
      <div
        className={cn('absolute inset-0 pointer-events-none', className)}
        style={{
          backdropFilter: `blur(${blur}px)`,
        }}
        aria-hidden="true"
      />

      {/* Gradient overlay */}
      {gradient !== 'none' && (
        <div
          className={cn(
            'absolute inset-0 pointer-events-none',
            gradient === 'radial' &&
              'bg-gradient-radial from-zinc-900/50 via-zinc-950/80 to-zinc-950',
            gradient === 'linear' && 'bg-gradient-to-b from-zinc-900/50 to-zinc-950'
          )}
          aria-hidden="true"
        />
      )}

      {/* Noise texture (optional) */}
      {noise && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundRepeat: 'repeat',
          }}
          aria-hidden="true"
        />
      )}
    </>
  )
})
