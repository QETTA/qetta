/**
 * Structured Logger
 *
 * Provides consistent logging with log levels and environment-aware output.
 *
 * @example
 * ```ts
 * import { logger } from '@/lib/api/logger'
 *
 * logger.debug('[Cache]', 'Hit:', key)
 * logger.info('[Auth]', 'User signed in:', email)
 * logger.warn('[API]', 'Rate limit approaching')
 * logger.error('[DB]', 'Connection failed:', error)
 * ```
 *
 * Environment variables:
 * - LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' | 'silent'
 * - Default: 'warn' in production, 'debug' in development
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel
  }
  return process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getLogLevel()]
}

function formatArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (arg instanceof Error) {
      return arg.message
    }
    return arg
  })
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.log(...formatArgs(args))
    }
  },

  info: (...args: unknown[]) => {
    if (shouldLog('info')) {
      console.log(...formatArgs(args))
    }
  },

  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(...formatArgs(args))
    }
  },

  error: (...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error(...formatArgs(args))
    }
  },
}

/**
 * Legacy function for API error logging
 * @deprecated Use logger.error instead
 */
export function logAPIError(method: string, route: string, error: unknown) {
  logger.error(`[API] ${method} ${route} error:`, error)
}
