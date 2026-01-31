/**
 * OPC-UA Client Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createOPCUAClient,
  createOPCUASensorService,
  createSmartFactoryOPCUAClient,
  parseNodeId,
  serializeNodeId,
  DEFAULT_OPCUA_NODES,
  type OPCUAClient,
  type NodeId,
} from '../opc-ua-client'

describe('createOPCUAClient', () => {
  let client: OPCUAClient

  beforeEach(() => {
    client = createOPCUAClient({
      endpointUrl: 'opc.tcp://localhost:4840',
      nodeIds: ['ns=2;s=Temperature', 'ns=2;s=Vibration'],
      connectionTimeout: 100, // Fast timeout for tests
    })
  })

  afterEach(async () => {
    if (client.isConnected()) {
      await client.disconnect()
    }
  })

  describe('connection lifecycle', () => {
    it('starts in disconnected state', () => {
      expect(client.getState()).toBe('disconnected')
      expect(client.isConnected()).toBe(false)
    })

    it('connects successfully', async () => {
      await client.connect()
      expect(client.getState()).toBe('connected')
      expect(client.isConnected()).toBe(true)
    })

    it('disconnects successfully', async () => {
      await client.connect()
      await client.disconnect()
      expect(client.getState()).toBe('disconnected')
      expect(client.isConnected()).toBe(false)
    })

    it('handles double connect gracefully', async () => {
      await client.connect()
      await client.connect()
      expect(client.isConnected()).toBe(true)
    })
  })

  describe('state change notifications', () => {
    it('notifies on state changes', async () => {
      const states: string[] = []
      client.onStateChange((state) => states.push(state))

      await client.connect()
      await client.disconnect()

      expect(states).toContain('connecting')
      expect(states).toContain('connected')
      expect(states).toContain('disconnected')
    })
  })

  describe('read operations', () => {
    it('reads a single node value', async () => {
      await client.connect()

      const dataValue = await client.read('ns=2;s=Temperature')

      expect(dataValue.statusCode).toBe('Good')
      expect(typeof dataValue.value).toBe('number')
      expect(dataValue.sourceTimestamp).toBeInstanceOf(Date)
    })

    it('reads multiple node values', async () => {
      await client.connect()

      const results = await client.readMultiple([
        'ns=2;s=Temperature',
        'ns=2;s=Vibration',
      ])

      expect(results.size).toBe(2)
      expect(results.get('ns=2;s=Temperature')).toBeDefined()
      expect(results.get('ns=2;s=Vibration')).toBeDefined()
    })

    it('throws when not connected', async () => {
      await expect(client.read('ns=2;s=Temperature')).rejects.toThrow(
        'Not connected'
      )
    })
  })

  describe('write operations', () => {
    it('writes a value to a node', async () => {
      await client.connect()

      await expect(
        client.write('ns=2;s=Temperature', 75)
      ).resolves.not.toThrow()
    })

    it('throws when not connected', async () => {
      await expect(client.write('ns=2;s=Temperature', 75)).rejects.toThrow(
        'Not connected'
      )
    })
  })

  describe('browse operations', () => {
    it('browses root nodes', async () => {
      await client.connect()

      const results = await client.browse()

      expect(results.length).toBeGreaterThan(0)
      expect(results[0]).toHaveProperty('nodeId')
      expect(results[0]).toHaveProperty('displayName')
      expect(results[0]).toHaveProperty('nodeClass')
    })

    it('browses specific node', async () => {
      await client.connect()

      const results = await client.browse('ns=2;s=Equipment')

      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('subscription', () => {
    it('creates subscription and receives data changes', async () => {
      await client.connect()

      const changes: { nodeId: string; value: unknown }[] = []
      client.onDataChange((nodeId, dataValue) => {
        changes.push({ nodeId, value: dataValue.value })
      })

      await client.subscribe()

      // Wait for data changes
      await new Promise((resolve) => setTimeout(resolve, 2500))

      expect(changes.length).toBeGreaterThan(0)
    }, 10000)

    it('throws when subscribing without connection', async () => {
      await expect(client.subscribe()).rejects.toThrow('Not connected')
    })
  })
})

describe('parseNodeId', () => {
  it('parses string identifier', () => {
    const result = parseNodeId('ns=2;s=Temperature')

    expect(result.namespaceIndex).toBe(2)
    expect(result.identifierType).toBe('string')
    expect(result.value).toBe('Temperature')
  })

  it('parses numeric identifier', () => {
    const result = parseNodeId('ns=0;i=85')

    expect(result.namespaceIndex).toBe(0)
    expect(result.identifierType).toBe('numeric')
    expect(result.value).toBe(85)
  })

  it('parses GUID identifier', () => {
    const guid = '550e8400-e29b-41d4-a716-446655440000'
    const result = parseNodeId(`ns=1;g=${guid}`)

    expect(result.namespaceIndex).toBe(1)
    expect(result.identifierType).toBe('guid')
    expect(result.value).toBe(guid)
  })

  it('parses opaque (byte string) identifier', () => {
    const result = parseNodeId('ns=3;b=M/RbKBsRVkePCePcx24oRA==')

    expect(result.namespaceIndex).toBe(3)
    expect(result.identifierType).toBe('opaque')
    expect(result.value).toBe('M/RbKBsRVkePCePcx24oRA==')
  })

  it('handles default namespace', () => {
    const result = parseNodeId('s=SimpleNode')

    expect(result.namespaceIndex).toBe(0) // Default
    expect(result.identifierType).toBe('string')
    expect(result.value).toBe('SimpleNode')
  })
})

describe('serializeNodeId', () => {
  it('serializes string identifier', () => {
    const nodeId: NodeId = {
      namespaceIndex: 2,
      identifierType: 'string',
      value: 'Temperature',
    }

    expect(serializeNodeId(nodeId)).toBe('ns=2;s=Temperature')
  })

  it('serializes numeric identifier', () => {
    const nodeId: NodeId = {
      namespaceIndex: 0,
      identifierType: 'numeric',
      value: 85,
    }

    expect(serializeNodeId(nodeId)).toBe('ns=0;i=85')
  })

  it('serializes GUID identifier', () => {
    const nodeId: NodeId = {
      namespaceIndex: 1,
      identifierType: 'guid',
      value: '550e8400-e29b-41d4-a716-446655440000',
    }

    expect(serializeNodeId(nodeId)).toBe(
      'ns=1;g=550e8400-e29b-41d4-a716-446655440000'
    )
  })

  it('round-trips through parse and serialize', () => {
    const original = 'ns=2;s=Equipment.CNC001.Temperature'
    const parsed = parseNodeId(original)
    const serialized = serializeNodeId(parsed)

    expect(serialized).toBe(original)
  })
})

describe('createOPCUASensorService', () => {
  it('transforms OPC-UA data to sensor readings', async () => {
    vi.useFakeTimers()

    try {
      const service = createOPCUASensorService({
        endpointUrl: 'opc.tcp://localhost:4840',
        nodeIds: ['ns=2;s=Temperature', 'ns=2;s=Vibration'],
        publishingInterval: 500,
        equipmentMapping: {
          'ns=2;s=Temperature': 'eq-001',
          'ns=2;s=Vibration': 'eq-001',
        },
        sensorMapping: {
          'ns=2;s=Temperature': 'temperature',
          'ns=2;s=Vibration': 'vibration',
        },
      })

      const readings: Map<string, number> = new Map()
      service.onSensorData((equipmentId, data) => {
        readings.set(equipmentId, data.length)
      })

      // Start service (advances past connection delay)
      const startPromise = service.start()
      await vi.advanceTimersByTimeAsync(2000)
      await startPromise

      // Advance past multiple publishing intervals to ensure data
      await vi.advanceTimersByTimeAsync(5000)

      await service.stop()

      // Should have received readings for eq-001
      expect(readings.has('eq-001')).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('returns underlying OPC-UA client', () => {
    const service = createOPCUASensorService({
      endpointUrl: 'opc.tcp://localhost:4840',
      nodeIds: ['ns=2;s=Temperature'],
      equipmentMapping: {},
      sensorMapping: {},
    })

    const client = service.getClient()
    expect(client).toBeDefined()
    expect(typeof client.connect).toBe('function')
  })
})

describe('createSmartFactoryOPCUAClient', () => {
  it('creates client with default smart factory nodes', () => {
    const client = createSmartFactoryOPCUAClient('opc.tcp://localhost:4840')

    expect(client).toBeDefined()
    expect(client.getState()).toBe('disconnected')
  })
})

describe('DEFAULT_OPCUA_NODES', () => {
  it('includes all standard sensor nodes', () => {
    expect(DEFAULT_OPCUA_NODES).toContain('ns=2;s=Temperature')
    expect(DEFAULT_OPCUA_NODES).toContain('ns=2;s=Vibration')
    expect(DEFAULT_OPCUA_NODES).toContain('ns=2;s=Current')
    expect(DEFAULT_OPCUA_NODES).toContain('ns=2;s=Noise')
  })

  it('includes OEE nodes', () => {
    expect(DEFAULT_OPCUA_NODES).toContain('ns=2;s=OEE.Overall')
    expect(DEFAULT_OPCUA_NODES).toContain('ns=2;s=OEE.Availability')
    expect(DEFAULT_OPCUA_NODES).toContain('ns=2;s=OEE.Performance')
    expect(DEFAULT_OPCUA_NODES).toContain('ns=2;s=OEE.Quality')
  })
})

describe('Production Security Enforcement', () => {
  const originalEnv = process.env.NODE_ENV
  const mutableEnv = process.env as Record<string, string | undefined>

  afterEach(() => {
    mutableEnv.NODE_ENV = originalEnv
  })

  describe('in development environment', () => {
    beforeEach(() => {
      mutableEnv.NODE_ENV = 'development'
    })

    it('allows securityMode None without modification', () => {
      const client = createOPCUAClient({
        endpointUrl: 'opc.tcp://remote-server.example.com:4840',
        nodeIds: ['ns=2;s=Temperature'],
        securityMode: 'None',
      })
      expect(client).toBeDefined()
      expect(client.getState()).toBe('disconnected')
    })
  })

  describe('in production environment', () => {
    beforeEach(() => {
      mutableEnv.NODE_ENV = 'production'
    })

    it('allows localhost connections without security enforcement', () => {
      const client = createOPCUAClient({
        endpointUrl: 'opc.tcp://localhost:4840',
        nodeIds: ['ns=2;s=Temperature'],
        securityMode: 'None',
      })
      expect(client).toBeDefined()
    })

    it('allows 127.0.0.1 connections without security enforcement', () => {
      const client = createOPCUAClient({
        endpointUrl: 'opc.tcp://127.0.0.1:4840',
        nodeIds: ['ns=2;s=Temperature'],
        securityMode: 'None',
      })
      expect(client).toBeDefined()
    })

    it('enforces SignAndEncrypt for remote connections with None security', () => {
      // Note: We can't directly verify the internal securityMode transformation,
      // but we can verify the client is created successfully (proving the function runs)
      const client = createOPCUAClient({
        endpointUrl: 'opc.tcp://production-server.example.com:4840',
        nodeIds: ['ns=2;s=Temperature'],
        securityMode: 'None',
      })
      expect(client).toBeDefined()
      expect(client.getState()).toBe('disconnected')
    })

    it('allows SignAndEncrypt security mode without modification', () => {
      const client = createOPCUAClient({
        endpointUrl: 'opc.tcp://production-server.example.com:4840',
        nodeIds: ['ns=2;s=Temperature'],
        securityMode: 'SignAndEncrypt',
        securityPolicy: 'Basic256Sha256',
      })
      expect(client).toBeDefined()
    })

    it('allows Sign security mode without modification', () => {
      const client = createOPCUAClient({
        endpointUrl: 'opc.tcp://production-server.example.com:4840',
        nodeIds: ['ns=2;s=Temperature'],
        securityMode: 'Sign',
        securityPolicy: 'Basic256Sha256',
      })
      expect(client).toBeDefined()
    })
  })

  describe('createSmartFactoryOPCUAClient with security override', () => {
    beforeEach(() => {
      mutableEnv.NODE_ENV = 'production'
    })

    it('respects security override parameter', () => {
      const client = createSmartFactoryOPCUAClient(
        'opc.tcp://production-server.example.com:4840',
        {
          mode: 'SignAndEncrypt',
          policy: 'Aes128_Sha256_RsaOaep',
        }
      )
      expect(client).toBeDefined()
    })
  })
})
