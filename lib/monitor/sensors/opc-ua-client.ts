/**
 * OPC-UA Sensor Client
 *
 * Client for connecting to OPC-UA servers (industrial automation standard).
 * Supports Browse, Read, Write, and Subscribe operations.
 *
 * @module lib/monitor/sensors/opc-ua-client
 *
 * @see https://opcfoundation.org/about/opc-technologies/opc-ua/
 *
 * @example
 * ```ts
 * const client = createOPCUAClient({
 *   endpointUrl: 'opc.tcp://localhost:4840',
 *   securityMode: 'None',
 *   nodeIds: [
 *     'ns=2;s=Temperature',
 *     'ns=2;s=Vibration',
 *   ],
 * })
 *
 * client.onDataChange((nodeId, value) => {
 *   console.log(`Node ${nodeId} changed to ${value}`)
 * })
 *
 * await client.connect()
 * await client.subscribe()
 * ```
 *
 * Note: This is a type-safe wrapper. In production, use with 'node-opcua' package.
 */

import type { SensorReading } from '@/types/monitor'
import { opcuaLogger as logger } from '@/lib/monitor/observability/logger'
import {
  getSensorStatus,
  SENSOR_NORMAL_RANGES,
  SENSOR_LABELS,
  SENSOR_UNITS,
} from '@/lib/monitor/sensor-utils'

// =============================================================================
// Types
// =============================================================================

/** OPC-UA security modes */
export type SecurityMode = 'None' | 'Sign' | 'SignAndEncrypt'

/** OPC-UA security policies */
export type SecurityPolicy =
  | 'None'
  | 'Basic128Rsa15'
  | 'Basic256'
  | 'Basic256Sha256'
  | 'Aes128_Sha256_RsaOaep'
  | 'Aes256_Sha256_RsaPss'

/** OPC-UA Node ID formats */
export interface NodeId {
  /** Namespace index */
  namespaceIndex: number
  /** Identifier type */
  identifierType: 'numeric' | 'string' | 'guid' | 'opaque'
  /** Identifier value */
  value: string | number
}

/** OPC-UA connection options */
export interface OPCUAClientOptions {
  /** OPC-UA server endpoint URL */
  endpointUrl: string
  /** Security mode */
  securityMode?: SecurityMode
  /** Security policy */
  securityPolicy?: SecurityPolicy
  /** Client application name */
  applicationName?: string
  /** Username for authentication (optional) */
  username?: string
  /** Password for authentication (optional) */
  password?: string
  /** Node IDs to subscribe to (string format: "ns=2;s=Temperature") */
  nodeIds: string[]
  /** Subscription publishing interval in ms */
  publishingInterval?: number
  /** Session timeout in ms */
  sessionTimeout?: number
  /** Connection timeout in ms */
  connectionTimeout?: number
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean
}

/** OPC-UA data value */
export interface DataValue {
  /** The actual value */
  value: unknown
  /** Status code (Good, Bad, Uncertain) */
  statusCode: 'Good' | 'Bad' | 'Uncertain'
  /** Source timestamp */
  sourceTimestamp?: Date
  /** Server timestamp */
  serverTimestamp?: Date
}

/** Data change notification */
export interface DataChangeNotification {
  /** Node ID that changed */
  nodeId: string
  /** New value */
  dataValue: DataValue
}

/** Connection state */
export type OPCUAConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

/** Data change handler callback */
export type DataChangeHandler = (nodeId: string, dataValue: DataValue) => void

/** State change handler callback */
export type OPCUAStateChangeHandler = (
  state: OPCUAConnectionState,
  error?: Error
) => void

// =============================================================================
// OPC-UA Client Interface
// =============================================================================

export interface OPCUAClient {
  /** Connect to the server */
  connect: () => Promise<void>
  /** Disconnect from the server */
  disconnect: () => Promise<void>
  /** Create and activate subscription */
  subscribe: () => Promise<void>
  /** Read a node value */
  read: (nodeId: string) => Promise<DataValue>
  /** Read multiple node values */
  readMultiple: (nodeIds: string[]) => Promise<Map<string, DataValue>>
  /** Write a value to a node */
  write: (nodeId: string, value: unknown) => Promise<void>
  /** Browse node children */
  browse: (nodeId?: string) => Promise<BrowseResult[]>
  /** Register data change handler */
  onDataChange: (handler: DataChangeHandler) => void
  /** Register state change handler */
  onStateChange: (handler: OPCUAStateChangeHandler) => void
  /** Get current connection state */
  getState: () => OPCUAConnectionState
  /** Check if connected */
  isConnected: () => boolean
}

