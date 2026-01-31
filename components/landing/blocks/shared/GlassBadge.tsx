import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ColorVariant } from '@/types/common'
import { BADGE_COLORS, DOT_COLORS } from '@/constants/color-tokens'

type BadgeSize = 'sm' | 'md' | 'lg'

interface GlassBadgeProps {
  children: ReactNode
  className?: string
  /** Badge color variant - uses centralized color tokens */
  color?: ColorVariant
  /** Badge size */
  size?: BadgeSize
  /** Show dot indicator */
  dot?: boolean
  /** Icon to display */
  icon?: ReactNode
}

const SIZE_STYLES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
} as const

/**
 * GlassBadge - Glass morphism badge component
 *
 * Consistent badge styling used throughout landing pages and dashboards.
 *
 * @example
 * ```tsx
 * <GlassBadge color="emerald">Active</GlassBadge>
 * <GlassBadge color="zinc" dot>Processing</GlassBadge>
 * <GlassBadge color="amber" icon={<ClockIcon />}>Pending</GlassBadge>
 * ```
 */
export const GlassBadge = memo(function GlassBadge({
  children,
  className,
  color = 'zinc',
  size = 'md',
  dot,
  icon,
}: GlassBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full ring-1 font-medium',
        BADGE_COLORS[color],
        SIZE_STYLES[size],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT_COLORS[color])} />}
      {icon}
      {children}
    </span>
  )
})

/**
 * GlassBadgeGroup - Container for multiple badges
 */
export const GlassBadgeGroup = memo(function GlassBadgeGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
})
