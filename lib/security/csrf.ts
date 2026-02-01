/**
 * CSRF (Cross-Site Request Forgery) 방지
 *
 * Double Submit Cookie 패턴 구현
 * - 쿠키에 CSRF 토큰 저장 (HttpOnly)
 * - 요청 헤더에서 토큰 검증
 *
 * @module security/csrf
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { logger } from '@/lib/api/logger'

// ============================================
// Constants
// ============================================

/** CSRF 쿠키 이름 */
export const CSRF_COOKIE_NAME = 'qetta_csrf'

/** CSRF 헤더 이름 */
export const CSRF_HEADER_NAME = 'x-csrf-token'

/** CSRF 폼 필드 이름 */
export const CSRF_FORM_FIELD = '_csrf'

/** 토큰 유효 기간 (초) */
export const CSRF_TOKEN_TTL = 60 * 60 * 24 // 24시간

/** 토큰 길이 (바이트) */
const TOKEN_LENGTH = 32

// ============================================
// Token Generation
// ============================================

/**
 * CSRF 토큰 생성
 *
 * @returns 64자 hex 문자열
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex')
}

/**
 * 타이밍 공격 방지를 위한 상수 시간 비교
 *
 * @param a - 첫 번째 문자열
 * @param b - 두 번째 문자열
 * @returns 일치 여부
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

// ============================================
// Cookie Operations
// ============================================

/**
 * CSRF 토큰을 쿠키에 설정
 *
 * @returns 생성된 토큰
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken()
  const cookieStore = await cookies()

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_TOKEN_TTL,
  })

  return token
}

/**
 * 쿠키에서 CSRF 토큰 조회
 *
 * @returns 토큰 또는 null
 */
export async function getCsrfToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null
  } catch {
    return null
  }
}

/**
 * CSRF 쿠키 삭제
 */
export async function clearCsrfToken(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(CSRF_COOKIE_NAME)
  } catch {
    // 무시
  }
}

// ============================================
// Token Extraction
// ============================================

/**
 * 요청에서 CSRF 토큰 추출
 *
 * 우선순위:
 * 1. X-CSRF-Token 헤더
 * 2. FormData의 _csrf 필드
 * 3. Query string의 _csrf 파라미터
 *
 * @param request - Request 객체
 * @returns 추출된 토큰 또는 null
 */
export async function extractCsrfToken(request: Request): Promise<string | null> {
  // 1. 헤더에서 추출
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken) {
    return headerToken
  }

  // 2. FormData에서 추출 (POST form submission)
  const contentType = request.headers.get('content-type')
  if (contentType?.includes('application/x-www-form-urlencoded') || contentType?.includes('multipart/form-data')) {
    try {
      const clonedRequest = request.clone()
      const formData = await clonedRequest.formData()
      const formToken = formData.get(CSRF_FORM_FIELD)
      if (typeof formToken === 'string') {
        return formToken
      }
    } catch {
      // FormData 파싱 실패
    }
  }

  // 3. Query string에서 추출 (GET은 일반적으로 CSRF 검증 불필요하지만 지원)
  try {
    const url = new URL(request.url)
    const queryToken = url.searchParams.get(CSRF_FORM_FIELD)
    if (queryToken) {
      return queryToken
    }
  } catch {
    // URL 파싱 실패
  }

  return null
}

// ============================================
// Token Verification
// ============================================

/**
 * CSRF 토큰 검증 결과
 */
export interface CsrfVerificationResult {
  valid: boolean
  error?: string
}

/**
 * CSRF 토큰 검증
 *
 * @param request - Request 객체
 * @returns 검증 결과
 */
export async function verifyCsrfToken(request: Request): Promise<CsrfVerificationResult> {
  // 쿠키에서 토큰 조회
  const cookieToken = await getCsrfToken()
  if (!cookieToken) {
    return { valid: false, error: 'CSRF 쿠키가 없습니다' }
  }

  // 요청에서 토큰 추출
  const requestToken = await extractCsrfToken(request)
  if (!requestToken) {
    return { valid: false, error: 'CSRF 토큰이 요청에 포함되지 않았습니다' }
  }

  // 타이밍 공격 방지 비교
  if (!timingSafeEqual(cookieToken, requestToken)) {
    return { valid: false, error: 'CSRF 토큰이 일치하지 않습니다' }
  }

  return { valid: true }
}

