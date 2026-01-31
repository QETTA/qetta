/**
 * Validation Schemas Tests
 */

import { describe, it, expect } from 'vitest'
import {
  EquipmentIdSchema,
  FlexibleEquipmentIdSchema,
  SensorTypeSchema,
  SensorReadingSchema,
  SensorDataInputSchema,
  AlertRuleSchema,
  AlertConditionSchema,
  EquipmentSchema,
  validateWithErrors,
} from '../schemas'

describe('EquipmentIdSchema', () => {
  it('should accept valid equipment IDs', () => {
    expect(EquipmentIdSchema.safeParse('eq-001').success).toBe(true)
    expect(EquipmentIdSchema.safeParse('eq-042').success).toBe(true)
    expect(EquipmentIdSchema.safeParse('eq-999').success).toBe(true)
  })

  it('should reject invalid equipment IDs', () => {
    expect(EquipmentIdSchema.safeParse('eq-1').success).toBe(false)
    expect(EquipmentIdSchema.safeParse('eq-0001').success).toBe(false)
    expect(EquipmentIdSchema.safeParse('EQ-001').success).toBe(false)
    expect(EquipmentIdSchema.safeParse('equipment-001').success).toBe(false)
    expect(EquipmentIdSchema.safeParse('').success).toBe(false)
  })
})

describe('FlexibleEquipmentIdSchema', () => {
  it('should accept various valid formats', () => {
    expect(FlexibleEquipmentIdSchema.safeParse('eq-001').success).toBe(true)
    expect(FlexibleEquipmentIdSchema.safeParse('PUMP-01').success).toBe(true)
    expect(FlexibleEquipmentIdSchema.safeParse('sensor_alpha').success).toBe(true)
    expect(FlexibleEquipmentIdSchema.safeParse('a').success).toBe(true)
  })

  it('should reject invalid formats', () => {
    expect(FlexibleEquipmentIdSchema.safeParse('').success).toBe(false)
    expect(FlexibleEquipmentIdSchema.safeParse('-start').success).toBe(false)
    expect(FlexibleEquipmentIdSchema.safeParse('_start').success).toBe(false)
    expect(FlexibleEquipmentIdSchema.safeParse('has space').success).toBe(false)
    expect(FlexibleEquipmentIdSchema.safeParse('a'.repeat(51)).success).toBe(false)
  })
})

describe('SensorTypeSchema', () => {
  it('should accept valid sensor types', () => {
    expect(SensorTypeSchema.safeParse('temperature').success).toBe(true)
    expect(SensorTypeSchema.safeParse('vibration').success).toBe(true)
    expect(SensorTypeSchema.safeParse('current').success).toBe(true)
    expect(SensorTypeSchema.safeParse('noise').success).toBe(true)
  })

  it('should reject invalid sensor types', () => {
    expect(SensorTypeSchema.safeParse('humidity').success).toBe(false)
    expect(SensorTypeSchema.safeParse('TEMPERATURE').success).toBe(false)
    expect(SensorTypeSchema.safeParse('').success).toBe(false)
  })
})

describe('SensorReadingSchema', () => {
  it('should validate complete sensor reading', () => {
    const validReading = {
      type: 'Temperature',
      value: 45.5,
      unit: '°C',
      normalRange: [20, 70] as [number, number],
      status: 'normal',
      timestamp: '2024-01-01T12:00:00Z',
    }
    expect(SensorReadingSchema.safeParse(validReading).success).toBe(true)
  })

  it('should reject invalid value range', () => {
    const invalidReading = {
      type: 'Temperature',
      value: 50000, // Exceeds max
      unit: '°C',
      normalRange: [20, 70],
      status: 'normal',
      timestamp: '2024-01-01T12:00:00Z',
    }
    expect(SensorReadingSchema.safeParse(invalidReading).success).toBe(false)
  })

  it('should reject invalid status', () => {
    const invalidReading = {
      type: 'Temperature',
      value: 45,
      unit: '°C',
      normalRange: [20, 70],
      status: 'invalid',
      timestamp: '2024-01-01T12:00:00Z',
    }
    expect(SensorReadingSchema.safeParse(invalidReading).success).toBe(false)
  })
})

describe('SensorDataInputSchema', () => {
  it('should validate incoming sensor data', () => {
    const validInput = {
      equipmentId: 'eq-001',
      sensorType: 'temperature',
      value: 45.5,
    }
    expect(SensorDataInputSchema.safeParse(validInput).success).toBe(true)
  })

  it('should allow optional timestamp', () => {
    const withTimestamp = {
      equipmentId: 'eq-001',
      sensorType: 'temperature',
      value: 45.5,
      timestamp: '2024-01-01T12:00:00Z',
    }
    expect(SensorDataInputSchema.safeParse(withTimestamp).success).toBe(true)
  })

  it('should reject invalid sensor type', () => {
    const invalidInput = {
      equipmentId: 'eq-001',
      sensorType: 'humidity',
      value: 45.5,
    }
    expect(SensorDataInputSchema.safeParse(invalidInput).success).toBe(false)
  })
})

