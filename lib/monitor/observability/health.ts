/**
 * Health Check Utilities for QETTA Monitor
 *
 * Provides health status checks for monitoring system components:
 * - Memory usage monitoring
 * - MQTT/OPC-UA configuration status
 * - Uptime tracking
 *
 * @module lib/monitor/observability/health
 *
 * @example
 * ```ts
 * import { checkMemory, getUptime, aggregateStatus } from '@/lib/monitor/observability/health'
 *
 * const memCheck = checkMemory()
 * console.log(memCheck.status) // 'ok' | 'degraded' | 'unhealthy'
 *
 * const uptime = getUptime()
 * console.log(`Running for ${uptime}ms`)
 * ```
 */

import { getMetricsSummary, type MetricsSummary } from './metrics'

// =============================================================================
// Types
// =============================================================================

export type HealthCheckStatus = 'ok' | 'degraded' | 'unhealthy'
export type OverallHealthStatus = 'healthy' | 'degraded' | 'unhealthy'

/**
 * Individual health check result
 */
export interface HealthCheck {
  status: HealthCheckStatus
  message?: string
  latencyMs?: number
}

/**
 * Complete health status response
 */
export interface HealthStatus {
  status: OverallHealthStatus
  timestamp: string
  uptime: number
  checks: {
    mqtt: HealthCheck
    opcua: HealthCheck
    memory: HealthCheck
  }
  metrics: MetricsSummary
}

// =============================================================================
// Internal State
// =============================================================================

/**
 * Process start time for uptime calculation
 * Uses module load time as approximation
 */
const startTime = Date.now()

// =============================================================================
// Health Check Functions
// =============================================================================

/**
 * Check memory usage health
 *
 * Thresholds:
 * - OK: < 70% heap usage
 * - Degraded: 70-90% heap usage
 * - Unhealthy: > 90% heap usage
 *
 * @returns Health check result with memory usage percentage
 *
 * @example
 * ```ts
 * const check = checkMemory()
 * // { status: 'ok', message: 'Heap usage 45.2%' }
 * ```
 */
export function checkMemory(): HealthCheck {
  // In browser environment, return ok (no process.memoryUsage)
  if (typeof process === 'undefined' || typeof process.memoryUsage !== 'function') {
    return { status: 'ok', message: 'Browser environment' }
  }

  const usage = process.memoryUsage()
  const heapUsedMB = usage.heapUsed / 1024 / 1024
  const heapTotalMB = usage.heapTotal / 1024 / 1024
  const usagePercent = (heapUsedMB / heapTotalMB) * 100

  if (usagePercent > 90) {
    return {
      status: 'unhealthy',
      message: `Heap usage ${usagePercent.toFixed(1)}% (${heapUsedMB.toFixed(0)}MB / ${heapTotalMB.toFixed(0)}MB)`,
    }
  }

  if (usagePercent > 70) {
    return {
      status: 'degraded',
      message: `Heap usage ${usagePercent.toFixed(1)}% (${heapUsedMB.toFixed(0)}MB / ${heapTotalMB.toFixed(0)}MB)`,
    }
  }

  return {
    status: 'ok',
    message: `Heap usage ${usagePercent.toFixed(1)}% (${heapUsedMB.toFixed(0)}MB / ${heapTotalMB.toFixed(0)}MB)`,
  }
}

/**
 * Check MQTT configuration status
 *
 * @param isConfigured - Whether MQTT is configured
 * @returns Health check result
 */
export function checkMQTT(isConfigured: boolean): HealthCheck {
  if (isConfigured) {
    return { status: 'ok', message: 'Configured' }
  }
  return { status: 'degraded', message: 'Not configured' }
}

/**
 * Check OPC-UA configuration status
 *
 * @param isConfigured - Whether OPC-UA is configured
 * @returns Health check result
 */
export function checkOPCUA(isConfigured: boolean): HealthCheck {
  if (isConfigured) {
    return { status: 'ok', message: 'Configured' }
  }
  return { status: 'degraded', message: 'Not configured' }
}

/**
 * Get process uptime in milliseconds
 *
 * @returns Milliseconds since module was loaded
 */
export function getUptime(): number {
  return Date.now() - startTime
}

/**
 * Aggregate multiple health check statuses into overall status
 *
 * Logic:
 * - If any check is 'unhealthy' → overall 'unhealthy'
 * - If any check is 'degraded' → overall 'degraded'
 * - Otherwise → 'healthy'
 *
 * @param checks - Array of health check results
 * @returns Aggregated overall status
 *
 * @example
 * ```ts
 * const overall = aggregateStatus([
 *   { status: 'ok' },
 *   { status: 'degraded' },
 *   { status: 'ok' }
 * ])
 * // 'degraded'
 * ```
 */
export function aggregateStatus(checks: HealthCheck[]): OverallHealthStatus {
  const statuses = checks.map((c) => c.status)

  if (statuses.includes('unhealthy')) {
    return 'unhealthy'
  }

  if (statuses.includes('degraded')) {
    return 'degraded'
  }

  return 'healthy'
}

/**
 * Build complete health status response
 *
 * Combines all health checks with metrics summary.
 *
 * @param mqttConfigured - Whether MQTT is configured
 * @param opcuaConfigured - Whether OPC-UA is configured
 * @returns Complete health status object
 *
 * @example
 * ```ts
 * import { isMQTTConfigured, isOPCUAConfigured } from '@/lib/monitor/config/credentials'
 *
 * const health = buildHealthStatus(isMQTTConfigured(), isOPCUAConfigured())
 * // {
 * //   status: 'healthy',
 * //   timestamp: '2026-01-30T12:00:00.000Z',
 * //   uptime: 3600000,
 * //   checks: { mqtt: {...}, opcua: {...}, memory: {...} },
 * //   metrics: {...}
 * // }
 * ```
 */
export function buildHealthStatus(mqttConfigured: boolean, opcuaConfigured: boolean): HealthStatus {
  const mqttCheck = checkMQTT(mqttConfigured)
  const opcuaCheck = checkOPCUA(opcuaConfigured)
  const memoryCheck = checkMemory()

  const checks = { mqtt: mqttCheck, opcua: opcuaCheck, memory: memoryCheck }
  const overallStatus = aggregateStatus([mqttCheck, opcuaCheck, memoryCheck])

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: getUptime(),
    checks,
    metrics: getMetricsSummary(),
  }
}
