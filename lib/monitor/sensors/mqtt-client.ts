/**
 * MQTT Sensor Client
 *
 * Client for connecting to MQTT brokers and subscribing to sensor data topics.
 * Supports TLS, authentication, and automatic reconnection.
 *
 * @module lib/monitor/sensors/mqtt-client
 *
 * @example
 * ```ts
 * const client = createMQTTClient({
 *   brokerUrl: 'mqtt://localhost:1883',
 *   clientId: 'qetta-monitor-001',
 *   topics: ['sensors/+/temperature', 'sensors/+/vibration'],
 * })
 *
 * client.onMessage((topic, payload) => {
 *   console.log(`[${topic}]`, payload)
 * })
 *
 * await client.connect()
 * ```
 *
 * Note: This is a type-safe wrapper. In production, use with 'mqtt' npm package.
 */

import type { SensorReading } from '@/types/monitor'
import { mqttLogger as logger } from '@/lib/monitor/observability/logger'
import {
  getSensorStatus,
  SENSOR_NORMAL_RANGES,
  SENSOR_LABELS,
} from '@/lib/monitor/sensor-utils'

// =============================================================================
// Types
// =============================================================================

/** MQTT connection options */
export interface MQTTClientOptions {
  /** MQTT broker URL (mqtt:// or mqtts://) */
  brokerUrl: string
  /** Client ID (unique per connection) */
  clientId: string
  /** Username for authentication (optional) */
  username?: string
  /** Password for authentication (optional) */
  password?: string
  /** Topics to subscribe to */
  topics: string[]
  /** QoS level (0, 1, or 2) */
  qos?: 0 | 1 | 2
  /** Keep-alive interval in seconds */
  keepAlive?: number
  /** Reconnect on disconnect */
  reconnect?: boolean
  /** Reconnect interval in ms */
  reconnectInterval?: number
  /** Maximum reconnect attempts (0 = infinite) */
  maxReconnectAttempts?: number
  /** Clean session flag */
  cleanSession?: boolean
}