// ============================================
// Middleware
// ============================================

/** CSRF 검증을 건너뛸 HTTP 메소드 */
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

/**
 * CSRF 보호 옵션
 */
export interface CsrfProtectionOptions {
  /**
   * 검증 실패 시 자동으로 401 응답 반환
   * @default true
   */
  autoRespond?: boolean

  /**
   * 검증을 건너뛸 경로 패턴 (정규식)
   */
  skipPaths?: RegExp[]

  /**
   * 디버그 로깅 활성화
   * @default false
   */
  debug?: boolean
}

/**
 * CSRF 검증 미들웨어
 *
 * @param request - Request 객체
 * @param options - 옵션
 * @returns 검증 실패 시 Response, 성공 시 null
 *
 * @example
 * ```ts
 * // API Route에서 사용
 * export async function POST(request: Request) {
 *   const csrfError = await csrfProtection(request)
 *   if (csrfError) return csrfError
 *
 *   // 정상 처리
 * }
 * ```
 */
export async function csrfProtection(
  request: Request,
  options: CsrfProtectionOptions = {}
): Promise<Response | null> {
  const { autoRespond = true, skipPaths = [], debug = false } = options

  // 안전한 메소드는 검증 건너뛰기
  if (SAFE_METHODS.includes(request.method)) {
    if (debug) {
      logger.debug('[CSRF] Safe method, skipping verification', { method: request.method })
    }
    return null
  }

  // 경로 검증 건너뛰기
  const url = new URL(request.url)
  for (const pattern of skipPaths) {
    if (pattern.test(url.pathname)) {
      if (debug) {
        logger.debug('[CSRF] Path skipped', { path: url.pathname })
      }
      return null
    }
  }

  // CSRF 토큰 검증
  const result = await verifyCsrfToken(request)

  if (!result.valid) {
    logger.warn('[CSRF] Verification failed', {
      path: url.pathname,
      method: request.method,
      error: result.error,
    })

    if (autoRespond) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_INVALID',
            message: result.error || 'CSRF 토큰 검증에 실패했습니다',
          },
        },
        { status: 403 }
      )
    }
  }

  if (debug && result.valid) {
    logger.debug('[CSRF] Verification passed', { path: url.pathname })
  }

  return result.valid ? null : NextResponse.json(
    { success: false, error: { code: 'CSRF_INVALID', message: result.error } },
    { status: 403 }
  )
}

/**
 * CSRF 보호 HOF (Higher-Order Function)
 *
 * @param handler - API 핸들러
 * @param options - CSRF 옵션
 * @returns CSRF 보호가 적용된 핸들러
 *
 * @example
 * ```ts
 * export const POST = withCsrfProtection(async (request) => {
 *   // CSRF 검증 통과 후 실행
 *   return Response.json({ success: true })
 * })
 * ```
 */
export function withCsrfProtection(
  handler: (request: Request) => Promise<Response>,
  options?: CsrfProtectionOptions
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const csrfError = await csrfProtection(request, options)
    if (csrfError) {
      return csrfError
    }
    return handler(request)
  }
}

// ============================================
// React Hook Support (Client-side)
// ============================================

/**
 * CSRF 토큰을 포함한 fetch 옵션 생성
 *
 * 클라이언트에서 사용:
 * @example
 * ```ts
 * const response = await fetch('/api/submit', {
 *   method: 'POST',
 *   ...getCsrfFetchOptions(csrfToken),
 *   body: JSON.stringify(data),
 * })
 * ```
 */
export function getCsrfFetchOptions(token: string): RequestInit {
  return {
    headers: {
      [CSRF_HEADER_NAME]: token,
    },
    credentials: 'include', // 쿠키 포함
  }
}

/**
 * CSRF 토큰을 포함한 FormData 생성
 *
 * @param token - CSRF 토큰
 * @param data - 추가할 데이터
 * @returns FormData
 */
export function createCsrfFormData(token: string, data?: Record<string, string>): FormData {
  const formData = new FormData()
  formData.set(CSRF_FORM_FIELD, token)

  if (data) {
    for (const [key, value] of Object.entries(data)) {
      formData.set(key, value)
    }
  }

  return formData
}
