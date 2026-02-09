/**
 * Pino Structured Logger
 * High-performance JSON logging with trace correlation
 *
 * @see Plan: Part C2 - Infrastructure & Observability
 */

import pino from 'pino'
import { getTraceContext } from './instrumentation'

/**
 * Create base logger instance
 * Automatically includes trace context for correlation
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Base fields for all logs
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || require('os').hostname(),
    service: 'qetta-accounting',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },

  // Custom formatters
  formatters: {
    level: (label) => ({ level: label }),

    // Inject trace context into every log
    bindings: (bindings) => ({
      ...bindings,
      ...getTraceContext()
    })
  },

  // Serializers for common objects
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,

    // Custom serializer for Prisma errors
    prismaError: (err: any) => ({
      code: err.code,
      message: err.message,
      meta: err.meta,
      clientVersion: err.clientVersion
    }),

    // Custom serializer for user info (avoid PII)
    user: (user: any) => ({
      id: user.id,
      email: user.email ? maskEmail(user.email) : undefined,
      role: user.role
    })
  },

  // Pretty print in development
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,traceId,spanId'
          }
        }
      : undefined,

  // Redact sensitive fields
  redact: {
    paths: [
      'apiKey',
      'password',
      'token',
      'secret',
      'authorization',
      'cookie',
      '*.apiKey',
      '*.password',
      '*.token'
    ],
    censor: '[REDACTED]'
  }
})

/**
 * Child loggers for different modules
 * Automatically adds module context
 */
export const childLoggers = {
  partner: logger.child({ module: 'partner-service' }),
  referral: logger.child({ module: 'referral-service' }),
  payout: logger.child({ module: 'payout-service' }),
  cache: logger.child({ module: 'cache-service' }),
  audit: logger.child({ module: 'audit-service' }),
  api: logger.child({ module: 'api' }),
  worker: logger.child({ module: 'background-worker' })
}

/**
 * Helper: Mask email addresses for privacy
 * Example: john.doe@example.com → j***@example.com
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email

  const masked = local.length > 3 ? `${local[0]}***` : '***'
  return `${masked}@${domain}`
}

/**
 * Request Logger Middleware (for Express)
 *
 * Usage:
 * ```typescript
 * import { requestLogger } from '@/lib/telemetry/logger'
 * app.use(requestLogger)
 * ```
 */
export function requestLogger(req: any, res: any, next: any) {
  const start = Date.now()

  // Log request
  logger.info(
    {
      req: {
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.headers['user-agent'],
          'x-forwarded-for': req.headers['x-forwarded-for']
        }
      }
    },
    'Incoming request'
  )

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start

    const logFn = res.statusCode >= 500 ? logger.error : res.statusCode >= 400 ? logger.warn : logger.info

    logFn(
      {
        req: {
          method: req.method,
          url: req.url
        },
        res: {
          statusCode: res.statusCode
        },
        duration
      },
      'Request completed'
    )
  })

  next()
}

/**
 * Next.js API Route Logger
 *
 * Usage:
 * ```typescript
 * import { logApiRequest } from '@/lib/telemetry/logger'
 *
 * export async function POST(req: NextRequest) {
 *   logApiRequest(req, 'POST /api/accounting/admin/partners')
 *   // ...
 * }
 * ```
 */
export function logApiRequest(req: any, operationName: string) {
  logger.info(
    {
      operation: operationName,
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers.get('user-agent'),
        'x-forwarded-for': req.headers.get('x-forwarded-for')
      }
    },
    'API request'
  )
}

/**
 * Performance Logger
 * Track slow operations automatically
 *
 * Usage:
 * ```typescript
 * import { withPerformanceLogging } from '@/lib/telemetry/logger'
 *
 * const result = await withPerformanceLogging(
 *   'calculatePayout',
 *   async () => {
 *     // Your expensive operation
 *     return await calculatePayout(partnerId, period)
 *   },
 *   { partnerId, period: periodStart }
 * )
 * ```
 */
export async function withPerformanceLogging<T>(
  operationName: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const start = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - start

    const logFn = duration > 1000 ? logger.warn : logger.info

    logFn(
      {
        operation: operationName,
        duration,
        ...context
      },
      `Operation completed in ${duration}ms`
    )

    return result
  } catch (error) {
    const duration = Date.now() - start

    logger.error(
      {
        operation: operationName,
        duration,
        err: error,
        ...context
      },
      'Operation failed'
    )

    throw error
  }
}

/**
 * Business Event Logger
 * Track important business events for analytics
 *
 * Usage:
 * ```typescript
 * import { logBusinessEvent } from '@/lib/telemetry/logger'
 *
 * logBusinessEvent('payout_approved', {
 *   partnerId,
 *   payoutId,
 *   amount,
 *   approvedBy
 * })
 * ```
 */
export function logBusinessEvent(eventName: string, data: Record<string, any>) {
  logger.info(
    {
      event: eventName,
      ...data,
      timestamp: new Date().toISOString()
    },
    `Business event: ${eventName}`
  )
}

/**
 * Error Logger with categorization
 * Automatically categorize errors for better alerting
 */
export function logError(error: Error, context?: Record<string, any>) {
  const category = categorizeError(error)

  logger.error(
    {
      err: error,
      category,
      ...context
    },
    `Error: ${error.message}`
  )

  // Critical errors should also log to external monitoring
  if (category === 'critical') {
    // Future: Send to PagerDuty/Sentry
    console.error('[CRITICAL ERROR]', error.message, context)
  }
}

/**
 * Categorize errors for alerting
 */
function categorizeError(error: Error): 'critical' | 'warning' | 'info' {
  const message = error.message.toLowerCase()

  // Critical: Data integrity, payment failures
  if (
    message.includes('snapshot verification failed') ||
    message.includes('payment failed') ||
    message.includes('database') ||
    message.includes('transaction')
  ) {
    return 'critical'
  }

  // Warning: Rate limits, validation errors
  if (message.includes('rate limit') || message.includes('validation') || message.includes('not found')) {
    return 'warning'
  }

  return 'info'
}

/**
 * Query Logger for expensive database operations
 *
 * Usage:
 * ```typescript
 * import { logQuery } from '@/lib/telemetry/logger'
 *
 * const start = Date.now()
 * const result = await prisma.referralConversion.findMany({ ... })
 * logQuery('findManyConversions', Date.now() - start, { count: result.length })
 * ```
 */
export function logQuery(queryName: string, duration: number, metadata?: Record<string, any>) {
  const logFn = duration > 500 ? logger.warn : duration > 100 ? logger.info : logger.debug

  logFn(
    {
      query: queryName,
      duration,
      ...metadata
    },
    `Query: ${queryName} (${duration}ms)`
  )
}

export default logger
