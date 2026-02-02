/**
 * Vitest Global Setup
 *
 * 전역 모킹 및 테스트 환경 설정
 * - Prisma 클라이언트 모킹
 * - 환경 변수 설정
 * - 전역 유틸리티
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// ============================================
// Environment Variables
// ============================================

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_SECRET = 'test-secret-for-vitest'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.TOSS_CLIENT_KEY = 'test_ck_test'
process.env.TOSS_SECRET_KEY = 'test_sk_test'

// ============================================
// Global Mocks
// ============================================

// Mock Next.js server components
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      json: async () => body,
      status: init?.status || 200,
      headers: new Headers(init?.headers),
    }),
    redirect: (url: string) => ({ url, status: 307 }),
  },
  NextRequest: class MockNextRequest {
    url: string
    method: string
    headers: Headers
    constructor(url: string, init?: RequestInit) {
      this.url = url
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers)
    }
    json() {
      return Promise.resolve({})
    }
  },
}))

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

// ============================================
// Lifecycle Hooks
// ============================================

beforeAll(() => {
  // 테스트 시작 전 초기화
  vi.clearAllMocks()
})

afterEach(() => {
  // 각 테스트 후 모킹 초기화
  vi.clearAllMocks()
})

afterAll(() => {
  // 테스트 종료 후 정리
  vi.restoreAllMocks()
})

// ============================================
// Global Test Utilities
// ============================================

// Vitest globals에 유틸리티 추가 (선택적)
declare global {
  var testUtils: {
    createMockSession: (userId?: string) => {
      user: { id: string; email: string; name: string }
      expires: string
    }
  }
}

globalThis.testUtils = {
  createMockSession: (userId = 'test-user-id') => ({
    user: {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }),
}
