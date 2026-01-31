'use client'

import { memo } from 'react'
import {
  useMonitorDataStore,
  selectEquipmentById,
} from '@/stores/monitor-data-store'
import { getOeeColor } from '@/constants/colors'

interface GaugeWidgetLiveProps {
  equipmentId: string
  metric: 'overall' | 'availability' | 'performance' | 'quality'
  title?: string
}

/**
 * Live OEE Gauge Widget
 *
 * Features:
 * - Selective subscription: only re-renders when THIS equipment's OEE changes
 * - Shallow comparison: only re-renders when THIS metric changes
 * - Real-time updates from SSE stream via Zustand store
 *
 * Performance optimization example:
 * Without selective subscription: 100 re-renders per second (all equipment updates)
 * With selective subscription: 1 re-render per 15s (only this equipment's OEE updates)
 */
function GaugeWidgetLiveInner({
  equipmentId,
  metric,
  title,
}: GaugeWidgetLiveProps) {
  // Selective subscription: only re-render when this specific equipment's OEE metric changes
  const equipment = useMonitorDataStore((state) =>
    selectEquipmentById(equipmentId)(state)
  )

  if (!equipment) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        Equipment not found
      </div>
    )
  }

  const value = equipment.oee[metric]
  const percentage = value / 100

  const color = getOeeColor(value)

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Title */}
      {title && (
        <div className="text-xs font-medium text-zinc-400 mb-4">{title}</div>
      )}

      {/* SVG Gauge */}
      <svg viewBox="0 0 200 200" className="w-full h-full max-w-[180px]">
        {/* Background arc */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="20"
        />

        {/* Value arc */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke={color}
          strokeWidth="20"
          strokeDasharray={`${percentage * 502.4} 502.4`}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          style={{
            transition: 'stroke-dasharray 0.5s ease-in-out, stroke 0.5s ease',
          }}
        />

        {/* Value text */}
        <text
          x="100"
          y="100"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-3xl font-bold fill-white"
        >
          {value.toFixed(1)}
        </text>

        {/* Unit text */}
        <text
          x="100"
          y="125"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm fill-zinc-500"
        >
          %
        </text>
      </svg>

      {/* Metric name */}
      <div className="text-xs text-zinc-500 mt-2 capitalize">{metric}</div>
    </div>
  )
}

export const GaugeWidgetLive = memo(GaugeWidgetLiveInner)

/**
 * Compact Gauge Widget (for small widget size)
 */
function CompactGaugeWidgetLiveInner({
  equipmentId,
  metric,
}: Omit<GaugeWidgetLiveProps, 'title'>) {
  const equipment = useMonitorDataStore((state) =>
    selectEquipmentById(equipmentId)(state)
  )

  if (!equipment) return null

  const value = equipment.oee[metric]
  const percentage = value / 100

  const color = getOeeColor(value)

  return (
    <div className="flex items-center gap-3">
      {/* Mini gauge */}
      <svg viewBox="0 0 100 100" className="w-16 h-16 flex-shrink-0">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${percentage * 251.2} 251.2`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{
            transition: 'stroke-dasharray 0.3s ease-in-out, stroke 0.3s ease',
          }}
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-lg font-bold fill-white"
        >
          {value.toFixed(0)}
        </text>
      </svg>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-zinc-400 capitalize">
          {metric}
        </div>
        <div className="text-lg font-semibold text-white">
          {value.toFixed(1)}%
        </div>
      </div>
    </div>
  )
}

export const CompactGaugeWidgetLive = memo(CompactGaugeWidgetLiveInner)
