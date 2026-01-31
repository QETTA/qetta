import { describe, it, expect, beforeEach } from 'vitest'
import {
  incrementCounter,
  addToCounter,
  setGauge,
  incrementGauge,
  decrementGauge,
  recordResponseTime,
  getMetrics,
  getMetricsSummary,
  resetMetrics,
  resetCounters,
  resetHistogram,
} from '../metrics'

describe('metrics', () => {
  beforeEach(() => {
    resetMetrics()
  })

  describe('counters', () => {
    it('increments counter by 1', () => {
      incrementCounter('sensorDataReceived')
      incrementCounter('sensorDataReceived')
      expect(getMetrics().sensorDataReceived).toBe(2)
    })

    it('adds specific amount to counter', () => {
      addToCounter('alertsTriggered', 5)
      addToCounter('alertsTriggered', 3)
      expect(getMetrics().alertsTriggered).toBe(8)
    })

    it('throws when adding negative amount', () => {
      expect(() => addToCounter('connectionAttempts', -1)).toThrow(
        'Counter increment must be positive'
      )
    })

    it('supports all counter types', () => {
      incrementCounter('sensorDataReceived')
      incrementCounter('alertsTriggered')
      incrementCounter('connectionAttempts')
      incrementCounter('connectionFailures')

      const metrics = getMetrics()
      expect(metrics.sensorDataReceived).toBe(1)
      expect(metrics.alertsTriggered).toBe(1)
      expect(metrics.connectionAttempts).toBe(1)
      expect(metrics.connectionFailures).toBe(1)
    })
  })

  describe('gauges', () => {
    it('sets gauge to specific value', () => {
      setGauge('activeMqttConnections', 5)
      expect(getMetrics().activeMqttConnections).toBe(5)

      setGauge('activeMqttConnections', 3)
      expect(getMetrics().activeMqttConnections).toBe(3)
    })

    it('increments gauge by 1', () => {
      incrementGauge('activeOpcuaConnections')
      incrementGauge('activeOpcuaConnections')
      expect(getMetrics().activeOpcuaConnections).toBe(2)
    })

    it('decrements gauge by 1 with minimum of 0', () => {
      setGauge('circuitBreakerOpenCount', 2)
      decrementGauge('circuitBreakerOpenCount')
      expect(getMetrics().circuitBreakerOpenCount).toBe(1)

      decrementGauge('circuitBreakerOpenCount')
      decrementGauge('circuitBreakerOpenCount') // Should stay at 0
      expect(getMetrics().circuitBreakerOpenCount).toBe(0)
    })

    it('supports all gauge types', () => {
      setGauge('activeMqttConnections', 1)
      setGauge('activeOpcuaConnections', 2)
      setGauge('circuitBreakerOpenCount', 3)

      const metrics = getMetrics()
      expect(metrics.activeMqttConnections).toBe(1)
      expect(metrics.activeOpcuaConnections).toBe(2)
      expect(metrics.circuitBreakerOpenCount).toBe(3)
    })
  })

  describe('histogram (response times)', () => {
    it('records response times', () => {
      recordResponseTime(100)
      recordResponseTime(200)
      recordResponseTime(300)

      const metrics = getMetrics()
      expect(metrics.responseTimesMs).toEqual([100, 200, 300])
    })

    it('maintains rolling window of max 1000 entries', () => {
      // Add 1001 entries
      for (let i = 0; i < 1001; i++) {
        recordResponseTime(i)
      }

      const metrics = getMetrics()
      expect(metrics.responseTimesMs.length).toBe(1000)
      // First entry should be 1 (0 was shifted out)
      expect(metrics.responseTimesMs[0]).toBe(1)
    })
  })

  describe('getMetricsSummary', () => {
    it('calculates average response time', () => {
      recordResponseTime(100)
      recordResponseTime(200)
      recordResponseTime(300)

      const summary = getMetricsSummary()
      expect(summary.avgResponseTimeMs).toBe(200)
    })

    it('calculates percentiles', () => {
      // Add 100 values: 1, 2, 3, ..., 100
      for (let i = 1; i <= 100; i++) {
        recordResponseTime(i)
      }

      const summary = getMetricsSummary()
      expect(summary.p50ResponseTimeMs).toBe(50)
      expect(summary.p95ResponseTimeMs).toBe(95)
      expect(summary.p99ResponseTimeMs).toBe(99)
    })

    it('calculates min and max', () => {
      recordResponseTime(50)
      recordResponseTime(10)
      recordResponseTime(90)
      recordResponseTime(30)

      const summary = getMetricsSummary()
      expect(summary.minResponseTimeMs).toBe(10)
      expect(summary.maxResponseTimeMs).toBe(90)
    })

    it('handles empty histogram', () => {
      const summary = getMetricsSummary()
      expect(summary.avgResponseTimeMs).toBe(0)
      expect(summary.p50ResponseTimeMs).toBe(0)
      expect(summary.p95ResponseTimeMs).toBe(0)
      expect(summary.minResponseTimeMs).toBe(0)
      expect(summary.maxResponseTimeMs).toBe(0)
      expect(summary.responseTimeCount).toBe(0)
    })

    it('includes all counters and gauges', () => {
      incrementCounter('sensorDataReceived')
      setGauge('activeMqttConnections', 5)

      const summary = getMetricsSummary()
      expect(summary.sensorDataReceived).toBe(1)
      expect(summary.activeMqttConnections).toBe(5)
    })
  })

  describe('reset operations', () => {
    it('resetMetrics clears everything', () => {
      incrementCounter('sensorDataReceived')
      setGauge('activeMqttConnections', 5)
      recordResponseTime(100)

      resetMetrics()

      const metrics = getMetrics()
      expect(metrics.sensorDataReceived).toBe(0)
      expect(metrics.activeMqttConnections).toBe(0)
      expect(metrics.responseTimesMs).toEqual([])
    })

    it('resetCounters only clears counters', () => {
      incrementCounter('sensorDataReceived')
      setGauge('activeMqttConnections', 5)
      recordResponseTime(100)

      resetCounters()

      const metrics = getMetrics()
      expect(metrics.sensorDataReceived).toBe(0)
      expect(metrics.activeMqttConnections).toBe(5) // Preserved
      expect(metrics.responseTimesMs).toEqual([100]) // Preserved
    })

    it('resetHistogram only clears response times', () => {
      incrementCounter('sensorDataReceived')
      setGauge('activeMqttConnections', 5)
      recordResponseTime(100)

      resetHistogram()

      const metrics = getMetrics()
      expect(metrics.sensorDataReceived).toBe(1) // Preserved
      expect(metrics.activeMqttConnections).toBe(5) // Preserved
      expect(metrics.responseTimesMs).toEqual([]) // Cleared
    })
  })

  describe('getMetrics returns copy', () => {
    it('does not allow external mutation', () => {
      recordResponseTime(100)

      const metrics1 = getMetrics()
      metrics1.responseTimesMs.push(999)
      metrics1.sensorDataReceived = 999

      const metrics2 = getMetrics()
      expect(metrics2.responseTimesMs).toEqual([100])
      expect(metrics2.sensorDataReceived).toBe(0)
    })
  })
})
