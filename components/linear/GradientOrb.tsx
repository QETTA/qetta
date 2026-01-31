'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import {
  GRADIENT_COLORS,
  ORB_SIZES,
  ORB_POSITIONS,
  type GradientColor,
  type OrbSize,
  type OrbPosition,
} from '@/constants/linear-config'

interface GradientOrbProps {
  /** Orb color theme */
  color: GradientColor
  /** Orb position */
  position?: OrbPosition
  /** Size variant */
  size?: OrbSize
  /** Blur intensity (px) */
  blur?: number
  /** Opacity (0-100) */
  opacity?: number
  /** Enable rotation animation */
  animate?: boolean
  /** Hide on mobile */
  hideOnMobile?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * GradientOrb - Linear App-style decorative gradient sphere
 *
 * Pure CSS gradient orb with optional rotation animation.
 * Respects prefers-reduced-motion for accessibility.
 *
 * @example
 * ```tsx
 * <section className="relative">
 *   <GradientOrb color="zinc" position="top-right" size="lg" />
 *   <div className="relative z-10">Content</div>
 * </section>
 * ```
 */
export const GradientOrb = memo(function GradientOrb({
  color,
  position = 'top-right',
  size = 'lg',
  blur = 60,
  opacity = 100,
  animate = false,
  hideOnMobile = true,
  className,
}: GradientOrbProps) {
  return (
    <div
      className={cn(
        // Base styles
        'absolute rounded-full pointer-events-none',
        GRADIENT_COLORS[color],
        ORB_SIZES[size],
        ORB_POSITIONS[position],
        // Animation
        animate && 'motion-safe:animate-[spin_20s_linear_infinite]',
        // Mobile hiding
        hideOnMobile && 'hidden lg:block',
        className
      )}
      style={{
        filter: `blur(${blur}px)`,
        opacity: opacity / 100,
      }}
      aria-hidden="true"
    />
  )
})
