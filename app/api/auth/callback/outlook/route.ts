/**
 * Outlook OAuth 콜백 엔드포인트
 *
 * GET /api/auth/callback/outlook
 *
 * Microsoft에서 리다이렉트된 후 토큰 교환 처리
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { outlookOAuth, OAuthError } from '@/lib/oauth'
import { logger } from '@/lib/api/logger'

interface OAuthState {
  returnUrl: string
  nonce: string
  timestamp: number
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // 에러 처리
  if (error) {
    const errorDescription = url.searchParams.get('error_description')
    logger.error('[Outlook OAuth] Error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  // code 필수
  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/error?error=missing_code', request.url)
    )
  }

  // state 파싱 + CSRF 검증
  let parsedState: OAuthState = { returnUrl: '/dashboard', nonce: '', timestamp: 0 }
  if (state) {
    try {
      parsedState = JSON.parse(Buffer.from(state, 'base64url').toString())

      // state 만료 검증 (10분)
      if (Date.now() - parsedState.timestamp > 10 * 60 * 1000) {
        return NextResponse.redirect(
          new URL('/auth/error?error=state_expired', request.url)
        )
      }

      // CSRF: nonce 검증 — 쿠키에 저장된 nonce와 비교
      const cookieStore = await cookies()
      const storedNonce = cookieStore.get('oauth_nonce')?.value
      if (!storedNonce || storedNonce !== parsedState.nonce) {
        logger.warn('[Outlook OAuth] Nonce mismatch — potential CSRF')
        return NextResponse.redirect(
          new URL('/auth/error?error=invalid_state', request.url)
        )
      }
      // 사용 후 삭제
      cookieStore.delete('oauth_nonce')
    } catch {
      logger.warn('[Outlook OAuth] Failed to parse state')
    }
  }

  // SECURITY: returnUrl 검증 — 상대 경로만 허용 (open redirect 방지)
  if (parsedState.returnUrl && (
    !parsedState.returnUrl.startsWith('/') ||
    parsedState.returnUrl.startsWith('//') ||
    parsedState.returnUrl.includes('://')
  )) {
    logger.warn('[Outlook OAuth] Blocked open redirect attempt:', parsedState.returnUrl)
    parsedState.returnUrl = '/dashboard'
  }

  try {
    // Authorization Code → Token 교환
    const tokens = await outlookOAuth.exchangeCodeForTokens(code)

    // 사용자 정보 조회
    const userInfo = await outlookOAuth.getUserInfo(tokens.accessToken)

    // 토큰을 쿠키에 저장
    const cookieStore = await cookies()

    // Access Token (httpOnly, secure)
    cookieStore.set('outlook_access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Math.floor((tokens.expiresAt.getTime() - Date.now()) / 1000),
      path: '/',
    })

    // Refresh Token (httpOnly, secure)
    if (tokens.refreshToken) {
      cookieStore.set('outlook_refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30일
        path: '/',
      })
    }

    // 사용자 이메일 (클라이언트에서 접근 가능)
    cookieStore.set('outlook_user_email', userInfo.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30일
      path: '/',
    })

    // 성공 - returnUrl로 리다이렉트
    return NextResponse.redirect(
      new URL(parsedState.returnUrl, request.url)
    )
  } catch (err) {
    logger.error('[Outlook OAuth] Token exchange error:', err)

    if (err instanceof OAuthError) {
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=${encodeURIComponent(err.code)}&message=${encodeURIComponent(err.message)}`,
          request.url
        )
      )
    }

    return NextResponse.redirect(
      new URL('/auth/error?error=unknown_error', request.url)
    )
  }
}
