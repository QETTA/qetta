import { memo } from 'react'
import { cn } from '@/lib/utils'
import { STATUS_PING_COLORS, type StatusPingColor } from '@/constants/card-styles'

interface StatusPingProps {
  /** Color scheme for the ping indicator */
  color?: StatusPingColor
  /** Size variant */
  size?: 'sm' | 'md'
  /** Whether to animate the ping effect */
  animate?: boolean
  /** Additional className */
  className?: string
}

const SIZE_CLASSES = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
} as const

/**
 * StatusPing - Animated status indicator dot
 *
 * Common pattern for showing live/active status with ping animation.
 *
 * @example
 * ```tsx
 * <Badge>
 *   <span className="flex items-center gap-1.5">
 *     <StatusPing color="emerald" size="sm" />
 *     Document automation
 *   </span>
 * </Badge>
 * ```
 */
export const StatusPing = memo(function StatusPing({
  color = 'emerald',
  size = 'sm',
  animate = true,
  className,
}: StatusPingProps) {
  const colors = STATUS_PING_COLORS[color]
  const sizeClass = SIZE_CLASSES[size]

  return (
    <span className={cn('relative flex', sizeClass, className)}>
      {animate && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            colors.ping
          )}
        />
      )}
      <span className={cn('relative inline-flex rounded-full', sizeClass, colors.solid)} />
    </span>
  )
})
