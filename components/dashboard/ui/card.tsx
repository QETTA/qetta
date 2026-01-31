import { cn } from '@/lib/utils'
import {
  DASHBOARD_CARD_VARIANTS,
  type DashboardCardVariant,
} from '@/constants/dashboard-styles'

interface DashboardCardProps {
  children: React.ReactNode
  className?: string
  variant?: DashboardCardVariant
}

/**
 * DashboardCard - 대시보드용 카드 컴포넌트
 *
 * 일관된 스타일링과 변형을 제공합니다.
 *
 * @example
 * <DashboardCard variant="accent">
 *   <h3>Title</h3>
 *   <p>Content</p>
 * </DashboardCard>
 */
export function DashboardCard({
  children,
  className,
  variant = 'default',
}: DashboardCardProps) {
  return (
    <div className={cn(DASHBOARD_CARD_VARIANTS[variant], className)}>
      {children}
    </div>
  )
}

interface DashboardCardHeaderProps {
  icon?: React.ReactNode
  title: string
  badge?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

/**
 * DashboardCardHeader - 카드 헤더 컴포넌트
 *
 * @example
 * <DashboardCardHeader
 *   icon={<DocumentIcon />}
 *   title="Documents"
 *   badge={<Badge>New</Badge>}
 * />
 */
export function DashboardCardHeader({
  icon,
  title,
  badge,
  action,
  className,
}: DashboardCardHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-2', className)}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-white">{icon}</span>}
        <span className="font-medium text-white">{title}</span>
        {badge}
      </div>
      {action}
    </div>
  )
}
