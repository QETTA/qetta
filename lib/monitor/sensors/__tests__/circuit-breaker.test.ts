/**
 * Circuit Breaker Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createCircuitBreaker,
  createSensorCircuitBreaker,
  createLenientCircuitBreaker,
  type CircuitBreakerState,
} from '../circuit-breaker'

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('createCircuitBreaker', () => {
    it('should create a circuit breaker with correct interface', () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000,
      })

      expect(breaker).toHaveProperty('execute')
      expect(breaker).toHaveProperty('getState')
      expect(breaker).toHaveProperty('getFailureCount')
      expect(breaker).toHaveProperty('reset')
      expect(breaker).toHaveProperty('forceOpen')
      expect(breaker).toHaveProperty('forceClose')
    })

    it('should start in closed state', () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000,
      })

      expect(breaker.getState()).toBe('closed')
    })

    it('should start with zero failure count', () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000,
      })

      expect(breaker.getFailureCount()).toBe(0)
    })
  })

  describe('execute', () => {
    it('should execute successful function and return value', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000,
      })

      const result = await breaker.execute(async () => 'success')

      expect(result.success).toBe(true)
      expect(result.value).toBe('success')
      expect(result.rejected).toBe(false)
      expect(result.state).toBe('closed')
    })

    it('should capture errors from failed function', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000,
      })

      const result = await breaker.execute(async () => {
        throw new Error('test error')
      })

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('test error')
      expect(result.rejected).toBe(false)
    })

    it('should increment failure count on errors', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000,
      })

      await breaker.execute(async () => {
        throw new Error('error')
      })

      expect(breaker.getFailureCount()).toBe(1)
    })
  })

  describe('state transitions', () => {
    it('should open circuit after reaching failure threshold', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 30000,
      })

      // Trigger 3 failures
      for (let i = 0; i < 3; i++) {
        await breaker.execute(async () => {
          throw new Error('error')
        })
      }

      expect(breaker.getState()).toBe('open')
    })

    it('should reject requests immediately when circuit is open', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 30000,
      })

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await breaker.execute(async () => {
          throw new Error('error')
        })
      }

      expect(breaker.getState()).toBe('open')

      // Next request should be rejected
      const result = await breaker.execute(async () => 'success')

      expect(result.success).toBe(false)
      expect(result.rejected).toBe(true)
      expect(result.error?.message).toBe('Circuit breaker is open')
    })

    it('should transition to half-open after reset timeout', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 5000,
      })

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await breaker.execute(async () => {
          throw new Error('error')
        })
      }

      expect(breaker.getState()).toBe('open')

      // Advance time past reset timeout
      await vi.advanceTimersByTimeAsync(5100)

      expect(breaker.getState()).toBe('half-open')
    })

    it('should close circuit after success in half-open state', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 5000,
        successThreshold: 1,
      })

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await breaker.execute(async () => {
          throw new Error('error')
        })
      }

      // Advance to half-open
      await vi.advanceTimersByTimeAsync(5100)
      expect(breaker.getState()).toBe('half-open')

      // Successful request should close circuit
      await breaker.execute(async () => 'success')

      expect(breaker.getState()).toBe('closed')
    })

    it('should reopen circuit on failure in half-open state', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 5000,
      })

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await breaker.execute(async () => {
          throw new Error('error')
        })
      }

      // Advance to half-open
      await vi.advanceTimersByTimeAsync(5100)
      expect(breaker.getState()).toBe('half-open')

      // Failed request should reopen circuit
      await breaker.execute(async () => {
        throw new Error('still failing')
      })

      expect(breaker.getState()).toBe('open')
    })
  })

  describe('failure window', () => {
    it('should only count failures within the window', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 30000,
        failureWindow: 5000, // 5 second window
      })

      // First failure
      await breaker.execute(async () => {
        throw new Error('error 1')
      })
      expect(breaker.getFailureCount()).toBe(1)

      // Advance time past window
      await vi.advanceTimersByTimeAsync(6000)

      // Second failure (first should have expired)
      await breaker.execute(async () => {
        throw new Error('error 2')
      })
      expect(breaker.getFailureCount()).toBe(1) // Only the recent one
    })
  })

  describe('success threshold', () => {
    it('should require multiple successes to close circuit', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 5000,
        successThreshold: 3,
      })

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await breaker.execute(async () => {
          throw new Error('error')
        })
      }

      // Advance to half-open
      await vi.advanceTimersByTimeAsync(5100)

      // First two successes should keep it half-open
      await breaker.execute(async () => 'success 1')
      expect(breaker.getState()).toBe('half-open')

      await breaker.execute(async () => 'success 2')
      expect(breaker.getState()).toBe('half-open')

      // Third success should close it
      await breaker.execute(async () => 'success 3')
      expect(breaker.getState()).toBe('closed')
    })
  })

  describe('state change callback', () => {
    it('should call onStateChange when state changes', async () => {
      const onStateChange = vi.fn()
      const breaker = createCircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 5000,
        onStateChange,
      })

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await breaker.execute(async () => {
          throw new Error('error')
        })
      }

      expect(onStateChange).toHaveBeenCalledWith('open', 'closed')

      // Advance to half-open
      await vi.advanceTimersByTimeAsync(5100)

      expect(onStateChange).toHaveBeenCalledWith('half-open', 'open')
    })

    it('should not call onStateChange when state remains the same', async () => {
      const onStateChange = vi.fn()
      const breaker = createCircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 5000,
        onStateChange,
      })

      // Single failure should not change state
      await breaker.execute(async () => {
        throw new Error('error')
      })

      expect(onStateChange).not.toHaveBeenCalled()
    })
  })

  describe('manual controls', () => {
    it('should reset circuit to closed state', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 30000,
      })

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await breaker.execute(async () => {
          throw new Error('error')
        })
      }

      expect(breaker.getState()).toBe('open')

      breaker.reset()

      expect(breaker.getState()).toBe('closed')
      expect(breaker.getFailureCount()).toBe(0)
    })

    it('should force open the circuit', () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000,
      })

      breaker.forceOpen()

      expect(breaker.getState()).toBe('open')
    })

    it('should force close the circuit', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 30000,
      })

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await breaker.execute(async () => {
          throw new Error('error')
        })
      }

      breaker.forceClose()

      expect(breaker.getState()).toBe('closed')
    })
  })
})

describe('createSensorCircuitBreaker', () => {
  it('should create a circuit breaker with sensor-optimized settings', () => {
    const breaker = createSensorCircuitBreaker()

    expect(breaker.getState()).toBe('closed')
    // Settings are internal, but we can verify it works
    expect(breaker).toBeDefined()
  })

  it('should accept state change callback', () => {
    const onStateChange = vi.fn()
    const breaker = createSensorCircuitBreaker(onStateChange)

    breaker.forceOpen()

    expect(onStateChange).toHaveBeenCalledWith('open', 'closed')
  })
})

describe('createLenientCircuitBreaker', () => {
  it('should create a circuit breaker with lenient settings', () => {
    const breaker = createLenientCircuitBreaker()

    expect(breaker.getState()).toBe('closed')
    expect(breaker).toBeDefined()
  })

  it('should accept state change callback', () => {
    const onStateChange = vi.fn()
    const breaker = createLenientCircuitBreaker(onStateChange)

    breaker.forceOpen()

    expect(onStateChange).toHaveBeenCalledWith('open', 'closed')
  })
})
