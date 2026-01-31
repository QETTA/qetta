'use client'

/**
 * Chart Widget - Data Visualization
 *
 * Displays various chart types (line, bar, radar, pie)
 * Phase 2 will integrate recharts library
 */

import { memo } from 'react'
import type { ChartWidgetData } from '@/types/widgets'

interface ChartWidgetProps {
  data?: ChartWidgetData
}

function ChartWidgetInner({ data }: ChartWidgetProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        No chart data available
      </div>
    )
  }

  const { chartType, data: chartData } = data

  // Phase 1: Simple visualization placeholder
  // Phase 2: Will integrate recharts for full chart rendering
  return (
    <div className="flex flex-col h-full">
      {/* Chart Type Indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2 py-1 bg-zinc-500/10 text-zinc-400 text-xs rounded ring-1 ring-zinc-500/20">
          {chartType.toUpperCase()}
        </span>
        <span className="text-xs text-zinc-500">{chartData.length} data points</span>
      </div>

      {/* Simple Bar Chart Representation */}
      <div className="flex-1 flex items-end justify-around gap-2 px-4 pb-4">
        {chartData.slice(0, 8).map((item, index) => {
          const maxValue = Math.max(...chartData.map((d) => d.value))
          const heightPercent = (item.value / maxValue) * 100

          return (
            <div key={item.label || index} className="flex-1 flex flex-col items-center gap-2">
              {/* Bar */}
              <div className="w-full flex flex-col justify-end" style={{ height: '120px' }}>
                <div
                  className="w-full bg-zinc-500/20 rounded-t transition-all hover:bg-zinc-500/30"
                  style={{ height: `${heightPercent}%` }}
                  title={`${item.label}: ${item.value}`}
                />
              </div>

              {/* Label */}
              <span className="text-xs text-zinc-500 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Chart Footer */}
      <div className="mt-2 pt-2 border-t border-white/10 text-xs text-zinc-500 text-center">
        Phase 2: Advanced chart rendering with recharts
      </div>
    </div>
  )
}

export const ChartWidget = memo(ChartWidgetInner)
