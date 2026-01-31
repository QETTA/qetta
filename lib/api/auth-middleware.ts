/**
 * API 인증 미들웨어
 *
 * NextAuth.js v5 기반 API 라우트 인증 검증
 *
 * 기능:
 * 1. 세션 검증 (JWT 기반)
 * 2. 역할 기반 접근 제어 (RBAC)
 * 3. 표준화된 에러 응답
 *
 * @example
 * ```ts
 * // 인증 필수 API
 * import { withAuth } from '@/lib/api/auth-middleware'
 *
 * export const POST = withAuth(async (request, session) => {
 *   // session.user 사용 가능
 *   return Response.json({ user: session.user })
 * })
 *
 * // 관리자 전용 API
 * export const DELETE = withAuth(
 *   async (request, session) => { ... },
 *   { requiredRole: 'admin' }
 * )
 * ```
 */

import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'

import { auth } from '@/lib/auth'
import { logger } from '@/lib/api/logger'

// ============================================
// Types
// ============================================

/**
 * 인증된 핸들러 타입
 */
export type AuthenticatedHandler = (
  request: Request,
  session: Session
) => Promise<Response>

/**
 * 인증 미들웨어 옵션
 */
export interface AuthMiddlewareOptions {
  /**
   * 필수 역할 (없으면 인증만 확인)
   */
  requiredRole?: 'user' | 'admin' | 'partner'

  /**
   * 여러 역할 중 하나 허용
   */
  allowedRoles?: Array<'user' | 'admin' | 'partner'>

  /**
   * 인증 선택적 (인증 없어도 호출, session이 null일 수 있음)
   */
  optional?: boolean
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

// ============================================
// Main Middleware
// ============================================

/**
 * API 인증 미들웨어
 *
 * @param handler - 인증 후 실행할 핸들러
 * @param options - 미들웨어 옵션
 * @returns 래핑된 핸들러
 *
 * @example
 * ```ts
 * // 기본 사용 (인증 필수)
 * export const POST = withAuth(async (request, session) => {
 *   return Response.json({ userId: session.user.id })
 * })
 *
 * // 관리자 전용
 * export const DELETE = withAuth(
 *   async (request, session) => { ... },
 *   { requiredRole: 'admin' }
 * )
 *
 * // 여러 역할 허용
 * export const PUT = withAuth(
 *   async (request, session) => { ... },
 *   { allowedRoles: ['admin', 'partner'] }
 * )
 * ```
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options: AuthMiddlewareOptions = {}
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      // NextAuth.js v5: auth() 함수로 세션 조회
      const session = await auth()

      // 인증 확인
      if (!session?.user) {
        if (options.optional) {
          // 선택적 인증: null 세션으로 핸들러 호출
          // Note: handler 시그니처 변경 필요 시 별도 처리
          return handler(request, session as unknown as Session)
        }
        return unauthorizedResponse()
      }

      // 역할 검증
      const userRole = session.user.role || 'user'

      // 특정 역할 필수
      if (options.requiredRole) {
        if (userRole !== options.requiredRole) {
          return forbiddenResponse(
            `이 작업에는 '${options.requiredRole}' 권한이 필요합니다`
          )
        }
      }

      // 허용된 역할 중 하나 확인
      if (options.allowedRoles && options.allowedRoles.length > 0) {
        if (!options.allowedRoles.includes(userRole as 'user' | 'admin' | 'partner')) {
          return forbiddenResponse(
            `이 작업에는 [${options.allowedRoles.join(', ')}] 중 하나의 권한이 필요합니다`
          )
        }
      }

      // 인증/권한 검증 완료, 핸들러 실행
      return handler(request, session)
    } catch (error) {
      logger.error('[Auth Middleware] Error:', error)

      // NextAuth 내부 에러
      if (error instanceof Error && error.message.includes('AUTH_')) {
        return unauthorizedResponse('세션이 만료되었습니다. 다시 로그인해주세요.')
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '인증 처리 중 오류가 발생했습니다',
          },
        },
        { status: 500 }
      )
    }
  }
}

// ============================================
// Optional Auth Middleware
// ============================================

/**
 * 선택적 인증 핸들러 타입
 */
export type OptionalAuthHandler = (
  request: Request,
  session: Session | null
) => Promise<Response>

/**
 * 선택적 인증 미들웨어
 *
 * 인증 없어도 호출 가능, 인증 시 session 제공
 *
 * @example
 * ```ts
 * export const GET = withOptionalAuth(async (request, session) => {
 *   if (session) {
 *     return Response.json({ user: session.user, personalized: true })
 *   }
 *   return Response.json({ personalized: false })
 * })
 * ```
 */
export function withOptionalAuth(
  handler: OptionalAuthHandler
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      const session = await auth()
      return handler(request, session)
    } catch (error) {
      logger.error('[Auth Middleware] Optional auth error:', error)
      // 인증 실패해도 null 세션으로 계속
      return handler(request, null)
    }
  }
}

