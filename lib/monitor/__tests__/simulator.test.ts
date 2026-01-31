/**
 * Simulator Unit Tests
 *
 * Tests for sensor data generation, equipment simulation, and alert generation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getSensorStatus,
  generateSensors,
  generateEquipmentData,
  generateAlerts,
  generateAgentAnalysis,
  generateMonitorData,
  updateEquipmentSensors,
  EQUIPMENT_DATA,
} from '../simulator'
import type { Equipment, EquipmentStatus } from '@/types/monitor'

describe('getSensorStatus', () => {
  const normalRange: [number, number] = [20, 70]

  it('returns normal when value is within range', () => {
    expect(getSensorStatus(45, normalRange)).toBe('normal')
    expect(getSensorStatus(20, normalRange)).toBe('normal')
    expect(getSensorStatus(70, normalRange)).toBe('normal')
  })

  it('returns warning when value is slightly outside range', () => {
    // Warning buffer is 10% of range (50 * 0.1 = 5)
    // So warning zone is: 15-20 and 70-75
    expect(getSensorStatus(72, normalRange)).toBe('warning')
    expect(getSensorStatus(18, normalRange)).toBe('warning')
  })

  it('returns critical when value is far outside range', () => {
    // Critical is beyond warning buffer
    expect(getSensorStatus(80, normalRange)).toBe('critical')
    expect(getSensorStatus(10, normalRange)).toBe('critical')
    expect(getSensorStatus(95, normalRange)).toBe('critical')
  })

  it('handles edge cases', () => {
    // Exactly at boundary
    expect(getSensorStatus(20, normalRange)).toBe('normal')
    expect(getSensorStatus(70, normalRange)).toBe('normal')

    // Just outside boundary (should be warning)
    expect(getSensorStatus(70.1, normalRange)).toBe('warning')
    expect(getSensorStatus(19.9, normalRange)).toBe('warning')
  })

  it('works with different ranges', () => {
    const vibrationRange: [number, number] = [0, 5]
    expect(getSensorStatus(3, vibrationRange)).toBe('normal')
    expect(getSensorStatus(5.3, vibrationRange)).toBe('warning')
    expect(getSensorStatus(6, vibrationRange)).toBe('critical')
  })
})

describe('generateSensors', () => {
  it('generates 4 sensor readings', () => {
    const sensors = generateSensors('normal')
    expect(sensors).toHaveLength(4)
  })

  it('includes all sensor types', () => {
    const sensors = generateSensors('normal')
    const types = sensors.map((s) => s.type)

    expect(types).toContain('진동')
    expect(types).toContain('온도')
    expect(types).toContain('전류')
    expect(types).toContain('소음')
  })

  it('includes proper units', () => {
    const sensors = generateSensors('normal')
    const unitMap = sensors.reduce(
      (acc, s) => ({ ...acc, [s.type]: s.unit }),
      {} as Record<string, string>
    )

    expect(unitMap['진동']).toBe('mm/s')
    expect(unitMap['온도']).toBe('°C')
    expect(unitMap['전류']).toBe('A')
    expect(unitMap['소음']).toBe('dB')
  })

  it('generates normal values for normal status', () => {
    const sensors = generateSensors('normal')
    const vibration = sensors.find((s) => s.type === '진동')
    const temp = sensors.find((s) => s.type === '온도')

    // Normal vibration should be 2-4.5 mm/s
    expect(vibration?.value).toBeGreaterThanOrEqual(2)
    expect(vibration?.value).toBeLessThan(5)

    // Normal temperature should be 45-65°C
    expect(temp?.value).toBeGreaterThanOrEqual(45)
    expect(temp?.value).toBeLessThan(70)
  })

  it('generates elevated values for warning status', () => {
    const sensors = generateSensors('warning')
    const vibration = sensors.find((s) => s.type === '진동')

    // Warning vibration should be 5.5-7 mm/s
    expect(vibration?.value).toBeGreaterThanOrEqual(5.5)
    expect(vibration?.value).toBeLessThan(8)
  })

  it('generates critical values for critical status', () => {
    const sensors = generateSensors('critical')
    const vibration = sensors.find((s) => s.type === '진동')
    const temp = sensors.find((s) => s.type === '온도')

    // Critical vibration should be 8.5+ mm/s
    expect(vibration?.value).toBeGreaterThanOrEqual(8.5)

    // Critical temperature should be 85+ °C
    expect(temp?.value).toBeGreaterThanOrEqual(85)
  })

  it('generates zero/minimal values for maintenance status', () => {
    const sensors = generateSensors('maintenance')
    const vibration = sensors.find((s) => s.type === '진동')
    const temp = sensors.find((s) => s.type === '온도')
    const current = sensors.find((s) => s.type === '전류')

    expect(vibration?.value).toBe(0)
    expect(temp?.value).toBe(25)
    expect(current?.value).toBe(0)
  })

  it('includes timestamps', () => {
    const sensors = generateSensors('normal')

    sensors.forEach((sensor) => {
      expect(sensor.timestamp).toBeDefined()
      expect(new Date(sensor.timestamp).getTime()).not.toBeNaN()
    })
  })

  it('calculates status based on values', () => {
    const sensors = generateSensors('critical')
    const vibration = sensors.find((s) => s.type === '진동')

    // Critical vibration should have critical status
    expect(vibration?.status).toBe('critical')
  })
})

describe('generateEquipmentData', () => {
  it('generates all equipment from EQUIPMENT_DATA', () => {
    const equipment = generateEquipmentData()
    expect(equipment).toHaveLength(EQUIPMENT_DATA.length)
  })

  it('includes sensors and OEE for each equipment', () => {
    const equipment = generateEquipmentData()

    equipment.forEach((eq) => {
      expect(eq.sensors).toBeDefined()
      expect(eq.sensors.length).toBeGreaterThan(0)
      expect(eq.oee).toBeDefined()
      expect(eq.oee.overall).toBeDefined()
      expect(eq.oee.availability).toBeDefined()
      expect(eq.oee.performance).toBeDefined()
      expect(eq.oee.quality).toBeDefined()
    })
  })

  it('sets alert counts based on status', () => {
    const equipment = generateEquipmentData()

    const critical = equipment.find((eq) => eq.status === 'critical')
    const warning = equipment.find((eq) => eq.status === 'warning')
    const normal = equipment.find((eq) => eq.status === 'normal')

    expect(critical?.alertCount).toBe(3)
    expect(warning?.alertCount).toBe(1)
    expect(normal?.alertCount).toBe(0)
  })

  it('includes timestamps for lastChecked and nextMaintenance', () => {
    const equipment = generateEquipmentData()

    equipment.forEach((eq) => {
      expect(eq.lastChecked).toBeDefined()
      expect(new Date(eq.lastChecked).getTime()).not.toBeNaN()
      expect(eq.nextMaintenance).toBeDefined()
      expect(new Date(eq.nextMaintenance).getTime()).not.toBeNaN()
    })
  })
})

describe('updateEquipmentSensors', () => {
  it('returns updated equipment with new sensor values', async () => {
    const equipment = generateEquipmentData()[0]

    // Wait a small amount to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10))

    const updated = updateEquipmentSensors(equipment)

    expect(updated.id).toBe(equipment.id)
    expect(updated.sensors).toBeDefined()
    expect(updated.sensors).toHaveLength(4)
    // Verify structure is correct
    expect(updated.sensors[0].type).toBeDefined()
    expect(updated.sensors[0].value).toBeDefined()
    expect(updated.sensors[0].timestamp).toBeDefined()
  })

  it('preserves equipment metadata', () => {
    const equipment = generateEquipmentData()[0]
    const updated = updateEquipmentSensors(equipment)

    expect(updated.name).toBe(equipment.name)
    expect(updated.code).toBe(equipment.code)
    expect(updated.status).toBe(equipment.status)
    expect(updated.location).toBe(equipment.location)
  })
})

describe('generateAlerts', () => {
  it('generates alerts for critical equipment', () => {
    const equipment = generateEquipmentData()
    const alerts = generateAlerts(equipment)

    const criticalAlerts = alerts.filter((a) => a.severity === 'critical')
    expect(criticalAlerts.length).toBeGreaterThan(0)
  })

  it('generates alerts for warning equipment', () => {
    const equipment = generateEquipmentData()
    const alerts = generateAlerts(equipment)

    const warningAlerts = alerts.filter((a) => a.severity === 'warning')
    expect(warningAlerts.length).toBeGreaterThan(0)
  })

  it('generates info alerts for maintenance equipment', () => {
    const equipment = generateEquipmentData()
    const alerts = generateAlerts(equipment)

    const infoAlerts = alerts.filter((a) => a.severity === 'info')
    expect(infoAlerts.length).toBeGreaterThan(0)
  })

  it('sorts alerts by timestamp (newest first)', () => {
    const equipment = generateEquipmentData()
    const alerts = generateAlerts(equipment)

    for (let i = 1; i < alerts.length; i++) {
      const prev = new Date(alerts[i - 1].timestamp).getTime()
      const curr = new Date(alerts[i].timestamp).getTime()
      expect(prev).toBeGreaterThanOrEqual(curr)
    }
  })

  it('includes equipment information in alerts', () => {
    const equipment = generateEquipmentData()
    const alerts = generateAlerts(equipment)

    alerts.forEach((alert) => {
      expect(alert.equipmentId).toBeDefined()
      expect(alert.equipmentName).toBeDefined()
      expect(alert.message).toBeDefined()
    })
  })

  it('sets acknowledged status appropriately', () => {
    const equipment = generateEquipmentData()
    const alerts = generateAlerts(equipment)

    const criticalAlerts = alerts.filter((a) => a.severity === 'critical')
    const warningAlerts = alerts.filter((a) => a.severity === 'warning')

    // Critical alerts should be unacknowledged
    criticalAlerts.forEach((alert) => {
      expect(alert.acknowledged).toBe(false)
    })

    // Warning alerts should be acknowledged
    warningAlerts.forEach((alert) => {
      expect(alert.acknowledged).toBe(true)
    })
  })
})

describe('generateAgentAnalysis', () => {
  it('generates analysis for critical equipment first', () => {
    const equipment = generateEquipmentData()
    const analysis = generateAgentAnalysis(equipment)

    const criticalEquipment = equipment.find((eq) => eq.status === 'critical')
    expect(analysis.equipmentId).toBe(criticalEquipment?.id)
  })

  it('includes messages and recommendations', () => {
    const equipment = generateEquipmentData()
    const analysis = generateAgentAnalysis(equipment)

    expect(analysis.messages).toBeDefined()
    expect(analysis.messages.length).toBeGreaterThan(0)
    expect(analysis.recommendations).toBeDefined()
    expect(analysis.recommendations.length).toBeGreaterThan(0)
  })

  it('includes confidence score', () => {
    const equipment = generateEquipmentData()
    const analysis = generateAgentAnalysis(equipment)

    expect(analysis.confidence).toBeDefined()
    expect(analysis.confidence).toBeGreaterThan(0)
    expect(analysis.confidence).toBeLessThanOrEqual(100)
  })

  it('includes analysis timestamp', () => {
    const equipment = generateEquipmentData()
    const analysis = generateAgentAnalysis(equipment)

    expect(analysis.analyzedAt).toBeDefined()
    expect(new Date(analysis.analyzedAt).getTime()).not.toBeNaN()
  })
})

describe('generateMonitorData', () => {
  it('generates complete monitor data structure', () => {
    const data = generateMonitorData()

    expect(data.equipment).toBeDefined()
    expect(data.alerts).toBeDefined()
    expect(data.agentAnalysis).toBeDefined()
    expect(data.summary).toBeDefined()
  })

  it('includes accurate summary counts', () => {
    const data = generateMonitorData()

    const criticalCount = data.equipment.filter(
      (eq) => eq.status === 'critical'
    ).length
    const warningCount = data.equipment.filter(
      (eq) => eq.status === 'warning'
    ).length
    const maintenanceCount = data.equipment.filter(
      (eq) => eq.status === 'maintenance'
    ).length
    const normalCount = data.equipment.filter(
      (eq) => eq.status === 'normal'
    ).length

    expect(data.summary.totalEquipment).toBe(data.equipment.length)
    expect(data.summary.critical).toBe(criticalCount)
    expect(data.summary.warning).toBe(warningCount)
    expect(data.summary.maintenance).toBe(maintenanceCount)
    expect(data.summary.operational).toBe(normalCount)
  })

  it('calculates average OEE', () => {
    const data = generateMonitorData()

    const manualAvg = Math.round(
      data.equipment.reduce((acc, eq) => acc + eq.oee.overall, 0) /
        data.equipment.length
    )

    expect(data.summary.avgOEE).toBe(manualAvg)
  })

  it('counts active (unacknowledged) alerts', () => {
    const data = generateMonitorData()

    const activeAlerts = data.alerts.filter((a) => !a.acknowledged).length
    expect(data.summary.activeAlerts).toBe(activeAlerts)
  })
})

describe('EQUIPMENT_DATA constant', () => {
  it('has unique IDs', () => {
    const ids = EQUIPMENT_DATA.map((eq) => eq.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('has all required fields', () => {
    EQUIPMENT_DATA.forEach((eq) => {
      expect(eq.id).toBeDefined()
      expect(eq.name).toBeDefined()
      expect(eq.code).toBeDefined()
      expect(eq.status).toBeDefined()
      expect(eq.location).toBeDefined()
      expect(eq.operator).toBeDefined()
    })
  })

  it('includes various equipment statuses', () => {
    const statuses = EQUIPMENT_DATA.map((eq) => eq.status)
    expect(statuses).toContain('normal')
    expect(statuses).toContain('warning')
    expect(statuses).toContain('critical')
    expect(statuses).toContain('maintenance')
  })
})
