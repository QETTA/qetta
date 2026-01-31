/**
 * Password Reset Execution API
 *
 * POST /api/auth/reset-password
 *
 * Set new password
 * @module api/auth/reset-password
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  verifyResetToken,
  consumeResetToken,
} from '@/lib/auth/password-reset'
import { hashPassword, validatePassword } from '@/lib/auth/password'
import { ENV } from '@/lib/env/validate'
import { logger } from '@/lib/api/logger'

/**
 * Password reset request type
 */
interface ResetPasswordRequest {
  token: string
  newPassword: string
}

/**
 * POST /api/auth/reset-password
 *
 * Execute password reset
 *
 * @example
 * ```ts
 * const response = await fetch('/api/auth/reset-password', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     token: 'abc123...',
 *     newPassword: 'NewSecurePass456'
 *   })
 * })
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Database required check
    if (!ENV.HAS_DATABASE) {
      return NextResponse.json(
        {
          error: 'Password reset not available',
          message: 'Database is not configured. Running in demo mode.',
          code: 'DATABASE_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }

    // Parse request
    const body = (await request.json()) as ResetPasswordRequest
    const { token, newPassword } = body

    // Input validation
    if (!token || !newPassword) {
      return NextResponse.json(
        {
          error: 'Missing fields',
          message: 'Please provide both token and new password.',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      )
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Weak password',
          message: passwordValidation.errors[0],
          errors: passwordValidation.errors,
          code: 'WEAK_PASSWORD',
        },
        { status: 400 }
      )
    }

    // Verify token
    const email = await verifyResetToken(token)

    if (!email) {
      return NextResponse.json(
        {
          error: 'Invalid token',
          message: 'Invalid or expired token.',
          code: 'INVALID_TOKEN',
        },
        { status: 400 }
      )
    }

    // Dynamic import for Prisma
    const { prisma } = await import('@/lib/db/prisma')

    // Check user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
          message: 'User not found.',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Check for OAuth user
    if (!user.password) {
      return NextResponse.json(
        {
          error: 'OAuth user',
          message: 'OAuth users cannot set a password.',
          code: 'OAUTH_USER',
        },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    })

    // Delete token
    await consumeResetToken(token)

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_PASSWORD_RESET',
        resource: 'User',
        resourceId: user.id,
        details: {
          email: user.email,
          resetAt: new Date().toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    // Optional: Invalidate all sessions (security enhancement)
    // Currently omitted - if needed, delete sessions for this userId from Session table

    logger.info('[Auth] Password reset successful:', { email, userId: user.id })

    return NextResponse.json(
      {
        message: 'Password has been reset. Please sign in with your new password.',
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('[Auth] Reset password error:', error)

    return NextResponse.json(
      {
        error: 'Reset password failed',
        message: 'An error occurred while resetting your password.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
