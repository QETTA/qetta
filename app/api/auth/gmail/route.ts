/**
 * Gmail OAuth 시작 엔드포인트
 *
 * GET /api/auth/gmail
 *
 * 사용자를 Google 로그인 페이지로 리다이렉트
 */

import { NextResponse } from 'next/server'
import { gmailOAuth } from '@/lib/oauth'

export async function GET(request: Request) {
  // OAuth 설정 검증
  if (!gmailOAuth.validateConfig()) {
    return NextResponse.json(
      {
        error: 'Gmail OAuth not configured',
        message: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set',
      },
      { status: 500 }
    )
  }

  // state 파라미터 생성 (CSRF 방지)
  const url = new URL(request.url)
  const returnUrl = url.searchParams.get('returnUrl') || '/dashboard'

  // state에 returnUrl 인코딩
  const state = Buffer.from(
    JSON.stringify({
      returnUrl,
      nonce: crypto.randomUUID(),
      timestamp: Date.now(),
    })
  ).toString('base64url')

  // Google OAuth URL로 리다이렉트
  const authUrl = gmailOAuth.getAuthorizationUrl(state)

  return NextResponse.redirect(authUrl)
}