/** Browse result for a node */
export interface BrowseResult {
  /** Node ID */
  nodeId: string
  /** Display name */
  displayName: string
  /** Node class (Variable, Object, Method, etc.) */
  nodeClass: string
  /** Whether the node is browsable */
  isForward: boolean
}

// =============================================================================
// Simulated OPC-UA Client (for development/testing)
// =============================================================================

/**
 * Create a simulated OPC-UA client for development
 */
function createSimulatedOPCUAClient(options: OPCUAClientOptions): OPCUAClient {
  let state: OPCUAConnectionState = 'disconnected'
  let dataChangeHandlers: DataChangeHandler[] = []
  let stateHandlers: OPCUAStateChangeHandler[] = []
  let subscriptionInterval: ReturnType<typeof setInterval> | null = null

  // Simulated node values (realistic smart factory data)
  const nodeValues: Map<string, number> = new Map()
  const nodeBaseValues: Record<string, { base: number; variance: number }> = {
    'ns=2;s=Temperature': { base: 55, variance: 20 },
    'ns=2;s=Vibration': { base: 3.5, variance: 3 },
    'ns=2;s=Current': { base: 12, variance: 3 },
    'ns=2;s=Noise': { base: 68, variance: 10 },
    'ns=2;s=OEE.Overall': { base: 82, variance: 10 },
    'ns=2;s=OEE.Availability': { base: 90, variance: 8 },
    'ns=2;s=OEE.Performance': { base: 88, variance: 8 },
    'ns=2;s=OEE.Quality': { base: 97, variance: 3 },
    'ns=2;s=ProductionCount': { base: 1000, variance: 100 },
    'ns=2;s=DefectCount': { base: 5, variance: 5 },
  }

  // Initialize node values
  options.nodeIds.forEach((nodeId) => {
    const config = nodeBaseValues[nodeId] || { base: 50, variance: 25 }
    nodeValues.set(
      nodeId,
      config.base + (Math.random() - 0.5) * config.variance
    )
  })

  const updateState = (newState: OPCUAConnectionState, error?: Error) => {
    state = newState
    stateHandlers.forEach((handler) => handler(newState, error))
  }

  const generateNewValue = (nodeId: string): number => {
    const current = nodeValues.get(nodeId) || 50
    const config = nodeBaseValues[nodeId] || { base: 50, variance: 25 }

    // Random walk with mean reversion
    const drift = (config.base - current) * 0.1
    const noise = (Math.random() - 0.5) * config.variance * 0.3
    const newValue = current + drift + noise

    nodeValues.set(nodeId, newValue)
    return Math.round(newValue * 100) / 100
  }

  const simulateDataChanges = () => {
    // Randomly update some nodes each interval
    const nodesToUpdate = options.nodeIds.filter(() => Math.random() > 0.5)

    for (const nodeId of nodesToUpdate) {
      const value = generateNewValue(nodeId)
      const dataValue: DataValue = {
        value,
        statusCode: 'Good',
        sourceTimestamp: new Date(),
        serverTimestamp: new Date(),
      }
      dataChangeHandlers.forEach((handler) => handler(nodeId, dataValue))
    }
  }

  return {
    async connect() {
      if (state === 'connected') return

      updateState('connecting')
      logger.info(`[OPC-UA] Connecting to ${options.endpointUrl}...`)

      // Simulate connection delay
      await new Promise((resolve) =>
        setTimeout(resolve, options.connectionTimeout || 1000)
      )

      updateState('connected')
      logger.info(`[OPC-UA] Connected to ${options.endpointUrl}`)
    },

    async disconnect() {
      if (state === 'disconnected') return

      if (subscriptionInterval) {
        clearInterval(subscriptionInterval)
        subscriptionInterval = null
      }

      updateState('disconnected')
      logger.info('[OPC-UA] Disconnected')
    },

    async subscribe() {
      if (state !== 'connected') {
        throw new Error('Not connected to OPC-UA server')
      }

      logger.info(
        `[OPC-UA] Created subscription for ${options.nodeIds.length} nodes`
      )

      // Start simulation
      subscriptionInterval = setInterval(
        simulateDataChanges,
        options.publishingInterval || 1000
      )
    },

    async read(nodeId) {
      if (state !== 'connected') {
        throw new Error('Not connected to OPC-UA server')
      }

      const value = nodeValues.get(nodeId) ?? generateNewValue(nodeId)
      return {
        value,
        statusCode: 'Good',
        sourceTimestamp: new Date(),
        serverTimestamp: new Date(),
      }
    },

    async readMultiple(nodeIds) {
      const results = new Map<string, DataValue>()
      for (const nodeId of nodeIds) {
        results.set(nodeId, await this.read(nodeId))
      }
      return results
    },

    async write(nodeId, value) {
      if (state !== 'connected') {
        throw new Error('Not connected to OPC-UA server')
      }

      if (typeof value === 'number') {
        nodeValues.set(nodeId, value)
      }
      logger.debug(`[OPC-UA] Wrote ${value} to ${nodeId}`)
    },

    async browse(nodeId) {
      // Return simulated browse results
      const results: BrowseResult[] = [
        {
          nodeId: 'ns=2;s=Equipment',
          displayName: 'Equipment',
          nodeClass: 'Object',
          isForward: true,
        },
        {
          nodeId: 'ns=2;s=Sensors',
          displayName: 'Sensors',
          nodeClass: 'Object',
          isForward: true,
        },
        {
          nodeId: 'ns=2;s=Alarms',
          displayName: 'Alarms',
          nodeClass: 'Object',
          isForward: true,
        },
      ]

      if (nodeId?.includes('Equipment')) {
        return [
          {
            nodeId: 'ns=2;s=Equipment.CNC001',
            displayName: 'CNC Machine 001',
            nodeClass: 'Object',
            isForward: true,
          },
          {
            nodeId: 'ns=2;s=Equipment.PRS002',
            displayName: 'Press Machine 002',
            nodeClass: 'Object',
            isForward: true,
          },
        ]
      }

      return results
    },

    onDataChange(handler) {
      dataChangeHandlers.push(handler)
    },

    onStateChange(handler) {
      stateHandlers.push(handler)
    },

    getState() {
      return state
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
 * Determine if real OPC-UA client should be used
 *
 * Uses real client when:
 * 1. OPCUA_REAL_CONNECTION env var is explicitly set to 'true'
 * 2. Production environment AND endpoint URL is not localhost
 *
 * Uses simulated client when:
 * 1. OPCUA_REAL_CONNECTION env var is 'false' or unset in dev
 * 2. Endpoint URL contains 'localhost' or '127.0.0.1'
 * 3. Running in test environment
 */
function shouldUseRealClient(options: OPCUAClientOptions): boolean {
  // Explicit override via environment variable
  if (process.env.OPCUA_REAL_CONNECTION === 'true') {
    return true
  }
  if (process.env.OPCUA_REAL_CONNECTION === 'false') {
    return false
  }

  // Never use real client in test environment
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return false
  }

  // In production, use real client if endpoint is not localhost
  if (process.env.NODE_ENV === 'production') {
    const isLocalhost =
      options.endpointUrl.includes('localhost') ||
      options.endpointUrl.includes('127.0.0.1')
    return !isLocalhost
  }

  // Default to simulated in development
  return false
}

/**
 * Enforce security settings in production environment
 *
 * In production, security mode 'None' is NOT allowed for non-localhost endpoints.
 * This prevents accidental deployment of insecure configurations.
 *
 * @param options - Original client options
 * @returns Options with enforced security settings
 * @throws Error if 'None' security mode is used in production with non-localhost endpoint
 */
function enforceProductionSecurity(options: OPCUAClientOptions): OPCUAClientOptions {
  const isProduction = process.env.NODE_ENV === 'production'
  const isLocalhost =
    options.endpointUrl.includes('localhost') ||
    options.endpointUrl.includes('127.0.0.1')

  // Skip enforcement for localhost or non-production
  if (!isProduction || isLocalhost) {
    return options
  }

  // Enforce secure mode in production for remote endpoints
  if (!options.securityMode || options.securityMode === 'None') {
    logger.warn(
      '[OPC-UA] Security mode "None" is not allowed in production. Enforcing "SignAndEncrypt".'
    )
    return {
      ...options,
      securityMode: 'SignAndEncrypt',
      securityPolicy: options.securityPolicy ?? 'Basic256Sha256',
    }
  }

  // Upgrade deprecated security policies
  if (options.securityPolicy === 'Basic128Rsa15' || options.securityPolicy === 'Basic256') {
    logger.warn(
      `[OPC-UA] Security policy "${options.securityPolicy}" is deprecated. Upgrading to "Basic256Sha256".`
    )
    return {
      ...options,
      securityPolicy: 'Basic256Sha256',
    }
  }

  return options
}

/**
 * Create an OPC-UA client
 *
 * Automatically selects between real (node-opcua) and simulated client
 * based on environment configuration.
 *
 * @param options - Client configuration
 * @returns OPCUAClient instance
 *
 * @example
 * ```ts
 * const client = createOPCUAClient({
 *   endpointUrl: process.env.OPCUA_ENDPOINT_URL || 'opc.tcp://localhost:4840',
 *   nodeIds: ['ns=2;s=Temperature', 'ns=2;s=Vibration'],
 * })
 * ```
 *
 * @remarks
 * - Set OPCUA_REAL_CONNECTION=true to force real client
 * - Set OPCUA_REAL_CONNECTION=false to force simulated client
 * - In production with non-localhost endpoint, real client is used automatically
 * - In production, security mode 'None' is automatically upgraded to 'SignAndEncrypt'
 */
export function createOPCUAClient(options: OPCUAClientOptions): OPCUAClient {
  // Enforce security settings in production
  const secureOptions = enforceProductionSecurity(options)

  if (shouldUseRealClient(secureOptions)) {
    // Dynamic import to avoid loading node-opcua in test/dev environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createRealOPCUAClient } = require('./opcua/real-client')
    return createRealOPCUAClient({
      endpointUrl: secureOptions.endpointUrl,
      applicationName: secureOptions.applicationName,
      security: secureOptions.securityMode !== 'None' ? {
        securityMode: secureOptions.securityMode,
        securityPolicy: secureOptions.securityPolicy === 'Basic128Rsa15' || secureOptions.securityPolicy === 'Basic256'
          ? 'Basic256Sha256' // Upgrade deprecated policies
          : secureOptions.securityPolicy,
      } : undefined,
      username: secureOptions.username,
      password: secureOptions.password,
      sessionTimeout: secureOptions.sessionTimeout,
      connectionTimeout: secureOptions.connectionTimeout,
      autoReconnect: secureOptions.autoReconnect,
    }, secureOptions.nodeIds)
  }

  return createSimulatedOPCUAClient(secureOptions)
}

// =============================================================================
// Helper: Parse Node ID String
// =============================================================================

/**
 * Parse OPC-UA node ID string to NodeId object
 *
 * @param nodeIdString - Node ID string (e.g., "ns=2;s=Temperature")
 * @returns Parsed NodeId object
 */
export function parseNodeId(nodeIdString: string): NodeId {
  const parts = nodeIdString.split(';')
  let namespaceIndex = 0
  let identifierType: NodeId['identifierType'] = 'string'
  let value: string | number = ''

  for (const part of parts) {
    if (part.startsWith('ns=')) {
      namespaceIndex = parseInt(part.slice(3), 10)
    } else if (part.startsWith('s=')) {
      identifierType = 'string'
      value = part.slice(2)
    } else if (part.startsWith('i=')) {
      identifierType = 'numeric'
      value = parseInt(part.slice(2), 10)
    } else if (part.startsWith('g=')) {
      identifierType = 'guid'
      value = part.slice(2)
    } else if (part.startsWith('b=')) {
      identifierType = 'opaque'
      value = part.slice(2)
    }
  }

  return { namespaceIndex, identifierType, value }
}

/**
 * Serialize NodeId object to string
 */
export function serializeNodeId(nodeId: NodeId): string {
  const typePrefix =
    nodeId.identifierType === 'numeric'
      ? 'i'
      : nodeId.identifierType === 'guid'
        ? 'g'
        : nodeId.identifierType === 'opaque'
          ? 'b'
          : 's'

  return `ns=${nodeId.namespaceIndex};${typePrefix}=${nodeId.value}`
}

// =============================================================================
// Higher-Level Abstraction: OPC-UA Sensor Service
// =============================================================================

export interface OPCUASensorServiceOptions extends OPCUAClientOptions {
  /** Map OPC-UA node IDs to equipment IDs */
  equipmentMapping: Record<string, string>
  /** Map OPC-UA node IDs to sensor types */
  sensorMapping: Record<string, string>
}

export interface OPCUASensorService {
  /** Start the service */
  start: () => Promise<void>
  /** Stop the service */
  stop: () => Promise<void>
  /** Register handler for sensor readings */
  onSensorData: (
    handler: (equipmentId: string, readings: SensorReading[]) => void
  ) => void
  /** Get underlying OPC-UA client */
  getClient: () => OPCUAClient
}

/**
 * Create a higher-level sensor service that abstracts OPC-UA complexity
 */
export function createOPCUASensorService(
  options: OPCUASensorServiceOptions
): OPCUASensorService {
  const client = createOPCUAClient(options)
  let handlers: ((equipmentId: string, readings: SensorReading[]) => void)[] =
    []

  // Aggregate readings by equipment
  const pendingReadings: Map<string, SensorReading[]> = new Map()

  client.onDataChange((nodeId, dataValue) => {
    const equipmentId = options.equipmentMapping[nodeId]
    const sensorType = options.sensorMapping[nodeId]

    if (!equipmentId || !sensorType || dataValue.statusCode !== 'Good') {
      return
    }

    const value = dataValue.value as number
    const normalRange = SENSOR_NORMAL_RANGES[sensorType] || [0, 100]

    const reading: SensorReading = {
      type: SENSOR_LABELS[sensorType] || sensorType,
      value: Math.round(value * 10) / 10,
      unit: SENSOR_UNITS[sensorType] || '',
      normalRange,
      status: getSensorStatus(value, normalRange),
      timestamp: dataValue.sourceTimestamp?.toISOString() || new Date().toISOString(),
    }

    // Update or add to pending readings
    const existing = pendingReadings.get(equipmentId) || []
    const idx = existing.findIndex((r) => r.type === reading.type)
    if (idx >= 0) {
      existing[idx] = reading
    } else {
      existing.push(reading)
    }
    pendingReadings.set(equipmentId, existing)

    // Dispatch immediately for real-time updates
    handlers.forEach((handler) =>
      handler(equipmentId, pendingReadings.get(equipmentId) || [])
    )
  })

  return {
    async start() {
      await client.connect()
      await client.subscribe()
    },

    async stop() {
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

/** Default OPC-UA nodes for smart factory */
export const DEFAULT_OPCUA_NODES = [
  'ns=2;s=Temperature',
  'ns=2;s=Vibration',
  'ns=2;s=Current',
  'ns=2;s=Noise',
  'ns=2;s=OEE.Overall',
  'ns=2;s=OEE.Availability',
  'ns=2;s=OEE.Performance',
  'ns=2;s=OEE.Quality',
]

/**
 * Create a pre-configured client for smart factory monitoring
 *
 * Security settings are environment-aware:
 * - Development/localhost: Uses 'None' for easier debugging
 * - Production/remote: Enforces 'SignAndEncrypt' automatically
 */
export function createSmartFactoryOPCUAClient(
  endpointUrl: string,
  securityOverride?: { mode?: SecurityMode; policy?: SecurityPolicy }
): OPCUAClient {
  // Default to 'None' in dev, but enforceProductionSecurity will upgrade in prod
  const securityMode = securityOverride?.mode ??
    (process.env.OPCUA_SECURITY_MODE as SecurityMode | undefined) ??
    'None'

  const securityPolicy = securityOverride?.policy ??
    (process.env.OPCUA_SECURITY_POLICY as SecurityPolicy | undefined) ??
    'Basic256Sha256'

  return createOPCUAClient({
    endpointUrl,
    securityMode,
    securityPolicy,
    applicationName: 'QETTA Smart Factory Monitor',
    nodeIds: DEFAULT_OPCUA_NODES,
    publishingInterval: 1000,
    sessionTimeout: 60000,
    autoReconnect: true,
  })
}
