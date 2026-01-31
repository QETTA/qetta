'use client'

import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline'
import { DOMAIN_GRADIENT_COLORS, type DomainGradientKey } from '@/constants/domain-colors'

type DomainKey = DomainGradientKey

export interface MetricCardProps {
  value: string
  label: string
  detail?: string
  trend?: 'up' | 'down' | 'neutral'
  domain?: DomainKey
  className?: string
}

/**
 * MetricCard
 *
 * QETTA 핵심 수치를 시각화하는 독립 컴포넌트
 * Tiptap 에디터 외부에서도 사용 가능
 *
 * 예시:
 * - 93.8% 시간 단축
 * - 91% 반려율 감소
 * - 45초/건 생성 속도
 */
export function MetricCard({
  value,
  label,
  detail,
  trend = 'neutral',
  domain = 'DIGITAL',
  className,
}: MetricCardProps) {
  const colors = DOMAIN_GRADIENT_COLORS[domain] || DOMAIN_GRADIENT_COLORS.DIGITAL

  const TrendIcon = {
    up: ArrowTrendingUpIcon,
    down: ArrowTrendingDownIcon,
    neutral: MinusIcon,
  }[trend]

  const trendColor = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-zinc-500',
  }[trend]

  return (
    <div
      className={[
        'relative overflow-hidden rounded-lg p-4',
        `bg-gradient-to-br ${colors.bgGradient}`,
        `ring-1 ${colors.ringColor}`,
        'transition-all hover:ring-2',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className={`text-3xl font-bold ${colors.accentColor}`}>
            {value}
          </div>
          <div className="text-sm font-medium text-zinc-300 mt-1">
            {label}
          </div>
          {detail && (
            <div className="text-xs text-zinc-500 mt-0.5">
              {detail}
            </div>
          )}
        </div>
        <div className={`${trendColor} opacity-50`}>
          <TrendIcon className="w-8 h-8" />
        </div>
      </div>

      {/* Domain Badge */}
      <div className="absolute top-2 right-2">
        <span className={[
          'text-[10px] font-medium px-1.5 py-0.5 rounded',
          'bg-black/20',
          colors.accentColor,
        ].join(' ')}>
          {domain.replace('_', ' ')}
        </span>
      </div>
    </div>
  )
}

