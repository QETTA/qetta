/**
 * QETTA API 통합 미들웨어
 *
 * Rate Limiting + Authentication + Subscription을 결합한 단일 미들웨어
 *
 * 실행 순서:
 * 1. Rate Limiting (429 Too Many Requests)
 * 2. Authentication (401 Unauthorized / 403 Forbidden)
 * 3. Subscription Check (403 Subscription Required) - P0-FIX-4
 * 4. Handler 실행
 *
 * @example
 * ```ts
 * // 기본 사용 (인증 필수 + Rate Limit)
 * import { withApiMiddleware } from '@/lib/api/middleware'
 *
 * export const POST = withApiMiddleware(
 *   async (request, session) => {
 *     return Response.json({ userId: session.user.id })
 *   },
 *   { endpoint: 'chat', requiredRole: 'user' }
 * )
 *
 * // 구독 필수 API (P0-FIX-4)
 * export const POST = withApiMiddleware(
 *   async (request, session) => {
 *     return Response.json({ data: 'premium feature' })
 *   },
 *   { endpoint: 'default', requireActiveSubscription: true }
 * )
 *
 * // 인증 선택적 (Rate Limit만)
 * export const GET = withApiMiddleware(
 *   async (request, session) => {
 *     return Response.json({ data: 'public', user: session?.user })
 *   },
 *   { endpoint: 'default', optionalAuth: true }
 * )
 * ```
 */

import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import * as Sentry from '@sentry/nextjs'

import { auth } from '@/lib/auth'
import { logger } from '@/lib/api/logger'
import {
  rateLimit,
  createRateLimitResponse,
  getRateLimitHeaders,
  RATE_LIMITS,
} from './rate-limiter'
import type { RateLimitResult } from './rate-limiter'

// ============================================
// Types
// ============================================

/**
 * 인증된 API 핸들러 타입
 */
export type ApiHandler = (
  request: Request,
  session: Session
) => Promise<Response>

/**
 * 선택적 인증 API 핸들러 타입
 */
export type OptionalApiHandler = (
  request: Request,
  session: Session | null
) => Promise<Response>

/**
 * 통합 미들웨어 옵션
 */
export interface ApiMiddlewareOptions {
  /**
   * Rate Limit 엔드포인트 키 (RATE_LIMITS에서 설정 가져옴)
   * @default 'default'
   */
  endpoint?: keyof typeof RATE_LIMITS | string

  /**
   * 인증 선택적 여부 (false면 인증 필수)
   * @default false
   */
  optionalAuth?: boolean

  /**
   * 인증 비활성화 (public API용)
   * @default false
   */
  skipAuth?: boolean

  /**
   * 필수 역할 (없으면 인증만 확인)
   */
  requiredRole?: 'user' | 'admin' | 'partner'

  /**
   * 허용된 역할 목록 (OR 조건)
   */
  allowedRoles?: Array<'user' | 'admin' | 'partner'>

  /**
   * Rate Limit 비활성화
   * @default false
   */
  skipRateLimit?: boolean

  /**
   * P0-FIX-4: 활성 구독 필수 여부
   * true면 ACTIVE 또는 TRIALING 상태의 구독이 필요
   * @default false
   */
  requireActiveSubscription?: boolean
}

// ============================================
// Error Responses
// ============================================

/**
 * 인증 필요 응답 (401)
 */
function unauthorizedResponse(message = '인증이 필요합니다'): Response {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
    },
    { status: 401 }
  )
}

/**
 * 권한 부족 응답 (403)
 */
function forbiddenResponse(message = '접근 권한이 없습니다'): Response {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
      },
    },
    { status: 403 }
  )
}

/**
 * P0-FIX-4: 구독 필요 응답 (403)
 */
function subscriptionRequiredResponse(
  message = '활성 구독이 필요합니다',
  details?: { status: string; plan: string; daysRemaining: number }
): Response {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'SUBSCRIPTION_REQUIRED',
        message,
        ...(details && { details }),
      },
    },
    { status: 403 }
  )
}

// ============================================
// Main Middleware
// ============================================

/**
 * 통합 API 미들웨어
 *
 * Rate Limiting → Authentication → Handler 순서로 실행
 *
 * @param handler - API 핸들러 함수
 * @param options - 미들웨어 옵션
 * @returns 래핑된 핸들러
 *
 * @example
 * ```ts
 * // 인증 필수 + Rate Limit
 * export const POST = withApiMiddleware(
 *   async (request, session) => {
 *     const userId = session.user.id
 *     return Response.json({ success: true, userId })
 *   },
 *   { endpoint: 'chat' }
 * )
 *
 * // 관리자 전용
 * export const DELETE = withApiMiddleware(
 *   async (request, session) => {
 *     // session.user.role === 'admin'
 *     return Response.json({ deleted: true })
 *   },
 *   { endpoint: 'default', requiredRole: 'admin' }
 * )
 *
 * // 인증 선택적 (공개 API)
 * export const GET = withApiMiddleware(
 *   async (request, session) => {
 *     return Response.json({
 *       public: true,
 *       user: session?.user ?? null
 *     })
 *   },
 *   { endpoint: 'default', optionalAuth: true }
 * )
 *
 * // Rate Limit만 (인증 없음)
 * export const GET = withApiMiddleware(
 *   async (request) => {
 *     return Response.json({ health: 'ok' })
 *   },
 *   { endpoint: 'default', skipAuth: true }
 * )
 * ```
 */
