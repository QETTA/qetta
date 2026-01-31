import { cn } from '@/lib/utils'
import { DashboardCard, DashboardCardHeader } from './card'

interface SkillBlockProps {
  icon?: React.ReactNode
  title: string
  badge?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * SkillBlock - AI 스킬 블록 컴포넌트
 *
 * 대시보드 AI 패널에서 스킬 결과를 표시하는 데 사용됩니다.
 *
 * @example
 * <SkillBlock
 *   icon={<ChartIcon />}
 *   title="Metrics Analysis"
 *   badge={<Badge color="emerald">Complete</Badge>}
 * >
 *   <MetricsDisplay data={metrics} />
 * </SkillBlock>
 */
export function SkillBlock({
  icon,
  title,
  badge,
  action,
  children,
  className,
}: SkillBlockProps) {
  return (
    <DashboardCard className={cn('mt-3', className)}>
      <DashboardCardHeader icon={icon} title={title} badge={badge} action={action} />
      {children}
    </DashboardCard>
  )
}

interface SkillBlockSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

/**
 * SkillBlockSection - 스킬 블록 내 섹션
 *
 * @example
 * <SkillBlockSection title="Key Findings">
 *   <ul>...</ul>
 * </SkillBlockSection>
 */
export function SkillBlockSection({
  title,
  children,
  className,
}: SkillBlockSectionProps) {
  return (
    <div className={cn('mt-4', className)}>
      <h4 className="mb-2 text-sm font-medium text-zinc-300">{title}</h4>
      {children}
    </div>
  )
}

interface SkillBlockItemProps {
  label: string
  value: string | number
  color?: 'zinc' | 'emerald' | 'amber' | 'red' | 'blue'
  className?: string
}

const VALUE_COLORS = {
  zinc: 'text-white',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
} as const

/**
 * SkillBlockItem - 스킬 블록 내 키-값 항목
 *
 * @example
 * <SkillBlockItem label="Accuracy" value="99.2%" color="emerald" />
 */
export function SkillBlockItem({
  label,
  value,
  color = 'zinc',
  className,
}: SkillBlockItemProps) {
  return (
    <div className={cn('flex items-center justify-between py-1', className)}>
      <span className="text-sm text-zinc-400">{label}</span>
      <span className={cn('text-sm font-medium', VALUE_COLORS[color])}>{value}</span>
    </div>
  )
}
