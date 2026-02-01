import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Types
export interface SensorReading {
  id: string
  name: string
  value: number
  unit: string
  status: 'normal' | 'warning' | 'critical'
  threshold?: { min: number; max: number }
}

export interface OEEMetrics {
  overall: number
  availability: number
  performance: number
  quality: number
}

export interface Equipment {
  id: string
  name: string
  type: string
  status: 'operational' | 'maintenance' | 'offline' | 'error'
  sensors: SensorReading[]
  oee: OEEMetrics
  lastChecked: string
  receiveTime?: number
}

export interface Alert {
  id: string
  equipmentId: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: string
  acknowledged: boolean
}

export interface MonitorSummary {
  totalEquipment: number
  operational: number
  maintenance: number
  offline: number
  error: number
  avgOEE: number
  activeAlerts: number
  critical: number
  warning: number
}

export interface MonitorData {
  equipment: Equipment[]
  alerts: Alert[]
  summary: MonitorSummary
}

// Event data types
export interface SensorUpdateData {
  equipmentId: string
  sensors: SensorReading[]
  receiveTime?: number
}

export interface OEEUpdateData {
  equipmentId: string
  oee: OEEMetrics
  receiveTime?: number
}

// Store state interface
interface MonitorDataState {
  equipment: Equipment[]
  alerts: Alert[]
  summary: MonitorSummary | null
  selectedEquipmentId: string | null
  error: string | null
  isConnected: boolean

  // Actions
  updateSensorData: (
    equipmentId: string,
    sensors: SensorReading[],
    receiveTime?: number
  ) => void
  updateOEE: (
    equipmentId: string,
    oee: OEEMetrics,
    receiveTime?: number
  ) => void
  addAlert: (alert: Alert) => void
  acknowledgeAlert: (alertId: string) => void
  fullSync: (data: MonitorData) => void
  setSelectedEquipment: (equipmentId: string | null) => void
  setConnectionStatus: (isConnected: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

// Create store with subscribeWithSelector middleware
export const useMonitorDataStore = create<MonitorDataState>()(
  subscribeWithSelector((set, _get) => ({
    // Initial state
    equipment: [],
    alerts: [],
    summary: null,
    selectedEquipmentId: null,
    error: null,
    isConnected: false,

    // Actions
    updateSensorData: (equipmentId, sensors, receiveTime) => {
      const storeUpdateTime = performance.now()
      if (receiveTime && process.env.NODE_ENV !== 'production') {
        console.log(
          `[Perf] sensor-update → store: ${(storeUpdateTime - receiveTime).toFixed(2)}ms`
        )
      }
      set((state) => ({
        equipment: state.equipment.map((eq) =>
          eq.id === equipmentId
            ? {
                ...eq,
                sensors,
                lastChecked: new Date().toISOString(),
                // Update status based on sensor readings
                status: sensors.some((s) => s.status === 'critical')
                  ? 'error'
                  : sensors.some((s) => s.status === 'warning')
                    ? 'maintenance'
                    : eq.status,
              }
            : eq
        ),
      }))
    },

    updateOEE: (equipmentId, oee, receiveTime) => {
      const storeUpdateTime = performance.now()
      if (receiveTime && process.env.NODE_ENV !== 'production') {
        console.log(
          `[Perf] oee-update → store: ${(storeUpdateTime - receiveTime).toFixed(2)}ms`
        )
      }
      set((state) => ({
        equipment: state.equipment.map((eq) =>
          eq.id === equipmentId ? { ...eq, oee, receiveTime } : eq
        ),
        // Update summary avgOEE
        summary: state.summary
          ? {
              ...state.summary,
              avgOEE:
                state.equipment.reduce((sum, eq) => {
                  if (eq.id === equipmentId) return sum + oee.overall
                  return sum + eq.oee.overall
                }, 0) / state.equipment.length,
            }
          : null,
      }))
    },

    addAlert: (alert) =>
      set((state) => ({
        alerts: [alert, ...state.alerts].slice(0, 100), // Keep last 100 alerts
        summary: state.summary
          ? {
              ...state.summary,
              activeAlerts: state.summary.activeAlerts + 1,
            }
          : null,
      })),

    acknowledgeAlert: (alertId) =>
      set((state) => ({
        alerts: state.alerts.map((alert) =>
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        ),
      })),

    fullSync: (data) =>
      set({
        equipment: data.equipment,
        alerts: data.alerts,
        summary: data.summary,
      }),

    setSelectedEquipment: (equipmentId) =>
      set({ selectedEquipmentId: equipmentId }),

    setConnectionStatus: (isConnected) => set({ isConnected }),

    setError: (error) => set({ error }),

    reset: () =>
      set({
        equipment: [],
        alerts: [],
        summary: null,
        selectedEquipmentId: null,
        error: null,
        isConnected: false,
      }),
  }))
)

// Selectors for performance optimization
export const selectSelectedEquipment = (state: MonitorDataState) =>
  state.equipment.find((eq) => eq.id === state.selectedEquipmentId) || null

export const selectEquipmentById =
  (equipmentId: string) => (state: MonitorDataState) =>
    state.equipment.find((eq) => eq.id === equipmentId) || null

export const selectAlertsByEquipment =
  (equipmentId: string) => (state: MonitorDataState) =>
    state.alerts.filter((alert) => alert.equipmentId === equipmentId)

export const selectActiveAlerts = (state: MonitorDataState) =>
  state.alerts.filter((alert) => !alert.acknowledged)
