import { cn } from '@/lib/utils'

interface MetricItem {
  value: string | number
  label: string
  detail?: string
  color?: 'zinc' | 'emerald' | 'amber' | 'blue' | 'indigo' | 'fuchsia'
}

interface MetricsGridProps {
  metrics: MetricItem[]
  columns?: 2 | 3 | 4 | 6
  className?: string
}

const METRIC_VALUE_COLORS = {
  zinc: 'text-white',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  indigo: 'text-indigo-400',
  fuchsia: 'text-fuchsia-400',
} as const

const COLUMN_CLASSES = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
} as const

/**
 * MetricsGrid - 대시보드 메트릭 그리드 컴포넌트
 *
 * @example
 * <MetricsGrid
 *   metrics={[
 *     { value: '93.8%', label: '시간 단축', color: 'zinc' },
 *     { value: '91%', label: '반려 감소', color: 'emerald' },
 *   ]}
 *   columns={4}
 * />
 */
export function MetricsGrid({ metrics, columns = 4, className }: MetricsGridProps) {
  return (
    <div
      className={cn(
        'grid gap-2',
        COLUMN_CLASSES[columns],
        className
      )}
    >
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-zinc-900 rounded px-2 py-1.5 ring-1 ring-white/5 text-center"
        >
          <div
            className={cn(
              'text-base font-semibold',
              METRIC_VALUE_COLORS[metric.color || 'zinc']
            )}
          >
            {metric.value}
          </div>
          <div className="text-[10px] text-zinc-500">{metric.label}</div>
          {metric.detail && (
            <div className="text-[9px] text-zinc-600 mt-0.5">{metric.detail}</div>
          )}
        </div>
      ))}
    </div>
  )
}

interface CompactMetricProps {
  value: string | number
  label: string
  color?: 'zinc' | 'emerald' | 'amber' | 'blue'
  className?: string
}

/**
 * CompactMetric - 인라인 메트릭 표시
 *
 * @example
 * <CompactMetric value="93.8%" label="시간 단축" color="zinc" />
 */
export function CompactMetric({ value, label, color = 'zinc', className }: CompactMetricProps) {
  return (
    <span className={cn('text-sm', className)}>
      <span className={cn('font-semibold', METRIC_VALUE_COLORS[color])}>{value}</span>
      <span className="text-zinc-500 ml-1">{label}</span>
    </span>
  )
}
