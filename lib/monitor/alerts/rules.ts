/**
 * Alert Rule Engine
 *
 * Declarative rule system for monitoring alerts.
 * Supports threshold-based, trend-based, and composite rules.
 *
 * @module lib/monitor/alerts/rules
 *
 * @example
 * ```ts
 * const engine = createAlertRuleEngine()
 *
 * // Define rules
 * engine.addRule({
 *   id: 'high-temp',
 *   name: 'High Temperature Alert',
 *   condition: {
 *     type: 'threshold',
 *     field: 'temperature',
 *     operator: 'gt',
 *     value: 80
 *   },
 *   severity: 'warning',
 *   cooldownMs: 60000
 * })
 *
 * // Evaluate against sensor data
 * const alerts = engine.evaluate({ temperature: 85, vibration: 3 })
 * // [{ ruleId: 'high-temp', ... }]
 * ```
 */

import type { AlertSeverity, SensorReading } from '@/types/monitor'
import { CircularBuffer } from '@/lib/data-structures/circular-buffer'

// =============================================================================
// Types
// =============================================================================

/** Comparison operators for threshold conditions */
export type ComparisonOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'

/** Logical operators for composite conditions */
export type LogicalOperator = 'and' | 'or'

/** Trend direction for trend-based conditions */
export type TrendDirection = 'increasing' | 'decreasing' | 'stable'

/** Base condition interface */
interface BaseCondition {
  type: string
}

/** Threshold-based condition (value > threshold) */
export interface ThresholdCondition extends BaseCondition {
  type: 'threshold'
  /** Field name to check */
  field: string
  /** Comparison operator */
  operator: ComparisonOperator
  /** Threshold value */
  value: number
}

/** Range-based condition (value within/outside range) */
export interface RangeCondition extends BaseCondition {
  type: 'range'
  /** Field name to check */
  field: string
  /** Minimum value */
  min: number
  /** Maximum value */
  max: number
  /** Check if inside or outside range */
  mode: 'inside' | 'outside'
}

/** Trend-based condition (requires historical data) */
export interface TrendCondition extends BaseCondition {
  type: 'trend'
  /** Field name to check */
  field: string
  /** Expected trend direction */
  direction: TrendDirection
  /** Number of samples to analyze */
  sampleCount: number
  /** Minimum change percentage to trigger */
  changeThreshold: number
}

/** Composite condition (combines multiple conditions) */
export interface CompositeCondition extends BaseCondition {
  type: 'composite'
  /** Logical operator to combine conditions */
  operator: LogicalOperator
  /** Child conditions */
  conditions: AlertCondition[]
}

/** Union type for all condition types */
export type AlertCondition =
  | ThresholdCondition
  | RangeCondition
  | TrendCondition
  | CompositeCondition

/** Alert rule definition */
export interface AlertRule {
  /** Unique rule ID */
  id: string
  /** Human-readable name */
  name: string
  /** Description (optional) */
  description?: string
  /** Condition to evaluate */
  condition: AlertCondition
  /** Alert severity when triggered */
  severity: AlertSeverity
  /** Cooldown period before re-alerting (ms) */
  cooldownMs: number
  /** Whether rule is enabled */
  enabled: boolean
  /** Equipment IDs this rule applies to (empty = all) */
  equipmentIds?: string[]
  /** Custom message template */
  messageTemplate?: string
}

/** Triggered alert from rule evaluation */
export interface TriggeredAlert {
  /** Rule that triggered */
  ruleId: string
  /** Rule name */
  ruleName: string
  /** Alert severity */
  severity: AlertSeverity
  /** Generated message */
  message: string
  /** Timestamp */
  timestamp: string
  /** Values that triggered the alert */
  triggeringValues: Record<string, number>
}

/** Historical data point for trend analysis */
export interface DataPoint {
  value: number
  timestamp: number
}

// =============================================================================
// Evaluation Functions
// =============================================================================

