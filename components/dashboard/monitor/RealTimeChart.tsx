'use client'

/**
 * RealTimeChart Component
 *
 * A real-time line chart for displaying time-series sensor data.
 * Uses canvas for performance with large datasets.
 *
 * @module components/dashboard/monitor/RealTimeChart
 *
 * @example
 * ```tsx
 * <RealTimeChart
 *   title="온도 추이"
 *   data={temperatureHistory}
 *   unit="°C"
 *   normalRange={[20, 70]}
 *   maxDataPoints={60}
 * />
 * ```
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  type HTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'
import {
  type ChartLine,
  type DrawContext,
  calculateYBounds,
  mapToCanvas,
  drawGrid,
  drawNormalRange,
  drawLine,
  drawCurrentValue,
  drawTimeAxis,
  drawEmptyState,
} from './real-time-chart-utils'

// Re-export types for backwards compatibility
export type { ChartDataPoint, ChartLine } from './real-time-chart-utils'

// =============================================================================
// Types
// =============================================================================

/** RealTimeChart props */
export interface RealTimeChartProps extends HTMLAttributes<HTMLDivElement> {
  /** Chart title */
  title?: string
  /** Chart lines to render */
  lines?: ChartLine[]
  /** Unit of measurement (displayed on Y-axis) */
  unit?: string
  /** Normal range [min, max] for highlighting */
  normalRange?: [number, number]
  /** Maximum number of data points to display */
  maxDataPoints?: number
  /** Chart height in pixels */
  height?: number
  /** Show grid lines */
  showGrid?: boolean
  /** Show legend */
  showLegend?: boolean
  /** Animation enabled */
  animated?: boolean
  /** Update interval in ms */
  updateInterval?: number
}

// =============================================================================
// RealTimeChart Component
// =============================================================================

function RealTimeChartInner({
  title,
  lines = [],
  unit = '',
  normalRange,
  maxDataPoints = 60,
  height = 200,
  showGrid = true,
  showLegend = true,
  animated = true,
  updateInterval = 1000,
  className,
  ...props
}: RealTimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 400, height })
  const animationRef = useRef<number>(0)
  const progressRef = useRef(0)

  // Handle resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        setDimensions({ width, height })
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [height])

  // Draw chart
  const draw = useCallback(
    (progress: number = 1) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const { width, height: h } = dimensions
      const dpr = window.devicePixelRatio || 1

      // Set canvas size with DPR
      canvas.width = width * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)

      // Clear canvas
      ctx.clearRect(0, 0, width, h)

      if (lines.length === 0 || lines.every((l) => l.data.length === 0)) {
        drawEmptyState(ctx, width, h)
        return
      }

      // Calculate bounds
      const [yMin, yMax] = calculateYBounds(lines, normalRange)
      let xMin = Infinity
      let xMax = -Infinity
      for (const line of lines) {
        for (const point of line.data) {
          xMin = Math.min(xMin, point.timestamp)
          xMax = Math.max(xMax, point.timestamp)
        }
      }

      // Ensure minimum time range
      if (xMax - xMin < 10000) {
        xMin = xMax - 60000 // Show at least 60 seconds
      }

      const padding = { top: 20, right: 16, bottom: 24, left: 48 }
      const drawContext: DrawContext = {
        ctx,
        width,
        height: h,
        padding,
        xMin,
        xMax,
        yMin,
        yMax,
      }

      // Draw normal range
      if (normalRange) {
        drawNormalRange(drawContext, normalRange, 'rgba(16, 185, 129, 0.1)')
      }

      // Draw grid
      if (showGrid) {
        drawGrid(drawContext, 'rgba(255, 255, 255, 0.1)')
      }

      // Draw lines
      for (const line of lines) {
        drawLine(drawContext, line, animated, progress)
      }

      // Draw current values
      for (const line of lines) {
        drawCurrentValue(drawContext, line, unit)
      }

      // Draw time axis
      drawTimeAxis(drawContext, 4)
    },
    [dimensions, lines, normalRange, unit, showGrid, animated]
  )

  // Animation loop
  useEffect(() => {
    if (!animated || lines.every((l) => l.data.length === 0)) {
      draw(1)
      return
    }

    progressRef.current = 0
    const startTime = performance.now()
    const duration = 500

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      progressRef.current = Math.min(elapsed / duration, 1)
      draw(progressRef.current)

      if (progressRef.current < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [draw, animated, lines])

  // Redraw on data change (after initial animation)
  useEffect(() => {
    if (progressRef.current >= 1) {
      draw(1)
    }
  }, [lines, draw])

  return (
    <div
      ref={containerRef}
      className={cn('relative bg-zinc-900/50 rounded-lg p-4', className)}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {title && (
          <h3 className="text-sm font-medium text-white">{title}</h3>
        )}
        {showLegend && lines.length > 0 && (
          <div className="flex items-center gap-4">
            {lines.map((line) => (
              <div key={line.id} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: line.color }}
                />
                <span className="text-xs text-zinc-400">{line.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          display: 'block',
        }}
      />
    </div>
  )
}

export const RealTimeChart = memo(RealTimeChartInner)

// Re-export EquipmentSensorChart from separate file for backwards compatibility
export { EquipmentSensorChart } from './equipment-sensor-chart'

export default RealTimeChart
