# QETTA P0-P2 구현 가이드

> **문서 버전**: 1.0
> **작성일**: 2026-02-01
> **대상 브랜치**: claude/setup-work-session-E42W5

---

## 목차

1. [P0 - Critical (즉시)](#p0---critical-즉시)
   - [P0-1: 분산 Rate Limiter](#p0-1-분산-rate-limiter)
   - [P0-2: 입력 살균 (XSS 방지)](#p0-2-입력-살균-xss-방지)
2. [P1 - High Priority (이번 분기)](#p1---high-priority-이번-분기)
   - [P1-1: Server Components 최적화](#p1-1-server-components-최적화)
   - [P1-2: Server Actions 도입](#p1-2-server-actions-도입)
   - [P1-3: 동적 import 코드 스플리팅](#p1-3-동적-import-코드-스플리팅)
3. [P2 - Medium Priority (이번 반기)](#p2---medium-priority-이번-반기)
   - [P2-1: tRPC 도입 검토](#p2-1-trpc-도입-검토)
   - [P2-2: Edge Runtime 적용](#p2-2-edge-runtime-적용)
   - [P2-3: Bundle Analyzer 통합](#p2-3-bundle-analyzer-통합)

---

## P0 - Critical (즉시)

### P0-1: 분산 Rate Limiter

#### 현재 문제점

```typescript
// lib/api/rate-limiter.ts:158
const rateLimitStore = new Map<string, RateLimitEntry>()
```

**문제**: 인메모리 Map은 서버리스 환경에서 인스턴스 간 공유되지 않음
- Vercel: 각 함수 인스턴스가 별도 메모리
- 사용자가 다른 인스턴스로 라우팅되면 Rate Limit 우회
- 수평 확장 시 제한 효과 무력화

#### 해결 방안: Redis 기반 Rate Limiter

##### 1단계: 의존성 확인

```json
// package.json - 이미 설치됨
{
  "@upstash/redis": "^1.36.1",
  "ioredis": "^5.9.2"
}
```

##### 2단계: Redis Rate Limiter 구현

**파일**: `lib/api/rate-limiter-redis.ts`

```typescript
/**
 * Redis 기반 분산 Rate Limiter
 *
 * 알고리즘: Sliding Window Log (정확도 높음)
 * 대안: Token Bucket (처리량 높음)
 */

import { getRedisClient, isRedisEnabled } from '@/lib/cache/redis-client'
import { logger } from '@/lib/api/logger'
import type { RateLimitConfig, RateLimitResult } from './rate-limiter'
import { RATE_LIMITS } from './rate-limiter'

// ============================================
// Redis Key Schema
// ============================================

const KEY_PREFIX = {
  WINDOW: 'rl:win:',      // Sliding window entries
  COUNT: 'rl:cnt:',       // Request counts
} as const

// ============================================
// Sliding Window Counter (Redis)
// ============================================

interface SlidingWindowResult {
  allowed: boolean
  count: number
  resetAt: number
}

/**
 * Redis MULTI/EXEC를 사용한 원자적 Rate Limit 체크
 *
 * Lua 스크립트로 원자성 보장 (Race condition 방지)
 */
const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local windowStart = now - window

-- 만료된 요청 제거
redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

-- 현재 윈도우 내 요청 수
local count = redis.call('ZCARD', key)

if count < limit then
  -- 새 요청 추가
  redis.call('ZADD', key, now, now .. ':' .. math.random())
  redis.call('PEXPIRE', key, window)
  return {1, count + 1, now + window}
else
  -- 제한 초과
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local resetAt = oldest[2] and (tonumber(oldest[2]) + window) or (now + window)
  return {0, count, resetAt}
end
`

/**
 * Redis Sliding Window Rate Limit
 */
async function slidingWindowRateLimit(
  identifier: string,
  endpoint: string,
  limit: number,
  windowMs: number
): Promise<SlidingWindowResult> {
  const redis = getRedisClient()

  if (!redis) {
    // Redis 불가 시 허용 (graceful degradation)
    logger.warn('[RateLimiter] Redis unavailable, allowing request')
    return { allowed: true, count: 0, resetAt: Date.now() + windowMs }
  }

  const key = `${KEY_PREFIX.WINDOW}${endpoint}:${identifier}`
  const now = Date.now()

  try {
    // Upstash Redis는 EVALSHA 지원
    const result = await redis.eval(
      SLIDING_WINDOW_SCRIPT,
      [key],
      [windowMs.toString(), limit.toString(), now.toString()]
    ) as [number, number, number]

    return {
      allowed: result[0] === 1,
      count: result[1],
      resetAt: result[2],
    }
  } catch (error) {
    logger.error('[RateLimiter] Redis error:', { error, identifier, endpoint })
    // 에러 시 허용 (가용성 우선)
    return { allowed: true, count: 0, resetAt: Date.now() + windowMs }
  }
}

// ============================================
// Public API
// ============================================

/**
 * 분산 Rate Limit 체크 (Redis 기반)
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

  // Redis 사용 가능 여부 확인
  if (!isRedisEnabled()) {
    // 폴백: 인메모리 Rate Limiter (기존 로직)
    const { rateLimit } = await import('./rate-limiter')
    return rateLimit(request, endpoint)
  }

  const result = await slidingWindowRateLimit(
    identifier,
    endpoint,
    maxRequests,
    config.window
  )

  return {
    success: result.allowed,
    remaining: Math.max(0, maxRequests - result.count),
    reset: new Date(result.resetAt),
    limit: maxRequests,
    isAuthenticated,
  }
}

// ============================================
// 마이그레이션 헬퍼
// ============================================

/**
 * Rate Limiter 전환 (점진적 마이그레이션)
 *
 * 환경변수로 제어: RATE_LIMITER_BACKEND=redis|memory
 */
export async function rateLimit(
  request: Request,
  endpoint: keyof typeof RATE_LIMITS | string
): Promise<RateLimitResult> {
  const backend = process.env.RATE_LIMITER_BACKEND || 'auto'

  if (backend === 'redis' || (backend === 'auto' && isRedisEnabled())) {
    return rateLimitDistributed(request, endpoint)
  }

  // 기존 인메모리 Rate Limiter
  const { rateLimit: memoryRateLimit } = await import('./rate-limiter')
  return memoryRateLimit(request, endpoint)
}

// identifier 추출 함수 (rate-limiter.ts에서 가져오기)
async function getIdentifier(
  request: Request,
  type: 'ip' | 'user' | 'global' = 'ip'
): Promise<{ identifier: string; isAuthenticated: boolean }> {
  // 기존 rate-limiter.ts의 getIdentifier 로직 재사용
  const { extractUserId, extractIp } = await import('./rate-limiter')

  if (type === 'global') {
    return { identifier: 'global', isAuthenticated: false }
  }

  if (type === 'user') {
    const userId = await extractUserId(request)
    if (userId) {
      return { identifier: `user:${userId}`, isAuthenticated: true }
    }
    return { identifier: `ip:${extractIp(request)}`, isAuthenticated: false }
  }

  return { identifier: `ip:${extractIp(request)}`, isAuthenticated: false }
}
```

##### 3단계: 기존 코드 마이그레이션

**파일 수정**: `lib/api/rate-limiter.ts`

```typescript
// 기존 함수를 export하되, 새로운 분산 버전도 노출
export { extractUserId, extractIp } from './rate-limiter-utils'

// 새로운 분산 Rate Limiter를 기본으로 사용
export { rateLimit, rateLimitDistributed } from './rate-limiter-redis'
```

##### 4단계: 환경변수 설정

```bash
# .env.local
RATE_LIMITER_BACKEND=redis  # redis | memory | auto

# Upstash Redis (이미 설정되어 있을 가능성 높음)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

##### 5단계: 테스트

```typescript
// lib/api/__tests__/rate-limiter-redis.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rateLimitDistributed } from '../rate-limiter-redis'

describe('Redis Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should limit requests within window', async () => {
    const mockRequest = new Request('https://example.com/api/chat', {
      headers: { 'x-forwarded-for': '1.2.3.4' }
    })

    // 첫 20개 요청은 허용
    for (let i = 0; i < 20; i++) {
      const result = await rateLimitDistributed(mockRequest, 'chat')
      expect(result.success).toBe(true)
    }

    // 21번째 요청은 거부
    const result = await rateLimitDistributed(mockRequest, 'chat')
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should use higher limit for authenticated users', async () => {
    const mockRequest = new Request('https://example.com/api/chat', {
      headers: {
        'authorization': 'Bearer valid-jwt-token',
        'x-forwarded-for': '1.2.3.4'
      }
    })

    const result = await rateLimitDistributed(mockRequest, 'chat')
    expect(result.isAuthenticated).toBe(true)
    expect(result.limit).toBe(100) // authenticatedRequests
  })
})
```

##### 예상 효과

| 지표 | 현재 (인메모리) | 개선 후 (Redis) |
|------|---------------|-----------------|
| 분산 환경 지원 | ❌ | ✅ |
| 일관성 | 인스턴스별 분리 | 글로벌 통합 |
| Rate Limit 우회 가능성 | 높음 | 낮음 |
| 지연 시간 | ~0ms | ~1-5ms |

---

### P0-2: 입력 살균 (XSS 방지)

#### 현재 문제점

사용자 입력이 직접 렌더링되는 컴포넌트에서 XSS 취약점 가능성

```typescript
// 위험: dangerouslySetInnerHTML 또는 직접 렌더링
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

#### 해결 방안: DOMPurify + 서버 사이드 검증

##### 1단계: 의존성 설치

```bash
npm install dompurify isomorphic-dompurify
npm install -D @types/dompurify
```

##### 2단계: 입력 살균 유틸리티

**파일**: `lib/security/sanitize.ts`

```typescript
/**
 * QETTA 입력 살균 유틸리티
 *
 * XSS, SQL Injection 방지를 위한 입력 검증 및 살균
 */

import DOMPurify from 'isomorphic-dompurify'

// ============================================
// DOMPurify 설정
// ============================================

/**
 * 허용된 HTML 태그 (마크다운 변환 결과용)
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'code', 'pre', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]

/**
 * 허용된 HTML 속성
 */
const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'id',
]

/**
 * DOMPurify 기본 설정
 */
const DEFAULT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'], // 링크에 target 허용
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
}

// ============================================
// 살균 함수
// ============================================

/**
 * HTML 살균 (Rich Text용)
 *
 * @example
 * ```ts
 * const safe = sanitizeHtml('<script>alert("xss")</script><p>Hello</p>')
 * // => '<p>Hello</p>'
 * ```
 */
export function sanitizeHtml(dirty: string, config?: DOMPurify.Config): string {
  return DOMPurify.sanitize(dirty, { ...DEFAULT_CONFIG, ...config })
}

/**
 * 플레인 텍스트 추출 (모든 HTML 제거)
 *
 * @example
 * ```ts
 * const text = stripHtml('<p>Hello <strong>World</strong></p>')
 * // => 'Hello World'
 * ```
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] })
}

/**
 * URL 살균 (javascript: 프로토콜 방지)
 *
 * @example
 * ```ts
 * sanitizeUrl('javascript:alert(1)') // => ''
 * sanitizeUrl('https://example.com') // => 'https://example.com'
 * ```
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  const trimmed = url.trim().toLowerCase()

  // 위험한 프로토콜 차단
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
  ]

  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return ''
    }
  }

  // 상대 경로 또는 안전한 프로토콜만 허용
  const safeProtocols = ['http://', 'https://', 'mailto:', 'tel:', '/']
  const isSafe = safeProtocols.some(p => trimmed.startsWith(p)) || !trimmed.includes(':')

  return isSafe ? url : ''
}

/**
 * 파일명 살균 (Path Traversal 방지)
 *
 * @example
 * ```ts
 * sanitizeFilename('../../../etc/passwd') // => 'etc-passwd'
 * sanitizeFilename('my file<script>.pdf') // => 'my-file-script-.pdf'
 * ```
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '') // Path traversal 방지
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-') // 위험 문자 제거
    .replace(/\s+/g, '-') // 공백을 대시로
    .replace(/-+/g, '-') // 연속 대시 정리
    .replace(/^-|-$/g, '') // 앞뒤 대시 제거
    .slice(0, 255) // 파일명 길이 제한
}

/**
 * SQL Injection 방지를 위한 식별자 검증
 * (Prisma 사용 시 대부분 불필요하지만, 동적 쿼리용)
 *
 * @example
 * ```ts
 * isValidIdentifier('user_id') // => true
 * isValidIdentifier("'; DROP TABLE--") // => false
 * ```
 */
export function isValidIdentifier(value: string): boolean {
  // 알파벳, 숫자, 언더스코어만 허용
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)
}

/**
 * JSON 안전 파싱 (Prototype Pollution 방지)
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    const parsed = JSON.parse(json)

    // __proto__, constructor 등 위험 키 제거
    if (typeof parsed === 'object' && parsed !== null) {
      delete parsed.__proto__
      delete parsed.constructor
      delete parsed.prototype
    }

    return parsed as T
  } catch {
    return defaultValue
  }
}

// ============================================
// React 컴포넌트용 훅
// ============================================

/**
 * 안전한 HTML 렌더링을 위한 훅
 *
 * @example
 * ```tsx
 * function RichContent({ html }: { html: string }) {
 *   const safeHtml = useSanitizedHtml(html)
 *   return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
 * }
 * ```
 */
export function useSanitizedHtml(dirty: string): string {
  // 클라이언트/서버 모두에서 동작
  return sanitizeHtml(dirty)
}

// ============================================
// Zod 스키마 확장
// ============================================

import { z } from 'zod'

/**
 * 살균된 문자열 스키마
 */
export const sanitizedString = z.string().transform(stripHtml)

/**
 * 살균된 HTML 스키마
 */
export const sanitizedHtml = z.string().transform(sanitizeHtml)

/**
 * 안전한 URL 스키마
 */
export const safeUrl = z.string().transform(sanitizeUrl).refine(
  (url) => url.length > 0,
  { message: 'Invalid or unsafe URL' }
)
```

##### 3단계: API 입력 검증에 적용

**파일 수정**: `lib/api/schemas.ts`

```typescript
import { sanitizedString, safeUrl, sanitizeHtml } from '@/lib/security/sanitize'

// 기존 스키마에 살균 적용
export const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: sanitizedString, // HTML 태그 제거
    })
  ).min(1).max(100),
  enginePreset: z.string().max(50).optional(),
})

// 사용자 프로필 업데이트
export const updateProfileSchema = z.object({
  name: sanitizedString.max(100),
  bio: z.string().max(500).transform(sanitizeHtml), // 제한된 HTML 허용
  website: safeUrl.optional(),
})
```

##### 4단계: CSRF 토큰 구현

**파일**: `lib/security/csrf.ts`

```typescript
/**
 * CSRF 토큰 관리
 */

import { cookies } from 'next/headers'
import crypto from 'crypto'

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * CSRF 토큰 생성
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * CSRF 토큰 설정 (쿠키에 저장)
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken()
  const cookieStore = await cookies()

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24시간
  })

  return token
}

