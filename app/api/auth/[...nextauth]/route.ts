/**
 * NextAuth.js v5 Route Handler
 *
 * 모든 인증 관련 API 엔드포인트 처리:
 * - GET /api/auth/signin - 로그인 페이지
 * - POST /api/auth/signin - 로그인 처리
 * - GET /api/auth/signout - 로그아웃 페이지
 * - POST /api/auth/signout - 로그아웃 처리
 * - GET /api/auth/session - 세션 조회
 * - GET /api/auth/providers - 프로바이더 목록
 * - GET /api/auth/csrf - CSRF 토큰
 * - POST /api/auth/callback/:provider - OAuth 콜백
 *
 * @see https://authjs.dev/getting-started/installation#configure
 */

import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
