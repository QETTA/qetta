import { NextRequest, NextResponse } from 'next/server'

/**
 * 한컴 OAuth 토큰 조회 API
 *
 * httpOnly 쿠키에 저장된 토큰을 안전하게 반환합니다.
 * 클라이언트 JS에서 직접 쿠키에 접근할 수 없으므로 이 API를 통해 조회합니다.
 *
 * 보안 고려사항:
 * - 토큰 전체를 반환하지만, 이 API 자체가 same-origin 정책으로 보호됨
 * - 프로덕션에서는 추가적인 인증 검증 권장
 */
export async function GET(request: NextRequest) {
  const tokensCookie = request.cookies.get('hancom_tokens')

  if (!tokensCookie?.value) {
    return NextResponse.json({ error: 'No tokens found' }, { status: 404 })
  }

  try {
    const tokens = JSON.parse(tokensCookie.value)

    // 민감 정보 마스킹 옵션 (query param으로 제어)
    const masked = request.nextUrl.searchParams.get('masked') === 'true'

    if (masked) {
      return NextResponse.json({
        accessToken: tokens.accessToken ? `${tokens.accessToken.substring(0, 20)}...` : null,
        refreshToken: tokens.refreshToken ? '***' : null,
        hasTokens: true,
      })
    }

    return NextResponse.json(tokens)
  } catch {
    return NextResponse.json({ error: 'Invalid token format' }, { status: 400 })
  }
}

/**
 * 한컴 OAuth 토큰 삭제 (로그아웃)
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true })

  response.cookies.delete('hancom_tokens')

  return response
}
