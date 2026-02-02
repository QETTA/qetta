/**
 * Real OPC-UA Client Implementation
 *
 * Production-ready OPC-UA client using node-opcua library.
 * Supports security modes, authentication, subscriptions, and session management.
 *
 * @module lib/monitor/sensors/opcua/real-client
 *
 * @example
 * ```ts
 * const client = createRealOPCUAClient({
 *   endpointUrl: 'opc.tcp://plc.factory.local:4840',
 *   applicationName: 'QETTA Monitor',
 *   security: {
 *     securityMode: 'SignAndEncrypt',
 *     securityPolicy: 'Basic256Sha256',
 *   },
 *   username: process.env.OPCUA_USERNAME,
 *   password: process.env.OPCUA_PASSWORD,
 * })
 *
 * client.onDataChange((nodeId, value) => {
 *   console.log(`[${nodeId}]`, value)
 * })
 *
 * await client.connect()
 * await client.subscribe()
 * ```
 */

import type {
  OPCUAClient as IOPCUAClient,
  ClientSession,
  ClientSubscription,
  ClientMonitoredItem,
} from 'node-opcua-client'
import type {
  OPCUAClient,
  OPCUAConnectionState,
  DataValue,
  DataChangeHandler,
  OPCUAStateChangeHandler,
  BrowseResult,
} from '../opc-ua-client'
import type {
  OPCUAConnectionConfig,
  OPCUASubscriptionConfig,
  OPCUAMonitoredItemConfig,
} from './types'
import {
  toNodeOpcuaSecurityMode,
  toNodeOpcuaSecurityPolicy,
  DEFAULT_SUBSCRIPTION_CONFIG,
  DEFAULT_MONITORED_ITEM_CONFIG,
} from './types'
import { createHandlerRegistry } from '@/lib/monitor/handler-registry'

// =============================================================================
// Real OPC-UA Client Implementation
// =============================================================================

/**
 * Create a real OPC-UA client using node-opcua
 *
 * This client is designed for production use with real OPC-UA servers.
 * It provides:
 * - Security mode support (None, Sign, SignAndEncrypt)
 * - Username/password and certificate authentication
 * - Subscription management for real-time data
 * - Automatic reconnection with configurable backoff
 * - Clean session and subscription lifecycle management
 *
 * @param config - OPC-UA connection configuration
 * @param nodeIds - Node IDs to monitor (optional, can be set later via subscribe)
 * @returns OPCUAClient interface implementation
 */