/**
 * CSRF 토큰 검증
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!headerToken || !cookieToken) {
    return false
  }

  // 타이밍 공격 방지를 위한 상수 시간 비교
  return crypto.timingSafeEqual(
    Buffer.from(headerToken),
    Buffer.from(cookieToken)
  )
}

/**
 * CSRF 검증 미들웨어
 */
export async function withCsrfProtection(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  // GET, HEAD, OPTIONS는 CSRF 검증 제외
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method)

  if (!safeMethod) {
    const isValid = await verifyCsrfToken(request)

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  return handler()
}
```

##### 예상 효과

| 취약점 | 현재 | 개선 후 |
|--------|------|---------|
| XSS (Stored) | ⚠️ 가능 | ✅ 방지 |
| XSS (Reflected) | ⚠️ 가능 | ✅ 방지 |
| CSRF | ⚠️ 미구현 | ✅ 토큰 검증 |
| Path Traversal | ⚠️ 가능 | ✅ 방지 |

---

## P1 - High Priority (이번 분기)

### P1-1: Server Components 최적화

#### 현재 상태

```bash
# 'use client' 사용 컴포넌트 수
$ grep -r "'use client'" components --include="*.tsx" | wc -l
144
```

많은 컴포넌트가 불필요하게 클라이언트 컴포넌트로 지정됨

#### 'use client' 감사 체크리스트

| 패턴 | Server Component 가능 | 조치 |
|------|----------------------|------|
| useState, useEffect 사용 | ❌ | 유지 |
| onClick 등 이벤트 핸들러 | ❌ | 유지 |
| 브라우저 API (window, document) | ❌ | 유지 |
| 데이터만 표시 (props → JSX) | ✅ | 제거 |
| 정적 UI (아이콘, 배지) | ✅ | 제거 |
| 조건부 렌더링만 있음 | ✅ | 제거 |

#### KidsMap 컴포넌트 분석

```typescript
// ❌ 유지 필요 (이벤트 + 상태)
components/kidsmap/place-detail-sheet.tsx  // useState, 터치 이벤트
components/kidsmap/quick-filter.tsx         // onClick
components/kidsmap/feed/fullscreen-viewer.tsx // useState, 터치

