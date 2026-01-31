/**
 * Unified Sensor Service
 *
 * Integrates MQTT and OPC-UA clients into a single service for real-time
 * sensor data collection. Provides automatic reconnection, data transformation,
 * and unified event handling.
 *
 * @module lib/monitor/sensors/sensor-service
 *
 * @example
 * ```ts
 * const service = createSensorService({
 *   mqtt: {
 *     brokerUrl: 'mqtt://localhost:1883',
 *     topics: ['sensors/#'],
 *   },
 *   opcua: {
 *     endpointUrl: 'opc.tcp://localhost:4840',
 *     nodeIds: ['ns=2;s=Temperature'],
 *   },
 * })
 *
 * service.onSensorData((equipmentId, readings) => {
 *   console.log(`[${equipmentId}]`, readings)
 * })
 *
 * await service.start()
 * ```
 */

import type { SensorReading } from '@/types/monitor'
import { sensorLogger as logger } from '@/lib/monitor/observability/logger'
import {
  createMQTTClient,
  mqttPayloadToSensorReading,
  type MQTTClient,
  type MQTTClientOptions,
  type MQTTConnectionState,
} from './mqtt-client'
import {
  createOPCUAClient,
  type OPCUAClient,
  type OPCUAClientOptions,
  type OPCUAConnectionState,
  type DataValue,
} from './opc-ua-client'
import {
  getSensorStatus,
  SENSOR_NORMAL_RANGES,
  SENSOR_LABELS,
  SENSOR_UNITS,
} from '@/lib/monitor/sensor-utils'
import { createHandlerRegistry } from '@/lib/monitor/handler-registry'
import {
  createSensorCircuitBreaker,
  type CircuitBreaker,
  type CircuitBreakerState,
} from './circuit-breaker'

// =============================================================================
// Types
// =============================================================================

/** Sensor service configuration */
export interface SensorServiceConfig {
  /** MQTT client configuration (optional) */
  mqtt?: Partial<Omit<MQTTClientOptions, 'topics'>> & {
    /** MQTT broker URL (required if mqtt is specified) */
    brokerUrl: string
    topics?: string[]
    /** Equipment ID extraction from topic */
    equipmentIdFromTopic?: (topic: string) => string | null
  }
  /** OPC-UA client configuration (optional) */
  opcua?: Partial<Omit<OPCUAClientOptions, 'nodeIds'>> & {
    /** OPC-UA endpoint URL (required if opcua is specified) */
    endpointUrl: string
    nodeIds?: string[]
    /** Equipment mapping: nodeId -> equipmentId */
    equipmentMapping?: Record<string, string>
    /** Sensor type mapping: nodeId -> sensorType */
    sensorMapping?: Record<string, string>
  }
  /** Reconnection configuration */
  reconnect?: {
    /** Enable automatic reconnection */
    enabled?: boolean
    /** Initial delay in ms */
    initialDelay?: number
    /** Maximum delay in ms */
    maxDelay?: number
    /** Maximum attempts (0 = unlimited) */
    maxAttempts?: number
  }
}

/** Connection status for both clients */
export interface ConnectionStatus {
  mqtt: {
    state: MQTTConnectionState
    lastError?: string
    reconnectAttempts: number
    circuitBreakerState?: CircuitBreakerState
  }
  opcua: {
    state: OPCUAConnectionState
    lastError?: string
    reconnectAttempts: number
    circuitBreakerState?: CircuitBreakerState
  }
}

/** Sensor data handler */
export type SensorDataHandler = (
  equipmentId: string,
  readings: SensorReading[]
) => void

/** Connection status change handler */
export type ConnectionStatusHandler = (status: ConnectionStatus) => void

