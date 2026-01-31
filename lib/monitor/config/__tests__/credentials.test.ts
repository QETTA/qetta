/**
 * Credentials Configuration Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MQTTCredentialsSchema,
  OPCUACredentialsSchema,
  MonitorCredentialsSchema,
  loadMQTTCredentials,
  loadOPCUACredentials,
  loadCredentials,
  isMQTTConfigured,
  isOPCUAConfigured,
  getCredentialSummary,
} from '../credentials'

describe('MQTTCredentialsSchema', () => {
  it('should accept valid MQTT credentials', () => {
    const valid = {
      brokerUrl: 'mqtt://broker.example.com:1883',
      username: 'user',
      password: 'pass',
      clientId: 'client-1',
      useTls: true,
    }
    expect(MQTTCredentialsSchema.safeParse(valid).success).toBe(true)
  })

  it('should accept empty credentials (all optional)', () => {
    expect(MQTTCredentialsSchema.safeParse({}).success).toBe(true)
  })

  it('should reject invalid broker URL', () => {
    const invalid = {
      brokerUrl: 'not-a-url',
    }
    expect(MQTTCredentialsSchema.safeParse(invalid).success).toBe(false)
  })

  it('should default useTls to false', () => {
    const result = MQTTCredentialsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.useTls).toBe(false)
    }
  })
})

describe('OPCUACredentialsSchema', () => {
  it('should accept valid OPC-UA credentials', () => {
    const valid = {
      endpointUrl: 'opc.tcp://server.example.com:4840',
      securityMode: 'SignAndEncrypt' as const,
      securityPolicy: 'Basic256Sha256' as const,
      username: 'admin',
      password: 'secret',
    }
    expect(OPCUACredentialsSchema.safeParse(valid).success).toBe(true)
  })

  it('should accept empty credentials (all optional)', () => {
    expect(OPCUACredentialsSchema.safeParse({}).success).toBe(true)
  })

  it('should default securityMode to SignAndEncrypt', () => {
    const result = OPCUACredentialsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.securityMode).toBe('SignAndEncrypt')
    }
  })

  it('should default securityPolicy to Basic256Sha256', () => {
    const result = OPCUACredentialsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.securityPolicy).toBe('Basic256Sha256')
    }
  })

  it('should reject invalid security mode', () => {
    const invalid = {
      securityMode: 'InvalidMode',
    }
    expect(OPCUACredentialsSchema.safeParse(invalid).success).toBe(false)
  })
})

describe('MonitorCredentialsSchema', () => {
  it('should accept combined credentials', () => {
    const valid = {
      mqtt: {
        brokerUrl: 'mqtt://broker.example.com:1883',
      },
      opcua: {
        endpointUrl: 'opc.tcp://server.example.com:4840',
      },
      environment: 'production' as const,
    }
    expect(MonitorCredentialsSchema.safeParse(valid).success).toBe(true)
  })

  it('should default environment to development', () => {
    const result = MonitorCredentialsSchema.safeParse({
      mqtt: {},
      opcua: {},
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.environment).toBe('development')
    }
  })
})

describe('loadMQTTCredentials', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should load credentials from environment variables', () => {
    process.env.MQTT_BROKER_URL = 'mqtt://test.example.com:1883'
    process.env.MQTT_USERNAME = 'testuser'
    process.env.MQTT_PASSWORD = 'testpass'

    const creds = loadMQTTCredentials()

    expect(creds.brokerUrl).toBe('mqtt://test.example.com:1883')
    expect(creds.username).toBe('testuser')
    expect(creds.password).toBe('testpass')
  })

  it('should return defaults when no env vars set', () => {
    delete process.env.MQTT_BROKER_URL
    delete process.env.MQTT_USERNAME

    const creds = loadMQTTCredentials()

    expect(creds.brokerUrl).toBeUndefined()
    expect(creds.useTls).toBe(false)
  })

  it('should parse MQTT_USE_TLS boolean correctly', () => {
    process.env.MQTT_USE_TLS = 'true'

    const creds = loadMQTTCredentials()

    expect(creds.useTls).toBe(true)
  })

  it('should throw on invalid broker URL', () => {
    process.env.MQTT_BROKER_URL = 'not-a-valid-url'

    expect(() => loadMQTTCredentials()).toThrow('Invalid MQTT credentials')
  })
})

describe('loadOPCUACredentials', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should load credentials from environment variables', () => {
    process.env.OPCUA_ENDPOINT_URL = 'opc.tcp://test.example.com:4840'
    process.env.OPCUA_SECURITY_MODE = 'Sign'
    process.env.OPCUA_USERNAME = 'admin'

    const creds = loadOPCUACredentials()

    expect(creds.endpointUrl).toBe('opc.tcp://test.example.com:4840')
    expect(creds.securityMode).toBe('Sign')
    expect(creds.username).toBe('admin')
  })

  it('should use default security settings', () => {
    delete process.env.OPCUA_SECURITY_MODE
    delete process.env.OPCUA_SECURITY_POLICY

    const creds = loadOPCUACredentials()

    expect(creds.securityMode).toBe('SignAndEncrypt')
    expect(creds.securityPolicy).toBe('Basic256Sha256')
  })
})

describe('loadCredentials', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should load all credentials', () => {
    process.env.MQTT_BROKER_URL = 'mqtt://mqtt.example.com:1883'
    process.env.OPCUA_ENDPOINT_URL = 'opc.tcp://opcua.example.com:4840'
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'

    const creds = loadCredentials()

    expect(creds.mqtt.brokerUrl).toBe('mqtt://mqtt.example.com:1883')
    expect(creds.opcua.endpointUrl).toBe('opc.tcp://opcua.example.com:4840')
    expect(creds.environment).toBe('production')
  })
})

describe('Configuration Check Helpers', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('isMQTTConfigured', () => {
    it('should return true when MQTT_BROKER_URL is set', () => {
      process.env.MQTT_BROKER_URL = 'mqtt://test.example.com:1883'
      expect(isMQTTConfigured()).toBe(true)
    })

    it('should return false when MQTT_BROKER_URL is not set', () => {
      delete process.env.MQTT_BROKER_URL
      expect(isMQTTConfigured()).toBe(false)
    })
  })

  describe('isOPCUAConfigured', () => {
    it('should return true when OPCUA_ENDPOINT_URL is set', () => {
      process.env.OPCUA_ENDPOINT_URL = 'opc.tcp://test.example.com:4840'
      expect(isOPCUAConfigured()).toBe(true)
    })

    it('should return false when OPCUA_ENDPOINT_URL is not set', () => {
      delete process.env.OPCUA_ENDPOINT_URL
      expect(isOPCUAConfigured()).toBe(false)
    })
  })

  describe('getCredentialSummary', () => {
    it('should return safe summary without secrets', () => {
      process.env.MQTT_BROKER_URL = 'mqtt://test.example.com:1883'
      process.env.MQTT_USERNAME = 'user'
      process.env.MQTT_PASSWORD = 'secret'
      process.env.MQTT_USE_TLS = 'true'
      process.env.OPCUA_ENDPOINT_URL = 'opc.tcp://test.example.com:4840'
      process.env.OPCUA_SECURITY_MODE = 'Sign'

      const summary = getCredentialSummary()

      expect(summary.mqtt.configured).toBe(true)
      expect(summary.mqtt.hasAuth).toBe(true)
      expect(summary.mqtt.useTls).toBe(true)
      expect(summary.opcua.configured).toBe(true)
      expect(summary.opcua.securityMode).toBe('Sign')

      // Verify no secrets are exposed
      expect(JSON.stringify(summary)).not.toContain('secret')
    })
  })
})
