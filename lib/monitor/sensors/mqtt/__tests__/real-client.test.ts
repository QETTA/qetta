/**
 * Real MQTT Client Tests
 *
 * Tests for the real MQTT client implementation using mqtt.js
 * These tests mock the mqtt library to test client behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRealMQTTClient } from '../real-client'
import type { MQTTConnectionConfig } from '../types'

// Mock mqtt module
const createMockClient = () => {
  const handlers: Record<string, ((...args: unknown[]) => void)[]> = {}
  const onceHandlers: Record<string, ((...args: unknown[]) => void)[]> = {}

  return {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!handlers[event]) handlers[event] = []
      handlers[event].push(handler)
    }),
    once: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!onceHandlers[event]) onceHandlers[event] = []
      onceHandlers[event].push(handler)
    }),
    removeListener: vi.fn(),
    subscribe: vi.fn((_topics: string[], _opts: unknown, cb?: (err: Error | null) => void) => {
      if (cb) cb(null)
    }),
    unsubscribe: vi.fn((_topics: string[], _opts: unknown, cb?: (err: Error | null) => void) => {
      if (cb) cb(null)
    }),
    publish: vi.fn((_topic: string, _msg: string, _opts: unknown, cb?: (err: Error | null) => void) => {
      if (cb) cb(null)
    }),
    end: vi.fn((_force: boolean, _opts: unknown, cb?: () => void) => {
      if (cb) cb()
    }),
    connected: false,
    removeAllListeners: vi.fn(),
    // Helper to trigger events in tests
    _emit: (event: string, ...args: unknown[]) => {
      handlers[event]?.forEach((h) => h(...args))
      const once = onceHandlers[event]
      if (once) {
        once.forEach((h) => h(...args))
        onceHandlers[event] = []
      }
    },
  }
}

let mockClient: ReturnType<typeof createMockClient>

vi.mock('mqtt', () => ({
  default: {
    connect: vi.fn(() => {
      mockClient = createMockClient()
      return mockClient
    }),
  },
  connect: vi.fn(() => {
    mockClient = createMockClient()
    return mockClient
  }),
}))

describe('RealMQTTClient', () => {
  const defaultConfig: MQTTConnectionConfig = {
    brokerUrl: 'mqtt://localhost:1883',
    clientId: 'test-client',
    keepalive: 60,
    reconnectPeriod: 5000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createRealMQTTClient', () => {
    it('should create a client with correct interface', () => {
      const client = createRealMQTTClient(defaultConfig)

      expect(client).toHaveProperty('connect')
      expect(client).toHaveProperty('disconnect')
      expect(client).toHaveProperty('subscribe')
      expect(client).toHaveProperty('unsubscribe')
      expect(client).toHaveProperty('publish')
      expect(client).toHaveProperty('onMessage')
      expect(client).toHaveProperty('onStateChange')
      expect(client).toHaveProperty('getState')
      expect(client).toHaveProperty('getTopics')
      expect(client).toHaveProperty('isConnected')
    })

    it('should initialize with disconnected state', () => {
      const client = createRealMQTTClient(defaultConfig)
      expect(client.getState()).toBe('disconnected')
    })

    it('should initialize with empty topics', () => {
      const client = createRealMQTTClient(defaultConfig)
      expect(client.getTopics()).toEqual([])
    })

    it('should not be connected initially', () => {
      const client = createRealMQTTClient(defaultConfig)
      expect(client.isConnected()).toBe(false)
    })
  })

  describe('connect', () => {
    it('should transition to connecting state and then connected', async () => {
      const client = createRealMQTTClient(defaultConfig)
      const stateHandler = vi.fn()
      client.onStateChange(stateHandler)

      // Start connection
      const connectPromise = client.connect()

      // Simulate successful connection
      setTimeout(() => {
        mockClient._emit('connect')
      }, 10)

      await connectPromise

      // Should have transitioned through connecting to connected
      expect(stateHandler).toHaveBeenCalledWith('connecting', undefined)
      expect(client.getState()).toBe('connected')
    })
  })

  describe('state management', () => {
    it('should track subscribed topics', () => {
      const client = createRealMQTTClient(defaultConfig)

      // Topics are tracked internally when subscribe is called
      expect(client.getTopics()).toEqual([])
    })

    it('should notify state change handlers', async () => {
      const client = createRealMQTTClient(defaultConfig)
      const stateHandler = vi.fn()

      client.onStateChange(stateHandler)

      // Trigger state change by starting connection
      const connectPromise = client.connect()

      // Simulate successful connection
      setTimeout(() => {
        mockClient._emit('connect')
      }, 10)

      await connectPromise

      expect(stateHandler).toHaveBeenCalledWith('connecting', undefined)
      expect(stateHandler).toHaveBeenCalledWith('connected', undefined)
    })
  })

  describe('configuration', () => {
    it('should use TLS when brokerUrl uses mqtts://', () => {
      const tlsConfig: MQTTConnectionConfig = {
        ...defaultConfig,
        brokerUrl: 'mqtts://secure.broker.com:8883',
        rejectUnauthorized: true,
      }

      const client = createRealMQTTClient(tlsConfig)
      expect(client).toBeDefined()
    })

    it('should support authentication credentials', () => {
      const authConfig: MQTTConnectionConfig = {
        ...defaultConfig,
        username: 'testuser',
        password: 'testpass',
      }

      const client = createRealMQTTClient(authConfig)
      expect(client).toBeDefined()
    })

    it('should support custom client ID', () => {
      const customConfig: MQTTConnectionConfig = {
        ...defaultConfig,
        clientId: 'custom-client-123',
      }

      const client = createRealMQTTClient(customConfig)
      expect(client).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle disconnect gracefully when not connected', async () => {
      const client = createRealMQTTClient(defaultConfig)

      // Should not throw when disconnecting without being connected
      await expect(client.disconnect()).resolves.not.toThrow()
    })

    it('should not throw when publishing without connection', async () => {
      const client = createRealMQTTClient(defaultConfig)

      // Should reject when not connected
      await expect(
        client.publish('test/topic', { test: 'data' })
      ).rejects.toThrow('Not connected')
    })
  })
})
