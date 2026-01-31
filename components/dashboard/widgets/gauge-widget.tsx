'use client'

/**
 * Gauge Widget - OEE Display
 *
 * Displays Overall Equipment Effectiveness (OEE) gauge
 * Used for monitoring equipment performance, utilization
 * Phase 2 will add advanced radial chart rendering
 */

import { memo } from 'react'
import type { GaugeWidgetData } from '@/types/widgets'

interface GaugeWidgetProps {
  data?: GaugeWidgetData
}

function GaugeWidgetInner({ data }: GaugeWidgetProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        No gauge data available
      </div>
    )
  }

  const { value, max, label, unit, thresholds } = data
  const percentage = (value / max) * 100

  // Determine color based on thresholds
  let colorClass = 'text-emerald-400 stroke-emerald-400'
  if (thresholds) {
    if (value >= thresholds.critical) {
      colorClass = 'text-red-400 stroke-red-400'
    } else if (value >= thresholds.warning) {
      colorClass = 'text-amber-400 stroke-amber-400'
    }
  }

  // SVG arc calculation for gauge
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Gauge Circle */}
      <div className="relative">
        <svg width="160" height="160" className="transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-white/10"
          />

          {/* Progress Circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-500`}
          />
        </svg>

        {/* Center Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${colorClass}`}>
            {value}
            <span className="text-sm text-zinc-400 ml-1">{unit}</span>
          </span>
          <span className="text-xs text-zinc-500 mt-1">{percentage.toFixed(1)}%</span>
        </div>
      </div>

      {/* Label */}
      <div className="mt-4 text-sm text-zinc-400 text-center">{label}</div>

      {/* Thresholds Legend */}
      {thresholds && (
        <div className="mt-3 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-500">Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-zinc-500">Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-zinc-500">Critical</span>
          </div>
        </div>
      )}
    </div>
  )
}

export const GaugeWidget = memo(GaugeWidgetInner)