/**
 * Evaluate a comparison operator
 */
function evaluateOperator(
  actual: number,
  operator: ComparisonOperator,
  expected: number
): boolean {
  switch (operator) {
    case 'gt':
      return actual > expected
    case 'gte':
      return actual >= expected
    case 'lt':
      return actual < expected
    case 'lte':
      return actual <= expected
    case 'eq':
      return actual === expected
    case 'neq':
      return actual !== expected
  }
}

/**
 * Evaluate threshold condition
 */
function evaluateThreshold(
  condition: ThresholdCondition,
  data: Record<string, number>
): boolean {
  const value = data[condition.field]
  if (value === undefined) return false
  return evaluateOperator(value, condition.operator, condition.value)
}

/**
 * Evaluate range condition
 */
function evaluateRange(
  condition: RangeCondition,
  data: Record<string, number>
): boolean {
  const value = data[condition.field]
  if (value === undefined) return false

  const inRange = value >= condition.min && value <= condition.max
  return condition.mode === 'inside' ? inRange : !inRange
}

/**
 * Calculate trend direction from historical data
 */
function calculateTrend(
  history: DataPoint[],
  sampleCount: number,
  changeThreshold: number
): TrendDirection {
  if (history.length < sampleCount) return 'stable'

  const samples = history.slice(-sampleCount)
  const firstValue = samples[0].value
  const lastValue = samples[samples.length - 1].value

  if (firstValue === 0) return 'stable'

  const changePercent = ((lastValue - firstValue) / Math.abs(firstValue)) * 100

  if (changePercent > changeThreshold) return 'increasing'
  if (changePercent < -changeThreshold) return 'decreasing'
  return 'stable'
}

/**
 * Evaluate trend condition
 */
function evaluateTrend(
  condition: TrendCondition,
  history: Map<string, CircularBuffer<DataPoint>>
): boolean {
  const fieldHistory = history.get(condition.field)
  if (!fieldHistory || fieldHistory.length < condition.sampleCount) {
    return false
  }

  // Get samples as array for trend calculation
  const samples = fieldHistory.slice(condition.sampleCount)
  const actualTrend = calculateTrend(
    samples,
    condition.sampleCount,
    condition.changeThreshold
  )

  return actualTrend === condition.direction
}

/**
 * Evaluate any condition type
 */
function evaluateCondition(
  condition: AlertCondition,
  data: Record<string, number>,
  history: Map<string, CircularBuffer<DataPoint>>
): boolean {
  switch (condition.type) {
    case 'threshold':
      return evaluateThreshold(condition, data)
    case 'range':
      return evaluateRange(condition, data)
    case 'trend':
      return evaluateTrend(condition, history)
    case 'composite': {
      const results = condition.conditions.map((c) =>
        evaluateCondition(c, data, history)
      )
      return condition.operator === 'and'
        ? results.every(Boolean)
        : results.some(Boolean)
    }
  }
}

// =============================================================================
// Alert Rule Engine
// =============================================================================

export interface AlertRuleEngine {
  /** Add a rule to the engine */
  addRule: (rule: Omit<AlertRule, 'enabled'> & { enabled?: boolean }) => void
  /** Remove a rule by ID */
  removeRule: (ruleId: string) => void
  /** Enable/disable a rule */
  setRuleEnabled: (ruleId: string, enabled: boolean) => void
  /** Get all rules */
  getRules: () => AlertRule[]
  /** Get a rule by ID */
  getRule: (ruleId: string) => AlertRule | undefined
  /** Evaluate all rules against current data */
  evaluate: (
    data: Record<string, number>,
    equipmentId?: string
  ) => TriggeredAlert[]
  /** Update historical data for trend analysis */
  updateHistory: (field: string, value: number) => void
  /** Clear all history */
  clearHistory: () => void
  /** Clear cooldowns (for testing) */
  clearCooldowns: () => void
}

