import { clsx } from 'clsx'

interface DashboardContainerProps {
  children: React.ReactNode
  className?: string
  /** Container max-width variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
}

/**
 * Consistent container wrapper for dashboard pages
 *
 * @example
 * <DashboardContainer size="lg">
 *   <PageHeader title="Settings" />
 *   {children}
 * </DashboardContainer>
 */
export function DashboardContainer({
  children,
  className,
  size = 'xl',
}: DashboardContainerProps) {
  return (
    <div
      className={clsx(
        'mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
}

/**
 * Consistent page header for dashboard pages
 */
export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
      <div className="flex items-center gap-3 sm:gap-4">
        {icon && (
          <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-zinc-500/20 to-fuchsia-500/20 ring-1 ring-zinc-500/30">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">{title}</h1>
          {description && (
            <p className="text-sm sm:text-base text-zinc-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 sm:gap-3">{actions}</div>}
    </div>
  )
}

interface DashboardCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'subtle' | 'interactive' | 'glass'
  padding?: 'sm' | 'md' | 'lg'
}

const cardVariants = {
  default: 'bg-zinc-900/50 border border-zinc-800',
  subtle: 'bg-zinc-900/30 border border-zinc-800/50',
  interactive: 'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer',
  glass: 'bg-zinc-900/50 backdrop-blur-sm border border-zinc-800',
}

const cardPaddings = {
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5 lg:p-6',
  lg: 'p-5 sm:p-6 lg:p-8',
}

/**
 * Consistent card component for dashboard pages
 */
export function DashboardCard({
  children,
  className,
  variant = 'default',
  padding = 'md',
}: DashboardCardProps) {
  return (
    <div
      className={clsx(
        'rounded-lg sm:rounded-xl',
        cardVariants[variant],
        cardPaddings[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

interface StatsGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

/**
 * Responsive grid for stat cards
 */
export function StatsGrid({ children, columns = 3, className }: StatsGridProps) {
  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={clsx('grid gap-3 sm:gap-4 lg:gap-6', columnClasses[columns], className)}>
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: number; label?: string }
  className?: string
}

/**
 * Individual stat card for metrics display
 */
export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <DashboardCard className={className} padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm text-zinc-500">{label}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white mt-1">
            {value}
          </p>
          {trend && (
            <p
              className={clsx(
                'text-xs sm:text-sm mt-1',
                trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        {icon && <div className="text-zinc-500">{icon}</div>}
      </div>
    </DashboardCard>
  )
}

interface SectionHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

/**
 * Section header within dashboard pages
 */
export function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-white">{title}</h2>
        {description && (
          <p className="text-xs sm:text-sm text-zinc-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
