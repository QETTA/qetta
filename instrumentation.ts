/**
 * Next.js Instrumentation
 *
 * Sentry 초기화를 위한 Next.js 14+ 인스트루멘테이션 파일
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = async (
  error: Error,
  request: { method: string; url: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string }
) => {
  // Dynamic import to avoid issues when Sentry is not configured
  const Sentry = await import('@sentry/nextjs')

  Sentry.captureException(error, {
    tags: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
    extra: {
      method: request.method,
      url: request.url,
    },
  })
}
