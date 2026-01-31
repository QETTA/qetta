/**
 * Sensor Service Tests
 *
 * Tests for the unified sensor service that integrates MQTT and OPC-UA
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSensorService, createSmartFactorySensorService } from '../sensor-service'

describe('SensorService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createSensorService', () => {
    it('should create a service with correct interface', () => {
      const service = createSensorService({})

      expect(service).toHaveProperty('start')
      expect(service).toHaveProperty('stop')
      expect(service).toHaveProperty('onSensorData')
      expect(service).toHaveProperty('onConnectionStatus')
      expect(service).toHaveProperty('getConnectionStatus')
      expect(service).toHaveProperty('isRunning')
      expect(service).toHaveProperty('getClients')
    })

    it('should not be running initially', () => {
      const service = createSensorService({})
      expect(service.isRunning()).toBe(false)
    })

    it('should return disconnected status initially', () => {
      const service = createSensorService({})
      const status = service.getConnectionStatus()

      expect(status.mqtt.state).toBe('disconnected')
      expect(status.opcua.state).toBe('disconnected')
    })

    it('should return null clients when not configured', () => {
      const service = createSensorService({})
      const { mqtt, opcua } = service.getClients()

      expect(mqtt).toBeNull()
      expect(opcua).toBeNull()
    })
  })

  describe('start/stop lifecycle', () => {
    it('should start without errors when no clients configured', async () => {
      const service = createSensorService({})

      await expect(service.start()).resolves.not.toThrow()
      expect(service.isRunning()).toBe(true)

      await service.stop()
      expect(service.isRunning()).toBe(false)
    })

    it('should handle multiple start calls gracefully', async () => {
      const service = createSensorService({})

      await service.start()
      await service.start() // Should not throw
      expect(service.isRunning()).toBe(true)

      await service.stop()
    })

    it('should handle stop when not running', async () => {
      const service = createSensorService({})

      await expect(service.stop()).resolves.not.toThrow()
    })
  })

  describe('event handlers', () => {
    it('should register sensor data handler', () => {
      const service = createSensorService({})
      const handler = vi.fn()

      const unsubscribe = service.onSensorData(handler)
      expect(typeof unsubscribe).toBe('function')
    })

    it('should unregister sensor data handler', () => {
      const service = createSensorService({})
      const handler = vi.fn()

      const unsubscribe = service.onSensorData(handler)
      unsubscribe()
      // Handler should be removed (no way to verify without triggering data)
    })

    it('should register connection status handler', () => {
      const service = createSensorService({})
      const handler = vi.fn()

      const unsubscribe = service.onConnectionStatus(handler)
      expect(typeof unsubscribe).toBe('function')
    })
  })

  describe('configuration', () => {
    it('should accept MQTT configuration', () => {
      const service = createSensorService({
        mqtt: {
          brokerUrl: 'mqtt://localhost:1883',
          topics: ['sensors/#'],
        },
      })

      expect(service).toBeDefined()
    })

    it('should accept OPC-UA configuration', () => {
      const service = createSensorService({
        opcua: {
          endpointUrl: 'opc.tcp://localhost:4840',
          nodeIds: ['ns=2;s=Temperature'],
        },
      })

      expect(service).toBeDefined()
    })

    it('should accept both MQTT and OPC-UA configuration', () => {
      const service = createSensorService({
        mqtt: {
          brokerUrl: 'mqtt://localhost:1883',
          topics: ['sensors/#'],
        },
        opcua: {
          endpointUrl: 'opc.tcp://localhost:4840',
          nodeIds: ['ns=2;s=Temperature'],
        },
      })

      expect(service).toBeDefined()
    })

    it('should accept reconnect configuration', () => {
      const service = createSensorService({
        reconnect: {
          enabled: true,
          initialDelay: 500,
          maxDelay: 10000,
          maxAttempts: 5,
        },
      })

      expect(service).toBeDefined()
    })
  })
})

describe('createSmartFactorySensorService', () => {
  it('should create a pre-configured service', () => {
    const service = createSmartFactorySensorService()

    expect(service).toBeDefined()
    expect(service.isRunning()).toBe(false)
  })

  it('should accept MQTT broker URL', () => {
    const service = createSmartFactorySensorService({
      mqttBrokerUrl: 'mqtt://localhost:1883',
    })

    expect(service).toBeDefined()
  })

  it('should accept OPC-UA endpoint URL', () => {
    const service = createSmartFactorySensorService({
      opcuaEndpointUrl: 'opc.tcp://localhost:4840',
    })

    expect(service).toBeDefined()
  })

  it('should accept both URLs', () => {
    const service = createSmartFactorySensorService({
      mqttBrokerUrl: 'mqtt://localhost:1883',
      opcuaEndpointUrl: 'opc.tcp://localhost:4840',
    })

    expect(service).toBeDefined()
  })
})
