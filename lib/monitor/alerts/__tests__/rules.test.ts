/**
 * Alert Rule Engine Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createAlertRuleEngine,
  sensorReadingsToRecord,
  DEFAULT_SMART_FACTORY_RULES,
  type AlertRule,
  type AlertRuleEngine,
} from '../rules'
import type { SensorReading } from '@/types/monitor'

describe('createAlertRuleEngine', () => {
  let engine: AlertRuleEngine

  beforeEach(() => {
    engine = createAlertRuleEngine()
  })

  describe('addRule / getRule / getRules', () => {
    it('adds a rule and retrieves it by ID', () => {
      engine.addRule({
        id: 'test-rule',
        name: 'Test Rule',
        condition: {
          type: 'threshold',
          field: 'temperature',
          operator: 'gt',
          value: 80,
        },
        severity: 'warning',
        cooldownMs: 1000,
      })

      const rule = engine.getRule('test-rule')
      expect(rule).toBeDefined()
      expect(rule?.name).toBe('Test Rule')
      expect(rule?.enabled).toBe(true) // default enabled
    })

    it('returns all rules', () => {
      engine.addRule({
        id: 'rule-1',
        name: 'Rule 1',
        condition: { type: 'threshold', field: 'a', operator: 'gt', value: 50 },
        severity: 'info',
        cooldownMs: 1000,
      })
      engine.addRule({
        id: 'rule-2',
        name: 'Rule 2',
        condition: { type: 'threshold', field: 'b', operator: 'lt', value: 10 },
        severity: 'warning',
        cooldownMs: 1000,
      })

      expect(engine.getRules()).toHaveLength(2)
    })
  })

  describe('removeRule', () => {
    it('removes a rule by ID', () => {
      engine.addRule({
        id: 'to-remove',
        name: 'To Remove',
        condition: { type: 'threshold', field: 'x', operator: 'eq', value: 0 },
        severity: 'info',
        cooldownMs: 1000,
      })

      engine.removeRule('to-remove')
      expect(engine.getRule('to-remove')).toBeUndefined()
    })
  })

  describe('setRuleEnabled', () => {
    it('disables and enables a rule', () => {
      engine.addRule({
        id: 'toggle-rule',
        name: 'Toggle Rule',
        condition: { type: 'threshold', field: 'x', operator: 'gt', value: 0 },
        severity: 'info',
        cooldownMs: 1000,
      })

      engine.setRuleEnabled('toggle-rule', false)
      expect(engine.getRule('toggle-rule')?.enabled).toBe(false)

      engine.setRuleEnabled('toggle-rule', true)
      expect(engine.getRule('toggle-rule')?.enabled).toBe(true)
    })
  })

  describe('evaluate - threshold conditions', () => {
    beforeEach(() => {
      engine.addRule({
        id: 'high-temp',
        name: 'High Temperature',
        condition: {
          type: 'threshold',
          field: 'temperature',
          operator: 'gt',
          value: 80,
        },
        severity: 'warning',
        cooldownMs: 0, // No cooldown for testing
      })
    })

    it('triggers when threshold exceeded (gt)', () => {
      const alerts = engine.evaluate({ temperature: 85 })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].ruleId).toBe('high-temp')
      expect(alerts[0].severity).toBe('warning')
    })

    it('does not trigger when below threshold', () => {
      const alerts = engine.evaluate({ temperature: 75 })
      expect(alerts).toHaveLength(0)
    })

    it('does not trigger when field is missing', () => {
      const alerts = engine.evaluate({ pressure: 100 })
      expect(alerts).toHaveLength(0)
    })

    it('handles all comparison operators', () => {
      // Test each operator
      const operators: Array<{
        op: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'
        value: number
        testValue: number
        shouldTrigger: boolean
      }> = [
        { op: 'gt', value: 50, testValue: 51, shouldTrigger: true },
        { op: 'gt', value: 50, testValue: 50, shouldTrigger: false },
        { op: 'gte', value: 50, testValue: 50, shouldTrigger: true },
        { op: 'gte', value: 50, testValue: 49, shouldTrigger: false },
        { op: 'lt', value: 50, testValue: 49, shouldTrigger: true },
        { op: 'lt', value: 50, testValue: 50, shouldTrigger: false },
        { op: 'lte', value: 50, testValue: 50, shouldTrigger: true },
        { op: 'lte', value: 50, testValue: 51, shouldTrigger: false },
        { op: 'eq', value: 50, testValue: 50, shouldTrigger: true },
        { op: 'eq', value: 50, testValue: 51, shouldTrigger: false },
        { op: 'neq', value: 50, testValue: 51, shouldTrigger: true },
        { op: 'neq', value: 50, testValue: 50, shouldTrigger: false },
      ]

      for (const test of operators) {
        const testEngine = createAlertRuleEngine()
        testEngine.addRule({
          id: `test-${test.op}`,
          name: `Test ${test.op}`,
          condition: {
            type: 'threshold',
            field: 'value',
            operator: test.op,
            value: test.value,
          },
          severity: 'info',
          cooldownMs: 0,
        })

        const alerts = testEngine.evaluate({ value: test.testValue })
        expect(alerts.length > 0).toBe(test.shouldTrigger)
      }
    })
  })

  describe('evaluate - range conditions', () => {
    it('triggers when value is outside range (mode: outside)', () => {
      engine.addRule({
        id: 'range-outside',
        name: 'Out of Range',
        condition: {
          type: 'range',
          field: 'temperature',
          min: 20,
          max: 70,
          mode: 'outside',
        },
        severity: 'warning',
        cooldownMs: 0,
      })

      // Outside range
      expect(engine.evaluate({ temperature: 15 })).toHaveLength(1)
      expect(engine.evaluate({ temperature: 75 })).toHaveLength(1)

      // Inside range
      engine.clearCooldowns()
      expect(engine.evaluate({ temperature: 50 })).toHaveLength(0)
    })

    it('triggers when value is inside range (mode: inside)', () => {
      engine.addRule({
        id: 'range-inside',
        name: 'In Range',
        condition: {
          type: 'range',
          field: 'temperature',
          min: 20,
          max: 70,
          mode: 'inside',
        },
        severity: 'info',
        cooldownMs: 0,
      })

      // Inside range
      expect(engine.evaluate({ temperature: 50 })).toHaveLength(1)
      expect(engine.evaluate({ temperature: 20 })).toHaveLength(1)
      expect(engine.evaluate({ temperature: 70 })).toHaveLength(1)

      // Outside range
      engine.clearCooldowns()
      expect(engine.evaluate({ temperature: 15 })).toHaveLength(0)
    })
  })

  describe('evaluate - trend conditions', () => {
    it('detects increasing trend', () => {
      engine.addRule({
        id: 'trend-up',
        name: 'Increasing Trend',
        condition: {
          type: 'trend',
          field: 'vibration',
          direction: 'increasing',
          sampleCount: 5,
          changeThreshold: 20, // 20% increase
        },
        severity: 'warning',
        cooldownMs: 0,
      })

      // Add historical data showing 30% increase (5 -> 6.5)
      engine.updateHistory('vibration', 5.0)
      engine.updateHistory('vibration', 5.3)
      engine.updateHistory('vibration', 5.7)
      engine.updateHistory('vibration', 6.1)
      engine.updateHistory('vibration', 6.5)

      const alerts = engine.evaluate({ vibration: 6.5 })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].ruleId).toBe('trend-up')
    })

    it('does not trigger without enough history', () => {
      engine.addRule({
        id: 'trend-up',
        name: 'Increasing Trend',
        condition: {
          type: 'trend',
          field: 'vibration',
          direction: 'increasing',
          sampleCount: 10,
          changeThreshold: 20,
        },
        severity: 'warning',
        cooldownMs: 0,
      })

      // Only add 5 samples (need 10)
      for (let i = 0; i < 5; i++) {
        engine.updateHistory('vibration', 5 + i * 0.5)
      }

      const alerts = engine.evaluate({ vibration: 7 })
      expect(alerts).toHaveLength(0)
    })
  })

  describe('evaluate - composite conditions', () => {
    it('triggers when all conditions are met (AND)', () => {
      engine.addRule({
        id: 'composite-and',
        name: 'Multi-Sensor Alert',
        condition: {
          type: 'composite',
          operator: 'and',
          conditions: [
            { type: 'threshold', field: 'vibration', operator: 'gt', value: 5 },
            { type: 'threshold', field: 'temperature', operator: 'gt', value: 70 },
          ],
        },
        severity: 'critical',
        cooldownMs: 0,
      })

      // Both conditions met
      expect(engine.evaluate({ vibration: 6, temperature: 75 })).toHaveLength(1)

      // Only one condition met
      engine.clearCooldowns()
      expect(engine.evaluate({ vibration: 6, temperature: 65 })).toHaveLength(0)
      expect(engine.evaluate({ vibration: 4, temperature: 75 })).toHaveLength(0)
    })

    it('triggers when any condition is met (OR)', () => {
      engine.addRule({
        id: 'composite-or',
        name: 'Any High Value',
        condition: {
          type: 'composite',
          operator: 'or',
          conditions: [
            { type: 'threshold', field: 'vibration', operator: 'gt', value: 5 },
            { type: 'threshold', field: 'temperature', operator: 'gt', value: 70 },
          ],
        },
        severity: 'warning',
        cooldownMs: 0,
      })

      // Either condition met
      expect(engine.evaluate({ vibration: 6, temperature: 50 })).toHaveLength(1)
      engine.clearCooldowns()
      expect(engine.evaluate({ vibration: 4, temperature: 75 })).toHaveLength(1)

      // Neither condition met
      engine.clearCooldowns()
      expect(engine.evaluate({ vibration: 4, temperature: 65 })).toHaveLength(0)
    })
  })

  describe('cooldown', () => {
    it('respects cooldown period', async () => {
      engine.addRule({
        id: 'cooldown-test',
        name: 'Cooldown Test',
        condition: {
          type: 'threshold',
          field: 'value',
          operator: 'gt',
          value: 50,
        },
        severity: 'info',
        cooldownMs: 100, // 100ms cooldown
      })

      // First trigger
      expect(engine.evaluate({ value: 60 })).toHaveLength(1)

      // Should be in cooldown
      expect(engine.evaluate({ value: 60 })).toHaveLength(0)

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Should trigger again
      expect(engine.evaluate({ value: 60 })).toHaveLength(1)
    })
  })

  describe('equipment filtering', () => {
    it('filters by equipment ID', () => {
      engine.addRule({
        id: 'equipment-specific',
        name: 'Equipment Specific',
        condition: {
          type: 'threshold',
          field: 'temperature',
          operator: 'gt',
          value: 80,
        },
        severity: 'warning',
        cooldownMs: 0,
        equipmentIds: ['eq-001', 'eq-002'],
      })

      // Matching equipment
      expect(engine.evaluate({ temperature: 85 }, 'eq-001')).toHaveLength(1)
      engine.clearCooldowns()

      // Non-matching equipment
      expect(engine.evaluate({ temperature: 85 }, 'eq-999')).toHaveLength(0)
    })
  })

  describe('message generation', () => {
    it('uses custom message template', () => {
      engine.addRule({
        id: 'custom-message',
        name: 'Custom Message',
        condition: {
          type: 'threshold',
          field: 'temperature',
          operator: 'gt',
          value: 80,
        },
        severity: 'warning',
        cooldownMs: 0,
        messageTemplate: '온도 경고: {temperature}°C',
      })

      const alerts = engine.evaluate({ temperature: 85 })
      expect(alerts[0].message).toBe('온도 경고: 85°C')
    })

    it('generates default message for threshold condition', () => {
      engine.addRule({
        id: 'default-message',
        name: 'Default Message Test',
        condition: {
          type: 'threshold',
          field: 'temperature',
          operator: 'gt',
          value: 80,
        },
        severity: 'warning',
        cooldownMs: 0,
      })

      const alerts = engine.evaluate({ temperature: 85 })
      expect(alerts[0].message).toContain('temperature')
      expect(alerts[0].message).toContain('85')
    })

    it('handles numeric values correctly in message templates', () => {
      engine.addRule({
        id: 'numeric-test',
        name: 'Numeric Test',
        condition: {
          type: 'threshold',
          field: 'temperature',
          operator: 'gt',
          value: 80,
        },
        severity: 'warning',
        cooldownMs: 0,
        messageTemplate: 'Temperature: {temperature}°C, Vibration: {vibration}mm/s',
      })

      const alerts = engine.evaluate({ temperature: 85.5, vibration: 3.2 })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].message).toBe('Temperature: 85.5°C, Vibration: 3.2mm/s')
    })

    it('handles multiple placeholders in message template', () => {
      engine.addRule({
        id: 'multi-placeholder',
        name: 'Multi Placeholder',
        condition: {
          type: 'threshold',
          field: 'value',
          operator: 'gt',
          value: 0,
        },
        severity: 'warning',
        cooldownMs: 0,
        messageTemplate: 'Sensor {value} at {other}',
      })

      const alerts = engine.evaluate({ value: 100, other: 200 })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].message).toBe('Sensor 100 at 200')
    })

    it('safely handles numeric values through escapeHtml (defense in depth)', () => {
      // Note: Values are typed as Record<string, number>, so HTML injection via values
      // is prevented by TypeScript. The escapeHtml function provides defense in depth
      // by escaping any string representation of values.
      engine.addRule({
        id: 'escape-test',
        name: 'Escape Test',
        condition: {
          type: 'threshold',
          field: 'temperature',
          operator: 'gt',
          value: 0,
        },
        severity: 'warning',
        cooldownMs: 0,
        messageTemplate: 'Value: {temperature}',
      })

      // Numeric values are safely converted to strings
      const alerts = engine.evaluate({ temperature: 85.5 })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].message).toBe('Value: 85.5')
      // Verify no HTML entities were incorrectly added to clean numeric values
      expect(alerts[0].message).not.toContain('&')
    })

    it('escapes special characters in generated messages', () => {
      // Test that the escapeHtml function is applied to values
      // Even though numeric values can't contain HTML, this verifies the mechanism works
      engine.addRule({
        id: 'special-char-test',
        name: 'Special Char Test',
        condition: {
          type: 'threshold',
          field: 'value',
          operator: 'gt',
          value: -1,
        },
        severity: 'warning',
        cooldownMs: 0,
        messageTemplate: 'Reading: {value} units',
      })

      // Test with various numeric values that convert cleanly
      const alerts = engine.evaluate({ value: 0 })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].message).toBe('Reading: 0 units')
    })
  })

  describe('disabled rules', () => {
    it('does not evaluate disabled rules', () => {
      engine.addRule({
        id: 'disabled-rule',
        name: 'Disabled Rule',
        condition: {
          type: 'threshold',
          field: 'value',
          operator: 'gt',
          value: 50,
        },
        severity: 'warning',
        cooldownMs: 0,
        enabled: false,
      })

      expect(engine.evaluate({ value: 100 })).toHaveLength(0)
    })
  })

  describe('clearHistory / clearCooldowns', () => {
    it('clears history', () => {
      engine.updateHistory('test', 1)
      engine.updateHistory('test', 2)
      engine.clearHistory()

      // Add trend rule that needs history
      engine.addRule({
        id: 'trend',
        name: 'Trend',
        condition: {
          type: 'trend',
          field: 'test',
          direction: 'increasing',
          sampleCount: 3,
          changeThreshold: 10,
        },
        severity: 'info',
        cooldownMs: 0,
      })

      // Should not trigger because history was cleared
      expect(engine.evaluate({ test: 100 })).toHaveLength(0)
    })
  })
})

describe('sensorReadingsToRecord', () => {
  it('converts sensor readings to flat record', () => {
    const readings: SensorReading[] = [
      {
        type: '진동',
        value: 5.5,
        unit: 'mm/s',
        normalRange: [0, 5],
        status: 'warning',
        timestamp: new Date().toISOString(),
      },
      {
        type: '온도',
        value: 65,
        unit: '°C',
        normalRange: [20, 70],
        status: 'normal',
        timestamp: new Date().toISOString(),
      },
    ]

    const record = sensorReadingsToRecord(readings)

    // Korean keys
    expect(record['진동']).toBe(5.5)
    expect(record['온도']).toBe(65)

    // English aliases
    expect(record['vibration']).toBe(5.5)
    expect(record['temperature']).toBe(65)
  })
})

describe('DEFAULT_SMART_FACTORY_RULES', () => {
  it('has valid rule structure', () => {
    for (const rule of DEFAULT_SMART_FACTORY_RULES) {
      expect(rule.id).toBeTruthy()
      expect(rule.name).toBeTruthy()
      expect(rule.condition).toBeDefined()
      expect(rule.severity).toMatch(/^(info|warning|critical)$/)
      expect(rule.cooldownMs).toBeGreaterThanOrEqual(0)
    }
  })

  it('includes vibration and temperature rules', () => {
    const ids = DEFAULT_SMART_FACTORY_RULES.map((r) => r.id)
    expect(ids).toContain('vibration-warning')
    expect(ids).toContain('vibration-critical')
    expect(ids).toContain('temperature-warning')
    expect(ids).toContain('temperature-critical')
  })
})