/** MQTT message payload (parsed JSON) */
export interface MQTTSensorPayload {
  /** Equipment ID */
  equipmentId: string
  /** Sensor type */
  sensorType: string
  /** Measured value */
  value: number
  /** Unit of measurement */
  unit: string
  /** Timestamp (ISO 8601) */
  timestamp: string
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

/** Connection state */
export type MQTTConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

/** Message handler callback */
export type MessageHandler = (
  topic: string,
  payload: MQTTSensorPayload
) => void

/** Connection state change handler */
export type StateChangeHandler = (
  state: MQTTConnectionState,
  error?: Error
) => void

/** Sensor reading handler (higher-level abstraction) */
export type SensorReadingHandler = (
  equipmentId: string,
  readings: SensorReading[]
) => void

// =============================================================================
// MQTT Client Interface
// =============================================================================

export interface MQTTClient {
  /** Connect to the broker */
  connect: () => Promise<void>
  /** Disconnect from the broker */
  disconnect: () => Promise<void>
  /** Subscribe to additional topics */
  subscribe: (topics: string[]) => Promise<void>
  /** Unsubscribe from topics */
  unsubscribe: (topics: string[]) => Promise<void>
  /** Publish a message */
  publish: (topic: string, payload: unknown) => Promise<void>
  /** Register message handler */
  onMessage: (handler: MessageHandler) => void
  /** Register state change handler */
  onStateChange: (handler: StateChangeHandler) => void
  /** Get current connection state */
  getState: () => MQTTConnectionState
  /** Get subscribed topics */
  getTopics: () => string[]
  /** Check if connected */
  isConnected: () => boolean
}

// =============================================================================
// Simulated MQTT Client (for development/testing)
// =============================================================================

/**
 * Create a simulated MQTT client for development
 *
 * In production, replace with actual MQTT library implementation.
 */
export function createSimulatedMQTTClient(
  options: MQTTClientOptions
): MQTTClient {
  let state: MQTTConnectionState = 'disconnected'
  let topics: string[] = [...options.topics]
  let messageHandlers: MessageHandler[] = []
  let stateHandlers: StateChangeHandler[] = []
  let simulationInterval: ReturnType<typeof setInterval> | null = null
  let reconnectAttempts = 0

  const updateState = (newState: MQTTConnectionState, error?: Error) => {
    state = newState
    stateHandlers.forEach((handler) => handler(newState, error))
  }

  const generateSensorValue = (sensorType: string): number => {
    switch (sensorType) {
      case 'temperature':
        return 45 + Math.random() * 30 // 45-75°C
      case 'vibration':
        return 2 + Math.random() * 5 // 2-7 mm/s
      case 'current':
        return 10 + Math.random() * 5 // 10-15 A
      case 'noise':
        return 60 + Math.random() * 15 // 60-75 dB
      default:
        return Math.random() * 100
    }
  }

  const simulateMessages = () => {
    const equipmentIds = ['eq-001', 'eq-002', 'eq-003', 'eq-004', 'eq-005']
    const sensorTypes = ['temperature', 'vibration', 'current', 'noise']

    // Simulate one message per equipment per interval
    const equipmentId =
      equipmentIds[Math.floor(Math.random() * equipmentIds.length)]
    const sensorType =
      sensorTypes[Math.floor(Math.random() * sensorTypes.length)]

    const topic = `sensors/${equipmentId}/${sensorType}`
    const payload: MQTTSensorPayload = {
      equipmentId,
      sensorType,
      value: Math.round(generateSensorValue(sensorType) * 10) / 10,
      unit: sensorType === 'temperature' ? '°C' : sensorType === 'vibration' ? 'mm/s' : sensorType === 'current' ? 'A' : 'dB',
      timestamp: new Date().toISOString(),
    }

    // Check if topic matches any subscribed pattern
    const matchesTopic = topics.some((pattern) => {
      const regex = new RegExp(
        '^' +
          pattern.replace(/\+/g, '[^/]+').replace(/#/g, '.*') +
          '$'
      )
      return regex.test(topic)
    })

    if (matchesTopic) {
      messageHandlers.forEach((handler) => handler(topic, payload))
    }
  }

  return {
    async connect() {
      if (state === 'connected') return

      updateState('connecting')
      logger.info(`[MQTT] Connecting to ${options.brokerUrl}...`)

      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Simulate occasional connection failure (10% chance)
      if (Math.random() < 0.1 && reconnectAttempts < 3) {
        reconnectAttempts++
        updateState('error', new Error('Connection refused'))

        if (options.reconnect !== false) {
          updateState('reconnecting')
          await new Promise((resolve) =>
            setTimeout(resolve, options.reconnectInterval || 5000)
          )
          return this.connect()
        }
        throw new Error('Failed to connect to MQTT broker')
      }

      reconnectAttempts = 0
      updateState('connected')
      logger.info(`[MQTT] Connected to ${options.brokerUrl}`)

      // Start simulation
      simulationInterval = setInterval(simulateMessages, 3000)
    },

    async disconnect() {
      if (state === 'disconnected') return

      if (simulationInterval) {
        clearInterval(simulationInterval)
        simulationInterval = null
      }

      updateState('disconnected')
      logger.info('[MQTT] Disconnected')
    },

    async subscribe(newTopics) {
      topics = [...new Set([...topics, ...newTopics])]
      logger.info(`[MQTT] Subscribed to: ${newTopics.join(', ')}`)
    },

    async unsubscribe(topicsToRemove) {
      topics = topics.filter((t) => !topicsToRemove.includes(t))
      logger.info(`[MQTT] Unsubscribed from: ${topicsToRemove.join(', ')}`)
    },

    async publish(topic, payload) {
      if (state !== 'connected') {
        throw new Error('Not connected to MQTT broker')
      }
      logger.debug({ topic, payload }, '[MQTT] Message published')
    },

    onMessage(handler) {
      messageHandlers.push(handler)
    },

    onStateChange(handler) {
      stateHandlers.push(handler)
    },

    getState() {
      return state
    },

    getTopics() {
      return [...topics]
    },

    isConnected() {
      return state === 'connected'
    },
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Determine if real MQTT client should be used
 *
 * Uses real client when:
 * 1. MQTT_REAL_CONNECTION env var is explicitly set to 'true'
 * 2. Production environment AND broker URL is not localhost
 *
 * Uses simulated client when:
 * 1. MQTT_REAL_CONNECTION env var is 'false' or unset in dev
 * 2. Broker URL contains 'localhost' or '127.0.0.1'
 * 3. Running in test environment
 */
function shouldUseRealClient(options: MQTTClientOptions): boolean {
  // Explicit override via environment variable
  if (process.env.MQTT_REAL_CONNECTION === 'true') {
    return true
  }
  if (process.env.MQTT_REAL_CONNECTION === 'false') {
    return false
  }

  // Never use real client in test environment
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return false
  }

  // In production, use real client if broker is not localhost
  if (process.env.NODE_ENV === 'production') {
    const isLocalhost =
      options.brokerUrl.includes('localhost') ||
      options.brokerUrl.includes('127.0.0.1')
    return !isLocalhost
  }

  // Default to simulated in development
  return false
}

/**
 * Create an MQTT client
 *
 * Automatically selects between real (mqtt.js) and simulated client
 * based on environment configuration.
 *
 * @param options - Client configuration
 * @returns MQTTClient instance
 *
 * @example
 * ```ts
 * const client = createMQTTClient({
 *   brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
 *   clientId: `qetta-monitor-${Date.now()}`,
 *   topics: ['sensors/#'],
 * })
 * ```
 *
 * @remarks
 * - Set MQTT_REAL_CONNECTION=true to force real client
 * - Set MQTT_REAL_CONNECTION=false to force simulated client
 * - In production with non-localhost broker, real client is used automatically
 */
export function createMQTTClient(options: MQTTClientOptions): MQTTClient {
  if (shouldUseRealClient(options)) {
    // Dynamic import to avoid loading mqtt.js in test/dev environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createRealMQTTClient } = require('./mqtt/real-client')
    return createRealMQTTClient({
      brokerUrl: options.brokerUrl,
      clientId: options.clientId,
      username: options.username,
      password: options.password,
      keepalive: options.keepAlive,
      reconnectPeriod: options.reconnectInterval,
      connectTimeout: 30000,
      clean: options.cleanSession,
    })
  }

  return createSimulatedMQTTClient(options)
}

// =============================================================================
// Helper: Convert MQTT Payload to SensorReading
// =============================================================================

/**
 * Convert MQTT payload to SensorReading format
 */
export function mqttPayloadToSensorReading(
  payload: MQTTSensorPayload
): SensorReading {
  const normalRange = SENSOR_NORMAL_RANGES[payload.sensorType] || [0, 100]

  return {
    type: SENSOR_LABELS[payload.sensorType] || payload.sensorType,
    value: payload.value,
    unit: payload.unit,
    normalRange,
    status: getSensorStatus(payload.value, normalRange),
    timestamp: payload.timestamp,
  }
}

// =============================================================================
// Higher-Level Abstraction: MQTT Sensor Service
// =============================================================================

export interface MQTTSensorServiceOptions extends MQTTClientOptions {
  /** Aggregation interval in ms (batch readings) */
  aggregationInterval?: number
}

export interface MQTTSensorService {
  /** Start the service */
  start: () => Promise<void>
  /** Stop the service */
  stop: () => Promise<void>
  /** Register handler for aggregated sensor readings */
  onSensorData: (handler: SensorReadingHandler) => void
  /** Get underlying MQTT client */
  getClient: () => MQTTClient
}

/**
 * Create a higher-level sensor service that aggregates MQTT messages
 */
export function createMQTTSensorService(
  options: MQTTSensorServiceOptions
): MQTTSensorService {
  const client = createMQTTClient(options)
  const aggregationInterval = options.aggregationInterval || 1000
  let handlers: SensorReadingHandler[] = []
  let pendingReadings: Map<string, SensorReading[]> = new Map()
  let aggregationTimer: ReturnType<typeof setInterval> | null = null

  // Process MQTT messages and aggregate by equipment
  client.onMessage((_topic, payload) => {
    const reading = mqttPayloadToSensorReading(payload)
    const equipmentId = payload.equipmentId

    const existing = pendingReadings.get(equipmentId) || []
    // Update or add reading for this sensor type
    const idx = existing.findIndex((r) => r.type === reading.type)
    if (idx >= 0) {
      existing[idx] = reading
    } else {
      existing.push(reading)
    }
    pendingReadings.set(equipmentId, existing)
  })

  // Flush aggregated readings to handlers
  const flushReadings = () => {
    for (const [equipmentId, readings] of pendingReadings) {
      if (readings.length > 0) {
        handlers.forEach((handler) => handler(equipmentId, readings))
      }
    }
    pendingReadings.clear()
  }

  return {
    async start() {
      await client.connect()
      aggregationTimer = setInterval(flushReadings, aggregationInterval)
    },

    async stop() {
      if (aggregationTimer) {
        clearInterval(aggregationTimer)
        aggregationTimer = null
      }
      await client.disconnect()
    },

    onSensorData(handler) {
      handlers.push(handler)
    },

    getClient() {
      return client
    },
  }
}

// =============================================================================
// Default Configuration
// =============================================================================

/** Default MQTT topics for smart factory sensors */
export const DEFAULT_SENSOR_TOPICS = [
  'sensors/+/temperature',
  'sensors/+/vibration',
  'sensors/+/current',
  'sensors/+/noise',
  'sensors/+/oee',
]

/** Create a pre-configured client for smart factory monitoring */
export function createSmartFactoryMQTTClient(
  brokerUrl: string,
  clientId?: string
): MQTTClient {
  return createMQTTClient({
    brokerUrl,
    clientId: clientId || `qetta-smartfactory-${Date.now()}`,
    topics: DEFAULT_SENSOR_TOPICS,
    qos: 1,
    keepAlive: 60,
    reconnect: true,
    reconnectInterval: 5000,
    cleanSession: true,
  })
}
