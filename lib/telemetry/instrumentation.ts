/**
 * OpenTelemetry Instrumentation
 * Distributed tracing for full-stack observability
 *
 * @see Plan: Part C1 - Infrastructure & Observability
 */

import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from '@opentelemetry/core'

/**
 * Initialize OpenTelemetry SDK
 * Call this once at application startup (instrumentation.ts or server entry point)
 */
export function initializeTelemetry() {
  // Only initialize in production or when explicitly enabled
  if (!process.env.OTEL_ENABLED && process.env.NODE_ENV !== 'production') {
    console.log('[OpenTelemetry] Disabled in development (set OTEL_ENABLED=true to enable)')
    return null
  }

  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    headers: {
      'x-api-key': process.env.OTEL_API_KEY || ''
    }
  })

  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: 'qetta-accounting',
      [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }),

    spanProcessor: new BatchSpanProcessor(exporter, {
      maxQueueSize: 100,
      maxExportBatchSize: 10,
      scheduledDelayMillis: 5000
    }),

    textMapPropagator: new CompositePropagator({
      propagators: [
        new W3CTraceContextPropagator(),
        new W3CBaggagePropagator()
      ]
    }),

    instrumentations: [
      getNodeAutoInstrumentations({
        // HTTP instrumentation
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          ignoreIncomingRequestHook: (req) => {
            // Ignore health checks and static assets
            const ignoredPaths = ['/api/health', '/_next/', '/favicon.ico']
            return ignoredPaths.some((path) => req.url?.includes(path))
          }
        },

        // Express instrumentation
        '@opentelemetry/instrumentation-express': {
          enabled: true
        },

        // Database instrumentation
        '@opentelemetry/instrumentation-pg': {
          enabled: true,
          enhancedDatabaseReporting: true
        },

        // Redis instrumentation
        '@opentelemetry/instrumentation-redis-4': {
          enabled: true
        },

        // Disable noisy instrumentations
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false }
      })
    ]
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('[OpenTelemetry] SDK shut down successfully'))
      .catch((error) => console.error('[OpenTelemetry] Error shutting down SDK', error))
      .finally(() => process.exit(0))
  })

  sdk.start()
  console.log('[OpenTelemetry] SDK initialized successfully')

  return sdk
}

/**
 * Helper to create custom spans in application code
 *
 * Usage:
 * ```typescript
 * import { createSpan } from '@/lib/telemetry/instrumentation'
 *
 * const result = await createSpan('calculatePayout', async (span) => {
 *   span?.setAttribute('partner.id', partnerId)
 *   span?.setAttribute('period.start', periodStart.toISOString())
 *
 *   const conversions = await queryConversions()
 *   span?.setAttribute('conversions.count', conversions.length)
 *
 *   return calculateTotal(conversions)
 * })
 * ```
 */
export async function createSpan<T>(
  name: string,
  fn: (span: any) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  // Lazy import to avoid loading OTel in development
  if (!process.env.OTEL_ENABLED && process.env.NODE_ENV !== 'production') {
    return fn(null)
  }

  const { trace } = await import('@opentelemetry/api')
  const tracer = trace.getTracer('qetta-accounting')

  return tracer.startActiveSpan(name, async (span) => {
    try {
      // Add custom attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value)
        })
      }

      const result = await fn(span)

      span.setStatus({ code: 1 }) // SpanStatusCode.OK
      return result
    } catch (error) {
      span.setStatus({
        code: 2, // SpanStatusCode.ERROR
        message: error instanceof Error ? error.message : 'Unknown error'
      })

      span.recordException(error as Error)
      throw error
    } finally {
      span.end()
    }
  })
}

/**
 * Add trace context to logs
 * Call this in your logger to correlate logs with traces
 */
export function getTraceContext() {
  if (!process.env.OTEL_ENABLED && process.env.NODE_ENV !== 'production') {
    return {}
  }

  try {
    const { trace, context } = require('@opentelemetry/api')
    const span = trace.getSpan(context.active())

    if (!span) return {}

    const spanContext = span.spanContext()
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      traceFlags: spanContext.traceFlags
    }
  } catch {
    return {}
  }
}

/**
 * Middleware to inject trace context into Next.js API routes
 *
 * Usage:
 * ```typescript
 * import { withTracing } from '@/lib/telemetry/instrumentation'
 *
 * export const POST = withTracing(async (req: NextRequest) => {
 *   // Your handler logic
 * })
 * ```
 */
export function withTracing<T extends (...args: any[]) => any>(handler: T): T {
  return (async (...args: any[]) => {
    const operationName = handler.name || 'api-route'

    return createSpan(
      operationName,
      async (span) => {
        // Extract request info
        const req = args[0]
        if (req?.url) {
          span?.setAttribute('http.url', req.url)
          span?.setAttribute('http.method', req.method || 'GET')
        }

        return handler(...args)
      },
      {
        'service.name': 'qetta-accounting-api'
      }
    )
  }) as T
}