// ✅ Server Component 전환 가능
components/kidsmap/feed/shorts-card.tsx     // 순수 표시 컴포넌트
components/kidsmap/feed/feed-skeleton.tsx   // 정적 스켈레톤
```

#### 리팩토링 예시: ShortsCard

**Before** (`components/kidsmap/feed/shorts-card.tsx`):
```typescript
'use client'  // ← 불필요

import Image from 'next/image'
// ... 순수 표시 로직만 있음

export function ShortsCard({ ... }) {
  return (
    <div className="group relative">
      {/* 이벤트 핸들러 없음, 상태 없음 */}
    </div>
  )
}
```

**After**:
```typescript
// 'use client' 제거 → Server Component

import Image from 'next/image'
// ...

export function ShortsCard({ ... }) {
  // 동일한 로직, 서버에서 렌더링
}
```

#### 하이브리드 패턴: 클라이언트 래퍼

```typescript
// components/kidsmap/feed/shorts-card.tsx (Server Component)
export function ShortsCard({ ... }) {
  return <div className="group relative">...</div>
}

// components/kidsmap/feed/shorts-card-interactive.tsx (Client)
'use client'
import { ShortsCard } from './shorts-card'

export function ShortsCardInteractive({
  onPlay,
  ...props
}: ShortsCardProps & { onPlay: () => void }) {
  return (
    <div onClick={onPlay} className="cursor-pointer">
      <ShortsCard {...props} />
    </div>
  )
}
```

#### 전환 작업 목록

| 파일 | 현재 | 권장 | 예상 절감 |
|------|------|------|----------|
| `shorts-card.tsx` | Client | Server | ~2KB |
| `feed-skeleton.tsx` | Client | Server | ~1KB |
| `content-card.tsx` | Client | Server | ~3KB |
| `place-contents-tab.tsx` | Client | 분리 필요 | ~2KB |
| **총계** | - | - | **~8KB** |

---

### P1-2: Server Actions 도입

#### 현재 패턴 (클라이언트 fetch)

```typescript
// app/(kidsmap)/feed/page.tsx
'use client'

