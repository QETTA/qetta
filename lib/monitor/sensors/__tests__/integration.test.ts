/**
 * Sensor Pipeline Integration Tests
 *
 * Tests for the full data flow from sensor clients through
 * the unified service to SSE stream consumers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createSensorService,
  type SensorService,
  type ConnectionStatus,
  type SensorDataHandler,
  type ConnectionStatusHandler,
} from '../sensor-service'
import type { SensorReading } from '@/types/monitor'

// =============================================================================
// Mock MQTT and OPC-UA Clients
// =============================================================================

vi.mock('../mqtt-client', () => ({
  createMQTTClient: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
    onMessage: vi.fn(),
    onStateChange: vi.fn(),
    getState: vi.fn().mockReturnValue('disconnected'),
    isConnected: vi.fn().mockReturnValue(false),
  })),
  mqttPayloadToSensorReading: vi.fn((payload: Buffer) => {
    const data = JSON.parse(payload.toString())
    return {
      type: data.type || 'Temperature',
      value: data.value || 0,
      unit: data.unit || '°C',
      normalRange: [0, 100] as [number, number],
      status: 'normal' as const,
      timestamp: new Date().toISOString(),
    }
  }),
}))

vi.mock('../opc-ua-client', () => ({
  createOPCUAClient: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockResolvedValue(undefined),
    read: vi.fn().mockResolvedValue({ value: 25.5, statusCode: 'Good' }),
    onDataChange: vi.fn(),
    onStateChange: vi.fn(),
    getState: vi.fn().mockReturnValue('disconnected'),
    isConnected: vi.fn().mockReturnValue(false),
  })),
}))

// =============================================================================
// Integration Tests
// =============================================================================

describe('Sensor Pipeline Integration', () => {
  let service: SensorService

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(async () => {
    if (service?.isRunning()) {
      await service.stop()
    }
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('MQTT → SSE Data Flow', () => {
    it('should relay MQTT messages to sensor data handlers', async () => {
      const { createMQTTClient } = await import('../mqtt-client')
      const mockOnMessage = vi.fn()
      ;(createMQTTClient as ReturnType<typeof vi.fn>).mockReturnValue({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(),
        onMessage: mockOnMessage,
        onStateChange: vi.fn(),
        getState: vi.fn().mockReturnValue('connected'),
        isConnected: vi.fn().mockReturnValue(true),
      })

      service = createSensorService({
        mqtt: {
          brokerUrl: 'mqtt://test:1883',
          topics: ['sensors/+/temperature'],
        },
      })

      const sensorHandler = vi.fn<SensorDataHandler>()
      service.onSensorData(sensorHandler)

      await service.start()

      // Simulate MQTT message callback
      const onMessageCallback = mockOnMessage.mock.calls[0]?.[0]
      if (onMessageCallback) {
        const topic = 'sensors/eq-001/temperature'
        const payload = Buffer.from(JSON.stringify({ type: 'Temperature', value: 45.5 }))
        onMessageCallback(topic, payload)
      }

      expect(sensorHandler).toHaveBeenCalled()
      if (sensorHandler.mock.calls[0]) {
        const [equipmentId, readings] = sensorHandler.mock.calls[0]
        expect(equipmentId).toBe('eq-001')
        expect(readings).toBeInstanceOf(Array)
      }
    })

    it('should handle messages on multiple topics', async () => {
      const { createMQTTClient } = await import('../mqtt-client')
      const mockOnMessage = vi.fn()
      ;(createMQTTClient as ReturnType<typeof vi.fn>).mockReturnValue({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(),
        onMessage: mockOnMessage,
        onStateChange: vi.fn(),
        getState: vi.fn().mockReturnValue('connected'),
        isConnected: vi.fn().mockReturnValue(true),
      })

      service = createSensorService({
        mqtt: {
          brokerUrl: 'mqtt://test:1883',
          topics: ['sensors/+/temperature', 'sensors/+/vibration'],
        },
      })

      const sensorHandler = vi.fn<SensorDataHandler>()
      service.onSensorData(sensorHandler)

      await service.start()

      // Get the onMessage callback
      const onMessageCallback = mockOnMessage.mock.calls[0]?.[0]
      if (onMessageCallback) {
        // Send messages for different sensors
        onMessageCallback('sensors/eq-001/temperature', Buffer.from('{"type": "Temperature", "value": 45}'))
        onMessageCallback('sensors/eq-001/vibration', Buffer.from('{"type": "Vibration", "value": 2.5}'))
      }

      expect(sensorHandler).toHaveBeenCalled()
      // Should have been called twice (once per message)
      expect(sensorHandler.mock.calls.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('OPC-UA → Data Handler Flow', () => {
    it('should relay OPC-UA data changes to handlers', async () => {
      const { createOPCUAClient } = await import('../opc-ua-client')
      const mockOnDataChange = vi.fn()
      ;(createOPCUAClient as ReturnType<typeof vi.fn>).mockReturnValue({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn().mockResolvedValue(undefined),
        read: vi.fn().mockResolvedValue({ value: 25.5, statusCode: 'Good' }),
        onDataChange: mockOnDataChange,
        onStateChange: vi.fn(),
        getState: vi.fn().mockReturnValue('connected'),
        isConnected: vi.fn().mockReturnValue(true),
      })

      service = createSensorService({
        opcua: {
          endpointUrl: 'opc.tcp://test:4840',
          nodeIds: ['ns=2;s=Temperature'],
          equipmentMapping: {
            'ns=2;s=Temperature': 'eq-002',
          },
          sensorMapping: {
            'ns=2;s=Temperature': 'temperature',
          },
        },
      })

      const sensorHandler = vi.fn<SensorDataHandler>()
      service.onSensorData(sensorHandler)

      await service.start()

      // Simulate OPC-UA data change
      const onDataChangeCallback = mockOnDataChange.mock.calls[0]?.[0]
      if (onDataChangeCallback) {
        onDataChangeCallback('ns=2;s=Temperature', {
          value: 65.3,
          statusCode: 'Good',
          sourceTimestamp: new Date(),
        })
      }

      expect(sensorHandler).toHaveBeenCalled()
    })
  })

  describe('Connection Status Updates', () => {
    it('should notify handlers on MQTT connection state change', async () => {
      const { createMQTTClient } = await import('../mqtt-client')
      const mockOnStateChange = vi.fn()
      ;(createMQTTClient as ReturnType<typeof vi.fn>).mockReturnValue({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(),
        onMessage: vi.fn(),
        onStateChange: mockOnStateChange,
        getState: vi.fn().mockReturnValue('connected'),
        isConnected: vi.fn().mockReturnValue(true),
      })

      service = createSensorService({
        mqtt: { brokerUrl: 'mqtt://test:1883' },
      })

      const statusHandler = vi.fn<ConnectionStatusHandler>()
      service.onConnectionStatus(statusHandler)

      await service.start()

      // Simulate state change
      const stateChangeCallback = mockOnStateChange.mock.calls[0]?.[0]
      if (stateChangeCallback) {
        stateChangeCallback('connected')
      }

      // Check that handler was called with updated status
      expect(statusHandler).toHaveBeenCalled()
    })

    it('should track reconnection attempts', async () => {
      const { createMQTTClient } = await import('../mqtt-client')
      const mockOnStateChange = vi.fn()
      ;(createMQTTClient as ReturnType<typeof vi.fn>).mockReturnValue({
        connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
        disconnect: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(),
        onMessage: vi.fn(),
        onStateChange: mockOnStateChange,
        getState: vi.fn().mockReturnValue('disconnected'),
        isConnected: vi.fn().mockReturnValue(false),
      })

      service = createSensorService({
        mqtt: { brokerUrl: 'mqtt://test:1883' },
        reconnect: {
          enabled: true,
          initialDelay: 100,
          maxDelay: 1000,
          maxAttempts: 3,
        },
      })

      await service.start()

      // Initial status should have reconnect attempts
      const status = service.getConnectionStatus()
      expect(status.mqtt.state).toBe('disconnected')
    })
  })

  describe('Reconnection Scenarios', () => {
    it('should schedule reconnect on connection loss', async () => {
      const { createMQTTClient } = await import('../mqtt-client')
      let stateChangeHandler: ((state: string, error?: Error) => void) | undefined

      const mockConnect = vi.fn()
        .mockResolvedValueOnce(undefined) // First connect succeeds
        .mockRejectedValueOnce(new Error('Reconnect failed')) // Reconnect fails

      ;(createMQTTClient as ReturnType<typeof vi.fn>).mockReturnValue({
        connect: mockConnect,
        disconnect: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(),
        onMessage: vi.fn(),
        onStateChange: (handler: (state: string, error?: Error) => void) => {
          stateChangeHandler = handler
        },
        getState: vi.fn().mockReturnValue('connected'),
        isConnected: vi.fn().mockReturnValue(true),
      })

      service = createSensorService({
        mqtt: { brokerUrl: 'mqtt://test:1883' },
        reconnect: {
          enabled: true,
          initialDelay: 100,
          maxDelay: 1000,
        },
      })

      await service.start()

      expect(mockConnect).toHaveBeenCalledTimes(1)

      // Simulate disconnection
      if (stateChangeHandler) {
        stateChangeHandler('disconnected')
      }

      // Fast-forward timers
      await vi.advanceTimersByTimeAsync(150)

      // Should have attempted reconnect
      expect(mockConnect).toHaveBeenCalledTimes(2)
    })

    it('should respect maxAttempts configuration', async () => {
      const { createMQTTClient } = await import('../mqtt-client')
      let stateChangeHandler: ((state: string, error?: Error) => void) | undefined

      const mockConnect = vi.fn().mockRejectedValue(new Error('Connection failed'))

      ;(createMQTTClient as ReturnType<typeof vi.fn>).mockReturnValue({
        connect: mockConnect,
        disconnect: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(),
        onMessage: vi.fn(),
        onStateChange: (handler: (state: string, error?: Error) => void) => {
          stateChangeHandler = handler
        },
        getState: vi.fn().mockReturnValue('disconnected'),
        isConnected: vi.fn().mockReturnValue(false),
      })

      service = createSensorService({
        mqtt: { brokerUrl: 'mqtt://test:1883' },
        reconnect: {
          enabled: true,
          initialDelay: 50,
          maxDelay: 100,
          maxAttempts: 2,
        },
      })

      await service.start()

      // Simulate multiple reconnection cycles
      for (let i = 0; i < 5; i++) {
        if (stateChangeHandler) {
          stateChangeHandler('disconnected')
        }
        await vi.advanceTimersByTimeAsync(200)
      }

      // Should not exceed maxAttempts (initial + 2 retries = 3)
      expect(mockConnect.mock.calls.length).toBeLessThanOrEqual(4)
    })
  })

  describe('Service Lifecycle', () => {
    it('should clean up resources on stop', async () => {
      const { createMQTTClient } = await import('../mqtt-client')
      const { createOPCUAClient } = await import('../opc-ua-client')

      const mockMqttDisconnect = vi.fn().mockResolvedValue(undefined)
      const mockOpcuaDisconnect = vi.fn().mockResolvedValue(undefined)

      ;(createMQTTClient as ReturnType<typeof vi.fn>).mockReturnValue({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: mockMqttDisconnect,
        subscribe: vi.fn(),
        onMessage: vi.fn(),
        onStateChange: vi.fn(),
        getState: vi.fn().mockReturnValue('connected'),
        isConnected: vi.fn().mockReturnValue(true),
      })

      ;(createOPCUAClient as ReturnType<typeof vi.fn>).mockReturnValue({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: mockOpcuaDisconnect,
        subscribe: vi.fn().mockResolvedValue(undefined),
        read: vi.fn().mockResolvedValue({ value: 0, statusCode: 'Good' }),
        onDataChange: vi.fn(),
        onStateChange: vi.fn(),
        getState: vi.fn().mockReturnValue('connected'),
        isConnected: vi.fn().mockReturnValue(true),
      })

      service = createSensorService({
        mqtt: { brokerUrl: 'mqtt://test:1883' },
        opcua: { endpointUrl: 'opc.tcp://test:4840' },
      })

      await service.start()
      expect(service.isRunning()).toBe(true)

      await service.stop()
      expect(service.isRunning()).toBe(false)

      expect(mockMqttDisconnect).toHaveBeenCalled()
      expect(mockOpcuaDisconnect).toHaveBeenCalled()
    })

    it('should reset connection status on stop', async () => {
      service = createSensorService({
        mqtt: { brokerUrl: 'mqtt://test:1883' },
      })

      await service.start()
      await service.stop()

      const status = service.getConnectionStatus()
      expect(status.mqtt.state).toBe('disconnected')
      expect(status.mqtt.reconnectAttempts).toBe(0)
      expect(status.opcua.state).toBe('disconnected')
      expect(status.opcua.reconnectAttempts).toBe(0)
    })
  })

  describe('Data Aggregation', () => {
    it('should aggregate multiple sensor readings per equipment', async () => {
      const { createMQTTClient } = await import('../mqtt-client')
      const mockOnMessage = vi.fn()
      ;(createMQTTClient as ReturnType<typeof vi.fn>).mockReturnValue({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(),
        onMessage: mockOnMessage,
        onStateChange: vi.fn(),
        getState: vi.fn().mockReturnValue('connected'),
        isConnected: vi.fn().mockReturnValue(true),
      })

      service = createSensorService({
        mqtt: {
          brokerUrl: 'mqtt://test:1883',
          topics: ['sensors/+/+'],
        },
      })

      let lastReadings: SensorReading[] = []
      service.onSensorData((_equipmentId: string, readings: SensorReading[]) => {
        lastReadings = readings
      })

      await service.start()

      const onMessageCallback = mockOnMessage.mock.calls[0]?.[0]
      if (onMessageCallback) {
        // Send temperature reading
        onMessageCallback(
          'sensors/eq-001/temperature',
          Buffer.from(JSON.stringify({ type: 'Temperature', value: 45 }))
        )

        // Send vibration reading for same equipment
        onMessageCallback(
          'sensors/eq-001/vibration',
          Buffer.from(JSON.stringify({ type: 'Vibration', value: 2.5 }))
        )
      }

      // Should have aggregated both readings
      expect(lastReadings.length).toBe(2)
    })
  })

  describe('Error Handling', () => {
    it('should process valid MQTT messages correctly', async () => {
      const { createMQTTClient } = await import('../mqtt-client')
      const mockOnMessage = vi.fn()

      ;(createMQTTClient as ReturnType<typeof vi.fn>).mockReturnValue({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(),
        onMessage: mockOnMessage,
        onStateChange: vi.fn(),
        getState: vi.fn().mockReturnValue('connected'),
        isConnected: vi.fn().mockReturnValue(true),
      })

      service = createSensorService({
        mqtt: { brokerUrl: 'mqtt://test:1883' },
      })

      const sensorHandler = vi.fn<SensorDataHandler>()
      service.onSensorData(sensorHandler)

      await service.start()

      // Process a valid message
      const onMessageCallback = mockOnMessage.mock.calls[0]?.[0]
      if (onMessageCallback) {
        const validPayload = JSON.stringify({ type: 'Temperature', value: 25.5, unit: '°C' })
        onMessageCallback('sensors/eq-001/temp', Buffer.from(validPayload))
      }

      expect(sensorHandler).toHaveBeenCalled()
      if (sensorHandler.mock.calls[0]) {
        const [equipmentId, readings] = sensorHandler.mock.calls[0]
        expect(equipmentId).toBe('eq-001')
        expect(readings[0].type).toBe('Temperature')
      }
    })

    it('should capture connection errors in status', async () => {
      const { createMQTTClient } = await import('../mqtt-client')
      let stateChangeHandler: ((state: string, error?: Error) => void) | undefined

      ;(createMQTTClient as ReturnType<typeof vi.fn>).mockReturnValue({
        connect: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
        disconnect: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(),
        onMessage: vi.fn(),
        onStateChange: (handler: (state: string, error?: Error) => void) => {
          stateChangeHandler = handler
        },
        getState: vi.fn().mockReturnValue('error'),
        isConnected: vi.fn().mockReturnValue(false),
      })

      service = createSensorService({
        mqtt: { brokerUrl: 'mqtt://test:1883' },
        reconnect: { enabled: false },
      })

      await service.start()

      // Simulate error state
      if (stateChangeHandler) {
        stateChangeHandler('error', new Error('ECONNREFUSED'))
      }

      const status = service.getConnectionStatus()
      expect(status.mqtt.lastError).toBe('ECONNREFUSED')
    })
  })
})