/**
 * Create an Alert Rule Engine instance
 *
 * @param maxHistorySize - Maximum history entries per field (default: 100)
 * @returns AlertRuleEngine instance
 */
export function createAlertRuleEngine(maxHistorySize = 100): AlertRuleEngine {
  const rules: Map<string, AlertRule> = new Map()
  const history: Map<string, CircularBuffer<DataPoint>> = new Map()
  const cooldowns: Map<string, number> = new Map()

  /**
   * Escape HTML entities to prevent XSS
   */
  function escapeHtml(str: string): string {
    const htmlEntities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return str.replace(/[<>&"']/g, (char) => htmlEntities[char] || char)
  }

  /**
   * Generate alert message from template
   */
  function generateMessage(
    rule: AlertRule,
    data: Record<string, number>
  ): string {
    if (rule.messageTemplate) {
      let message = rule.messageTemplate
      for (const [key, value] of Object.entries(data)) {
        // Escape HTML entities to prevent XSS attacks
        const safeValue = escapeHtml(String(value))
        message = message.replace(`{${key}}`, safeValue)
      }
      return message
    }

    // Default message based on condition type
    const condition = rule.condition
    switch (condition.type) {
      case 'threshold':
        return `${rule.name}: ${condition.field} = ${data[condition.field]} (threshold: ${condition.operator} ${condition.value})`
      case 'range':
        return `${rule.name}: ${condition.field} = ${data[condition.field]} (${condition.mode} range ${condition.min}-${condition.max})`
      case 'trend':
        return `${rule.name}: ${condition.field} trend is ${condition.direction}`
      case 'composite':
        return `${rule.name}: Multiple conditions triggered`
    }
  }

  return {
    addRule(rule) {
      rules.set(rule.id, { ...rule, enabled: rule.enabled ?? true })
    },

    removeRule(ruleId) {
      rules.delete(ruleId)
      cooldowns.delete(ruleId)
    },

    setRuleEnabled(ruleId, enabled) {
      const rule = rules.get(ruleId)
      if (rule) {
        rules.set(ruleId, { ...rule, enabled })
      }
    },

    getRules() {
      return Array.from(rules.values())
    },

    getRule(ruleId) {
      return rules.get(ruleId)
    },

    evaluate(data, equipmentId) {
      const now = Date.now()
      const triggered: TriggeredAlert[] = []

      for (const rule of rules.values()) {
        // Skip disabled rules
        if (!rule.enabled) continue

        // Check equipment filter
        if (
          rule.equipmentIds &&
          rule.equipmentIds.length > 0 &&
          equipmentId &&
          !rule.equipmentIds.includes(equipmentId)
        ) {
          continue
        }

        // Check cooldown
        const lastTriggered = cooldowns.get(rule.id)
        if (lastTriggered && now - lastTriggered < rule.cooldownMs) {
          continue
        }

        // Evaluate condition
        if (evaluateCondition(rule.condition, data, history)) {
          triggered.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: generateMessage(rule, data),
            timestamp: new Date().toISOString(),
            triggeringValues: { ...data },
          })
          cooldowns.set(rule.id, now)
        }
      }

      return triggered
    },

    updateHistory(field, value) {
      let buffer = history.get(field)
      if (!buffer) {
        // Create new CircularBuffer with fixed capacity
        buffer = new CircularBuffer<DataPoint>(maxHistorySize)
        history.set(field, buffer)
      }
      // O(1) push - automatically overwrites oldest when full
      buffer.push({ value, timestamp: Date.now() })
    },

    clearHistory() {
      history.clear()
    },

    clearCooldowns() {
      cooldowns.clear()
    },
  }
}

// =============================================================================
// Default Rules (Smart Factory)
// =============================================================================

