'use server'

import { signIn, signOut, auth } from '@/lib/auth'
import { AuthError } from 'next-auth'

/**
 * Login Server Action
 *
 * NextAuth.js v5 based authentication
 * - Uses Credentials Provider
 * - JWT session management
 *
 * @see src/lib/auth.ts - NextAuth configuration
 */
export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Basic validation
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email.' }
  }

  if (!password || password.length < 4) {
    return { error: 'Password must be at least 4 characters.' }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/docs',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password.' }
        default:
          return { error: 'An error occurred during sign in.' }
      }
    }
    // Re-throw redirect errors (Next.js redirect handling)
    throw error
  }
}

/**
 * Logout Server Action
 */
export async function logout() {
  await signOut({ redirectTo: '/login' })
}

/**
 * Get current session
 *
 * @returns Current user session or null
 */
export async function getSession() {
  const session = await auth()
  return session
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth()
  return !!session?.user
}
