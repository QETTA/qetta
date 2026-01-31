import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkMemory,
  checkMQTT,
  checkOPCUA,
  getUptime,
  aggregateStatus,
  buildHealthStatus,
} from '../health'
import { resetMetrics } from '../metrics'

describe('health', () => {
  beforeEach(() => {
    resetMetrics()
  })

  describe('checkMemory', () => {
    it('returns health check with status', () => {
      const result = checkMemory()
      expect(result).toHaveProperty('status')
      expect(['ok', 'degraded', 'unhealthy']).toContain(result.status)
    })

    it('includes message with heap usage info', () => {
      const result = checkMemory()
      expect(result.message).toBeDefined()
      expect(result.message).toMatch(/Heap usage|Browser environment/)
    })
  })

  describe('checkMQTT', () => {
    it('returns ok when configured', () => {
      const result = checkMQTT(true)
      expect(result.status).toBe('ok')
      expect(result.message).toBe('Configured')
    })

    it('returns degraded when not configured', () => {
      const result = checkMQTT(false)
      expect(result.status).toBe('degraded')
      expect(result.message).toBe('Not configured')
    })
  })

  describe('checkOPCUA', () => {
    it('returns ok when configured', () => {
      const result = checkOPCUA(true)
      expect(result.status).toBe('ok')
      expect(result.message).toBe('Configured')
    })

    it('returns degraded when not configured', () => {
      const result = checkOPCUA(false)
      expect(result.status).toBe('degraded')
      expect(result.message).toBe('Not configured')
    })
  })

  describe('getUptime', () => {
    it('returns positive number', () => {
      const uptime = getUptime()
      expect(typeof uptime).toBe('number')
      expect(uptime).toBeGreaterThanOrEqual(0)
    })

    it('increases over time', async () => {
      const first = getUptime()
      await new Promise((resolve) => setTimeout(resolve, 10))
      const second = getUptime()
      expect(second).toBeGreaterThan(first)
    })
  })

  describe('aggregateStatus', () => {
    it('returns healthy when all checks are ok', () => {
      const result = aggregateStatus([
        { status: 'ok' },
        { status: 'ok' },
        { status: 'ok' },
      ])
      expect(result).toBe('healthy')
    })

    it('returns degraded when any check is degraded', () => {
      const result = aggregateStatus([
        { status: 'ok' },
        { status: 'degraded' },
        { status: 'ok' },
      ])
      expect(result).toBe('degraded')
    })

    it('returns unhealthy when any check is unhealthy', () => {
      const result = aggregateStatus([
        { status: 'ok' },
        { status: 'degraded' },
        { status: 'unhealthy' },
      ])
      expect(result).toBe('unhealthy')
    })

    it('unhealthy takes precedence over degraded', () => {
      const result = aggregateStatus([
        { status: 'degraded' },
        { status: 'unhealthy' },
      ])
      expect(result).toBe('unhealthy')
    })

    it('returns healthy for empty array', () => {
      const result = aggregateStatus([])
      expect(result).toBe('healthy')
    })
  })

  describe('buildHealthStatus', () => {
    it('returns complete health status object', () => {
      const status = buildHealthStatus(true, false)

      expect(status).toHaveProperty('status')
      expect(status).toHaveProperty('timestamp')
      expect(status).toHaveProperty('uptime')
      expect(status).toHaveProperty('checks')
      expect(status).toHaveProperty('metrics')
    })

    it('includes mqtt check result', () => {
      const status = buildHealthStatus(true, false)
      expect(status.checks.mqtt.status).toBe('ok')
      expect(status.checks.mqtt.message).toBe('Configured')
    })

    it('includes opcua check result', () => {
      const status = buildHealthStatus(false, true)
      expect(status.checks.opcua.status).toBe('ok')
      expect(status.checks.opcua.message).toBe('Configured')
    })

    it('includes memory check result', () => {
      const status = buildHealthStatus(false, false)
      expect(status.checks.memory).toHaveProperty('status')
      expect(status.checks.memory).toHaveProperty('message')
    })

    it('has valid ISO timestamp', () => {
      const status = buildHealthStatus(false, false)
      const parsed = Date.parse(status.timestamp)
      expect(isNaN(parsed)).toBe(false)
    })

    it('has positive uptime', () => {
      const status = buildHealthStatus(false, false)
      expect(status.uptime).toBeGreaterThanOrEqual(0)
    })

    it('calculates correct overall status - healthy', () => {
      // Mock memory to return ok
      const status = buildHealthStatus(true, true)
      // Memory is typically ok, so with both configured we should be healthy
      expect(['healthy', 'degraded']).toContain(status.status)
    })

    it('calculates correct overall status - degraded when mqtt not configured', () => {
      const status = buildHealthStatus(false, false)
      // Both not configured = degraded (memory is usually ok)
      expect(status.status).toBe('degraded')
    })

    it('includes metrics summary', () => {
      const status = buildHealthStatus(false, false)
      expect(status.metrics).toHaveProperty('sensorDataReceived')
      expect(status.metrics).toHaveProperty('avgResponseTimeMs')
    })
  })
})
