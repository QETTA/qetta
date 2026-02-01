/**
 * Redis 기반 분산 Rate Limiter
 *
 * 서버리스 환경에서 인스턴스 간 Rate Limit 공유를 위한 Redis 기반 구현
 *
 * 알고리즘: Sliding Window Counter (정확도 + 성능 균형)
 * - 고정 윈도우의 경계 문제 해결
 * - Token Bucket보다 구현 간단
 * - O(1) 시간 복잡도
 *
 * Key Schema:
 * - rl:sw:{endpoint}:{identifier}:cur → 현재 윈도우 카운터
 * - rl:sw:{endpoint}:{identifier}:prev → 이전 윈도우 카운터
 *
 * @module api/rate-limiter-redis
 */

import { getRedisClient, isRedisEnabled } from '@/lib/cache/redis-client'
import { logger } from '@/lib/api/logger'
import { getIdentifier } from './rate-limiter-utils'
import type { RateLimitConfig, RateLimitResult } from './rate-limiter'
import { RATE_LIMITS } from './rate-limiter'

// ============================================
// Constants
// ============================================

const KEY_PREFIX = 'rl:sw:' // Rate Limit: Sliding Window

// ============================================
// Sliding Window Counter Algorithm
// ============================================

/**
 * Sliding Window Counter Lua Script
 *
 * 원자적으로 Rate Limit을 체크하고 카운터를 증가시킵니다.
 *
 * 알고리즘:
 * 1. 현재 윈도우와 이전 윈도우의 카운터를 조회
 * 2. 가중치 기반으로 현재 요청 수 계산
 *    - weight = (windowMs - elapsed) / windowMs
 *    - count = prev * weight + current
 * 3. 제한 내라면 현재 윈도우 카운터 증가
 * 4. TTL 설정 (윈도우 크기 * 2)
 *
 * KEYS[1]: 현재 윈도우 키
 * KEYS[2]: 이전 윈도우 키
 * ARGV[1]: 윈도우 크기 (ms)
 * ARGV[2]: 최대 요청 수
 * ARGV[3]: 현재 타임스탬프 (ms)
 *
 * Returns: [allowed (0/1), count, resetAt, currentWindow]
 */
const SLIDING_WINDOW_SCRIPT = `
local currentKey = KEYS[1]
local prevKey = KEYS[2]
local windowMs = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- 현재 윈도우 계산
local windowStart = math.floor(now / windowMs) * windowMs
local elapsed = now - windowStart
local weight = (windowMs - elapsed) / windowMs

-- 카운터 조회
local prevCount = tonumber(redis.call('GET', prevKey) or '0')
local currentCount = tonumber(redis.call('GET', currentKey) or '0')

-- 가중치 기반 요청 수 계산
local weightedCount = math.floor(prevCount * weight) + currentCount

-- 제한 체크
if weightedCount >= limit then
  -- 제한 초과: 다음 윈도우 시작 시간 반환
  local resetAt = windowStart + windowMs
  return {0, weightedCount, resetAt, windowStart}
end

-- 현재 윈도우 카운터 증가
local newCount = redis.call('INCR', currentKey)

-- TTL 설정 (윈도우 크기 * 2, 초 단위)
local ttlSec = math.ceil(windowMs * 2 / 1000)
redis.call('EXPIRE', currentKey, ttlSec)

-- 이전 키가 현재 윈도우가 아니면 갱신
local prevWindow = windowStart - windowMs
local prevKeyWindow = tonumber(redis.call('GET', prevKey .. ':ts') or '0')

if prevKeyWindow ~= prevWindow and windowStart > 0 then
  -- 이전 윈도우 데이터 보존 (현재 → 이전)
  local currentForPrev = redis.call('GET', currentKey)
  if currentForPrev then
    redis.call('SET', prevKey, currentForPrev, 'EX', ttlSec)
    redis.call('SET', prevKey .. ':ts', tostring(windowStart), 'EX', ttlSec)
  end
end

-- 새로운 가중치 기반 카운트 계산
local finalCount = math.floor(prevCount * weight) + newCount
local resetAt = windowStart + windowMs

return {1, finalCount, resetAt, windowStart}
`

/**
 * 간소화된 Fixed Window Script (폴백용)
 *
 * Sliding Window가 너무 복잡한 경우 사용
 */
