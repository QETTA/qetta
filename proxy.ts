/**
 * Next.js 16 Proxy (formerly Middleware)
 *
 * Auth protection + i18n 준비
 * Next.js 16에서 middleware.ts → proxy.ts 마이그레이션
 *
 * @module proxy
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { PROTECTED_ROUTES, AUTH_ROUTES } from '@/constants/routes'

// ============================================
// Auth Middleware (via NextAuth)
// ============================================

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Redirect authenticated users away from auth pages
  if (AUTH_ROUTES.some((p) => pathname.startsWith(p)) && isLoggedIn) {
    return NextResponse.redirect(new URL('/monitor', req.url))
  }

  // Protect dashboard routes
  if (PROTECTED_ROUTES.some((p) => pathname.startsWith(p)) && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

// ============================================
// Matcher Configuration
// ============================================

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)'],
}