export default function FeedPage() {
  const [feeds, setFeeds] = useState([])

  useEffect(() => {
    fetch('/api/kidsmap/feed')
      .then(res => res.json())
      .then(data => setFeeds(data))
  }, [])

  // ...
}
```

#### React 19 Server Actions 패턴

##### 데이터 페칭: Server Component로 이동

```typescript
// app/(kidsmap)/feed/page.tsx (Server Component)
import { getFeedItems } from './actions'
import { FeedList } from '@/components/kidsmap/feed/feed-list'
import { Suspense } from 'react'
import { FeedSkeleton } from '@/components/kidsmap/feed/feed-skeleton'

export default async function FeedPage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent />
    </Suspense>
  )
}

async function FeedContent() {
  const feeds = await getFeedItems()
  return <FeedList initialFeeds={feeds} />
}
```

##### 뮤테이션: Server Actions

```typescript
// app/(kidsmap)/feed/actions.ts
'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { sanitizedString } from '@/lib/security/sanitize'
import { z } from 'zod'

// 데이터 페칭 (캐시 가능)
export async function getFeedItems(cursor?: string) {
  const feeds = await prisma.content.findMany({
    where: { status: 'PUBLISHED' },
    take: 20,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  })

  return feeds
}

// 뮤테이션: 북마크 토글
const bookmarkSchema = z.object({
  feedId: z.string().uuid(),
})