const FIXED_WINDOW_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local windowSec = tonumber(ARGV[2])

local current = redis.call('INCR', key)

if current == 1 then
  redis.call('EXPIRE', key, windowSec)
end

local ttl = redis.call('TTL', key)
local resetAt = (redis.call('TIME')[1] + ttl) * 1000

if current > limit then
  return {0, current, resetAt}
end

return {1, current, resetAt}
`

// ============================================
// Redis Rate Limiter Implementation
// ============================================

interface SlidingWindowResult {
  allowed: boolean
  count: number
  resetAt: number
}

/**
 * Redis Sliding Window Rate Limit 실행
 */
async function executeSlidingWindow(
  identifier: string,
  endpoint: string,
  limit: number,
  windowMs: number
): Promise<SlidingWindowResult> {
  const redis = getRedisClient()

  if (!redis) {
    // Redis 불가 시 허용 (graceful degradation)
    logger.warn('[RateLimiter:Redis] Redis unavailable, allowing request')
    return { allowed: true, count: 0, resetAt: Date.now() + windowMs }
  }

  const now = Date.now()
  const windowStart = Math.floor(now / windowMs) * windowMs
  const currentKey = `${KEY_PREFIX}${endpoint}:${identifier}:${windowStart}`
  const prevKey = `${KEY_PREFIX}${endpoint}:${identifier}:${windowStart - windowMs}`

  try {
    // Upstash Redis는 eval 지원
    const result = (await redis.eval(
      SLIDING_WINDOW_SCRIPT,
      [currentKey, prevKey],
      [windowMs.toString(), limit.toString(), now.toString()]
    )) as [number, number, number, number]

    return {
      allowed: result[0] === 1,
      count: result[1],
      resetAt: result[2],
    }
  } catch (error) {
    logger.error('[RateLimiter:Redis] Lua script error, using fallback', { error })

    // Lua 스크립트 실패 시 간단한 INCR 기반 폴백
    return executeSimpleFallback(redis, identifier, endpoint, limit, windowMs)
  }
}

/**
 * 간단한 INCR 기반 폴백 (Lua 스크립트 실패 시)
 */
async function executeSimpleFallback(
  redis: NonNullable<ReturnType<typeof getRedisClient>>,
  identifier: string,
  endpoint: string,
  limit: number,
  windowMs: number
): Promise<SlidingWindowResult> {
  const now = Date.now()
  const windowStart = Math.floor(now / windowMs) * windowMs
  const key = `${KEY_PREFIX}${endpoint}:${identifier}:simple:${windowStart}`
  const ttlSec = Math.ceil(windowMs / 1000)

  try {
    // INCR + EXPIRE (비원자적이지만 대부분의 경우 충분)
    const count = await redis.incr(key)

    if (count === 1) {
      await redis.expire(key, ttlSec)
    }

    const resetAt = windowStart + windowMs

    return {
      allowed: count <= limit,
      count,
      resetAt,
    }
  } catch (error) {
    logger.error('[RateLimiter:Redis] Fallback also failed', { error })
    return { allowed: true, count: 0, resetAt: Date.now() + windowMs }
  }
}

// ============================================
// Public API
// ============================================

/**
 * 분산 Rate Limit 체크 (Redis 기반)
 *
 * @param request - Request 객체
 * @param endpoint - 엔드포인트 이름 (RATE_LIMITS 키)
 * @returns Rate limit 결과
 *
 * @example
 * ```ts
 * const result = await rateLimitDistributed(request, 'chat')
 * if (!result.success) {
 *   return createRateLimitResponse(result)
 * }
 * ```
 */
export async function rateLimitDistributed(
  request: Request,
  endpoint: keyof typeof RATE_LIMITS | string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default
  const { identifier, isAuthenticated } = await getIdentifier(request, config.identifier)

  const maxRequests = isAuthenticated && config.authenticatedRequests
    ? config.authenticatedRequests
    : config.requests

  const result = await executeSlidingWindow(identifier, endpoint, maxRequests, config.window)

  return {
    success: result.allowed,
    remaining: Math.max(0, maxRequests - result.count),
    reset: new Date(result.resetAt),
    limit: maxRequests,
    isAuthenticated,
  }
}

/**
 * Rate Limit 상태 조회 (현재 사용량 확인용)
 */
export async function getRateLimitStatus(
  request: Request,
  endpoint: keyof typeof RATE_LIMITS | string
): Promise<{
  used: number
  limit: number
  remaining: number
  resetAt: Date
  isAuthenticated: boolean
}> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default
  const { identifier, isAuthenticated } = await getIdentifier(request, config.identifier)

  const maxRequests = isAuthenticated && config.authenticatedRequests
    ? config.authenticatedRequests
    : config.requests

  const redis = getRedisClient()
  const now = Date.now()
  const windowMs = config.window
  const windowStart = Math.floor(now / windowMs) * windowMs

  let used = 0

  if (redis) {
    const currentKey = `${KEY_PREFIX}${endpoint}:${identifier}:${windowStart}`
    const prevKey = `${KEY_PREFIX}${endpoint}:${identifier}:${windowStart - windowMs}`

    try {
      const [currentCount, prevCount] = await Promise.all([
        redis.get<number>(currentKey),
        redis.get<number>(prevKey),
      ])

      const elapsed = now - windowStart
      const weight = (windowMs - elapsed) / windowMs
      used = Math.floor((prevCount || 0) * weight) + (currentCount || 0)
    } catch {
      // 에러 시 0으로 처리
    }
  }

  return {
    used,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - used),
    resetAt: new Date(windowStart + windowMs),
    isAuthenticated,
  }
}

/**
 * Rate Limit 캐시 초기화 (특정 식별자)
 */
export async function resetRateLimit(
  identifier: string,
  endpoint: string
): Promise<boolean> {
  const redis = getRedisClient()

  if (!redis) {
    return false
  }

  try {
    const pattern = `${KEY_PREFIX}${endpoint}:${identifier}:*`
    const keys = await redis.keys(pattern)

    if (keys.length > 0) {
      await Promise.all(keys.map(key => redis.del(key)))
    }

    logger.info('[RateLimiter:Redis] Reset rate limit', { identifier, endpoint, keysDeleted: keys.length })
    return true
  } catch (error) {
    logger.error('[RateLimiter:Redis] Reset failed', { error, identifier, endpoint })
    return false
  }
}

// ============================================
// Unified Rate Limit Function
// ============================================

/**
 * 통합 Rate Limit 함수
 *
 * 환경변수 RATE_LIMITER_BACKEND에 따라 Redis 또는 메모리 기반 선택
 *
 * - redis: 항상 Redis 사용 (Redis 불가 시 허용)
 * - memory: 항상 인메모리 사용
 * - auto (기본값): Redis 가능 시 Redis, 불가 시 메모리
 */
export async function rateLimit(
  request: Request,
  endpoint: keyof typeof RATE_LIMITS | string
): Promise<RateLimitResult> {
  const backend = process.env.RATE_LIMITER_BACKEND || 'auto'

  // Redis 강제 또는 자동 선택 시 Redis 사용
  if (backend === 'redis' || (backend === 'auto' && isRedisEnabled())) {
    return rateLimitDistributed(request, endpoint)
  }

  // 메모리 기반 Rate Limiter (기존 구현)
  const { rateLimit: memoryRateLimit } = await import('./rate-limiter')
  return memoryRateLimit(request, endpoint)
}

// ============================================
// Middleware Helper
// ============================================

/**
 * Rate Limit 미들웨어 (분산 버전)
 *
 * @example
 * ```ts
 * export const POST = withDistributedRateLimit(handler, 'chat')
 * ```
 */
export function withDistributedRateLimit(
  handler: (request: Request) => Promise<Response>,
  endpoint: keyof typeof RATE_LIMITS | string
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const result = await rateLimit(request, endpoint)

    if (!result.success) {
      const { createRateLimitResponse } = await import('./rate-limiter')
      return createRateLimitResponse(result)
    }

    const response = await handler(request)

    // Rate Limit 헤더 추가
    const headers = new Headers(response.headers)
    headers.set('X-RateLimit-Limit', result.limit.toString())
    headers.set('X-RateLimit-Remaining', result.remaining.toString())
    headers.set('X-RateLimit-Reset', result.reset.toISOString())

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}
