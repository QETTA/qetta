/**
 * Real-Time Chart Drawing Utilities
 *
 * Canvas-based drawing functions for time-series visualization.
 * Separated from the main component for better testability and maintainability.
 *
 * @module components/dashboard/monitor/real-time-chart-utils
 */

// =============================================================================
// Types
// =============================================================================

/** Single data point for the chart */
export interface ChartDataPoint {
  /** Timestamp (ms since epoch) */
  timestamp: number
  /** Measured value */
  value: number
}

/** Chart line configuration */
export interface ChartLine {
  /** Unique ID for the line */
  id: string
  /** Display label */
  label: string
  /** Line color (hex or CSS color) */
  color: string
  /** Data points */
  data: ChartDataPoint[]
}

/** Drawing context with canvas state and bounds */
export interface DrawContext {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  padding: { top: number; right: number; bottom: number; left: number }
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

// =============================================================================
// Calculation Utilities
// =============================================================================

/**
 * Calculate Y-axis bounds with padding
 */
export function calculateYBounds(
  lines: ChartLine[],
  normalRange?: [number, number]
): [number, number] {
  let min = Infinity
  let max = -Infinity

  for (const line of lines) {
    for (const point of line.data) {
      min = Math.min(min, point.value)
      max = Math.max(max, point.value)
    }
  }

  if (normalRange) {
    min = Math.min(min, normalRange[0])
    max = Math.max(max, normalRange[1])
  }

  // Add 10% padding
  const range = max - min || 1
  min -= range * 0.1
  max += range * 0.1

  return [min, max]
}

/**
 * Map data coordinates to canvas coordinates
 */
export function mapToCanvas(
  x: number,
  y: number,
  ctx: DrawContext
): [number, number] {
  const { width, height, padding, xMin, xMax, yMin, yMax } = ctx
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  const canvasX = padding.left + ((x - xMin) / (xMax - xMin)) * plotWidth
  const canvasY =
    padding.top + (1 - (y - yMin) / (yMax - yMin)) * plotHeight

  return [canvasX, canvasY]
}

// =============================================================================
// Drawing Functions
// =============================================================================

/**
 * Draw grid lines
 */
export function drawGrid(ctx: DrawContext, gridColor: string) {
  const { ctx: c, width, padding, yMin, yMax } = ctx
  const plotWidth = width - padding.left - padding.right

  c.strokeStyle = gridColor
  c.lineWidth = 1

  // Horizontal grid lines (5 lines)
  const yStep = (yMax - yMin) / 4
  for (let i = 0; i <= 4; i++) {
    const y = yMin + i * yStep
    const [, canvasY] = mapToCanvas(0, y, ctx)

    c.beginPath()
    c.setLineDash([2, 4])
    c.moveTo(padding.left, canvasY)
    c.lineTo(padding.left + plotWidth, canvasY)
    c.stroke()
    c.setLineDash([])

    // Y-axis labels
    c.fillStyle = 'rgba(255, 255, 255, 0.5)'
    c.font = '10px Inter, system-ui, sans-serif'
    c.textAlign = 'right'
    c.textBaseline = 'middle'
    c.fillText(y.toFixed(1), padding.left - 8, canvasY)
  }
}

/**
 * Draw normal range highlight
 */
export function drawNormalRange(
  ctx: DrawContext,
  normalRange: [number, number],
  fillColor: string
) {
  const { ctx: c, width, padding } = ctx
  const [minY] = mapToCanvas(0, normalRange[0], ctx)
  const [, maxY] = mapToCanvas(0, normalRange[1], ctx)

  c.fillStyle = fillColor
  c.fillRect(
    padding.left,
    maxY,
    width - padding.left - padding.right,
    minY - maxY
  )
}

/**
 * Draw a single line with gradient fill
 */
export function drawLine(
  ctx: DrawContext,
  line: ChartLine,
  animated: boolean,
  progress: number
) {
  const { ctx: c } = ctx

  if (line.data.length < 2) return

  c.strokeStyle = line.color
  c.lineWidth = 2
  c.lineJoin = 'round'
  c.lineCap = 'round'

  c.beginPath()

  const pointsToDraw = animated
    ? Math.floor(line.data.length * progress)
    : line.data.length

  for (let i = 0; i < pointsToDraw; i++) {
    const point = line.data[i]
    const [x, y] = mapToCanvas(point.timestamp, point.value, ctx)

    if (i === 0) {
      c.moveTo(x, y)
    } else {
      c.lineTo(x, y)
    }
  }

  c.stroke()

  // Draw gradient fill under line
  if (pointsToDraw > 0) {
    const gradient = c.createLinearGradient(
      0,
      ctx.padding.top,
      0,
      ctx.height - ctx.padding.bottom
    )
    gradient.addColorStop(0, `${line.color}40`)
    gradient.addColorStop(1, `${line.color}00`)

    c.fillStyle = gradient
    c.beginPath()

    const firstPoint = line.data[0]
    const [firstX, firstY] = mapToCanvas(firstPoint.timestamp, firstPoint.value, ctx)
    c.moveTo(firstX, ctx.height - ctx.padding.bottom)
    c.lineTo(firstX, firstY)

    for (let i = 1; i < pointsToDraw; i++) {
      const point = line.data[i]
      const [x, y] = mapToCanvas(point.timestamp, point.value, ctx)
      c.lineTo(x, y)
    }

    const lastPoint = line.data[pointsToDraw - 1]
    const [lastX] = mapToCanvas(lastPoint.timestamp, lastPoint.value, ctx)
    c.lineTo(lastX, ctx.height - ctx.padding.bottom)
    c.closePath()
    c.fill()
  }
}

/**
 * Draw current value indicator
 */
export function drawCurrentValue(
  ctx: DrawContext,
  line: ChartLine,
  unit: string
) {
  const { ctx: c } = ctx

  if (line.data.length === 0) return

  const lastPoint = line.data[line.data.length - 1]
  const [x, y] = mapToCanvas(lastPoint.timestamp, lastPoint.value, ctx)

  // Draw point
  c.fillStyle = line.color
  c.beginPath()
  c.arc(x, y, 4, 0, Math.PI * 2)
  c.fill()

  // Draw value label
  c.fillStyle = 'white'
  c.font = 'bold 11px Inter, system-ui, sans-serif'
  c.textAlign = 'left'
  c.textBaseline = 'middle'
  c.fillText(`${lastPoint.value.toFixed(1)}${unit}`, x + 8, y)
}

/**
 * Draw time axis labels
 */
export function drawTimeAxis(ctx: DrawContext, labelCount: number = 4) {
  const { ctx: c, height, padding, xMin, xMax, yMin } = ctx

  c.fillStyle = 'rgba(255, 255, 255, 0.5)'
  c.font = '10px Inter, system-ui, sans-serif'
  c.textAlign = 'center'
  c.textBaseline = 'top'

  for (let i = 0; i <= labelCount; i++) {
    const timestamp = xMin + ((xMax - xMin) * i) / labelCount
    const [x] = mapToCanvas(timestamp, yMin, ctx)
    const date = new Date(timestamp)
    const label = `${date.getMinutes()}:${String(date.getSeconds()).padStart(2, '0')}`
    c.fillText(label, x, height - padding.bottom + 8)
  }
}

/**
 * Draw empty state placeholder
 */
export function drawEmptyState(
  c: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  c.fillStyle = 'rgba(255, 255, 255, 0.3)'
  c.font = '12px Inter, system-ui, sans-serif'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText('데이터를 수집 중입니다...', width / 2, height / 2)
}
