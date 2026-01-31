/**
 * Real MQTT Client Implementation
 *
 * Production-ready MQTT client using mqtt.js library.
 * Supports TLS, authentication, automatic reconnection, and clean handler management.
 *
 * @module lib/monitor/sensors/mqtt/real-client
 *
 * @example
 * ```ts
 * const client = createRealMQTTClient({
 *   brokerUrl: 'mqtts://broker.example.com:8883',
 *   clientId: 'qetta-monitor-001',
 *   username: process.env.MQTT_USERNAME,
 *   password: process.env.MQTT_PASSWORD,
 * })
 *
 * client.onMessage((topic, payload) => {
 *   const data = JSON.parse(payload.toString())
 *   console.log(`[${topic}]`, data)
 * })
 *
 * await client.connect()
 * await client.subscribe(['sensors/#'])
 * ```
 */

import mqtt from 'mqtt'
import type { MqttClient as MqttJsClient } from 'mqtt'
import type { MQTTClient, MQTTSensorPayload, MQTTConnectionState, MessageHandler, StateChangeHandler } from '../mqtt-client'
import type { MQTTConnectionConfig } from './types'
import { createHandlerRegistry } from '@/lib/monitor/handler-registry'

// =============================================================================
// Real MQTT Client Implementation
// =============================================================================

/**
 * Create a real MQTT client using mqtt.js
 *
 * This client is designed for production use with real MQTT brokers.
 * It provides:
 * - TLS/SSL support for secure connections
 * - Username/password authentication
 * - Automatic reconnection with configurable backoff
 * - Clean handler management with unsubscribe support
 * - Promise-based API for async/await usage
 *
 * @param config - MQTT connection configuration
 * @returns MQTTClient interface implementation
 */
export function createRealMQTTClient(config: MQTTConnectionConfig): MQTTClient {
  let client: MqttJsClient | null = null
  let state: MQTTConnectionState = 'disconnected'
  const subscribedTopics: Set<string> = new Set()

  // Handler registries for clean management
  const messageHandlers = createHandlerRegistry<MessageHandler>()
  const stateHandlers = createHandlerRegistry<StateChangeHandler>()

  /**
   * Update connection state and notify handlers
   */
  const updateState = (newState: MQTTConnectionState, error?: Error) => {
    state = newState
    stateHandlers.getAll().forEach((handler) => handler(newState, error))
  }

  /**
   * Parse incoming message payload to MQTTSensorPayload
   */
  const parsePayload = (_topic: string, payload: Buffer): MQTTSensorPayload | null => {
    try {
      const data = JSON.parse(payload.toString())

      // Validate required fields
      if (!data.equipmentId || !data.sensorType || typeof data.value !== 'number') {
        return null
      }

      return {
        equipmentId: data.equipmentId,
        sensorType: data.sensorType,
        value: data.value,
        unit: data.unit || '',
        timestamp: data.timestamp || new Date().toISOString(),
        metadata: data.metadata,
      }
    } catch {
      // Invalid JSON or missing fields
      return null
    }
  }

  /**
   * Setup event handlers on the mqtt.js client
   */
  const setupEventHandlers = (mqttClient: MqttJsClient) => {
    mqttClient.on('connect', () => {
      updateState('connected')
    })

    mqttClient.on('reconnect', () => {
      updateState('reconnecting')
    })

    mqttClient.on('close', () => {
      updateState('disconnected')
    })

    mqttClient.on('error', (error) => {
      updateState('error', error)
    })

    mqttClient.on('message', (topic: string, payload: Buffer) => {
      const parsedPayload = parsePayload(topic, payload)
      if (parsedPayload) {
        messageHandlers.getAll().forEach((handler) => handler(topic, parsedPayload))
      }
    })
  }

  return {
    async connect(): Promise<void> {
      if (state === 'connected') {
        return
      }

      updateState('connecting')

      return new Promise((resolve, reject) => {
        try {
          // Convert config to mqtt.js options
          const options: mqtt.IClientOptions = {
            clientId: config.clientId || `qetta-${Date.now()}`,
            username: config.username,
            password: config.password,
            keepalive: config.keepalive ?? 60,
            reconnectPeriod: config.reconnectPeriod ?? 5000,
            connectTimeout: config.connectTimeout ?? 30000,
            clean: config.clean ?? true,
            rejectUnauthorized: config.rejectUnauthorized ?? true,
            ca: config.ca,
            cert: config.cert,
            key: config.key,
          }

          client = mqtt.connect(config.brokerUrl, options)
          setupEventHandlers(client)

          // Setup one-time connect/error handlers for the promise
          const onConnect = () => {
            client?.removeListener('error', onError)
            resolve()
          }

          const onError = (error: Error) => {
            client?.removeListener('connect', onConnect)
            reject(error)
          }

          client.once('connect', onConnect)
          client.once('error', onError)
        } catch (error) {
          updateState('error', error as Error)
          reject(error)
        }
      })
    },

    async disconnect(): Promise<void> {
      if (!client || state === 'disconnected') {
        return
      }

      return new Promise((resolve) => {
        client?.end(false, {}, () => {
          client?.removeAllListeners()
          client = null
          subscribedTopics.clear()
          updateState('disconnected')
          resolve()
        })
      })
    },

    async subscribe(topics: string[]): Promise<void> {
      if (!client || state !== 'connected') {
        throw new Error('Not connected to MQTT broker')
      }

      return new Promise((resolve, reject) => {
        client?.subscribe(topics, { qos: 1 }, (error) => {
          if (error) {
            reject(error)
          } else {
            topics.forEach((topic) => subscribedTopics.add(topic))
            resolve()
          }
        })
      })
    },

    async unsubscribe(topics: string[]): Promise<void> {
      if (!client || state !== 'connected') {
        throw new Error('Not connected to MQTT broker')
      }

      return new Promise((resolve, reject) => {
        client?.unsubscribe(topics, {}, (error) => {
          if (error) {
            reject(error)
          } else {
            topics.forEach((topic) => subscribedTopics.delete(topic))
            resolve()
          }
        })
      })
    },

    async publish(topic: string, payload: unknown): Promise<void> {
      if (!client || state !== 'connected') {
        throw new Error('Not connected to MQTT broker')
      }

      return new Promise((resolve, reject) => {
        const message = typeof payload === 'string' ? payload : JSON.stringify(payload)
        client?.publish(topic, message, { qos: 1 }, (error) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })
    },

    onMessage(handler: MessageHandler): void {
      messageHandlers.add(handler)
    },

    onStateChange(handler: StateChangeHandler): void {
      stateHandlers.add(handler)
    },

    getState(): MQTTConnectionState {
      return state
    },

    getTopics(): string[] {
      return Array.from(subscribedTopics)
    },

    isConnected(): boolean {
      return state === 'connected'
    },
  }
}

// =============================================================================
// Export for factory pattern
// =============================================================================

export type { MQTTConnectionConfig } from './types'