/** Pre-configured rules for smart factory monitoring */
export const DEFAULT_SMART_FACTORY_RULES: Omit<AlertRule, 'enabled'>[] = [
  {
    id: 'vibration-warning',
    name: '진동 경고',
    description: '진동 수치가 정상 범위를 초과함',
    condition: {
      type: 'threshold',
      field: 'vibration',
      operator: 'gt',
      value: 5,
    },
    severity: 'warning',
    cooldownMs: 60000,
    messageTemplate: '진동 수치 주의 필요: {vibration}mm/s (기준: 5mm/s)',
  },
  {
    id: 'vibration-critical',
    name: '진동 위험',
    description: '진동 수치가 위험 수준에 도달함',
    condition: {
      type: 'threshold',
      field: 'vibration',
      operator: 'gt',
      value: 8,
    },
    severity: 'critical',
    cooldownMs: 30000,
    messageTemplate: '진동 수치 위험: {vibration}mm/s (기준: 8mm/s)',
  },
  {
    id: 'temperature-warning',
    name: '온도 경고',
    description: '온도가 정상 범위를 초과함',
    condition: {
      type: 'range',
      field: 'temperature',
      min: 20,
      max: 70,
      mode: 'outside',
    },
    severity: 'warning',
    cooldownMs: 120000,
    messageTemplate: '온도 범위 이탈: {temperature}°C (정상: 20-70°C)',
  },
  {
    id: 'temperature-critical',
    name: '온도 위험',
    description: '온도가 위험 수준에 도달함',
    condition: {
      type: 'threshold',
      field: 'temperature',
      operator: 'gt',
      value: 85,
    },
    severity: 'critical',
    cooldownMs: 30000,
    messageTemplate: '온도 임계치 초과: {temperature}°C (기준: 85°C)',
  },
  {
    id: 'oee-low',
    name: 'OEE 저하',
    description: 'OEE가 60% 미만으로 하락',
    condition: {
      type: 'threshold',
      field: 'oee',
      operator: 'lt',
      value: 60,
    },
    severity: 'warning',
    cooldownMs: 300000, // 5 minutes
    messageTemplate: 'OEE 저하 감지: {oee}% (기준: 60%)',
  },
  {
    id: 'vibration-trend',
    name: '진동 상승 추세',
    description: '진동이 지속적으로 상승 중',
    condition: {
      type: 'trend',
      field: 'vibration',
      direction: 'increasing',
      sampleCount: 10,
      changeThreshold: 20, // 20% increase
    },
    severity: 'warning',
    cooldownMs: 600000, // 10 minutes
    messageTemplate: '진동 상승 추세 감지 - 예방 점검 권장',
  },
  {
    id: 'multi-sensor-critical',
    name: '복합 위험',
    description: '진동과 온도가 동시에 위험 수준',
    condition: {
      type: 'composite',
      operator: 'and',
      conditions: [
        { type: 'threshold', field: 'vibration', operator: 'gt', value: 7 },
        { type: 'threshold', field: 'temperature', operator: 'gt', value: 75 },
      ],
    },
    severity: 'critical',
    cooldownMs: 30000,
    messageTemplate:
      '복합 위험 감지: 진동 {vibration}mm/s, 온도 {temperature}°C',
  },
]

// =============================================================================
// Helper: Convert SensorReading[] to Record
// =============================================================================

/**
 * Convert sensor readings array to a flat record for rule evaluation
 */
export function sensorReadingsToRecord(
  sensors: SensorReading[]
): Record<string, number> {
  const record: Record<string, number> = {}
  for (const sensor of sensors) {
    // Use Korean type as key (진동, 온도, etc.)
    record[sensor.type] = sensor.value
    // Also add English alias for flexibility
    const typeMap: Record<string, string> = {
      진동: 'vibration',
      온도: 'temperature',
      전류: 'current',
      소음: 'noise',
    }
    const englishKey = typeMap[sensor.type]
    if (englishKey) {
      record[englishKey] = sensor.value
    }
  }
  return record
}
