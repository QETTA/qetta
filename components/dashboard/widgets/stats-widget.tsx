'use client'

/**
 * Stats Widget - Single Metric Display
 *
 * Displays a single key metric with optional trend indicator
 * Used for KPIs like time reduction, rejection rate, API uptime
 */

import { memo } from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid'
import type { StatsWidgetData } from '@/types/widgets'

interface StatsWidgetProps {
  data?: StatsWidgetData
}

function StatsWidgetInner({ data }: StatsWidgetProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        No data available
      </div>
    )
  }

  const { metric, value, change, trend, unit } = data

  return (
    <div className="flex flex-col justify-center h-full px-2">
      {/* Metric Name */}
      <div className="text-xs text-zinc-500 mb-2">{metric}</div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-semibold text-white">
          {value}
          {unit && <span className="text-lg text-zinc-400 ml-1">{unit}</span>}
        </span>
      </div>

      {/* Trend Indicator */}
      {change !== undefined && trend && (
        <div className="flex items-center gap-1">
          {trend === 'up' && (
            <>
              <ArrowUpIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">+{change}%</span>
            </>
          )}
          {trend === 'down' && (
            <>
              <ArrowDownIcon className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{change}%</span>
            </>
          )}
          {trend === 'neutral' && (
            <span className="text-sm text-zinc-400">{change}%</span>
          )}
        </div>
      )}
    </div>
  )
}

export const StatsWidget = memo(StatsWidgetInner)