export async function toggleBookmark(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    return { error: '로그인이 필요합니다' }
  }

  const parsed = bookmarkSchema.safeParse({
    feedId: formData.get('feedId'),
  })

  if (!parsed.success) {
    return { error: '잘못된 요청입니다' }
  }

  const { feedId } = parsed.data
  const userId = session.user.id

  const existing = await prisma.bookmark.findUnique({
    where: { userId_contentId: { userId, contentId: feedId } },
  })

  if (existing) {
    await prisma.bookmark.delete({
      where: { id: existing.id },
    })
  } else {
    await prisma.bookmark.create({
      data: { userId, contentId: feedId },
    })
  }

  revalidatePath('/feed')
  return { success: true, bookmarked: !existing }
}
```

##### 폼 컴포넌트: useActionState

```typescript
// components/kidsmap/feed/bookmark-button.tsx
'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toggleBookmark } from '@/app/(kidsmap)/feed/actions'

function SubmitButton({ isBookmarked }: { isBookmarked: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'transition-colors',
        pending && 'opacity-50',
        isBookmarked ? 'text-red-500' : 'text-gray-500'
      )}
    >
      {pending ? '...' : isBookmarked ? '❤️' : '🤍'}
    </button>
  )
}

export function BookmarkButton({
  feedId,
  initialBookmarked
}: {
  feedId: string
  initialBookmarked: boolean
}) {
  const [state, action] = useActionState(toggleBookmark, {
    bookmarked: initialBookmarked,
  })

  return (
    <form action={action}>
      <input type="hidden" name="feedId" value={feedId} />
      <SubmitButton isBookmarked={state.bookmarked} />
    </form>
  )
}
```

#### 마이그레이션 우선순위

| 기능 | 현재 방식 | Server Actions | 난이도 |
|------|----------|---------------|--------|
| 피드 목록 조회 | useEffect + fetch | Server Component | 낮음 |
| 북마크 토글 | Zustand + fetch | useActionState | 중간 |
| 필터 변경 | URL params | useActionState | 낮음 |
| 무한 스크롤 | useSWR | Server Actions + streaming | 높음 |

---

### P1-3: 동적 import 코드 스플리팅

#### 현재 문제점

```typescript
// 모든 컴포넌트가 초기 번들에 포함
import { FullscreenViewer } from '@/components/kidsmap/feed/fullscreen-viewer'
import { PlaceDetailSheet } from '@/components/kidsmap/place-detail-sheet'
import { RealTimeChart } from '@/components/dashboard/monitor/RealTimeChart'
```

#### 동적 import 적용

##### 1. next/dynamic 사용

```typescript
// app/(kidsmap)/feed/page.tsx
import dynamic from 'next/dynamic'

