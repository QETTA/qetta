'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/catalyst/button'
import { QETTA_METRICS, DISPLAY_METRICS } from '@/constants/metrics'

type TabType = 'DOCS' | 'VERIFY' | 'APPLY' | 'MONITOR'

interface EmptyStateProps {
  tab: TabType
  onAction?: () => void
  className?: string
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
  },
}

/**
 * EmptyState - 대시보드 탭별 Empty State 컴포넌트
 *
 * QETTA 핵심 가치 제안을 포함한 Empty State를 표시합니다.
 *
 * @example
 * <EmptyState tab="DOCS" onAction={() => navigate('/docs/new')} />
 */
export function EmptyState({ tab, onAction, className }: EmptyStateProps) {
  const content = EMPTY_STATE_CONTENT[tab]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      {/* Icon */}
      <span className="text-5xl mb-4" role="img" aria-label={content.title}>
        {content.icon}
      </span>

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">{content.title}</h3>

      {/* Key Metric */}
      <p className="text-3xl font-bold text-white mb-2">{content.value}</p>

      {/* Subtitle */}
      <p className="text-zinc-400 mb-6 max-w-sm">{content.subtitle}</p>

      {/* Items (Steps or Features) */}
      <ul className="text-left text-sm text-zinc-400 space-y-2 mb-8 max-w-sm">
        {content.items.map((item) => (
          <li key={item} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Button onClick={onAction} className="bg-white text-zinc-950 hover:bg-zinc-100">
        {content.cta}
      </Button>
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
