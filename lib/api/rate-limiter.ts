/**
 * QETTA Rate Limiter
 *
 * API 요청 속도 제한 유틸리티
 *
 * 기능:
 * 1. 메모리 기반 Rate Limiting (서버리스 환경 호환)
 * 2. 엔드포인트별 다른 제한 설정
 * 3. IP 또는 사용자별 제한
 * 4. Sliding window 알고리즘
 *
 * @example
 * ```ts
 * // API Route에서 사용
 * import { rateLimit, RATE_LIMITS } from '@/lib/api/rate-limiter'
 *
 * export async function POST(request: Request) {
 *   const { success, remaining, reset } = await rateLimit(request, 'chat')
 *
 *   if (!success) {
 *     return new Response('Too Many Requests', {
 *       status: 429,
 *       headers: {
 *         'X-RateLimit-Remaining': '0',
 *         'X-RateLimit-Reset': reset.toISOString(),
 *       },
 *     })
 *   }
 *
 *   // ... 정상 처리
 * }
 * ```
 */

// ============================================
// Rate Limit 설정
// ============================================

export interface RateLimitConfig {
  requests: number // 허용 요청 수 (비인증 사용자)
  window: number // 시간 윈도우 (ms)
  identifier?: 'ip' | 'user' | 'global' // 제한 기준
  authenticatedRequests?: number // 인증 사용자 허용 요청 수 (선택)
}

/**
 * 엔드포인트별 Rate Limit 설정
 *
 * @see docs/plans/2026-01-22-domain-engine-master-plan.md
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // 채팅 (AI 응답)
  chat: {
    requests: 20, // 비인증: 20회/분
    authenticatedRequests: 100, // 인증: 100회/분
    window: 60 * 1000, // 1분
    identifier: 'user', // 인증 시 사용자별, 비인증 시 IP로 폴백
  },

  // 문서 생성 (비용 높음)
  'generate-document': {
    requests: 10, // 비인증: 10회/분
    authenticatedRequests: 50, // 인증: 50회/분
    window: 60 * 1000, // 1분
    identifier: 'user',
  },

  // 템플릿 생성
  templates: {
    requests: 60, // 비인증: 60회/분
    authenticatedRequests: 200, // 인증: 200회/분
    window: 60 * 1000, // 1분
    identifier: 'user',
  },

  // 탈락 분석 (Extended Thinking, 비용 매우 높음)
  'analyze-rejection': {
    requests: 5, // 비인증: 5회/분
    authenticatedRequests: 20, // 인증: 20회/분
    window: 60 * 1000, // 1분
    identifier: 'user',
  },

  // 해외 입찰 검색
  'apply-tenders': {
    requests: 30, // 비인증: 30회/분
    authenticatedRequests: 150, // 인증: 150회/분
    window: 60 * 1000, // 1분
    identifier: 'user',
  },

  // 스킬 엔진
  'skill-engine': {
    requests: 30, // 비인증: 30회/분
    authenticatedRequests: 150, // 인증: 150회/분
    window: 60 * 1000, // 1분
    identifier: 'user',
  },

  // 회원가입 (브루트포스/스팸 방지)
  register: {
    requests: 5,
    window: 60 * 1000, // 1분
    identifier: 'ip',
  },

  // KidsMap 장소 검색
  'kidsmap-places': {
    requests: 30,
    authenticatedRequests: 120,
    window: 60 * 1000,
    identifier: 'ip',
  },

  // KidsMap AI 추천 (Claude API 비용 높음)
  'kidsmap-recommendations': {
    requests: 5,
    authenticatedRequests: 20,
    window: 60 * 1000,
    identifier: 'ip',
  },

  // KidsMap 피드
  'kidsmap-feed': {
    requests: 60,
    authenticatedRequests: 200,
    window: 60 * 1000,
    identifier: 'ip',
  },

  // KidsMap 쿠폰
  'kidsmap-coupons': {
    requests: 10,
    authenticatedRequests: 30,
    window: 60 * 1000,
    identifier: 'ip',
  },

  // 기본값
  default: {
    requests: 100, // 비인증: 100회/분
    authenticatedRequests: 500, // 인증: 500회/분
    window: 60 * 1000, // 1분
    identifier: 'ip',
  },
}

// ============================================
// In-Memory Store (서버리스 환경용)
// ============================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

// 메모리 기반 저장소 (서버리스에서는 인스턴스별로 분리됨)
const rateLimitStore = new Map<string, RateLimitEntry>()

// 주기적 정리 (메모리 누수 방지)
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function startCleanup(): void {
  if (cleanupInterval) return

  cleanupInterval = setInterval(
    () => {
      const now = Date.now()
      for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
          rateLimitStore.delete(key)
        }
      }
    },
    5 * 60 * 1000
  ) // 5분마다 정리
}

// 서버 시작 시 자동 실행
if (typeof globalThis !== 'undefined') {
  startCleanup()
}

// ============================================
// Rate Limiter 함수
// ============================================

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: Date
  limit: number
  isAuthenticated: boolean
}

// ============================================
// Re-export utilities for external use
// ============================================

export {
  extractUserId,
  extractIp,
  getIdentifier,
} from './rate-limiter-utils'

// Import for internal use
import { getIdentifier } from './rate-limiter-utils'

/**
 * Rate Limit 체크
 *
 * @param request - Next.js Request 객체
 * @param endpoint - 엔드포인트 이름 (RATE_LIMITS 키)
 * @returns Rate limit 결과
 */
export async function rateLimit(
  request: Request,
  endpoint: keyof typeof RATE_LIMITS | string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default
  const { identifier, isAuthenticated } = await getIdentifier(request, config.identifier)
  const key = `${endpoint}:${identifier}`
  const now = Date.now()

  // 인증 여부에 따른 요청 한도 결정
  const maxRequests = isAuthenticated && config.authenticatedRequests
    ? config.authenticatedRequests
    : config.requests

  // 기존 엔트리 조회
  let entry = rateLimitStore.get(key)

  // 윈도우 만료 또는 신규 요청
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.window,
    }
  }

  // 요청 카운트 증가
  entry.count++
  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, maxRequests - entry.count)
  const success = entry.count <= maxRequests

  return {
    success,
    remaining,
    reset: new Date(entry.resetTime),
    limit: maxRequests,
    isAuthenticated,
  }
}

/**
 * Rate Limit 헤더 생성
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
  }
}

/**
 * Rate Limit 초과 응답 생성
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again after ${result.reset.toISOString()}`,
      retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(result),
      },
    }
  )
}

// ============================================
// API Route Helper
// ============================================

/**
 * Rate Limit 미들웨어 (API Route용)
 *
 * @example
 * ```ts
 * import { withRateLimit } from '@/lib/api/rate-limiter'
 *
 * async function handler(request: Request) {
 *   return Response.json({ success: true })
 * }
 *
 * export const POST = withRateLimit(handler, 'chat')
 * ```
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  endpoint: keyof typeof RATE_LIMITS | string
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const result = await rateLimit(request, endpoint)

    if (!result.success) {
      return createRateLimitResponse(result)
    }

    // 정상 처리 후 헤더 추가
    const response = await handler(request)

    // Response 복제하여 헤더 추가
    const headers = new Headers(response.headers)
    for (const [key, value] of Object.entries(getRateLimitHeaders(result))) {
      headers.set(key, value)
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}

// ============================================
// 유틸리티
// ============================================

/**
 * Rate Limit 캐시 초기화 (테스트용)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear()
}
