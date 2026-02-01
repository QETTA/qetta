/**
 * Rate Limiter Utilities
 *
 * Rate Limiter에서 공통으로 사용되는 유틸리티 함수들
 */

// ============================================
// JWT 검증 및 사용자 ID 추출
// ============================================

/**
 * JWT 토큰에서 페이로드 추출 및 서명 검증
 *
 * NextAuth의 NEXTAUTH_SECRET을 사용하여 JWT 서명을 검증합니다.
 * 서명 검증 실패 시 null을 반환하여 위조 토큰에 의한 rate limit 우회를 방지합니다.
 */
export async function verifyAndDecodeJwt(
  token: string
): Promise<{ sub?: string; userId?: string; email?: string } | null> {
  try {
    const { decode } = await import('next-auth/jwt')
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET

    if (!secret) {
      return null
    }

    const decoded = await decode({ token, secret, salt: '' })
    if (!decoded) return null

    return {
      sub: decoded.sub ?? undefined,
      userId: (decoded as Record<string, unknown>).userId as string | undefined,
      email: decoded.email ?? undefined,
    }
  } catch {
    return null
  }
}

/**
 * 요청에서 사용자 ID 추출 (JWT 서명 검증 포함)
 */
export async function extractUserId(request: Request): Promise<string | null> {
  // 1. Authorization 헤더에서 Bearer 토큰 추출
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = await verifyAndDecodeJwt(token)

    if (payload) {
      return payload.userId || payload.sub || payload.email || null
    }
  }

  // 2. Cookie에서 토큰 추출 (NextAuth.js v5 세션 쿠키)
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const sessionMatch = cookieHeader.match(
      /(?:authjs\.session-token|next-auth\.session-token|qetta-session)=([^;]+)/
    )
    if (sessionMatch) {
      const token = sessionMatch[1]
      const payload = await verifyAndDecodeJwt(token)
      if (payload) {
        return payload.userId || payload.sub || payload.email || null
      }
    }
  }

  return null
}

/**
 * 요청에서 IP 추출
 */
export function extractIp(request: Request): string {
  // Vercel, Cloudflare 등 프록시 환경 지원
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfIp = request.headers.get('cf-connecting-ip')
  const vercelIp = request.headers.get('x-vercel-forwarded-for')

  return cfIp || vercelIp || forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
}

/**
 * 요청에서 식별자 추출
 */
export async function getIdentifier(
  request: Request,
  type: 'ip' | 'user' | 'global' = 'ip'
): Promise<{ identifier: string; isAuthenticated: boolean }> {
  if (type === 'global') {
    return { identifier: 'global', isAuthenticated: false }
  }

  // 사용자 기반 식별
  if (type === 'user') {
    const userId = await extractUserId(request)

    if (userId) {
      return { identifier: `user:${userId}`, isAuthenticated: true }
    }

    const ip = extractIp(request)
    return { identifier: `ip:${ip}`, isAuthenticated: false }
  }

  // IP 기반 식별
  const ip = extractIp(request)
  return { identifier: `ip:${ip}`, isAuthenticated: false }
}