export function withApiMiddleware<T extends boolean = false>(
  handler: T extends true ? OptionalApiHandler : ApiHandler,
  options: ApiMiddlewareOptions & { optionalAuth?: T; skipAuth?: T } = {}
): (request: Request) => Promise<Response> {
  const {
    endpoint = 'default',
    optionalAuth = false,
    skipAuth = false,
    requiredRole,
    allowedRoles,
    skipRateLimit = false,
    requireActiveSubscription = false,
  } = options

  return async (request: Request): Promise<Response> => {
    let rateLimitResult: RateLimitResult | null = null
    let session: Session | null = null

    try {
      // ========================================
      // Step 1: Rate Limiting
      // ========================================
      if (!skipRateLimit) {
        rateLimitResult = await rateLimit(request, endpoint)

        if (!rateLimitResult.success) {
          return createRateLimitResponse(rateLimitResult)
        }
      }

      // ========================================
      // Step 2: Authentication
      // ========================================
      if (!skipAuth) {
        try {
          session = await auth()
        } catch (authError) {
          logger.error('[API Middleware] Auth error:', authError)

          if (!optionalAuth) {
            return unauthorizedResponse('세션이 만료되었습니다. 다시 로그인해주세요.')
          }
          // optionalAuth면 null 세션으로 계속
        }

        // 인증 필수인데 세션이 없으면 401
        if (!optionalAuth && !session?.user) {
          return unauthorizedResponse()
        }

        // 역할 검증 (인증된 경우에만)
        if (session?.user) {
          const userRole = session.user.role || 'user'

          // 특정 역할 필수
          if (requiredRole && userRole !== requiredRole) {
            return forbiddenResponse(
              `이 작업에는 '${requiredRole}' 권한이 필요합니다`
            )
          }

          // 허용된 역할 중 하나 확인
          if (allowedRoles && allowedRoles.length > 0) {
            if (!allowedRoles.includes(userRole as 'user' | 'admin' | 'partner')) {
              return forbiddenResponse(
                `이 작업에는 [${allowedRoles.join(', ')}] 중 하나의 권한이 필요합니다`
              )
            }
          }
        }
      }

      // ========================================
      // Step 3: Subscription Check (P0-FIX-4)
      // ========================================
      if (requireActiveSubscription && session?.user) {
        const { checkSubscriptionStatus } = await import('@/lib/payment/subscription')
        const subscriptionStatus = await checkSubscriptionStatus(session.user.id)

        if (!subscriptionStatus.isActive) {
          const messages: Record<string, string> = {
            CANCELED: '구독이 취소되었습니다. 플랜을 다시 선택해주세요.',
            UNPAID: '결제가 필요합니다. 결제 정보를 확인해주세요.',
            PAST_DUE: '결제가 연체되었습니다. 결제 정보를 업데이트해주세요.',
          }

          return subscriptionRequiredResponse(
            messages[subscriptionStatus.status] || '활성 구독이 필요합니다',
            {
              status: subscriptionStatus.status,
              plan: subscriptionStatus.plan,
              daysRemaining: subscriptionStatus.daysRemaining,
            }
          )
        }
      }

      // ========================================
      // Step 4: Handler 실행
      // ========================================
      const response = await (handler as OptionalApiHandler)(request, session)

      // API 버전 및 Rate Limit 헤더 추가
      const headers = new Headers(response.headers)
      headers.set('X-API-Version', '1.0')
      headers.set('X-Request-Id', crypto.randomUUID())

      if (rateLimitResult) {
        for (const [key, value] of Object.entries(getRateLimitHeaders(rateLimitResult))) {
          headers.set(key, value)
        }
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch (error) {
      logger.error('[API Middleware] Unexpected error:', error)

      // Sentry에 에러 전송
      Sentry.captureException(error, {
        tags: {
          endpoint,
          hasSession: !!session,
        },
        extra: {
          url: request.url,
          method: request.method,
          userId: session?.user?.id,
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '요청 처리 중 오류가 발생했습니다',
          },
        },
        { status: 500 }
      )
    }
  }
}

// ============================================
// Convenience Wrappers
// ============================================

/**
 * 관리자 전용 API
 *
 * @example
 * ```ts
 * export const DELETE = adminApi(async (req, session) => {
 *   // admin만 접근 가능
 * }, 'default')
 * ```
 */
export function adminApi(
  handler: ApiHandler,
  endpoint: keyof typeof RATE_LIMITS | string = 'default'
): (request: Request) => Promise<Response> {
  return withApiMiddleware(handler, { endpoint, requiredRole: 'admin' })
}

/**
 * 파트너 전용 API
 */
export function partnerApi(
  handler: ApiHandler,
  endpoint: keyof typeof RATE_LIMITS | string = 'default'
): (request: Request) => Promise<Response> {
  return withApiMiddleware(handler, { endpoint, requiredRole: 'partner' })
}

/**
 * 관리자 또는 파트너 API
 */
export function adminOrPartnerApi(
  handler: ApiHandler,
  endpoint: keyof typeof RATE_LIMITS | string = 'default'
): (request: Request) => Promise<Response> {
  return withApiMiddleware(handler, { endpoint, allowedRoles: ['admin', 'partner'] })
}

/**
 * 공개 API (Rate Limit만 적용)
 */
export function publicApi(
  handler: (request: Request) => Promise<Response>,
  endpoint: keyof typeof RATE_LIMITS | string = 'default'
): (request: Request) => Promise<Response> {
  return withApiMiddleware(handler as OptionalApiHandler, { endpoint, skipAuth: true })
}

// ============================================
// Re-exports for convenience
// ============================================

export { RATE_LIMITS } from './rate-limiter'
export type { RateLimitConfig, RateLimitResult } from './rate-limiter'
