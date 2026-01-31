/**
 * OPC-UA Type Definitions
 *
 * Type definitions for real OPC-UA client connections.
 * Supports various security modes, policies, and authentication methods.
 *
 * @module lib/monitor/sensors/opcua/types
 */

import type { MessageSecurityMode, SecurityPolicy } from 'node-opcua-client'

// =============================================================================
// Security Configuration
// =============================================================================

/**
 * OPC-UA security mode configuration
 */
export type OPCUASecurityMode = 'None' | 'Sign' | 'SignAndEncrypt'

/**
 * OPC-UA security policy configuration
 */
export type OPCUASecurityPolicy =
  | 'None'
  | 'Basic256Sha256'
  | 'Aes128_Sha256_RsaOaep'
  | 'Aes256_Sha256_RsaPss'

/**
 * OPC-UA security configuration for production connections
 */
export interface OPCUASecurityConfig {
  /** Security mode for message encryption/signing */
  securityMode: OPCUASecurityMode
  /** Security policy algorithm */
  securityPolicy: OPCUASecurityPolicy
  /** Path to client certificate (PEM format) */
  certificatePath?: string
  /** Path to client private key (PEM format) */
  privateKeyPath?: string
  /** Path to server certificate for validation */
  serverCertificatePath?: string
}

// =============================================================================
// Connection Configuration
// =============================================================================

/**
 * OPC-UA connection configuration for real server connections
 */
export interface OPCUAConnectionConfig {
  /** OPC-UA server endpoint URL (opc.tcp://) */
  endpointUrl: string
  /** Application name for client identification */
  applicationName?: string
  /** Security configuration */
  security?: OPCUASecurityConfig
  /** Username for authentication (UserNameIdentityToken) */
  username?: string
  /** Password for authentication */
  password?: string
  /** Connection timeout in milliseconds */
  connectionTimeout?: number
  /** Session timeout in milliseconds */
  sessionTimeout?: number
  /** Keep-alive interval in milliseconds */
  keepAliveInterval?: number
  /** Auto-reconnect on connection loss */
  autoReconnect?: boolean
  /** Maximum reconnection attempts (0 = unlimited) */
  maxReconnectAttempts?: number
  /** Reconnection delay in milliseconds */
  reconnectDelay?: number
}

// =============================================================================
// Subscription Configuration
// =============================================================================

/**
 * OPC-UA subscription parameters
 */
export interface OPCUASubscriptionConfig {
  /** Publishing interval in milliseconds */
  publishingInterval?: number
  /** Lifetime count (number of publishing intervals before timeout) */
  lifetimeCount?: number
  /** Maximum keep-alive count */
  maxKeepAliveCount?: number
  /** Maximum notifications per publish */
  maxNotificationsPerPublish?: number
  /** Priority (0-255) */
  priority?: number
}

/**
 * OPC-UA monitored item parameters
 */
export interface OPCUAMonitoredItemConfig {
  /** Node ID to monitor */
  nodeId: string
  /** Sampling interval in milliseconds (-1 = fastest possible) */
  samplingInterval?: number
  /** Queue size for data changes */
  queueSize?: number
  /** Discard oldest data when queue is full */
  discardOldest?: boolean
}

// =============================================================================
// Handler Types
// =============================================================================

/**
 * Handler for OPC-UA data value changes
 */
export type OPCUADataChangeHandler = (
  nodeId: string,
  value: unknown,
  statusCode: string,
  timestamp: Date
) => void

/**
 * Handler for connection state changes
 */
export type OPCUAStateHandler = (
  state: 'connected' | 'disconnected' | 'reconnecting' | 'error'
) => void

/**
 * Handler for connection errors
 */
export type OPCUAErrorHandler = (error: Error) => void

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert our security mode to node-opcua MessageSecurityMode
 */
export function toNodeOpcuaSecurityMode(mode: OPCUASecurityMode): MessageSecurityMode {
  // Dynamic import to avoid loading in test environment
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MessageSecurityMode } = require('node-opcua-client')

  switch (mode) {
    case 'None':
      return MessageSecurityMode.None
    case 'Sign':
      return MessageSecurityMode.Sign
    case 'SignAndEncrypt':
      return MessageSecurityMode.SignAndEncrypt
    default:
      return MessageSecurityMode.None
  }
}

/**
 * Convert our security policy to node-opcua SecurityPolicy string
 */
export function toNodeOpcuaSecurityPolicy(policy: OPCUASecurityPolicy): SecurityPolicy {
  // Dynamic import to avoid loading in test environment
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SecurityPolicy } = require('node-opcua-client')

  switch (policy) {
    case 'None':
      return SecurityPolicy.None
    case 'Basic256Sha256':
      return SecurityPolicy.Basic256Sha256
    case 'Aes128_Sha256_RsaOaep':
      return SecurityPolicy.Aes128_Sha256_RsaOaep
    case 'Aes256_Sha256_RsaPss':
      return SecurityPolicy.Aes256_Sha256_RsaPss
    default:
      return SecurityPolicy.None
  }
}

/**
 * Default subscription configuration for industrial monitoring
 */
export const DEFAULT_SUBSCRIPTION_CONFIG: OPCUASubscriptionConfig = {
  publishingInterval: 1000,
  lifetimeCount: 100,
  maxKeepAliveCount: 10,
  maxNotificationsPerPublish: 100,
  priority: 10,
}

/**
 * Default monitored item configuration
 */
export const DEFAULT_MONITORED_ITEM_CONFIG: Partial<OPCUAMonitoredItemConfig> = {
  samplingInterval: 500,
  queueSize: 10,
  discardOldest: true,
}
