'use client'

import { memo, useEffect, useState } from 'react'
import type { ConnectionStatus as ConnectionStatusType } from '@/lib/monitor/sensors/sensor-service'

interface ConnectionStatusProps {
  className?: string
  compact?: boolean
}

type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error'

const STATE_COLORS: Record<ConnectionState, { dot: string; text: string }> = {
  connected: { dot: 'bg-emerald-500', text: 'text-emerald-400' },
  connecting: { dot: 'bg-yellow-500 animate-pulse', text: 'text-yellow-400' },
  reconnecting: { dot: 'bg-amber-500 animate-pulse', text: 'text-amber-400' },
  disconnected: { dot: 'bg-zinc-500', text: 'text-zinc-400' },
  error: { dot: 'bg-red-500', text: 'text-red-400' },
}

const STATE_LABELS: Record<ConnectionState, string> = {
  connected: 'Connected',
  connecting: 'Connecting...',
  reconnecting: 'Reconnecting...',
  disconnected: 'Disconnected',
  error: 'Error',
}

/**
 * Connection Status Widget
 *
 * Displays real-time connection status for MQTT and OPC-UA sensors.
 * Listens to SSE events for connection status updates.
 *
 * Features:
 * - Shows MQTT and OPC-UA connection states independently
 * - Displays reconnection attempts count
 * - Shows last error message on hover/click
 * - Animated indicators for connecting/reconnecting states
 *
 * @example
 * ```tsx
 * // Full view with both protocols
 * <ConnectionStatus />
 *
 * // Compact view for sidebar
 * <ConnectionStatus compact />
 * ```
 */
function ConnectionStatusInner({ className, compact = false }: ConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionStatusType>({
    mqtt: { state: 'disconnected', reconnectAttempts: 0 },
    opcua: { state: 'disconnected', reconnectAttempts: 0 },
  })
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource('/api/monitor/stream')

    eventSource.addEventListener('connection-status', (event) => {
      try {
        const parsed = JSON.parse(event.data)
        if (parsed.data) {
          setStatus(parsed.data)
        }
      } catch {
        // Ignore parse errors
      }
    })

    eventSource.onopen = () => {
      setIsListening(true)
    }

    eventSource.onerror = () => {
      setIsListening(false)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <StatusDot state={status.mqtt.state as ConnectionState} />
        <StatusDot state={status.opcua.state as ConnectionState} />
        {!isListening && (
          <span className="text-xs text-zinc-500">Offline</span>
        )}
      </div>
    )
  }

  return (
    <div className={`rounded-lg bg-zinc-900/50 border border-zinc-800 p-4 ${className || ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-300">Sensor Connections</h3>
        {isListening ? (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        ) : (
          <span className="text-xs text-zinc-500">Offline</span>
        )}
      </div>

      <div className="space-y-3">
        <ProtocolStatus
          name="MQTT"
          state={status.mqtt.state as ConnectionState}
          reconnectAttempts={status.mqtt.reconnectAttempts}
          lastError={status.mqtt.lastError}
        />
        <ProtocolStatus
          name="OPC-UA"
          state={status.opcua.state as ConnectionState}
          reconnectAttempts={status.opcua.reconnectAttempts}
          lastError={status.opcua.lastError}
        />
      </div>
    </div>
  )
}

interface StatusDotProps {
  state: ConnectionState
}

function StatusDot({ state }: StatusDotProps) {
  const colors = STATE_COLORS[state] || STATE_COLORS.disconnected
  return (
    <span
      className={`w-2 h-2 rounded-full ${colors.dot}`}
      title={STATE_LABELS[state]}
    />
  )
}

interface ProtocolStatusProps {
  name: string
  state: ConnectionState
  reconnectAttempts: number
  lastError?: string
}

function ProtocolStatus({ name, state, reconnectAttempts, lastError }: ProtocolStatusProps) {
  const colors = STATE_COLORS[state] || STATE_COLORS.disconnected
  const label = STATE_LABELS[state] || 'Unknown'

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <StatusDot state={state} />
        <span className="text-sm text-zinc-400">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        {reconnectAttempts > 0 && state === 'reconnecting' && (
          <span className="text-xs text-zinc-500">
            Attempt {reconnectAttempts}
          </span>
        )}
        <span className={`text-xs font-medium ${colors.text}`}>
          {label}
        </span>
        {lastError && state === 'error' && (
          <span
            className="text-xs text-red-400/70 truncate max-w-[120px]"
            title={lastError}
          >
            {lastError}
          </span>
        )}
      </div>
    </div>
  )
}

export const ConnectionStatus = memo(ConnectionStatusInner)

/**
 * Mini connection indicator for headers/toolbars
 */
export function ConnectionIndicator() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource('/api/monitor/stream')

    eventSource.onopen = () => setIsConnected(true)
    eventSource.onerror = () => setIsConnected(false)

    return () => eventSource.close()
  }, [])

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected
            ? 'bg-emerald-500 animate-pulse'
            : 'bg-zinc-600'
        }`}
      />
      <span className="text-xs text-zinc-500">
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  )
}
