'use client'

import { Node, mergeAttributes } from '@tiptap/react'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline'
import { DOMAIN_GRADIENT_COLORS, type DomainGradientKey } from '@/constants/domain-colors'

type DomainKey = DomainGradientKey

interface MetricBlockAttributes {
  value: string
  label: string
  detail?: string
  trend?: 'up' | 'down' | 'neutral'
  domain?: DomainKey
}

/**
 * MetricBlock View Component
 *
 * QETTA 핵심 수치를 시각화하는 블록
 * - 93.8% 시간 단축
 * - 91% 반려율 감소
 * - 45초/건 생성 속도
 */
function MetricBlockView({ node }: NodeViewProps) {
  const attrs = node.attrs as unknown as MetricBlockAttributes
  const { value, label, detail, trend = 'neutral', domain = 'DIGITAL' } = attrs

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
    <NodeViewWrapper className="my-2">
      <div
        className={`
          relative overflow-hidden rounded-lg p-4
          bg-gradient-to-br ${colors.bgGradient}
          ring-1 ${colors.ringColor}
          transition-all hover:ring-2
        `}
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
          <span className={`
            text-[10px] font-medium px-1.5 py-0.5 rounded
            bg-black/20 ${colors.accentColor}
          `}>
            {domain.replace('_', ' ')}
          </span>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

/**
 * MetricBlock Tiptap Extension
 */
export const MetricBlockExtension = Node.create({
  name: 'metricBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      value: { default: '0%' },
      label: { default: 'Metric' },
      detail: { default: null },
      trend: { default: 'neutral' },
      domain: { default: 'DIGITAL' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-metric-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-metric-block': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MetricBlockView)
  },
})

