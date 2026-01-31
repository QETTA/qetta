'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/catalyst/button'
import { QETTA_METRICS, DISPLAY_METRICS } from '@/constants/metrics'
import { useOnboarding } from '@/components/onboarding'

type TabType = 'DOCS' | 'VERIFY' | 'APPLY' | 'MONITOR'

interface QuickAction {
  label: string
  icon: string
  onClick?: () => void
  href?: string
}

interface EmptyStateProps {
  tab: TabType
  onAction?: () => void
  className?: string
  showQuickActions?: boolean
}

const EMPTY_STATE_CONTENT: Record<
  TabType,
  {
    icon: string
    title: string
    value: string
    subtitle: string
    items: string[]
    itemType: 'steps' | 'features'
    cta: string
    quickActions: QuickAction[]
  }
> = {
  DOCS: {
    icon: '📄',
    title: '첫 번째 문서를 생성해보세요',
    value: QETTA_METRICS.TIME_REDUCTION,
    subtitle: '8시간 작업을 30분으로 단축합니다',
    items: [
      '1️⃣ 도메인 선택 (MANUFACTURING / ENVIRONMENT / ...)',
      '2️⃣ 템플릿 선택 (MES 정산보고서 / TMS 보고서 / ...)',
      '3️⃣ 데이터 입력 후 45초 자동 생성!',
    ],
    itemType: 'steps',
    cta: '문서 생성 시작',
    quickActions: [
      { label: 'Watch Demo', icon: '▶️', href: '/demo' },
      { label: 'View Templates', icon: '📋', href: '/docs/templates' },
      { label: 'Import Data', icon: '📥', href: '/docs/import' },
    ],
  },
  VERIFY: {
    icon: '🔐',
    title: '해시체인 검증 (SHA-256)',
    value: QETTA_METRICS.API_UPTIME,
    subtitle: '생성한 문서의 무결성을 보장합니다',
    items: [
      '✓ 데이터 변조 감지 확률 99.9%',
      '✓ QR 코드 역추적으로 원본 센서 데이터 확인',
    ],
    itemType: 'features',
    cta: '첫 검증 시작',
    quickActions: [
      { label: 'How It Works', icon: '❓', href: '/docs/verify-guide' },
      { label: 'Scan QR Code', icon: '📷' },
    ],
  },
  APPLY: {
    icon: '🌍',
    title: `${DISPLAY_METRICS.globalTenders.value} 글로벌 입찰 매칭`,
    value: DISPLAY_METRICS.globalTenders.value,
    subtitle: 'SAM.gov • UNGM • Goszakup',
    items: [
      '✓ 당신의 회사와 매칭되는 입찰을 찾습니다',
      '✓ 매칭 스코어 기반 자동 추천',
    ],
    itemType: 'features',
    cta: '입찰 검색 시작',
    quickActions: [
      { label: 'Set Preferences', icon: '⚙️', href: '/apply/settings' },
      { label: 'Browse All', icon: '🔍', href: '/apply/browse' },
    ],
  },
  MONITOR: {
    icon: '📊',
    title: '실시간 설비 모니터링',
    value: '24/7',
    subtitle: 'MES, PLC, OPC-UA 연동',
    items: [
      '✓ 실시간 센서 데이터 수집',
      '✓ OEE 자동 계산 및 알림',
      '✓ 이상 감지 및 예측 정비',
    ],
    itemType: 'features',
    cta: '모니터링 설정',
    quickActions: [
      { label: 'Connect Equipment', icon: '🔌', href: '/monitor/connect' },
      { label: 'View Demo Data', icon: '📈', href: '/monitor/demo' },
    ],
  },
}

/**
 * EmptyState - 대시보드 탭별 Empty State 컴포넌트
 *
 * QETTA 핵심 가치 제안을 포함한 Empty State를 표시합니다.
 * 2026 트렌드: 애니메이션, Quick Actions, 투어 연동
 *
 * @example
 * <EmptyState tab="DOCS" onAction={() => navigate('/docs/new')} />
 */
export function EmptyState({ tab, onAction, className, showQuickActions = true }: EmptyStateProps) {
  const content = EMPTY_STATE_CONTENT[tab]
  const { startTour, isFirstVisit } = useOnboarding()

  const handleStartTour = () => {
    // Map tab to tour ID
    const tourMap: Record<TabType, 'docs' | 'verify' | 'apply' | 'monitor'> = {
      DOCS: 'docs',
      VERIFY: 'verify',
      APPLY: 'apply',
      MONITOR: 'monitor',
    }
    startTour(tourMap[tab])
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        'animate-fade-in-up',
        className
      )}
    >
      {/* Icon with pulse animation */}
      <span
        className="text-5xl mb-4 inline-block animate-float"
        role="img"
        aria-label={content.title}
      >
        {content.icon}
      </span>

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">{content.title}</h3>

      {/* Key Metric with highlight */}
      <p className="text-3xl font-bold text-white mb-2 tabular-nums">
        {content.value}
      </p>

      {/* Subtitle */}
      <p className="text-zinc-400 mb-6 max-w-sm">{content.subtitle}</p>

      {/* Items (Steps or Features) with stagger animation */}
      <ul className="text-left text-sm text-zinc-400 space-y-2 mb-8 max-w-sm stagger-children visible">
        {content.items.map((item, index) => (
          <li
            key={item}
            className="leading-relaxed"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {item}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Button
        onClick={onAction}
        className="bg-white text-zinc-950 hover:bg-zinc-100 mb-4"
      >
        {content.cta}
      </Button>

      {/* Quick Actions */}
      {showQuickActions && content.quickActions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          {content.quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                'text-xs text-zinc-400 hover:text-white',
                'bg-zinc-800/50 hover:bg-zinc-800',
                'border border-white/5 hover:border-white/10',
                'transition-all duration-200'
              )}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tour prompt for first-time users */}
      {isFirstVisit && (
        <button
          onClick={handleStartTour}
          className={cn(
            'mt-6 flex items-center gap-2 px-4 py-2 rounded-lg',
            'text-sm text-zinc-400 hover:text-white',
            'bg-zinc-900/50 hover:bg-zinc-800',
            'border border-white/10 hover:border-white/20',
            'transition-all duration-200'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-hint-beacon" />
          <span>Take a quick tour</span>
        </button>
      )}
    </div>
  )
}

interface SimpleEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * SimpleEmptyState - 간단한 Empty State 컴포넌트
 *
 * @example
 * <SimpleEmptyState
 *   icon={<SearchIcon />}
 *   title="검색 결과가 없습니다"
 *   description="다른 검색어를 시도해보세요"
 * />
 */
export function SimpleEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: SimpleEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-500/10 flex items-center justify-center ring-1 ring-white/10">
          <span className="text-white">{icon}</span>
        </div>
      )}
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-zinc-500 mb-4">{description}</p>}
      {action && (
        <Button onClick={action.onClick} outline>
          {action.label}
        </Button>
      )}
    </div>
  )
}
