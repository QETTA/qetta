/**
 * Monitor Credential Configuration
 *
 * Environment-based credential loading with Zod validation.
 * Ensures type-safe configuration for MQTT and OPC-UA connections.
 *
 * @module lib/monitor/config/credentials
 *
 * @example
 * ```ts
 * import { loadCredentials, loadMQTTCredentials } from '@/lib/monitor/config/credentials'
 *
 * // Load all credentials (throws if invalid)
 * const creds = loadCredentials()
 *
 * // Load MQTT credentials only
 * const mqtt = loadMQTTCredentials()
 * ```
 */

import { z } from 'zod'

// =============================================================================
// Schema Definitions
// =============================================================================

/**
 * MQTT connection credentials schema
 */
export const MQTTCredentialsSchema = z.object({
  brokerUrl: z
    .string()
    .url('MQTT_BROKER_URL must be a valid URL')
    .optional()
    .describe('MQTT broker URL (e.g., mqtt://broker.example.com:1883)'),
  username: z
    .string()
    .min(1)
    .optional()
    .describe('MQTT username for authentication'),
  password: z
    .string()
    .min(1)
    .optional()
    .describe('MQTT password for authentication'),
  clientId: z
    .string()
    .min(1)
    .max(64)
    .optional()
    .describe('MQTT client identifier'),
  useTls: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to use TLS for MQTT connection'),
  caCertPath: z
    .string()
    .optional()
    .describe('Path to CA certificate file for TLS'),
})

/**
 * OPC-UA connection credentials schema
 */
export const OPCUACredentialsSchema = z.object({
  endpointUrl: z
    .string()
    .url('OPCUA_ENDPOINT_URL must be a valid URL')
    .optional()
    .describe('OPC-UA server endpoint URL'),
  securityMode: z
    .enum(['None', 'Sign', 'SignAndEncrypt'])
    .optional()
    .default('SignAndEncrypt')
    .describe('OPC-UA security mode'),
  securityPolicy: z
    .enum(['None', 'Basic256Sha256', 'Aes128_Sha256_RsaOaep'])
    .optional()
    .default('Basic256Sha256')
    .describe('OPC-UA security policy'),
  username: z
    .string()
    .min(1)
    .optional()
    .describe('OPC-UA username for authentication'),
  password: z
    .string()
    .min(1)
    .optional()
    .describe('OPC-UA password for authentication'),
  certificatePath: z
    .string()
    .optional()
    .describe('Path to client certificate for OPC-UA'),
  privateKeyPath: z
    .string()
    .optional()
    .describe('Path to private key for OPC-UA'),
})

/**
 * Combined credentials schema
 */
export const MonitorCredentialsSchema = z.object({
  mqtt: MQTTCredentialsSchema,
  opcua: OPCUACredentialsSchema,
  environment: z
    .enum(['development', 'staging', 'production'])
    .optional()
    .default('development'),
})

// =============================================================================
// Type Exports
// =============================================================================

export type MQTTCredentials = z.infer<typeof MQTTCredentialsSchema>
export type OPCUACredentials = z.infer<typeof OPCUACredentialsSchema>
export type MonitorCredentials = z.infer<typeof MonitorCredentialsSchema>

// =============================================================================
// Credential Loading Functions
// =============================================================================

/**
 * Load MQTT credentials from environment variables
 *
 * @returns Validated MQTT credentials
 * @throws Error if validation fails
 */
export function loadMQTTCredentials(): MQTTCredentials {
  const raw = {
    brokerUrl: process.env.MQTT_BROKER_URL,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: process.env.MQTT_CLIENT_ID,
    useTls: process.env.MQTT_USE_TLS === 'true',
    caCertPath: process.env.MQTT_CA_CERT_PATH,
  }

  const result = MQTTCredentialsSchema.safeParse(raw)
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    throw new Error(`Invalid MQTT credentials: ${errors.join(', ')}`)
  }

  return result.data
}

/**
 * Load OPC-UA credentials from environment variables
 *
 * @returns Validated OPC-UA credentials
 * @throws Error if validation fails
 */
export function loadOPCUACredentials(): OPCUACredentials {
  // Note: No type assertions needed - Zod validates and returns correctly typed data
  const raw = {
    endpointUrl: process.env.OPCUA_ENDPOINT_URL,
    securityMode: process.env.OPCUA_SECURITY_MODE,
    securityPolicy: process.env.OPCUA_SECURITY_POLICY,
    username: process.env.OPCUA_USERNAME,
    password: process.env.OPCUA_PASSWORD,
    certificatePath: process.env.OPCUA_CERTIFICATE_PATH,
    privateKeyPath: process.env.OPCUA_PRIVATE_KEY_PATH,
  }

  const result = OPCUACredentialsSchema.safeParse(raw)
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    throw new Error(`Invalid OPC-UA credentials: ${errors.join(', ')}`)
  }

  return result.data
}

/**
 * Load all monitor credentials from environment variables
 *
 * @returns Validated monitor credentials
 * @throws Error if validation fails
 */
export function loadCredentials(): MonitorCredentials {
  // Note: No type assertions needed - Zod validates and returns correctly typed data
  const raw = {
    mqtt: {
      brokerUrl: process.env.MQTT_BROKER_URL,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clientId: process.env.MQTT_CLIENT_ID,
      useTls: process.env.MQTT_USE_TLS === 'true',
      caCertPath: process.env.MQTT_CA_CERT_PATH,
    },
    opcua: {
      endpointUrl: process.env.OPCUA_ENDPOINT_URL,
      securityMode: process.env.OPCUA_SECURITY_MODE,
      securityPolicy: process.env.OPCUA_SECURITY_POLICY,
      username: process.env.OPCUA_USERNAME,
      password: process.env.OPCUA_PASSWORD,
      certificatePath: process.env.OPCUA_CERTIFICATE_PATH,
      privateKeyPath: process.env.OPCUA_PRIVATE_KEY_PATH,
    },
    environment: process.env.NODE_ENV,
  }

  const result = MonitorCredentialsSchema.safeParse(raw)
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    throw new Error(`Invalid monitor credentials: ${errors.join(', ')}`)
  }

  return result.data
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Check if MQTT is configured
 *
 * @returns true if MQTT broker URL is set
 */
export function isMQTTConfigured(): boolean {
  return !!process.env.MQTT_BROKER_URL
}

/**
 * Check if OPC-UA is configured
 *
 * @returns true if OPC-UA endpoint URL is set
 */
export function isOPCUAConfigured(): boolean {
  return !!process.env.OPCUA_ENDPOINT_URL
}

/**
 * Get credential summary (safe for logging, no secrets)
 *
 * @returns Summary of configured credentials
 */
export function getCredentialSummary(): {
  mqtt: { configured: boolean; hasAuth: boolean; useTls: boolean }
  opcua: { configured: boolean; hasAuth: boolean; securityMode: string }
} {
  return {
    mqtt: {
      configured: isMQTTConfigured(),
      hasAuth: !!(process.env.MQTT_USERNAME && process.env.MQTT_PASSWORD),
      useTls: process.env.MQTT_USE_TLS === 'true',
    },
    opcua: {
      configured: isOPCUAConfigured(),
      hasAuth: !!(process.env.OPCUA_USERNAME && process.env.OPCUA_PASSWORD),
      securityMode: process.env.OPCUA_SECURITY_MODE ?? 'SignAndEncrypt',
    },
  }
}
