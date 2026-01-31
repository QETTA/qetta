import { cn } from '@/lib/utils'
import { QETTA_METRICS, DISPLAY_METRICS } from '@/constants/metrics'

type TabType = 'DOCS' | 'VERIFY' | 'APPLY' | 'MONITOR'

interface TabHeaderProps {
  tab: TabType
  className?: string
}

interface Badge {
  value: string
  label: string
}

const TAB_HEADERS: Record<
  TabType,
  {
    title: string
    titleEn: string
    badges: Badge[]
  }
> = {
  DOCS: {
    title: 'DOCS',
    titleEn: 'Document Generation',
    badges: [
      { value: QETTA_METRICS.TIME_REDUCTION, label: '시간 단축' },
      { value: QETTA_METRICS.REJECTION_REDUCTION, label: '반려 감소' },
    ],
  },
  VERIFY: {
    title: 'VERIFY',
    titleEn: 'Hash Chain Verification',
    badges: [
      { value: QETTA_METRICS.API_UPTIME, label: '신뢰도' },
      { value: `${QETTA_METRICS.GENERATION_SPEED}s`, label: '검증' },
    ],
  },
  APPLY: {
    title: 'APPLY',
    titleEn: 'Global Tender Matching',
    badges: [{ value: DISPLAY_METRICS.globalTenders.value, label: '입찰 DB' }],
  },
  MONITOR: {
    title: 'MONITOR',
    titleEn: 'Real-time Monitoring',
    badges: [
      { value: '24/7', label: '가동' },
      { value: QETTA_METRICS.ACCURACY, label: 'OEE 정확도' },
    ],
  },
}

/**
 * TabHeader - 대시보드 탭 헤더 컴포넌트
 *
 * 탭별 제목과 핵심 메트릭 배지를 표시합니다.
 *
 * @example
 * <TabHeader tab="DOCS" />
 */
export function TabHeader({ tab, className }: TabHeaderProps) {
  const header = TAB_HEADERS[tab]

  return (
    <div className={cn('border-b border-white/10 pb-4 mb-4', className)}>
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-lg font-semibold text-white">{header.title}</h2>
        <span className="text-sm text-zinc-500">— {header.titleEn}</span>
      </div>
      {header.badges.length > 0 && (
        <div className="flex gap-4">
          {header.badges.map((badge) => (
            <span key={badge.label} className="text-sm">
              <span className="text-white font-semibold">{badge.value}</span>
              <span className="text-zinc-500 ml-1">{badge.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface CompactTabHeaderProps {
  title: string
  badge?: { value: string; label: string }
  action?: React.ReactNode
  className?: string
}

/**
 * CompactTabHeader - 컴팩트 탭 헤더 컴포넌트
 *
 * @example
 * <CompactTabHeader
 *   title="Recent Documents"
 *   badge={{ value: '12', label: 'new' }}
 *   action={<Button size="sm">View All</Button>}
 * />
 */
export function CompactTabHeader({
  title,
  badge,
  action,
  className,
}: CompactTabHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-white">{title}</h3>
        {badge && (
          <span className="px-2 py-0.5 text-xs bg-zinc-500/10 text-white rounded-full">
            {badge.value} {badge.label}
          </span>
        )}
      </div>
      {action}
    </div>
  )
}
