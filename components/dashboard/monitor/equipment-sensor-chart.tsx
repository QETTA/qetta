'use client'

/**
 * EquipmentSensorChart Component
 *
 * Real-time chart connected to equipment sensor data from Zustand store.
 * Displays sensor readings with automatic history tracking.
 *
 * @module components/dashboard/monitor/equipment-sensor-chart
 *
 * @example
 * ```tsx
 * <EquipmentSensorChart
 *   equipmentId="pump-1"
 *   sensorTypes={['진동', '온도']}
 *   title="센서 추이"
 * />
 * ```
 */

import { useState, useEffect } from 'react'
import { useMonitorDataStore, selectEquipmentById } from '@/stores/monitor-data-store'
import { RealTimeChart, type RealTimeChartProps } from './RealTimeChart'
import type { ChartDataPoint, ChartLine } from './real-time-chart-utils'

// =============================================================================
// Types
// =============================================================================

/** Props for equipment-connected chart */
export interface EquipmentSensorChartProps
  extends Omit<RealTimeChartProps, 'lines'> {
  /** Equipment ID to monitor */
  equipmentId: string
  /** Sensor types to display */
  sensorTypes?: string[]
}

// =============================================================================
// Constants
// =============================================================================

/** Color map for sensor types */
export const SENSOR_COLORS: Record<string, string> = {
  진동: '#f59e0b', // amber
  온도: '#ef4444', // red
  전류: '#3b82f6', // blue
  소음: '#a1a1aa', // zinc-400
  vibration: '#f59e0b',
  temperature: '#ef4444',
  current: '#3b82f6',
  noise: '#a1a1aa', // zinc-400
}

// =============================================================================
// Component
// =============================================================================

/**
 * Real-time chart connected to equipment sensor data from Zustand store
 */
export function EquipmentSensorChart({
  equipmentId,
  sensorTypes = ['진동', '온도'],
  maxDataPoints = 60,
  ...props
}: EquipmentSensorChartProps) {
  const equipment = useMonitorDataStore((state) =>
    selectEquipmentById(equipmentId)(state)
  )
  const [history, setHistory] = useState<Map<string, ChartDataPoint[]>>(
    new Map()
  )

  // Update history when equipment data changes
  useEffect(() => {
    if (!equipment) return

    setHistory((prev) => {
      const next = new Map(prev)
      const now = Date.now()

      for (const sensor of equipment.sensors) {
        if (!sensorTypes.includes(sensor.name)) continue

        const existing = next.get(sensor.name) || []
        const newPoint: ChartDataPoint = {
          timestamp: now,
          value: sensor.value,
        }

        // Add new point and trim to max
        const updated = [...existing, newPoint].slice(-maxDataPoints)
        next.set(sensor.name, updated)
      }

      return next
    })
  }, [equipment, sensorTypes, maxDataPoints])

  const lines: ChartLine[] = sensorTypes.map((type) => ({
    id: type,
    label: type,
    color: SENSOR_COLORS[type] || '#10b981',
    data: history.get(type) || [],
  }))

  // Find first sensor's normal range for reference
  const firstSensor = equipment?.sensors.find((s) =>
    sensorTypes.includes(s.name)
  )
  const normalRange = firstSensor?.threshold
    ? ([firstSensor.threshold.min, firstSensor.threshold.max] as [
        number,
        number,
      ])
    : undefined

  return (
    <RealTimeChart
      lines={lines}
      normalRange={normalRange}
      maxDataPoints={maxDataPoints}
      {...props}
    />
  )
}

export default EquipmentSensorChart
