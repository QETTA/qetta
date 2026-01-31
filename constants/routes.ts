export const PROTECTED_ROUTES = ['/docs', '/verify', '/apply', '/monitor', '/box', '/widgets-demo'] as const
export type ProtectedRoute = typeof PROTECTED_ROUTES[number]
