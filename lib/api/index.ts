/**
 * QETTA API Utilities
 *
 * API 라우트에서 공통으로 사용하는 유틸리티 모음
 *
 * @example
 * ```ts
 * // 추천: 통합 미들웨어 사용 (Rate Limit + Auth)
 * import { withApiMiddleware } from '@/lib/api'
 *
 * export const POST = withApiMiddleware(
 *   async (request, session) => {
 *     return Response.json({ userId: session.user.id })
 *   },
 *   { endpoint: 'chat', requiredRole: 'user' }
 * )
 *
 * // 또는 개별 미들웨어 조합
 * import { withAuth, withRateLimit } from '@/lib/api'
 *
 * export const POST = withAuth(
 *   withRateLimit(handler, 'chat'),
 *   { requiredRole: 'user' }
 * )
 * ```
 */

// Rate Limiter
export {
  rateLimit,
  withRateLimit,
  getRateLimitHeaders,
  createRateLimitResponse,
  clearRateLimitStore,
  RATE_LIMITS,
} from './rate-limiter'

export type { RateLimitConfig, RateLimitResult } from './rate-limiter'

// Auth Middleware
export {
  withAuth,
  withOptionalAuth,
} from './auth-middleware'

export type {
  AuthenticatedHandler,
  OptionalAuthHandler,
  AuthMiddlewareOptions,
} from './auth-middleware'

// Unified Middleware (Recommended)
export {
  withApiMiddleware,
  adminApi,
  partnerApi,
  adminOrPartnerApi,
  publicApi,
} from './middleware'

export type {
  ApiHandler,
  OptionalApiHandler,
  ApiMiddlewareOptions,
} from './middleware'

// Browser-side API Client
export { apiPost, apiGet, ApiError } from './client'
