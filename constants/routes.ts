export const PROTECTED_ROUTES = [
  '/monitor',
  '/apply',
  '/generate',
  '/docs',
  '/box',
  '/documents',
  '/settings',
  '/verify',
  '/widgets-demo',
] as const

export type ProtectedRoute = typeof PROTECTED_ROUTES[number]

export const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
] as const

export type AuthRoute = typeof AUTH_ROUTES[number]
