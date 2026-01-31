/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by stopping requests to failing services
 * and automatically recovering when the service becomes healthy.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are rejected immediately
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 *
 * @module lib/monitor/sensors/circuit-breaker
 *
 * @example
 * ```ts
 * const breaker = createCircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 30000,
 *   halfOpenRequests: 1,
 * })
 *
 * const result = await breaker.execute(async () => {
 *   return await mqttClient.connect()
 * })
 *
 * if (result.success) {
 *   console.log('Connected:', result.value)
 * } else {
 *   console.error('Failed:', result.error)
 * }
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export type CircuitBreakerState = 'closed' | 'open' | 'half-open'

export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit */
  failureThreshold: number
  /** Time in ms before attempting to close the circuit */
  resetTimeout: number
  /** Number of successful requests needed to close the circuit from half-open */
  successThreshold?: number
  /** Time window in ms for counting failures (sliding window) */
  failureWindow?: number
  /** Callback when state changes */
  onStateChange?: (state: CircuitBreakerState, previousState: CircuitBreakerState) => void
}

export interface CircuitBreakerResult<T> {
  success: boolean
  value?: T
  error?: Error
  state: CircuitBreakerState
  rejected: boolean
}

export interface CircuitBreaker {
  /** Execute a function through the circuit breaker */
  execute: <T>(fn: () => Promise<T>) => Promise<CircuitBreakerResult<T>>
  /** Get current state */
  getState: () => CircuitBreakerState
  /** Get failure count */
  getFailureCount: () => number
  /** Manually reset the circuit breaker */
  reset: () => void
  /** Force open the circuit (for testing or manual intervention) */
  forceOpen: () => void
  /** Force close the circuit (for testing or manual intervention) */
  forceClose: () => void
}

// =============================================================================
// Implementation
// =============================================================================

const DEFAULT_CONFIG: Required<Omit<CircuitBreakerConfig, 'onStateChange'>> & { onStateChange?: CircuitBreakerConfig['onStateChange'] } = {
  failureThreshold: 5,
  resetTimeout: 30000,
  successThreshold: 1,
  failureWindow: 60000,
  onStateChange: undefined,
}

/**
 * Create a circuit breaker instance
 *
 * The circuit breaker pattern helps prevent cascading failures in distributed
 * systems by failing fast when a service is known to be unavailable.
 *
 * @param config - Circuit breaker configuration
 * @returns CircuitBreaker instance
 */
export function createCircuitBreaker(config: CircuitBreakerConfig): CircuitBreaker {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  let state: CircuitBreakerState = 'closed'
  let failures: number[] = [] // Timestamps of failures
  let successCount = 0
  let resetTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Update state and notify listener
   */
  const setState = (newState: CircuitBreakerState) => {
    const previousState = state
    if (previousState !== newState) {
      state = newState
      cfg.onStateChange?.(newState, previousState)
    }
  }

  /**
   * Count recent failures within the window
   */
  const getRecentFailures = (): number => {
    const now = Date.now()
    const windowStart = now - cfg.failureWindow
    failures = failures.filter((ts) => ts >= windowStart)
    return failures.length
  }

  /**
   * Record a failure
   */
  const recordFailure = () => {
    failures.push(Date.now())
    successCount = 0

    const recentFailures = getRecentFailures()
    if (recentFailures >= cfg.failureThreshold && state === 'closed') {
      openCircuit()
    }
  }

  /**
   * Record a success
   */
  const recordSuccess = () => {
    if (state === 'half-open') {
      successCount++
      if (successCount >= cfg.successThreshold) {
        closeCircuit()
      }
    } else if (state === 'closed') {
      // Clear some failures on success (optional, for faster recovery)
      failures = failures.slice(Math.max(0, failures.length - cfg.failureThreshold + 1))
    }
  }

  /**
   * Open the circuit (stop allowing requests)
   */
  const openCircuit = () => {
    setState('open')
    scheduleReset()
  }

  /**
   * Close the circuit (allow requests again)
   */
  const closeCircuit = () => {
    setState('closed')
    failures = []
    successCount = 0
    clearResetTimer()
  }

  /**
   * Enter half-open state (allow test requests)
   */
  const halfOpenCircuit = () => {
    setState('half-open')
    successCount = 0
  }

  /**
   * Schedule circuit reset attempt
   */
  const scheduleReset = () => {
    clearResetTimer()
    resetTimer = setTimeout(() => {
      halfOpenCircuit()
    }, cfg.resetTimeout)
  }

  /**
   * Clear reset timer
   */
  const clearResetTimer = () => {
    if (resetTimer) {
      clearTimeout(resetTimer)
      resetTimer = null
    }
  }

  return {
    async execute<T>(fn: () => Promise<T>): Promise<CircuitBreakerResult<T>> {
      // Reject immediately if circuit is open
      if (state === 'open') {
        return {
          success: false,
          error: new Error('Circuit breaker is open'),
          state,
          rejected: true,
        }
      }

      try {
        const value = await fn()
        recordSuccess()
        return {
          success: true,
          value,
          state,
          rejected: false,
        }
      } catch (error) {
        recordFailure()

        // If we were half-open and failed, go back to open
        if (state === 'half-open') {
          openCircuit()
        }

        return {
          success: false,
          error: error as Error,
          state,
          rejected: false,
        }
      }
    },

    getState(): CircuitBreakerState {
      return state
    },

    getFailureCount(): number {
      return getRecentFailures()
    },

    reset(): void {
      closeCircuit()
    },

    forceOpen(): void {
      openCircuit()
    },

    forceClose(): void {
      closeCircuit()
    },
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a circuit breaker configured for sensor connections
 *
 * Uses more aggressive settings since sensor connections are critical
 * and we want to recover quickly.
 */
export function createSensorCircuitBreaker(
  onStateChange?: (state: CircuitBreakerState, previousState: CircuitBreakerState) => void
): CircuitBreaker {
  return createCircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 15000, // 15 seconds
    successThreshold: 1,
    failureWindow: 30000, // 30 second window
    onStateChange,
  })
}

/**
 * Create a circuit breaker configured for less critical operations
 *
 * More lenient settings for non-critical services.
 */
export function createLenientCircuitBreaker(
  onStateChange?: (state: CircuitBreakerState, previousState: CircuitBreakerState) => void
): CircuitBreaker {
  return createCircuitBreaker({
    failureThreshold: 10,
    resetTimeout: 60000, // 1 minute
    successThreshold: 2,
    failureWindow: 120000, // 2 minute window
    onStateChange,
  })
}
