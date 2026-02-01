import { useEffect, useRef } from 'react'
import { useMonitorDataStore } from '@/stores/monitor-data-store'
import { clientLogger } from '@/lib/logger/client'
import type {
  SensorUpdateData,
  OEEUpdateData,
  MonitorData,
  Alert,
} from '@/stores/monitor-data-store'

const SSE_ENDPOINT = '/api/monitor/stream'
const MAX_RECONNECT_DELAY = 30000 // 30 seconds
const BASE_RECONNECT_DELAY = 1000 // 1 second
const MAX_RECONNECT_ATTEMPTS = 10 // Stop retrying after 10 attempts

interface MonitorEvent {
  type: 'sensor-update' | 'oee-update' | 'alert' | 'full-sync' | 'heartbeat'
  timestamp: string
  data: SensorUpdateData | OEEUpdateData | Alert | MonitorData | null
}

/**
 * Custom hook for managing SSE connection to monitor data stream
 * Features:
 * - Exponential backoff reconnection (1s, 2s, 4s, 8s, ..., max 30s)
 * - Automatic cleanup on unmount (including store reset)
 * - Error handling and status reporting
 * - Uses getState() for actions to avoid unnecessary re-renders
 */
export function useMonitorSSE() {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  useEffect(() => {
    // Use getState() for actions — stable references, no re-render dependency
    const store = useMonitorDataStore.getState

    const connect = () => {
      try {
        const eventSource = new EventSource(SSE_ENDPOINT)
        eventSourceRef.current = eventSource

        // Sensor update events
        eventSource.addEventListener('sensor-update', (event) => {
          try {
            const receiveTime = performance.now()
            const data: MonitorEvent = JSON.parse(event.data)
            const { equipmentId, sensors } = data.data as SensorUpdateData
            store().updateSensorData(equipmentId, sensors, receiveTime)
          } catch (err) {
            clientLogger.error('[SSE] sensor-update parse error:', err)
          }
        })

        // OEE update events
        eventSource.addEventListener('oee-update', (event) => {
          try {
            const receiveTime = performance.now()
            const data: MonitorEvent = JSON.parse(event.data)
            const { equipmentId, oee } = data.data as OEEUpdateData
            store().updateOEE(equipmentId, oee, receiveTime)
          } catch (err) {
            clientLogger.error('[SSE] oee-update parse error:', err)
          }
        })

        // Alert events
        eventSource.addEventListener('alert', (event) => {
          try {
            const data: MonitorEvent = JSON.parse(event.data)
            const alert = data.data as Alert
            store().addAlert(alert)
          } catch (err) {
            clientLogger.error('[SSE] alert parse error:', err)
          }
        })

        // Full sync events (initial data + periodic sync)
        eventSource.addEventListener('full-sync', (event) => {
          try {
            const data: MonitorEvent = JSON.parse(event.data)
            store().fullSync(data.data as MonitorData)
          } catch (err) {
            clientLogger.error('[SSE] full-sync parse error:', err)
          }
        })

        // Heartbeat events (connection keep-alive)
        eventSource.addEventListener('heartbeat', (event) => {
          try {
            void JSON.parse(event.data)
          } catch (err) {
            clientLogger.error('[SSE] heartbeat parse error:', err)
          }
        })

        // Connection opened
        eventSource.onopen = () => {
          store().setConnectionStatus(true)
          store().setError(null)
          reconnectAttemptsRef.current = 0
        }

        // Connection error
        eventSource.onerror = (err) => {
          clientLogger.error('[SSE] Connection error:', err)
          store().setConnectionStatus(false)
          store().setError('실시간 연결 끊김')
          eventSource.close()

          if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            clientLogger.error('[SSE] Max reconnect attempts reached, giving up')
            store().setError('연결 재시도 횟수 초과. 페이지를 새로고침해 주세요.')
            return
          }

          const delay = Math.min(
            BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
            MAX_RECONNECT_DELAY
          )
          reconnectAttemptsRef.current++

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      } catch (err) {
        clientLogger.error('[SSE] Failed to create EventSource:', err)
        store().setError('SSE 연결 실패')
      }
    }

    connect()

    // Cleanup on unmount: close connection and reset store
    return () => {
      eventSourceRef.current?.close()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      store().reset()
    }
  }, []) // No dependencies — actions accessed via getState()

  return {
    isConnected: useMonitorDataStore((state) => state.isConnected),
    error: useMonitorDataStore((state) => state.error),
  }
}