describe('AlertConditionSchema', () => {
  it('should validate threshold condition', () => {
    const threshold = {
      type: 'threshold',
      field: 'temperature',
      operator: 'gt',
      value: 80,
    }
    expect(AlertConditionSchema.safeParse(threshold).success).toBe(true)
  })

  it('should validate range condition', () => {
    const range = {
      type: 'range',
      field: 'temperature',
      min: 20,
      max: 70,
      mode: 'outside',
    }
    expect(AlertConditionSchema.safeParse(range).success).toBe(true)
  })

  it('should validate trend condition', () => {
    const trend = {
      type: 'trend',
      field: 'vibration',
      direction: 'increasing',
      sampleCount: 10,
      changeThreshold: 20,
    }
    expect(AlertConditionSchema.safeParse(trend).success).toBe(true)
  })

  it('should validate composite condition', () => {
    const composite = {
      type: 'composite',
      operator: 'and',
      conditions: [
        { type: 'threshold', field: 'vibration', operator: 'gt', value: 5 },
        { type: 'threshold', field: 'temperature', operator: 'gt', value: 70 },
      ],
    }
    expect(AlertConditionSchema.safeParse(composite).success).toBe(true)
  })

  it('should reject invalid operator', () => {
    const invalid = {
      type: 'threshold',
      field: 'temperature',
      operator: 'invalid',
      value: 80,
    }
    expect(AlertConditionSchema.safeParse(invalid).success).toBe(false)
  })
})

describe('AlertRuleSchema', () => {
  it('should validate complete alert rule', () => {
    const validRule = {
      id: 'temp-warning',
      name: 'Temperature Warning',
      description: 'Alerts when temperature exceeds threshold',
      condition: {
        type: 'threshold',
        field: 'temperature',
        operator: 'gt',
        value: 80,
      },
      severity: 'warning',
      cooldownMs: 60000,
      enabled: true,
    }
    expect(AlertRuleSchema.safeParse(validRule).success).toBe(true)
  })

  it('should reject rule ID with invalid characters', () => {
    const invalidRule = {
      id: 'Temp_Warning!', // Invalid: uppercase and special chars
      name: 'Temperature Warning',
      condition: { type: 'threshold', field: 'temp', operator: 'gt', value: 80 },
      severity: 'warning',
      cooldownMs: 60000,
    }
    expect(AlertRuleSchema.safeParse(invalidRule).success).toBe(false)
  })

  it('should reject message template with script tags', () => {
    const maliciousRule = {
      id: 'test-rule',
      name: 'Test Rule',
      condition: { type: 'threshold', field: 'temp', operator: 'gt', value: 80 },
      severity: 'warning',
      cooldownMs: 60000,
      messageTemplate: 'Alert: <script>alert("xss")</script>',
    }
    expect(AlertRuleSchema.safeParse(maliciousRule).success).toBe(false)
  })

  it('should allow safe message template', () => {
    const safeRule = {
      id: 'test-rule',
      name: 'Test Rule',
      condition: { type: 'threshold', field: 'temp', operator: 'gt', value: 80 },
      severity: 'warning',
      cooldownMs: 60000,
      messageTemplate: 'Temperature alert: {temperature}°C exceeds threshold',
    }
    expect(AlertRuleSchema.safeParse(safeRule).success).toBe(true)
  })

  it('should reject cooldown exceeding 24 hours', () => {
    const invalidRule = {
      id: 'test-rule',
      name: 'Test Rule',
      condition: { type: 'threshold', field: 'temp', operator: 'gt', value: 80 },
      severity: 'warning',
      cooldownMs: 86400001, // > 24 hours
    }
    expect(AlertRuleSchema.safeParse(invalidRule).success).toBe(false)
  })
})

describe('EquipmentSchema', () => {
  it('should validate complete equipment', () => {
    const validEquipment = {
      id: 'eq-001',
      name: 'CNC Machine 1',
      code: 'CNC-001',
      status: 'normal',
      location: 'Factory Floor A',
      operator: 'John Doe',
      operatorInitial: 'JD',
    }
    expect(EquipmentSchema.safeParse(validEquipment).success).toBe(true)
  })

  it('should reject empty name', () => {
    const invalid = {
      id: 'eq-001',
      name: '',
      code: 'CNC-001',
      status: 'normal',
      location: 'Factory Floor A',
      operator: 'John Doe',
      operatorInitial: 'JD',
    }
    expect(EquipmentSchema.safeParse(invalid).success).toBe(false)
  })
})

describe('validateWithErrors', () => {
  it('should return success with data for valid input', () => {
    const result = validateWithErrors(EquipmentIdSchema, 'eq-001')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('eq-001')
    }
  })

  it('should return errors for invalid input', () => {
    const result = validateWithErrors(EquipmentIdSchema, 'invalid')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it('should include field path in error messages', () => {
    const schema = EquipmentSchema
    const result = validateWithErrors(schema, { id: 'eq-001', name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('name'))).toBe(true)
    }
  })
})
