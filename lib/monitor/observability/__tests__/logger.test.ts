import { describe, it, expect } from 'vitest'
import {
  monitorLogger,
  sensorLogger,
  alertLogger,
  mqttLogger,
  opcuaLogger,
  createRequestLogger,
  logError,
} from '../logger'

describe('monitorLogger', () => {
  it('creates base logger with service name', () => {
    expect(monitorLogger).toBeDefined()
    expect(typeof monitorLogger.info).toBe('function')
    expect(typeof monitorLogger.error).toBe('function')
    expect(typeof monitorLogger.debug).toBe('function')
    expect(typeof monitorLogger.warn).toBe('function')
  })

  it('supports child logger creation', () => {
    const child = monitorLogger.child({ test: true })
    expect(child).toBeDefined()
    expect(typeof child.info).toBe('function')
  })
})

describe('component loggers', () => {
  it('creates sensor logger', () => {
    expect(sensorLogger).toBeDefined()
  })

  it('creates alert logger', () => {
    expect(alertLogger).toBeDefined()
  })

  it('creates mqtt logger', () => {
    expect(mqttLogger).toBeDefined()
  })

  it('creates opcua logger', () => {
    expect(opcuaLogger).toBeDefined()
  })
})

describe('createRequestLogger', () => {
  it('creates request-scoped logger with requestId', () => {
    const requestId = 'req-123-abc'
    const reqLogger = createRequestLogger(requestId)

    expect(reqLogger).toBeDefined()
    expect(typeof reqLogger.info).toBe('function')
  })

  it('creates unique loggers for different request IDs', () => {
    const logger1 = createRequestLogger('req-1')
    const logger2 = createRequestLogger('req-2')

    // Both should be valid loggers
    expect(logger1).toBeDefined()
    expect(logger2).toBeDefined()
    // They should be different instances
    expect(logger1).not.toBe(logger2)
  })
})

describe('logError', () => {
  it('handles Error instances', () => {
    const testError = new Error('Test error message')
    // Should not throw
    expect(() => {
      logError(monitorLogger, testError, 'An error occurred')
    }).not.toThrow()
  })

  it('handles non-Error values', () => {
    // Should not throw for string errors
    expect(() => {
      logError(monitorLogger, 'string error', 'An error occurred')
    }).not.toThrow()

    // Should not throw for object errors
    expect(() => {
      logError(monitorLogger, { code: 500 }, 'An error occurred')
    }).not.toThrow()
  })

  it('includes additional context', () => {
    const testError = new Error('Test')
    // Should not throw when context is provided
    expect(() => {
      logError(monitorLogger, testError, 'Error with context', {
        equipmentId: 'eq-001',
        sensorType: 'temperature',
      })
    }).not.toThrow()
  })
})