// 무거운 컴포넌트는 동적 로드
const FullscreenViewer = dynamic(
  () => import('@/components/kidsmap/feed/fullscreen-viewer').then(
    mod => mod.FullscreenViewer
  ),
  {
    loading: () => <ViewerSkeleton />,
    ssr: false, // 클라이언트 전용
  }
)

const PlaceDetailSheet = dynamic(
  () => import('@/components/kidsmap/place-detail-sheet').then(
    mod => mod.PlaceDetailSheet
  ),
  {
    loading: () => null, // 바텀시트는 로딩 UI 불필요
  }
)
```

##### 2. 조건부 로드 패턴

```typescript
// components/kidsmap/feed/feed-list.tsx
'use client'

import { useState, lazy, Suspense } from 'react'

// React.lazy 사용 (React 19)
const FullscreenViewer = lazy(() =>
  import('./fullscreen-viewer').then(mod => ({ default: mod.FullscreenViewer }))
)

export function FeedList({ feeds }) {
  const [selectedFeed, setSelectedFeed] = useState(null)

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {feeds.map(feed => (
          <ShortsCard
            key={feed.id}
            {...feed}
            onClick={() => setSelectedFeed(feed)}
          />
        ))}
      </div>

      {/* 선택했을 때만 로드 */}
      {selectedFeed && (
        <Suspense fallback={<ViewerSkeleton />}>
          <FullscreenViewer
            feed={selectedFeed}
            onClose={() => setSelectedFeed(null)}
          />
        </Suspense>
      )}
    </>
  )
}
```

##### 3. 모니터링 대시보드 최적화

```typescript
// components/dashboard/monitor/widget-dashboard.tsx
import dynamic from 'next/dynamic'

