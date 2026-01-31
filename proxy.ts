/**
 * Next.js Middleware
 *
 * i18n 준비 단계 - locale routing은 아직 비활성화
 * 앱 구조를 [locale] 패턴으로 변환 후 활성화 예정
 *
 * 현재: 단순 pass-through (모든 요청 허용)
 */

import { NextRequest, NextResponse } from 'next/server'

// ============================================
// i18n Configuration (준비됨, 미활성화)
// ============================================

// 앱 구조 변환 후 아래 코드 활성화:
// import createMiddleware from 'next-intl/middleware'
// import { locales, defaultLocale } from './i18n'
//
// const intlMiddleware = createMiddleware({
//   locales,
//   defaultLocale,
//   localePrefix: 'as-needed',
//   localeDetection: true,
// })

// ============================================
// Main Middleware
// ============================================

export default function middleware(request: NextRequest) {
  // i18n 라우팅 준비 완료, 앱 구조 변환 후 활성화
  // 현재는 모든 요청 통과
  return NextResponse.next()
}

// ============================================
// Matcher Configuration
// ============================================

export const config = {
  // 정적 파일 및 API 제외
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