/** Unified sensor service interface */
export interface SensorService {
  /** Start the sensor service */
  start: () => Promise<void>
  /** Stop the sensor service */
  stop: () => Promise<void>
  /** Register sensor data handler */
  onSensorData: (handler: SensorDataHandler) => () => void
  /** Register connection status handler */
  onConnectionStatus: (handler: ConnectionStatusHandler) => () => void
  /** Get current connection status */
  getConnectionStatus: () => ConnectionStatus
  /** Check if service is running */
  isRunning: () => boolean
  /** Get underlying clients (for advanced usage) */
  getClients: () => { mqtt: MQTTClient | null; opcua: OPCUAClient | null }
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_MQTT_TOPICS = [
  'sensors/+/temperature',
  'sensors/+/vibration',
  'sensors/+/current',
  'sensors/+/noise',
]

const DEFAULT_OPCUA_NODES = [
  'ns=2;s=Temperature',
  'ns=2;s=Vibration',
  'ns=2;s=Current',
  'ns=2;s=Noise',
]

const DEFAULT_RECONNECT_CONFIG = {
  enabled: true,
  initialDelay: 1000,
  maxDelay: 30000,
  maxAttempts: 0, // unlimited
}

// =============================================================================
// Sensor Service Implementation
// =============================================================================

/**
 * Create a unified sensor service
 *
 * This service manages both MQTT and OPC-UA clients, providing:
 * - Unified data handling across protocols
 * - Automatic reconnection with exponential backoff
 * - Connection status monitoring
 * - Clean resource management
 */
export function createSensorService(config: SensorServiceConfig): SensorService {
  let mqttClient: MQTTClient | null = null
  let opcuaClient: OPCUAClient | null = null
  let running = false

  // Handler registries
  const sensorDataHandlers = createHandlerRegistry<SensorDataHandler>()
  const connectionStatusHandlers = createHandlerRegistry<ConnectionStatusHandler>()

  // Aggregated sensor readings per equipment
  const pendingReadings: Map<string, SensorReading[]> = new Map()

  // Connection status
  const connectionStatus: ConnectionStatus = {
    mqtt: { state: 'disconnected', reconnectAttempts: 0 },
    opcua: { state: 'disconnected', reconnectAttempts: 0 },
  }

  // Reconnect timers
  let mqttReconnectTimer: ReturnType<typeof setTimeout> | null = null
  let opcuaReconnectTimer: ReturnType<typeof setTimeout> | null = null

  const reconnectConfig = { ...DEFAULT_RECONNECT_CONFIG, ...config.reconnect }

  // Circuit breakers for connection protection
  const mqttCircuitBreaker: CircuitBreaker = createSensorCircuitBreaker(
    (state, previousState) => {
      logger.info(`[SensorService] MQTT circuit breaker: ${previousState} → ${state}`)
      connectionStatus.mqtt.circuitBreakerState = state
      notifyConnectionStatus()
    }
  )

  const opcuaCircuitBreaker: CircuitBreaker = createSensorCircuitBreaker(
    (state, previousState) => {
      logger.info(`[SensorService] OPC-UA circuit breaker: ${previousState} → ${state}`)
      connectionStatus.opcua.circuitBreakerState = state
      notifyConnectionStatus()
    }
  )

  /**
   * Notify connection status handlers
   */
  const notifyConnectionStatus = () => {
    connectionStatusHandlers.getAll().forEach((handler) => handler(connectionStatus))
  }

  /**
   * Calculate reconnection delay with exponential backoff
   */
  const getReconnectDelay = (attempts: number): number => {
    const delay = reconnectConfig.initialDelay * Math.pow(2, attempts)
    return Math.min(delay, reconnectConfig.maxDelay)
  }

  /**
   * Extract equipment ID from MQTT topic
   */
  const extractEquipmentIdFromTopic = (topic: string): string | null => {
    if (config.mqtt?.equipmentIdFromTopic) {
      return config.mqtt.equipmentIdFromTopic(topic)
    }
    // Default: sensors/{equipmentId}/{sensorType}
    const parts = topic.split('/')
    if (parts.length >= 2 && parts[0] === 'sensors') {
      return parts[1]
    }
    return null
  }

  /**
   * Convert OPC-UA data value to sensor reading
   */
  const opcuaDataToReading = (
    nodeId: string,
    dataValue: DataValue
  ): { equipmentId: string; reading: SensorReading } | null => {
    const equipmentId = config.opcua?.equipmentMapping?.[nodeId] || 'eq-default'
    const sensorType = config.opcua?.sensorMapping?.[nodeId] || nodeId.split(';').pop()?.split('=').pop() || 'unknown'

    if (dataValue.statusCode !== 'Good' || typeof dataValue.value !== 'number') {
      return null
    }

    const value = dataValue.value
    const normalRange = SENSOR_NORMAL_RANGES[sensorType] || [0, 100]

    return {
      equipmentId,
      reading: {
        type: SENSOR_LABELS[sensorType] || sensorType,
        value: Math.round(value * 10) / 10,
        unit: SENSOR_UNITS[sensorType] || '',
        normalRange,
        status: getSensorStatus(value, normalRange),
        timestamp: dataValue.sourceTimestamp?.toISOString() || new Date().toISOString(),
      },
    }
  }

  /**
   * Update pending readings and notify handlers
   */
  const updateReadings = (equipmentId: string, reading: SensorReading) => {
    const existing = pendingReadings.get(equipmentId) || []
    const idx = existing.findIndex((r) => r.type === reading.type)
    if (idx >= 0) {
      existing[idx] = reading
    } else {
      existing.push(reading)
    }
    pendingReadings.set(equipmentId, existing)

    // Notify handlers immediately
    const readings = pendingReadings.get(equipmentId) || []
    sensorDataHandlers.getAll().forEach((handler) => handler(equipmentId, readings))
  }

  /**
   * Setup MQTT client
   */
  const setupMQTT = async () => {
    if (!config.mqtt) return

    const topics = config.mqtt.topics || DEFAULT_MQTT_TOPICS

    mqttClient = createMQTTClient({
      ...config.mqtt,
      topics,
      clientId: config.mqtt.clientId || `qetta-sensor-${Date.now()}`,
    })

    // Handle state changes
    mqttClient.onStateChange((state, error) => {
      connectionStatus.mqtt.state = state
      if (error) {
        connectionStatus.mqtt.lastError = error.message
      }
      notifyConnectionStatus()

      // Handle disconnection with reconnect
      if (state === 'disconnected' && running && reconnectConfig.enabled) {
        scheduleReconnect('mqtt')
      } else if (state === 'connected') {
        connectionStatus.mqtt.reconnectAttempts = 0
      }
    })

    // Handle messages
    mqttClient.onMessage((topic, payload) => {
      const equipmentId = extractEquipmentIdFromTopic(topic)
      if (!equipmentId) return

      const reading = mqttPayloadToSensorReading(payload)
      updateReadings(equipmentId, reading)
    })

    // Initial connection through circuit breaker
    const result = await mqttCircuitBreaker.execute(async () => {
      await mqttClient!.connect()
    })

    if (result.success) {
      logger.info('[SensorService] MQTT client connected')
    } else {
      logger.error({ err: result.error }, '[SensorService] MQTT connection failed')
      connectionStatus.mqtt.lastError = result.error?.message
      if (reconnectConfig.enabled && !result.rejected) {
        scheduleReconnect('mqtt')
      }
    }
  }

  /**
   * Setup OPC-UA client
   */
  const setupOPCUA = async () => {
    if (!config.opcua) return

    const nodeIds = config.opcua.nodeIds || DEFAULT_OPCUA_NODES

    opcuaClient = createOPCUAClient({
      ...config.opcua,
      nodeIds,
      applicationName: config.opcua.applicationName || 'QETTA Sensor Service',
    })

    // Handle state changes
    opcuaClient.onStateChange((state, error) => {
      connectionStatus.opcua.state = state
      if (error) {
        connectionStatus.opcua.lastError = error.message
      }
      notifyConnectionStatus()

      // Handle disconnection with reconnect
      if (state === 'disconnected' && running && reconnectConfig.enabled) {
        scheduleReconnect('opcua')
      } else if (state === 'connected') {
        connectionStatus.opcua.reconnectAttempts = 0
      }
    })

    // Handle data changes
    opcuaClient.onDataChange((nodeId, dataValue) => {
      const result = opcuaDataToReading(nodeId, dataValue)
      if (result) {
        updateReadings(result.equipmentId, result.reading)
      }
    })

    // Initial connection through circuit breaker
    const result = await opcuaCircuitBreaker.execute(async () => {
      await opcuaClient!.connect()
      await opcuaClient!.subscribe()
    })

    if (result.success) {
      logger.info('[SensorService] OPC-UA client connected')
    } else {
      logger.error({ err: result.error }, '[SensorService] OPC-UA connection failed')
      connectionStatus.opcua.lastError = result.error?.message
      if (reconnectConfig.enabled && !result.rejected) {
        scheduleReconnect('opcua')
      }
    }
  }

  /**
   * Schedule reconnection with exponential backoff and circuit breaker protection
   */
  const scheduleReconnect = (client: 'mqtt' | 'opcua') => {
    const status = client === 'mqtt' ? connectionStatus.mqtt : connectionStatus.opcua
    const timer = client === 'mqtt' ? mqttReconnectTimer : opcuaReconnectTimer
    const circuitBreaker = client === 'mqtt' ? mqttCircuitBreaker : opcuaCircuitBreaker

    // Check if circuit breaker is open (fail fast)
    if (circuitBreaker.getState() === 'open') {
      logger.info(`[SensorService] ${client.toUpperCase()} circuit breaker is open, skipping reconnect`)
      return
    }

    // Check max attempts
    if (reconnectConfig.maxAttempts > 0 && status.reconnectAttempts >= reconnectConfig.maxAttempts) {
      logger.warn(`[SensorService] ${client.toUpperCase()} max reconnect attempts reached`)
      return
    }

    // Clear existing timer
    if (timer) {
      clearTimeout(timer)
    }

    const delay = getReconnectDelay(status.reconnectAttempts)
    status.reconnectAttempts++

    logger.info(`[SensorService] Scheduling ${client.toUpperCase()} reconnect in ${delay}ms (attempt ${status.reconnectAttempts})`)

    const newTimer = setTimeout(async () => {
      if (!running) return

      // Execute connection through circuit breaker
      const result = await circuitBreaker.execute(async () => {
        if (client === 'mqtt' && mqttClient) {
          await mqttClient.connect()
        } else if (client === 'opcua' && opcuaClient) {
          await opcuaClient.connect()
          await opcuaClient.subscribe()
        }
      })

      if (!result.success) {
        if (result.rejected) {
          logger.warn(`[SensorService] ${client.toUpperCase()} reconnect rejected by circuit breaker`)
        } else {
          logger.error({ err: result.error, client }, '[SensorService] Reconnect failed')
          scheduleReconnect(client)
        }
      }
    }, delay)

    if (client === 'mqtt') {
      mqttReconnectTimer = newTimer
    } else {
      opcuaReconnectTimer = newTimer
    }
  }

  return {
    async start() {
      if (running) {
        logger.warn('[SensorService] Service already running')
        return
      }

      running = true
      logger.info('[SensorService] Starting sensor service...')

      // Start clients in parallel
      await Promise.all([setupMQTT(), setupOPCUA()])

      logger.info('[SensorService] Sensor service started')
    },

    async stop() {
      if (!running) return

      running = false
      logger.info('[SensorService] Stopping sensor service...')

      // Clear reconnect timers
      if (mqttReconnectTimer) {
        clearTimeout(mqttReconnectTimer)
        mqttReconnectTimer = null
      }
      if (opcuaReconnectTimer) {
        clearTimeout(opcuaReconnectTimer)
        opcuaReconnectTimer = null
      }

      // Disconnect clients
      const disconnectPromises: Promise<void>[] = []

      if (mqttClient) {
        disconnectPromises.push(mqttClient.disconnect())
      }
      if (opcuaClient) {
        disconnectPromises.push(opcuaClient.disconnect())
      }

      await Promise.all(disconnectPromises)

      // Reset status
      connectionStatus.mqtt = { state: 'disconnected', reconnectAttempts: 0 }
      connectionStatus.opcua = { state: 'disconnected', reconnectAttempts: 0 }
      notifyConnectionStatus()

      pendingReadings.clear()
      logger.info('[SensorService] Sensor service stopped')
    },

    onSensorData(handler: SensorDataHandler) {
      return sensorDataHandlers.add(handler)
    },

    onConnectionStatus(handler: ConnectionStatusHandler) {
      return connectionStatusHandlers.add(handler)
    },

    getConnectionStatus() {
      return { ...connectionStatus }
    },

    isRunning() {
      return running
    },

    getClients() {
      return { mqtt: mqttClient, opcua: opcuaClient }
    },
  }
}

// =============================================================================
// Factory for Pre-configured Services
// =============================================================================

/**
 * Create a sensor service configured for smart factory monitoring
 */
export function createSmartFactorySensorService(options?: {
  mqttBrokerUrl?: string
  opcuaEndpointUrl?: string
}): SensorService {
  return createSensorService({
    mqtt: options?.mqttBrokerUrl
      ? {
          brokerUrl: options.mqttBrokerUrl,
          topics: DEFAULT_MQTT_TOPICS,
        }
      : undefined,
    opcua: options?.opcuaEndpointUrl
      ? {
          endpointUrl: options.opcuaEndpointUrl,
          nodeIds: DEFAULT_OPCUA_NODES,
          equipmentMapping: {
            'ns=2;s=Temperature': 'eq-001',
            'ns=2;s=Vibration': 'eq-001',
            'ns=2;s=Current': 'eq-002',
            'ns=2;s=Noise': 'eq-002',
          },
          sensorMapping: {
            'ns=2;s=Temperature': 'temperature',
            'ns=2;s=Vibration': 'vibration',
            'ns=2;s=Current': 'current',
            'ns=2;s=Noise': 'noise',
          },
        }
      : undefined,
    reconnect: {
      enabled: true,
      initialDelay: 1000,
      maxDelay: 30000,
    },
  })
}
