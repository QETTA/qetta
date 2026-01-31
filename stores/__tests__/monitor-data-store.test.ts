import { describe, it, expect, beforeEach } from 'vitest'
import { useMonitorDataStore, selectSelectedEquipment, selectEquipmentById, selectAlertsByEquipment, selectActiveAlerts } from '../monitor-data-store'
import type { Equipment, Alert, MonitorData } from '../monitor-data-store'

// Helper to create test equipment
function makeEquipment(overrides: Partial<Equipment> = {}): Equipment {
  return {
    id: 'eq-1',
    name: 'CNC-001',
    type: 'CNC',
    status: 'operational',
    sensors: [],
    oee: { overall: 85, availability: 90, performance: 92, quality: 98 },
    lastChecked: new Date().toISOString(),
    ...overrides,
  }
}

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'alert-1',
    equipmentId: 'eq-1',
    severity: 'warning',
    message: 'Temperature high',
    timestamp: new Date().toISOString(),
    acknowledged: false,
    ...overrides,
  }
}

describe('MonitorDataStore', () => {
  beforeEach(() => {
    // Reset store
    useMonitorDataStore.setState({
      equipment: [],
      alerts: [],
      summary: null,
      selectedEquipmentId: null,
      error: null,
      isConnected: false,
    })
  })

  describe('fullSync', () => {
    it('sets equipment, alerts, and summary', () => {
      const data: MonitorData = {
        equipment: [makeEquipment()],
        alerts: [makeAlert()],
        summary: {
          totalEquipment: 1,
          operational: 1,
          maintenance: 0,
          offline: 0,
          error: 0,
          avgOEE: 85,
          activeAlerts: 1,
          critical: 0,
          warning: 1,
        },
      }

      useMonitorDataStore.getState().fullSync(data)

      const state = useMonitorDataStore.getState()
      expect(state.equipment).toHaveLength(1)
      expect(state.alerts).toHaveLength(1)
      expect(state.summary!.totalEquipment).toBe(1)
    })
  })

  describe('updateSensorData', () => {
    it('updates sensors for matching equipment', () => {
      useMonitorDataStore.setState({
        equipment: [makeEquipment({ id: 'eq-1' })],
      })

      const newSensors = [
        { id: 's1', name: 'Temp', value: 45, unit: '°C', status: 'normal' as const },
      ]

      useMonitorDataStore.getState().updateSensorData('eq-1', newSensors)

      const eq = useMonitorDataStore.getState().equipment[0]
      expect(eq.sensors).toHaveLength(1)
      expect(eq.sensors[0].value).toBe(45)
    })

    it('sets status to error when any sensor is critical', () => {
      useMonitorDataStore.setState({
        equipment: [makeEquipment({ id: 'eq-1', status: 'operational' })],
      })

      const sensors = [
        { id: 's1', name: 'Temp', value: 120, unit: '°C', status: 'critical' as const },
      ]

      useMonitorDataStore.getState().updateSensorData('eq-1', sensors)

      expect(useMonitorDataStore.getState().equipment[0].status).toBe('error')
    })

    it('sets status to maintenance when any sensor is warning', () => {
      useMonitorDataStore.setState({
        equipment: [makeEquipment({ id: 'eq-1', status: 'operational' })],
      })

      const sensors = [
        { id: 's1', name: 'Temp', value: 80, unit: '°C', status: 'warning' as const },
      ]

      useMonitorDataStore.getState().updateSensorData('eq-1', sensors)

      expect(useMonitorDataStore.getState().equipment[0].status).toBe('maintenance')
    })

    it('does not change status for unmatched equipment', () => {
      useMonitorDataStore.setState({
        equipment: [makeEquipment({ id: 'eq-1' }), makeEquipment({ id: 'eq-2' })],
      })

      useMonitorDataStore.getState().updateSensorData('eq-1', [])

      const eq2 = useMonitorDataStore.getState().equipment[1]
      expect(eq2.status).toBe('operational')
    })
  })

  describe('updateOEE', () => {
    it('updates OEE for matching equipment', () => {
      useMonitorDataStore.setState({
        equipment: [makeEquipment({ id: 'eq-1' })],
        summary: {
          totalEquipment: 1, operational: 1, maintenance: 0,
          offline: 0, error: 0, avgOEE: 85, activeAlerts: 0, critical: 0, warning: 0,
        },
      })

      const newOEE = { overall: 90, availability: 95, performance: 93, quality: 99 }
      useMonitorDataStore.getState().updateOEE('eq-1', newOEE)

      const eq = useMonitorDataStore.getState().equipment[0]
      expect(eq.oee.overall).toBe(90)
    })

    it('recalculates summary avgOEE', () => {
      useMonitorDataStore.setState({
        equipment: [
          makeEquipment({ id: 'eq-1', oee: { overall: 80, availability: 85, performance: 90, quality: 95 } }),
          makeEquipment({ id: 'eq-2', oee: { overall: 90, availability: 95, performance: 93, quality: 99 } }),
        ],
        summary: {
          totalEquipment: 2, operational: 2, maintenance: 0,
          offline: 0, error: 0, avgOEE: 85, activeAlerts: 0, critical: 0, warning: 0,
        },
      })

      useMonitorDataStore.getState().updateOEE('eq-1', { overall: 70, availability: 75, performance: 80, quality: 85 })

      const summary = useMonitorDataStore.getState().summary!
      // (70 + 90) / 2 = 80
      expect(summary.avgOEE).toBe(80)
    })
  })

  describe('addAlert', () => {
    it('adds alert to the front', () => {
      useMonitorDataStore.setState({
        alerts: [makeAlert({ id: 'old' })],
        summary: {
          totalEquipment: 1, operational: 1, maintenance: 0,
          offline: 0, error: 0, avgOEE: 85, activeAlerts: 1, critical: 0, warning: 1,
        },
      })

      useMonitorDataStore.getState().addAlert(makeAlert({ id: 'new' }))

      const alerts = useMonitorDataStore.getState().alerts
      expect(alerts[0].id).toBe('new')
      expect(alerts).toHaveLength(2)
    })

    it('limits alerts to 100', () => {
      const existing = Array.from({ length: 100 }, (_, i) => makeAlert({ id: `a-${i}` }))
      useMonitorDataStore.setState({ alerts: existing, summary: null })

      useMonitorDataStore.getState().addAlert(makeAlert({ id: 'overflow' }))

      expect(useMonitorDataStore.getState().alerts).toHaveLength(100)
      expect(useMonitorDataStore.getState().alerts[0].id).toBe('overflow')
    })

    it('increments summary activeAlerts', () => {
      useMonitorDataStore.setState({
        alerts: [],
        summary: {
          totalEquipment: 1, operational: 1, maintenance: 0,
          offline: 0, error: 0, avgOEE: 85, activeAlerts: 0, critical: 0, warning: 0,
        },
      })

      useMonitorDataStore.getState().addAlert(makeAlert())
      expect(useMonitorDataStore.getState().summary!.activeAlerts).toBe(1)
    })
  })

  describe('acknowledgeAlert', () => {
    it('marks alert as acknowledged', () => {
      useMonitorDataStore.setState({
        alerts: [makeAlert({ id: 'a1', acknowledged: false })],
      })

      useMonitorDataStore.getState().acknowledgeAlert('a1')

      expect(useMonitorDataStore.getState().alerts[0].acknowledged).toBe(true)
    })
  })

  describe('selectors', () => {
    it('selectSelectedEquipment returns matched equipment', () => {
      const eq = makeEquipment({ id: 'eq-sel' })
      const state = {
        ...useMonitorDataStore.getState(),
        equipment: [eq],
        selectedEquipmentId: 'eq-sel',
      }

      expect(selectSelectedEquipment(state)?.id).toBe('eq-sel')
    })

    it('selectSelectedEquipment returns null when no match', () => {
      const state = {
        ...useMonitorDataStore.getState(),
        equipment: [],
        selectedEquipmentId: 'missing',
      }

      expect(selectSelectedEquipment(state)).toBeNull()
    })

    it('selectEquipmentById returns correct equipment', () => {
      const eq = makeEquipment({ id: 'eq-by-id' })
      const state = { ...useMonitorDataStore.getState(), equipment: [eq] }

      expect(selectEquipmentById('eq-by-id')(state)?.id).toBe('eq-by-id')
      expect(selectEquipmentById('missing')(state)).toBeNull()
    })

    it('selectAlertsByEquipment filters correctly', () => {
      const alerts = [
        makeAlert({ id: 'a1', equipmentId: 'eq-1' }),
        makeAlert({ id: 'a2', equipmentId: 'eq-2' }),
        makeAlert({ id: 'a3', equipmentId: 'eq-1' }),
      ]
      const state = { ...useMonitorDataStore.getState(), alerts }

      expect(selectAlertsByEquipment('eq-1')(state)).toHaveLength(2)
      expect(selectAlertsByEquipment('eq-2')(state)).toHaveLength(1)
    })

    it('selectActiveAlerts filters unacknowledged', () => {
      const alerts = [
        makeAlert({ id: 'a1', acknowledged: false }),
        makeAlert({ id: 'a2', acknowledged: true }),
        makeAlert({ id: 'a3', acknowledged: false }),
      ]
      const state = { ...useMonitorDataStore.getState(), alerts }

      expect(selectActiveAlerts(state)).toHaveLength(2)
    })
  })

  describe('connection state', () => {
    it('setConnectionStatus updates state', () => {
      useMonitorDataStore.getState().setConnectionStatus(true)
      expect(useMonitorDataStore.getState().isConnected).toBe(true)

      useMonitorDataStore.getState().setConnectionStatus(false)
      expect(useMonitorDataStore.getState().isConnected).toBe(false)
    })

    it('setError updates error state', () => {
      useMonitorDataStore.getState().setError('connection lost')
      expect(useMonitorDataStore.getState().error).toBe('connection lost')

      useMonitorDataStore.getState().setError(null)
      expect(useMonitorDataStore.getState().error).toBeNull()
    })
  })

  describe('setSelectedEquipment', () => {
    it('updates selectedEquipmentId', () => {
      useMonitorDataStore.getState().setSelectedEquipment('eq-123')
      expect(useMonitorDataStore.getState().selectedEquipmentId).toBe('eq-123')
    })

    it('clears selectedEquipmentId when null', () => {
      useMonitorDataStore.getState().setSelectedEquipment('eq-123')
      useMonitorDataStore.getState().setSelectedEquipment(null)
      expect(useMonitorDataStore.getState().selectedEquipmentId).toBeNull()
    })
  })

  describe('performance timing', () => {
    it('updateSensorData accepts optional receiveTime', () => {
      useMonitorDataStore.setState({
        equipment: [makeEquipment({ id: 'eq-1' })],
      })

      const receiveTime = performance.now()
      // This exercises the receiveTime logging path
      useMonitorDataStore.getState().updateSensorData('eq-1', [], receiveTime)

      const eq = useMonitorDataStore.getState().equipment[0]
      expect(eq.sensors).toEqual([])
    })

    it('updateOEE accepts optional receiveTime', () => {
      useMonitorDataStore.setState({
        equipment: [makeEquipment({ id: 'eq-1' })],
        summary: {
          totalEquipment: 1, operational: 1, maintenance: 0,
          offline: 0, error: 0, avgOEE: 85, activeAlerts: 0, critical: 0, warning: 0,
        },
      })

      const receiveTime = performance.now()
      const newOEE = { overall: 88, availability: 92, performance: 94, quality: 99 }
      // This exercises the receiveTime logging path
      useMonitorDataStore.getState().updateOEE('eq-1', newOEE, receiveTime)

      const eq = useMonitorDataStore.getState().equipment[0]
      expect(eq.oee.overall).toBe(88)
    })
  })
})
