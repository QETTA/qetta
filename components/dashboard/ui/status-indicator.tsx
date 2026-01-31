import { cn } from '@/lib/utils'
import {
  DASHBOARD_STATUS_COLORS,
  type DashboardStatusType,
} from '@/constants/dashboard-styles'

interface StatusIndicatorProps {
  /** Indicator type: 'dot' for static, 'ping' for animated */
  type?: 'dot' | 'ping'
  /** Status determines color */
  status?: DashboardStatusType
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-3 w-3',
} as const

/**
 * StatusIndicator - 상태 표시 점 컴포넌트
 *
 * @example
 * // Static dot
 * <StatusIndicator status="active" type="dot" />
 *
 * // Animated ping
 * <StatusIndicator status="info" type="ping" />
 */
export function StatusIndicator({
  type = 'dot',
  status = 'active',
  size = 'md',
  className,
}: StatusIndicatorProps) {
  const colors = DASHBOARD_STATUS_COLORS[status]
  const sizeClasses = SIZE_MAP[size]

  if (type === 'dot') {
    return (
      <span
        className={cn('block rounded-full', sizeClasses, colors.solid, className)}
        aria-hidden="true"
      />
    )
  }

  return (
    <span className={cn('relative flex', sizeClasses, className)} aria-hidden="true">
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          colors.ping
        )}
      />
      <span className={cn('relative inline-flex rounded-full', sizeClasses, colors.solid)} />
    </span>
  )
}
