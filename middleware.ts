import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PROTECTED_PATHS = [
  '/monitor',
  '/apply',
  '/generate',
  '/docs',
  '/box',
  '/documents',
  '/settings',
  '/verify',
  '/widgets-demo',
]

const AUTH_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Redirect authenticated users away from auth pages
  if (AUTH_PATHS.some((p) => pathname.startsWith(p)) && isLoggedIn) {
    return NextResponse.redirect(new URL('/monitor', req.url))
  }

  // Protect dashboard routes
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p)) && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)'],
}