export function createRealOPCUAClient(
  config: OPCUAConnectionConfig,
  nodeIds: string[] = []
): OPCUAClient {
  // Dynamic imports to avoid loading node-opcua in test/dev

  const {
    OPCUAClient: OPCUAClientClass,
    ClientSubscription,
    AttributeIds,
    TimestampsToReturn,
    MessageSecurityMode,
    SecurityPolicy,
    UserTokenType,
  } = require('node-opcua-client')

  let client: IOPCUAClient | null = null
  let session: ClientSession | null = null
  let subscription: ClientSubscription | null = null
  let state: OPCUAConnectionState = 'disconnected'
  const monitoredItems: Map<string, ClientMonitoredItem> = new Map()
  const monitoredNodeIds: Set<string> = new Set(nodeIds)

  // Handler registries
  const dataChangeHandlers = createHandlerRegistry<DataChangeHandler>()
  const stateHandlers = createHandlerRegistry<OPCUAStateChangeHandler>()

  /**
   * Update connection state and notify handlers
   */
  const updateState = (newState: OPCUAConnectionState, error?: Error) => {
    state = newState
    stateHandlers.getAll().forEach((handler) => handler(newState, error))
  }

  /**
   * Create OPC-UA client with security configuration
   */
  const createClient = (): IOPCUAClient => {
    const securityMode = config.security?.securityMode
      ? toNodeOpcuaSecurityMode(config.security.securityMode)
      : MessageSecurityMode.None

    const securityPolicy = config.security?.securityPolicy
      ? toNodeOpcuaSecurityPolicy(config.security.securityPolicy)
      : SecurityPolicy.None

    return OPCUAClientClass.create({
      applicationName: config.applicationName || 'QETTA OPC-UA Client',
      connectionStrategy: {
        initialDelay: config.reconnectDelay || 1000,
        maxDelay: 10000,
        maxRetry: config.maxReconnectAttempts || 10,
      },
      securityMode,
      securityPolicy,
      endpointMustExist: false,
      requestedSessionTimeout: config.sessionTimeout || 60000,
      keepSessionAlive: true,
      certificateFile: config.security?.certificatePath,
      privateKeyFile: config.security?.privateKeyPath,
    })
  }

  /**
   * Create subscription for data monitoring
   */
  const createSubscription = async (
    subscriptionConfig: OPCUASubscriptionConfig = DEFAULT_SUBSCRIPTION_CONFIG
  ): Promise<ClientSubscription> => {
    if (!session) {
      throw new Error('Session not established')
    }

    const sub = await ClientSubscription.create(session, {
      requestedPublishingInterval: subscriptionConfig.publishingInterval || 1000,
      requestedLifetimeCount: subscriptionConfig.lifetimeCount || 100,
      requestedMaxKeepAliveCount: subscriptionConfig.maxKeepAliveCount || 10,
      maxNotificationsPerPublish: subscriptionConfig.maxNotificationsPerPublish || 100,
      publishingEnabled: true,
      priority: subscriptionConfig.priority || 10,
    })

    sub.on('error', (error: Error) => {
      console.error('[OPC-UA] Subscription error:', error.message)
    })

    return sub
  }

  /**
   * Monitor a node for data changes
   */
  const monitorNode = async (
    nodeId: string,
    itemConfig: Partial<OPCUAMonitoredItemConfig> = DEFAULT_MONITORED_ITEM_CONFIG
  ): Promise<void> => {
    if (!subscription) {
      throw new Error('Subscription not created')
    }

    const monitoredItem = await subscription.monitor(
      {
        nodeId,
        attributeId: AttributeIds.Value,
      },
      {
        samplingInterval: itemConfig.samplingInterval || 500,
        discardOldest: itemConfig.discardOldest ?? true,
        queueSize: itemConfig.queueSize || 10,
      },
      TimestampsToReturn.Both
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(monitoredItem as any).on(
      'changed',
      (dataValue: {
        value?: { value: unknown }
        statusCode?: { name: string }
        sourceTimestamp?: Date
      }) => {
        const value = dataValue.value?.value
        const statusCode = dataValue.statusCode?.name || 'Good'
        const timestamp = dataValue.sourceTimestamp || new Date()

        // Build DataValue for handlers
        const dv: DataValue = {
          value,
          statusCode: statusCode.includes('Good')
            ? 'Good'
            : statusCode.includes('Uncertain')
              ? 'Uncertain'
              : 'Bad',
          sourceTimestamp: timestamp,
          serverTimestamp: new Date(),
        }

        dataChangeHandlers.getAll().forEach((handler) => handler(nodeId, dv))
      }
    )

    monitoredItems.set(nodeId, monitoredItem)
  }

  return {
    async connect(): Promise<void> {
      if (state === 'connected') {
        return
      }

      updateState('connecting')

      try {
        client = createClient()

        // Setup client event handlers
        client.on('connection_reestablished', () => {
          updateState('connected')
        })

        client.on('connection_lost', () => {
          updateState('reconnecting')
        })

        client.on('backoff', () => {
          updateState('reconnecting')
        })

        // Connect to server
        await client.connect(config.endpointUrl)

        // Create session with optional credentials
        // Note: node-opcua types require casting through unknown
        if (config.username && config.password) {
          session = (await client.createSession({
            type: UserTokenType.UserName,
            userName: config.username,
            password: config.password,
          })) as unknown as ClientSession
        } else {
          session = (await client.createSession()) as unknown as ClientSession
        }

        updateState('connected')
      } catch (error) {
        updateState('error', error as Error)
        throw error
      }
    },

    async disconnect(): Promise<void> {
      if (!client || state === 'disconnected') {
        return
      }

      try {
        // Terminate subscription
        if (subscription) {
          await subscription.terminate()
          subscription = null
        }

        // Close session
        if (session) {
          await session.close()
          session = null
        }

        // Disconnect client
        await client.disconnect()
        client.removeAllListeners()
        client = null

        monitoredItems.clear()
        updateState('disconnected')
      } catch (error) {
        updateState('error', error as Error)
        throw error
      }
    },

    async subscribe(): Promise<void> {
      if (!session || state !== 'connected') {
        throw new Error('Not connected to OPC-UA server')
      }

      // Create subscription if not exists
      if (!subscription) {
        subscription = await createSubscription()
      }

      // Monitor all configured nodes
      for (const nodeId of monitoredNodeIds) {
        if (!monitoredItems.has(nodeId)) {
          await monitorNode(nodeId)
        }
      }
    },

    async read(nodeId: string): Promise<DataValue> {
      if (!session || state !== 'connected') {
        throw new Error('Not connected to OPC-UA server')
      }

      const dataValue = await session.read({
        nodeId,
        attributeId: AttributeIds.Value,
      })

      return {
        value: dataValue.value?.value,
        statusCode: dataValue.statusCode?.name?.includes('Good')
          ? 'Good'
          : dataValue.statusCode?.name?.includes('Uncertain')
            ? 'Uncertain'
            : 'Bad',
        sourceTimestamp: dataValue.sourceTimestamp || undefined,
        serverTimestamp: dataValue.serverTimestamp || undefined,
      }
    },

    async readMultiple(nodeIds: string[]): Promise<Map<string, DataValue>> {
      const results = new Map<string, DataValue>()

      for (const nodeId of nodeIds) {
        try {
          results.set(nodeId, await this.read(nodeId))
        } catch (error) {
          results.set(nodeId, {
            value: null,
            statusCode: 'Bad',
            sourceTimestamp: new Date(),
          })
        }
      }

      return results
    },

    async write(nodeId: string, value: unknown): Promise<void> {
      if (!session || state !== 'connected') {
        throw new Error('Not connected to OPC-UA server')
      }

      await session.write({
        nodeId,
        attributeId: AttributeIds.Value,
        value: {
          value: {
            dataType: typeof value === 'number' ? 11 : typeof value === 'boolean' ? 1 : 12,
            value,
          },
        },
      })
    },

    async browse(nodeId?: string): Promise<BrowseResult[]> {
      if (!session || state !== 'connected') {
        throw new Error('Not connected to OPC-UA server')
      }

      const browseResult = await session.browse(nodeId || 'RootFolder')
      const references = browseResult.references || []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return references.map((ref: any) => ({
        nodeId: ref.nodeId?.toString() || '',
        displayName: ref.displayName?.text || '',
        nodeClass: ref.nodeClass?.toString() || 'Unknown',
        isForward: ref.isForward ?? true,
      }))
    },

    onDataChange(handler: DataChangeHandler): void {
      dataChangeHandlers.add(handler)
    },

    onStateChange(handler: OPCUAStateChangeHandler): void {
      stateHandlers.add(handler)
    },

    getState(): OPCUAConnectionState {
      return state
    },

    isConnected(): boolean {
      return state === 'connected'
    },
  }
}

// =============================================================================
// Export
// =============================================================================

export type { OPCUAConnectionConfig } from './types'
