/**
 * Structured Logger for QETTA Monitor Module
 *
 * Uses pino for structured JSON logging with:
 * - Component-specific child loggers
 * - Request correlation ID support
 * - Environment-aware formatting (pretty in dev, JSON in prod)
 *
 * @example
 * ```ts
 * import { sensorLogger } from '@/lib/monitor/observability/logger'
 *
 * sensorLogger.info({ equipmentId: 'eq-001' }, 'Data received')
 * sensorLogger.error({ err }, 'Connection failed')
 * ```
 */

import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'
const isServer = typeof window === 'undefined'

/**
 * Base logger for the monitor module
 *
 * Configuration:
 * - LOG_LEVEL env var controls verbosity (default: debug in dev, info in prod)
 * - Pretty formatting in development (server-side only) for readability
 * - JSON output in production for log aggregation tools
 * - Browser uses default console output (no transport)
 */
export const monitorLogger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  // pino-pretty transport is Node.js only - don't use in browser
  transport:
    isDev && isServer
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  // In browser, use browser-compatible settings
  browser: {
    asObject: true,
  },
  base: isServer
    ? {
        service: 'qetta-monitor',
        env: process.env.NODE_ENV ?? 'development',
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
})

/**
 * Child logger for sensor-related operations
 * Includes component tag for filtering
 */
export const sensorLogger = monitorLogger.child({ component: 'sensor' })

/**
 * Child logger for alert engine operations
 * Includes component tag for filtering
 */
export const alertLogger = monitorLogger.child({ component: 'alert' })

/**
 * Child logger for MQTT client operations
 * Includes component tag for filtering
 */
export const mqttLogger = monitorLogger.child({ component: 'mqtt' })

/**
 * Child logger for OPC-UA client operations
 * Includes component tag for filtering
 */
export const opcuaLogger = monitorLogger.child({ component: 'opcua' })

/**
 * Creates a request-scoped logger with correlation ID
 *
 * Use this to trace requests across components
 *
 * @param requestId - Unique request identifier
 * @returns Logger instance with requestId in all log entries
 *
 * @example
 * ```ts
 * const logger = createRequestLogger(crypto.randomUUID())
 * logger.info('Processing request')
 * // Output: {"requestId":"abc-123","msg":"Processing request",...}
 * ```
 */
export function createRequestLogger(requestId: string) {
  return monitorLogger.child({ requestId })
}

/**
 * Type-safe wrapper for error logging
 * Ensures error objects are properly serialized
 */
export function logError(
  logger: pino.Logger,
  error: unknown,
  message: string,
  context?: Record<string, unknown>,
) {
  if (error instanceof Error) {
    logger.error({ err: error, ...context }, message)
  } else {
    logger.error({ error, ...context }, message)
  }
}
