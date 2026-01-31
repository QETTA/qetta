/**
 * MQTT Type Definitions
 *
 * Type definitions for real MQTT client connections.
 * Supports TLS, authentication, and various connection configurations.
 *
 * @module lib/monitor/sensors/mqtt/types
 */

import type { IClientOptions } from 'mqtt'

// =============================================================================
// Connection Configuration
// =============================================================================

/**
 * MQTT connection configuration for real broker connections
 */
export interface MQTTConnectionConfig {
  /** Broker URL (mqtt://, mqtts://, ws://, wss://) */
  brokerUrl: string
  /** Unique client identifier */
  clientId?: string
  /** Username for authentication */
  username?: string
  /** Password for authentication */
  password?: string
  /** Keep-alive interval in seconds (default: 60) */
  keepalive?: number
  /** Reconnect period in milliseconds (default: 5000) */
  reconnectPeriod?: number
  /** Connection timeout in milliseconds (default: 30000) */
  connectTimeout?: number
  /** Use clean session (default: true) */
  clean?: boolean
  /** TLS: Reject unauthorized certificates (default: true in production) */
  rejectUnauthorized?: boolean
  /** TLS: CA certificate (PEM format) */
  ca?: string | Buffer
  /** TLS: Client certificate (PEM format) */
  cert?: string | Buffer
  /** TLS: Client private key (PEM format) */
  key?: string | Buffer
}

// =============================================================================
// Subscription Configuration
// =============================================================================

/**
 * MQTT subscription configuration
 */
export interface MQTTSubscription {
  /** Topic pattern (supports MQTT wildcards: +, #) */
  topic: string
  /** Quality of Service level */
  qos: 0 | 1 | 2
}

// =============================================================================
// Handler Types
// =============================================================================

/**
 * Handler for incoming MQTT messages
 */
export type MQTTMessageHandler = (topic: string, payload: Buffer) => void

/**
 * Handler for connection state changes
 */
export type MQTTStateHandler = (
  state: 'connected' | 'disconnected' | 'reconnecting' | 'error'
) => void

/**
 * Handler for connection errors
 */
export type MQTTErrorHandler = (error: Error) => void

// =============================================================================
// Internal Types
// =============================================================================

/**
 * Handler registration entry with cleanup support
 */
export interface HandlerRegistration<T extends (...args: unknown[]) => void> {
  id: string
  handler: T
}

/**
 * Convert MQTTConnectionConfig to mqtt.js IClientOptions
 */
export function toMqttClientOptions(config: MQTTConnectionConfig): IClientOptions {
  return {
    clientId: config.clientId,
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
}
