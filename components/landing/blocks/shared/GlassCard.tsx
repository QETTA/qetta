'use client'

import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CARD_VARIANTS, CARD_PADDINGS, type CardVariant, type CardPadding } from '@/constants/card-styles'
import { GradientOrb } from '@/components/linear'
import type { GradientColor, OrbSize, OrbPosition } from '@/constants/linear-config'

interface GlassCardProps {
  children: ReactNode
  className?: string
  /** Card visual variant */
  variant?: CardVariant
  /** Padding preset */
  padding?: CardPadding
  /** HTML element to render as */
  as?: 'div' | 'li' | 'article'
  /** Optional gradient orb decoration */
  orb?: {
    color: GradientColor
    position?: OrbPosition
    size?: OrbSize
    blur?: number
    opacity?: number
  }
  /** Enable subtle scale-in animation */
  microAnimate?: boolean
}

/**
 * GlassCard - Reusable glass morphism card container
 *
 * Provides consistent styling for cards across landing pages.
 * Now supports Linear-style gradient orbs and micro-animations.
 *
 * @example
 * ```tsx
 * <GlassCard variant="glass" padding="md">
 *   <p>Card content</p>
 * </GlassCard>
 *
 * <GlassCard variant="linear" orb={{ color: 'zinc', position: 'top-right' }} microAnimate>
 *   <p>Linear-style card with orb</p>
 * </GlassCard>
 * ```
 */
export const GlassCard = memo(function GlassCard({
  children,
  className,
  variant = 'glass',
  padding = 'md',
  as: Component = 'div',
  orb,
  microAnimate = false,
}: GlassCardProps) {
  return (
    <Component
      className={cn(
        CARD_VARIANTS[variant],
        CARD_PADDINGS[padding],
        orb && 'relative overflow-hidden',
        microAnimate && 'motion-safe:animate-scale-in',
        className
      )}
    >
      {orb && (
        <GradientOrb
          color={orb.color}
          position={orb.position}
          size={orb.size}
          blur={orb.blur}
          opacity={orb.opacity}
        />
      )}
      <div className={orb ? 'relative z-10' : undefined}>{children}</div>
    </Component>
  )
})
