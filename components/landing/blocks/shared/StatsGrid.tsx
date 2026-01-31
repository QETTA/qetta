import { memo } from 'react'
import { cn } from '@/lib/utils'

export interface StatItem {
  /** Main value (e.g., "93.8%", "45s/doc") */
  value: string
  /** Primary label */
  label: string
  /** Optional detail/subtitle */
  detail?: string
}

interface StatsGridProps {
  /** Array of stat items to display */
  stats: StatItem[]
  /** Number of columns */
  columns?: 2 | 3 | 4
  /** Display variant */
  variant?: 'default' | 'compact' | 'centered'
  /** Additional className */
  className?: string
}

const COLUMN_CLASSES = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
} as const

/**
 * StatsGrid - Responsive grid of statistics
 *
 * Displays key metrics in a consistent, responsive layout.
 *
 * @example
 * ```tsx
 * <StatsGrid
 *   stats={[
 *     { value: '93.8%', label: 'Time Saved', detail: '8h → 30m' },
 *     { value: '91%', label: 'Rejection', detail: 'Reduction' },
 *   ]}
 *   columns={4}
 * />
 * ```
 */
export const StatsGrid = memo(function StatsGrid({
  stats,
  columns = 4,
  variant = 'default',
  className,
}: StatsGridProps) {
  return (
    <div className={cn('grid gap-8', COLUMN_CLASSES[columns], className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(variant === 'centered' && 'text-center')}
        >
          <p
            className={cn(
              'font-semibold text-white',
              variant === 'compact' ? 'text-2xl' : 'text-3xl'
            )}
          >
            {stat.value}
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-400">{stat.label}</p>
          {stat.detail && <p className="text-xs text-zinc-400">{stat.detail}</p>}
        </div>
      ))}
    </div>
  )
})