// 차트 라이브러리는 매우 무거움 → 동적 로드
const RealTimeChart = dynamic(
  () => import('./RealTimeChart').then(mod => mod.RealTimeChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

const GaugeWidget = dynamic(
  () => import('./gauge-widget-live').then(mod => mod.GaugeWidgetLive),
  {
    loading: () => <GaugeSkeleton />,
    ssr: false,
  }
)
```

#### 동적 로드 대상 우선순위

| 컴포넌트 | 예상 크기 | 로드 조건 | 우선순위 |
|----------|----------|----------|----------|
| `FullscreenViewer` | ~50KB | 클릭 시 | P1 |
| `RealTimeChart` | ~80KB | 탭 진입 시 | P1 |
| `PlaceDetailSheet` | ~30KB | 마커 클릭 시 | P1 |
| `TiptapEditor` | ~100KB | 문서 편집 시 | P1 |
| `KakaoMap` | ~200KB (외부) | 지도 탭 진입 시 | P1 |

---

## P2 - Medium Priority (이번 반기)

### P2-1: tRPC 도입 검토

#### 장단점 분석

| 항목 | 현재 (REST) | tRPC |
|------|------------|------|
| 타입 안전성 | Zod 수동 검증 | E2E 자동 |
| 보일러플레이트 | 많음 (route.ts마다) | 적음 |
| 러닝 커브 | 낮음 | 중간 |
| 번들 크기 | 작음 | +~15KB |
| React Query 통합 | 별도 설정 | 내장 |

#### 권장: 부분 도입

```typescript
// lib/trpc/router.ts
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

const t = initTRPC.create()

export const appRouter = t.router({
  // KidsMap 관련 프로시저만 우선 적용
  kidsmap: t.router({
    getFeed: t.procedure
      .input(z.object({
        cursor: z.string().optional(),
        filter: z.enum(['all', 'youtube', 'blog']).optional(),
      }))
      .query(async ({ input }) => {
        // 기존 API 로직 재사용
      }),

    toggleBookmark: t.procedure
      .input(z.object({ feedId: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        // 기존 북마크 로직
      }),
  }),
})

export type AppRouter = typeof appRouter
```

#### 결정 기준

- **도입 권장**: 새로운 기능 모듈 (예: 알림 시스템)
- **유지 권장**: 기존 안정적인 API (문서 생성, 인증)

---

### P2-2: Edge Runtime 적용

#### 적용 가능 라우트 분석

```typescript
// ✅ Edge 가능 (상태 없음, 가벼운 처리)
app/api/kidsmap/places/route.ts      // 조회만
app/api/kidsmap/feed/route.ts        // 조회만
app/api/health/route.ts              // 헬스체크

// ❌ Edge 불가 (Prisma, 무거운 의존성)
app/api/chat/route.ts                // AI SDK
app/api/generate-document/route.ts   // 문서 생성
```

#### Edge Runtime 적용 예시

```typescript
// app/api/kidsmap/places/route.ts
export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  // Supabase Edge Function 또는 외부 API 호출
  const places = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/places?lat=eq.${lat}&lng=eq.${lng}`,
    {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY!,
      },
    }
  ).then(res => res.json())

  return Response.json(places)
}
```

#### Edge vs Node.js 선택 가이드

| 요구사항 | 런타임 | 이유 |
|----------|--------|------|
| 빠른 응답 필요 | Edge | 글로벌 분산, 콜드스타트 없음 |
| Prisma ORM 사용 | Node.js | Edge 미지원 |
| 파일 시스템 접근 | Node.js | Edge 미지원 |
| AI SDK (스트리밍) | Node.js | 긴 실행 시간 |
| 단순 CRUD | Edge | 최적 |

---

### P2-3: Bundle Analyzer 통합

#### 설치 및 설정

```bash
npm install -D @next/bundle-analyzer
```

```typescript
// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
```

#### 분석 실행

```bash
# 분석 리포트 생성
ANALYZE=true npm run build

# 결과: .next/analyze/client.html, server.html 생성
```

#### 번들 예산 설정

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    // 페이지별 번들 크기 제한
    bundlePagesExternals: true,
  },

  // Webpack 번들 분석
  webpack: (config, { isServer }) => {
    if (!isServer && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: '../analyze/client.html',
        })
      )
    }
    return config
  },
}
```

#### CI 통합 (번들 크기 검증)

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on:
  pull_request:
    paths:
      - 'package.json'
      - 'components/**'
      - 'app/**'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build and analyze
        run: ANALYZE=true npm run build

      - name: Check bundle size
        run: |
          # First Load JS 크기 확인 (200KB 제한)
          SIZE=$(cat .next/build-manifest.json | jq '.pages["/"].reduce(0; . + 1)')
          if [ "$SIZE" -gt 200000 ]; then
            echo "Bundle size exceeds 200KB limit"
            exit 1
          fi

      - name: Upload analysis
        uses: actions/upload-artifact@v4
        with:
          name: bundle-analysis
          path: .next/analyze/
```

