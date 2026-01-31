/**
 * Lightweight Metrics Collection for QETTA Monitor
 *
 * Provides simple in-memory metrics collection for observability.
 * Designed for basic monitoring without external dependencies.
 *
 * Metric types:
 * - Counters: Monotonically increasing values (events, requests)
 * - Gauges: Current values that can go up/down (connections, queue size)
 * - Histogram: Distribution of values (response times)
 *
 * @example
 * ```ts
 * import { incrementCounter, setGauge, recordResponseTime, getMetricsSummary } from '@/lib/monitor/observability/metrics'
 *
 * incrementCounter('sensorDataReceived')
 * setGauge('activeMqttConnections', 5)
 * recordResponseTime(42)
 *
 * const summary = getMetricsSummary()
 * console.log(summary.avgResponseTimeMs)
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export interface MonitorMetrics {
  // Counters - monotonically increasing
  sensorDataReceived: number
  alertsTriggered: number
  connectionAttempts: number
  connectionFailures: number

  // Gauges - current values
  activeMqttConnections: number
  activeOpcuaConnections: number
  circuitBreakerOpenCount: number

  // Histogram data (stored as array for percentile calculation)
  responseTimesMs: number[]
}

export type CounterName = keyof Pick<
  MonitorMetrics,
  'sensorDataReceived' | 'alertsTriggered' | 'connectionAttempts' | 'connectionFailures'
>

export type GaugeName = keyof Pick<
  MonitorMetrics,
  'activeMqttConnections' | 'activeOpcuaConnections' | 'circuitBreakerOpenCount'
>

export interface MetricsSummary {
  // Counters
  sensorDataReceived: number
  alertsTriggered: number
  connectionAttempts: number
  connectionFailures: number

  // Gauges
  activeMqttConnections: number
  activeOpcuaConnections: number
  circuitBreakerOpenCount: number

  // Calculated histogram stats
  avgResponseTimeMs: number
  p50ResponseTimeMs: number
  p95ResponseTimeMs: number
  p99ResponseTimeMs: number
  minResponseTimeMs: number
  maxResponseTimeMs: number
  responseTimeCount: number
}

// =============================================================================
// Internal State
// =============================================================================

const MAX_HISTOGRAM_ENTRIES = 1000

const metrics: MonitorMetrics = {
  // Counters
  sensorDataReceived: 0,
  alertsTriggered: 0,
  connectionAttempts: 0,
  connectionFailures: 0,

  // Gauges
  activeMqttConnections: 0,
  activeOpcuaConnections: 0,
  circuitBreakerOpenCount: 0,

  // Histogram
  responseTimesMs: [],
}

// =============================================================================
// Counter Operations
// =============================================================================

/**
 * Increment a counter metric by 1
 *
 * @param name - Counter name to increment
 *
 * @example
 * ```ts
 * incrementCounter('sensorDataReceived')
 * incrementCounter('alertsTriggered')
 * ```
 */
export function incrementCounter(name: CounterName): void {
  metrics[name]++
}

/**
 * Add a specific amount to a counter
 *
 * @param name - Counter name
 * @param amount - Amount to add (must be positive)
 */
export function addToCounter(name: CounterName, amount: number): void {
  if (amount < 0) {
    throw new Error('Counter increment must be positive')
  }
  metrics[name] += amount
}

// =============================================================================
// Gauge Operations
// =============================================================================

/**
 * Set a gauge metric to a specific value
 *
 * @param name - Gauge name to set
 * @param value - Current value
 *
 * @example
 * ```ts
 * setGauge('activeMqttConnections', 5)
 * setGauge('circuitBreakerOpenCount', 0)
 * ```
 */
export function setGauge(name: GaugeName, value: number): void {
  metrics[name] = value
}

/**
 * Increment a gauge by 1
 */
export function incrementGauge(name: GaugeName): void {
  metrics[name]++
}

/**
 * Decrement a gauge by 1 (minimum 0)
 */
export function decrementGauge(name: GaugeName): void {
  metrics[name] = Math.max(0, metrics[name] - 1)
}

// =============================================================================
// Histogram Operations
// =============================================================================

/**
 * Record a response time measurement
 *
 * Maintains a rolling window of the last 1000 measurements.
 *
 * @param ms - Response time in milliseconds
 *
 * @example
 * ```ts
 * const start = Date.now()
 * await someOperation()
 * recordResponseTime(Date.now() - start)
 * ```
 */
export function recordResponseTime(ms: number): void {
  metrics.responseTimesMs.push(ms)

  // Keep only last N entries to bound memory
  if (metrics.responseTimesMs.length > MAX_HISTOGRAM_ENTRIES) {
    metrics.responseTimesMs.shift()
  }
}

/**
 * Calculate percentile value from sorted array
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

// =============================================================================
// Retrieval Operations
// =============================================================================

/**
 * Get raw metrics data (snapshot)
 *
 * Returns a copy to prevent external mutation.
 */
export function getMetrics(): MonitorMetrics {
  return {
    ...metrics,
    responseTimesMs: [...metrics.responseTimesMs],
  }
}

/**
 * Get metrics summary with calculated statistics
 *
 * Includes average, percentiles, min, max for response times.
 */
export function getMetricsSummary(): MetricsSummary {
  const times = [...metrics.responseTimesMs]
  const sorted = times.sort((a, b) => a - b)

  const sum = times.reduce((acc, t) => acc + t, 0)
  const avg = times.length > 0 ? sum / times.length : 0

  return {
    // Counters
    sensorDataReceived: metrics.sensorDataReceived,
    alertsTriggered: metrics.alertsTriggered,
    connectionAttempts: metrics.connectionAttempts,
    connectionFailures: metrics.connectionFailures,

    // Gauges
    activeMqttConnections: metrics.activeMqttConnections,
    activeOpcuaConnections: metrics.activeOpcuaConnections,
    circuitBreakerOpenCount: metrics.circuitBreakerOpenCount,

    // Histogram stats
    avgResponseTimeMs: Math.round(avg * 100) / 100,
    p50ResponseTimeMs: percentile(sorted, 50),
    p95ResponseTimeMs: percentile(sorted, 95),
    p99ResponseTimeMs: percentile(sorted, 99),
    minResponseTimeMs: sorted.length > 0 ? sorted[0] : 0,
    maxResponseTimeMs: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
    responseTimeCount: times.length,
  }
}

// =============================================================================
// Reset Operations
// =============================================================================

/**
 * Reset all metrics to initial state
 *
 * Useful for testing or periodic resets.
 */
export function resetMetrics(): void {
  // Reset counters
  metrics.sensorDataReceived = 0
  metrics.alertsTriggered = 0
  metrics.connectionAttempts = 0
  metrics.connectionFailures = 0

  // Reset gauges
  metrics.activeMqttConnections = 0
  metrics.activeOpcuaConnections = 0
  metrics.circuitBreakerOpenCount = 0

  // Clear histogram
  metrics.responseTimesMs = []
}

/**
 * Reset only counters (keep gauges and histograms)
 *
 * Useful for periodic counter resets without losing current state.
 */
export function resetCounters(): void {
  metrics.sensorDataReceived = 0
  metrics.alertsTriggered = 0
  metrics.connectionAttempts = 0
  metrics.connectionFailures = 0
}

/**
 * Clear response time histogram only
 */
export function resetHistogram(): void {
  metrics.responseTimesMs = []
}
