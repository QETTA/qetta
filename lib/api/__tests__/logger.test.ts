import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, logAPIError } from '../logger'

describe('logger', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('log levels', () => {
    it('respects LOG_LEVEL=debug (outputs all)', async () => {
      process.env.LOG_LEVEL = 'debug'
      // Re-import to pick up new env
      const { logger: freshLogger } = await import('../logger')

      freshLogger.debug('debug msg')
      freshLogger.info('info msg')
      freshLogger.warn('warn msg')
      freshLogger.error('error msg')

      expect(console.log).toHaveBeenCalledWith('debug msg')
      expect(console.log).toHaveBeenCalledWith('info msg')
      expect(console.warn).toHaveBeenCalledWith('warn msg')
      expect(console.error).toHaveBeenCalledWith('error msg')
    })

    it('respects LOG_LEVEL=info (skips debug)', async () => {
      process.env.LOG_LEVEL = 'info'
      const { logger: freshLogger } = await import('../logger')

      freshLogger.debug('debug msg')
      freshLogger.info('info msg')

      // debug should not be called because level is info
      expect(console.log).toHaveBeenCalledTimes(1)
      expect(console.log).toHaveBeenCalledWith('info msg')
    })

    it('respects LOG_LEVEL=warn (skips debug and info)', async () => {
      process.env.LOG_LEVEL = 'warn'
      const { logger: freshLogger } = await import('../logger')

      freshLogger.debug('debug msg')
      freshLogger.info('info msg')
      freshLogger.warn('warn msg')

      expect(console.log).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith('warn msg')
    })

    it('respects LOG_LEVEL=error (only errors)', async () => {
      process.env.LOG_LEVEL = 'error'
      const { logger: freshLogger } = await import('../logger')

      freshLogger.debug('debug msg')
      freshLogger.info('info msg')
      freshLogger.warn('warn msg')
      freshLogger.error('error msg')

      expect(console.log).not.toHaveBeenCalled()
      expect(console.warn).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith('error msg')
    })

    it('respects LOG_LEVEL=silent (outputs nothing)', async () => {
      process.env.LOG_LEVEL = 'silent'
      const { logger: freshLogger } = await import('../logger')

      freshLogger.debug('debug msg')
      freshLogger.info('info msg')
      freshLogger.warn('warn msg')
      freshLogger.error('error msg')

      expect(console.log).not.toHaveBeenCalled()
      expect(console.warn).not.toHaveBeenCalled()
      expect(console.error).not.toHaveBeenCalled()
    })

    it('defaults to warn in production', async () => {
      delete process.env.LOG_LEVEL
      ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
      const { logger: freshLogger } = await import('../logger')

      freshLogger.debug('debug msg')
      freshLogger.info('info msg')
      freshLogger.warn('warn msg')

      expect(console.log).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith('warn msg')
    })

    it('defaults to debug in development', async () => {
      delete process.env.LOG_LEVEL
      ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
      const { logger: freshLogger } = await import('../logger')

      freshLogger.debug('debug msg')

      expect(console.log).toHaveBeenCalledWith('debug msg')
    })
  })

  describe('error formatting', () => {
    it('formats Error objects to message string', () => {
      process.env.LOG_LEVEL = 'error'
      const testError = new Error('Test error message')

      logger.error('Caught:', testError)

      expect(console.error).toHaveBeenCalledWith('Caught:', 'Test error message')
    })

    it('passes non-Error objects through unchanged', () => {
      process.env.LOG_LEVEL = 'debug'
      const obj = { key: 'value' }

      logger.debug('Object:', obj)

      expect(console.log).toHaveBeenCalledWith('Object:', obj)
    })
  })

  describe('multiple arguments', () => {
    it('handles multiple arguments', () => {
      process.env.LOG_LEVEL = 'debug'

      logger.debug('arg1', 'arg2', 'arg3', 123)

      expect(console.log).toHaveBeenCalledWith('arg1', 'arg2', 'arg3', 123)
    })
  })
})

describe('logAPIError (deprecated)', () => {
  beforeEach(() => {
    process.env.LOG_LEVEL = 'error'
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs API errors with method and route', () => {
    const error = new Error('Connection refused')

    logAPIError('POST', '/api/test', error)

    expect(console.error).toHaveBeenCalledWith(
      '[API] POST /api/test error:',
      'Connection refused'
    )
  })

  it('handles non-Error objects', () => {
    logAPIError('GET', '/api/data', 'string error')

    expect(console.error).toHaveBeenCalledWith(
      '[API] GET /api/data error:',
      'string error'
    )
  })
})