---

## 구현 일정 (권장)

```
2026 Q1 (1월-3월)
├── Week 1-2: P0-1 분산 Rate Limiter ★★★
├── Week 2-3: P0-2 입력 살균 ★★★
├── Week 4-6: P1-1 Server Components 감사 ★★
├── Week 6-8: P1-2 Server Actions 도입 ★★
└── Week 8-10: P1-3 동적 import ★★

2026 Q2 (4월-6월)
├── Week 1-4: P2-1 tRPC 부분 도입 ★
├── Week 4-6: P2-2 Edge Runtime ★
└── Week 6-8: P2-3 Bundle Analyzer + CI ★
```

---

## 체크리스트

### P0 완료 기준
- [ ] Redis Rate Limiter 구현 및 테스트 통과
- [ ] 환경변수 `RATE_LIMITER_BACKEND=redis` 설정
- [ ] 프로덕션 배포 후 모니터링 (429 응답 일관성)
- [ ] DOMPurify 설치 및 sanitize 유틸리티 구현
- [ ] API 스키마에 살균 적용
- [ ] CSRF 토큰 미들웨어 적용

### P1 완료 기준
- [ ] `'use client'` 감사 완료 (144개 → 100개 이하)
- [ ] KidsMap 피드: Server Actions 전환
- [ ] 북마크: useActionState 적용
- [ ] FullscreenViewer, PlaceDetailSheet 동적 로드
- [ ] 초기 JS 번들 10% 이상 감소

### P2 완료 기준
- [ ] tRPC 라우터 설정 (신규 기능용)
- [ ] 최소 3개 라우트 Edge Runtime 전환
- [ ] Bundle Analyzer CI 파이프라인 구축
- [ ] 번들 예산 200KB 제한 적용

---

## 참고 자료

- [Next.js App Router 공식 문서](https://nextjs.org/docs/app)
- [React 19 Server Actions](https://react.dev/reference/rsc/server-actions)
- [Upstash Redis Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit)
- [DOMPurify GitHub](https://github.com/cure53/DOMPurify)
- [tRPC with Next.js](https://trpc.io/docs/client/nextjs)
