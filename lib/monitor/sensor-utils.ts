/**
 * Shared Sensor Utilities
 *
 * Centralized sensor-related functions and constants to eliminate code duplication
 * across MQTT client, OPC-UA client, and simulator modules.
 *
 * @module lib/monitor/sensor-utils
 */

import type { SensorStatus } from '@/types/monitor'

// =============================================================================
// Status Calculation
// =============================================================================

/**
 * Determine sensor status based on value and normal range
 *
 * Uses a 10% buffer zone for warning detection:
 * - Value within normalRange -> 'normal'
 * - Value outside normalRange but within 10% buffer -> 'warning'
 * - Value outside 10% buffer -> 'critical'
 *
 * @param value - The sensor reading value
 * @param normalRange - Tuple of [min, max] for normal operation
 * @returns SensorStatus - 'normal' | 'warning' | 'critical'
 *
 * @example
 * ```ts
 * getSensorStatus(65, [20, 70]) // 'normal' - within range
 * getSensorStatus(72, [20, 70]) // 'warning' - slightly outside
 * getSensorStatus(80, [20, 70]) // 'critical' - far outside
 * ```
 */
export function getSensorStatus(
  value: number,
  normalRange: [number, number]
): SensorStatus {
  const [min, max] = normalRange
  const warningBuffer = (max - min) * 0.1

  if (value < min - warningBuffer || value > max + warningBuffer) {
    return 'critical'
  }
  if (value < min || value > max) {
    return 'warning'
  }
  return 'normal'
}

// =============================================================================
// Sensor Configuration Constants
// =============================================================================

/**
 * Normal operating ranges for each sensor type
 *
 * Values outside these ranges trigger warning/critical status
 */
export const SENSOR_NORMAL_RANGES: Record<string, [number, number]> = {
  temperature: [20, 70],
  vibration: [0, 5],
  current: [8, 16],
  noise: [50, 80],
}

/**
 * Korean display labels for sensor types
 *
 * Used in UI components and messages
 */
export const SENSOR_LABELS: Record<string, string> = {
  temperature: '온도',
  vibration: '진동',
  current: '전류',
  noise: '소음',
}

/**
 * Measurement units for each sensor type
 */
export const SENSOR_UNITS: Record<string, string> = {
  temperature: '°C',
  vibration: 'mm/s',
  current: 'A',
  noise: 'dB',
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the normal range for a sensor type, with fallback to default
 */
export function getNormalRange(sensorType: string): [number, number] {
  return SENSOR_NORMAL_RANGES[sensorType] || [0, 100]
}

/**
 * Get the Korean label for a sensor type, with fallback to original
 */
export function getSensorLabel(sensorType: string): string {
  return SENSOR_LABELS[sensorType] || sensorType
}

/**
 * Get the unit for a sensor type, with fallback to empty string
 */
export function getSensorUnit(sensorType: string): string {
  return SENSOR_UNITS[sensorType] || ''
}
