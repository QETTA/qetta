/**
 * MQTT Client Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createMQTTClient,
  createMQTTSensorService,
  createSmartFactoryMQTTClient,
  mqttPayloadToSensorReading,
  DEFAULT_SENSOR_TOPICS,
  type MQTTClient,
  type MQTTSensorPayload,
} from '../mqtt-client'

describe('createMQTTClient', () => {
  let client: MQTTClient

  beforeEach(() => {
    client = createMQTTClient({
      brokerUrl: 'mqtt://localhost:1883',
      clientId: 'test-client',
      topics: ['sensors/+/temperature'],
    })
  })

  afterEach(async () => {
    if (client.isConnected()) {
      await client.disconnect()
    }
  })

  describe('connection lifecycle', () => {
    it('starts in disconnected state', () => {
      expect(client.getState()).toBe('disconnected')
      expect(client.isConnected()).toBe(false)
    })

    it('connects successfully', async () => {
      await client.connect()
      expect(client.getState()).toBe('connected')
      expect(client.isConnected()).toBe(true)
    }, 15000)

    it('disconnects successfully', async () => {
      await client.connect()
      await client.disconnect()
      expect(client.getState()).toBe('disconnected')
      expect(client.isConnected()).toBe(false)
    }, 15000)

    it('handles double connect gracefully', async () => {
      await client.connect()
      await client.connect() // Should not throw
      expect(client.isConnected()).toBe(true)
    }, 15000)

    it('handles double disconnect gracefully', async () => {
      await client.connect()
      await client.disconnect()
      await client.disconnect() // Should not throw
      expect(client.isConnected()).toBe(false)
    }, 15000)
  })

  describe('topic management', () => {
    it('returns initial topics', () => {
      expect(client.getTopics()).toContain('sensors/+/temperature')
    })

    it('subscribes to new topics', async () => {
      await client.connect()
      await client.subscribe(['sensors/+/vibration'])
      expect(client.getTopics()).toContain('sensors/+/vibration')
    }, 15000)

    it('unsubscribes from topics', async () => {
      await client.connect()
      await client.unsubscribe(['sensors/+/temperature'])
      expect(client.getTopics()).not.toContain('sensors/+/temperature')
    }, 15000)
  })

  describe('state change notifications', () => {
    it('notifies on state changes', async () => {
      const states: string[] = []
      client.onStateChange((state) => states.push(state))

      await client.connect()
      await client.disconnect()

      expect(states).toContain('connecting')
      expect(states).toContain('connected')
      expect(states).toContain('disconnected')
    }, 15000) // Extended timeout for potential reconnect retries
  })

  describe('message handling', () => {
    it('receives messages on subscribed topics', async () => {
      vi.useFakeTimers()

      try {
        // Create a fresh client with broad topic pattern to catch all messages
        const testClient = createMQTTClient({
          brokerUrl: 'mqtt://localhost:1883',
          clientId: 'test-message-client',
          topics: ['sensors/#'], // Broad pattern to match all sensor messages
        })

        const messages: { topic: string; payload: unknown }[] = []
        testClient.onMessage((topic, payload) => messages.push({ topic, payload }))

        // Connect (advance past connection delay)
        const connectPromise = testClient.connect()
        await vi.advanceTimersByTimeAsync(1000)
        await connectPromise

        // Advance past multiple simulation intervals (3000ms each) to ensure messages
        await vi.advanceTimersByTimeAsync(7000)

        // Should have received at least one message
        expect(messages.length).toBeGreaterThan(0)

        await testClient.disconnect()
      } finally {
        vi.useRealTimers()
      }
    })

    it('registers message handlers', () => {
      const handler = vi.fn()
      client.onMessage(handler)
      // Handler registration doesn't throw
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('publish', () => {
    it('throws when not connected', async () => {
      await expect(
        client.publish('test/topic', { value: 1 })
      ).rejects.toThrow('Not connected')
    })

    it('publishes when connected', async () => {
      await client.connect()
      await expect(
        client.publish('test/topic', { value: 1 })
      ).resolves.not.toThrow()
    }, 15000)
  })
})

describe('mqttPayloadToSensorReading', () => {
  it('converts temperature payload correctly', () => {
    const payload: MQTTSensorPayload = {
      equipmentId: 'eq-001',
      sensorType: 'temperature',
      value: 65.5,
      unit: '°C',
      timestamp: '2026-01-30T10:00:00Z',
    }

    const reading = mqttPayloadToSensorReading(payload)

    expect(reading.type).toBe('온도')
    expect(reading.value).toBe(65.5)
    expect(reading.unit).toBe('°C')
    expect(reading.normalRange).toEqual([20, 70])
    expect(reading.status).toBe('normal')
    expect(reading.timestamp).toBe('2026-01-30T10:00:00Z')
  })

  it('converts vibration payload correctly', () => {
    const payload: MQTTSensorPayload = {
      equipmentId: 'eq-001',
      sensorType: 'vibration',
      value: 5.3,
      unit: 'mm/s',
      timestamp: '2026-01-30T10:00:00Z',
    }

    const reading = mqttPayloadToSensorReading(payload)

    expect(reading.type).toBe('진동')
    expect(reading.value).toBe(5.3)
    expect(reading.normalRange).toEqual([0, 5])
    // 5.3 is above max (5) but within warning buffer (5.5), so it's warning
    expect(reading.status).toBe('warning')
  })

  it('detects critical status when far outside range', () => {
    const payload: MQTTSensorPayload = {
      equipmentId: 'eq-001',
      sensorType: 'temperature',
      value: 95, // Far above 70°C max
      unit: '°C',
      timestamp: '2026-01-30T10:00:00Z',
    }

    const reading = mqttPayloadToSensorReading(payload)
    expect(reading.status).toBe('critical')
  })

  it('handles unknown sensor types', () => {
    const payload: MQTTSensorPayload = {
      equipmentId: 'eq-001',
      sensorType: 'unknown-sensor',
      value: 42,
      unit: 'units',
      timestamp: '2026-01-30T10:00:00Z',
    }

    const reading = mqttPayloadToSensorReading(payload)

    expect(reading.type).toBe('unknown-sensor') // Uses original type
    expect(reading.normalRange).toEqual([0, 100]) // Default range
  })
})

describe('createMQTTSensorService', () => {
  it('aggregates sensor readings by equipment', async () => {
    vi.useFakeTimers()

    try {
      const service = createMQTTSensorService({
        brokerUrl: 'mqtt://localhost:1883',
        clientId: 'test-service-aggregation',
        topics: ['sensors/#'],
        aggregationInterval: 500,
      })

      const readings: Map<string, number> = new Map()
      service.onSensorData((equipmentId, data) => {
        readings.set(equipmentId, data.length)
      })

      // Start service (advances past connection delay)
      const startPromise = service.start()
      await vi.advanceTimersByTimeAsync(1000)
      await startPromise

      // Advance past multiple simulation intervals (3000ms each) + aggregation
      await vi.advanceTimersByTimeAsync(7000)

      await service.stop()

      // Should have received some aggregated readings
      expect(readings.size).toBeGreaterThan(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('starts and stops correctly', async () => {
    const service = createMQTTSensorService({
      brokerUrl: 'mqtt://localhost:1883',
      clientId: 'test-service',
      topics: ['sensors/#'],
    })

    await service.start()
    expect(service.getClient().isConnected()).toBe(true)

    await service.stop()
    expect(service.getClient().isConnected()).toBe(false)
  }, 15000) // Extended timeout for potential reconnect retries

  it('returns underlying client', () => {
    const service = createMQTTSensorService({
      brokerUrl: 'mqtt://localhost:1883',
      clientId: 'test-service',
      topics: ['sensors/#'],
    })

    const client = service.getClient()
    expect(client).toBeDefined()
    expect(typeof client.connect).toBe('function')
  })
})

describe('createSmartFactoryMQTTClient', () => {
  it('creates client with default sensor topics', () => {
    const client = createSmartFactoryMQTTClient('mqtt://localhost:1883')

    const topics = client.getTopics()
    expect(topics).toContain('sensors/+/temperature')
    expect(topics).toContain('sensors/+/vibration')
    expect(topics).toContain('sensors/+/current')
    expect(topics).toContain('sensors/+/noise')
  })

  it('uses custom client ID when provided', () => {
    const client = createSmartFactoryMQTTClient(
      'mqtt://localhost:1883',
      'custom-id-123'
    )

    // Client should be created successfully
    expect(client).toBeDefined()
    expect(client.getState()).toBe('disconnected')
  })
})

describe('DEFAULT_SENSOR_TOPICS', () => {
  it('includes all standard sensor types', () => {
    expect(DEFAULT_SENSOR_TOPICS).toContain('sensors/+/temperature')
    expect(DEFAULT_SENSOR_TOPICS).toContain('sensors/+/vibration')
    expect(DEFAULT_SENSOR_TOPICS).toContain('sensors/+/current')
    expect(DEFAULT_SENSOR_TOPICS).toContain('sensors/+/noise')
    expect(DEFAULT_SENSOR_TOPICS).toContain('sensors/+/oee')
  })
})
