/**
 * Password Reset Request API
 *
 * POST /api/auth/forgot-password
 *
 * Send password reset email
 * @module api/auth/forgot-password
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateResetToken,
  saveResetToken,
  canRequestReset,
} from '@/lib/auth/password-reset'
import {
  sendPasswordResetEmail,
  EmailNotConfiguredError,
  EmailSendError,
} from '@/lib/email/service'
import { ENV } from '@/lib/env/validate'
import { logger } from '@/lib/api/logger'

/**
 * Password reset request type
 */
interface ForgotPasswordRequest {
  email: string
}

/**
 * POST /api/auth/forgot-password
 *
 * Send password reset link
 *
 * @example
 * ```ts
 * const response = await fetch('/api/auth/forgot-password', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email: 'user@example.com' })
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
    const body = (await request.json()) as ForgotPasswordRequest
    const { email } = body

    // Input validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        {
          error: 'Invalid email',
          message: 'Please enter a valid email address.',
          code: 'INVALID_EMAIL',
        },
        { status: 400 }
      )
    }

    // Dynamic import for Prisma
    const { prisma } = await import('@/lib/db/prisma')

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
      },
    })

    // Return success even if user doesn't exist (prevent email enumeration)
    if (!user) {
      logger.warn('[Auth] Password reset requested for non-existent email:', { email })

      return NextResponse.json(
        {
          message: 'Password reset link has been sent to your email.',
          success: true,
        },
        { status: 200 }
      )
    }

    // OAuth user (no password)
    if (!user.password) {
      logger.warn('[Auth] Password reset requested for OAuth user:', { email })

      return NextResponse.json(
        {
          error: 'OAuth user',
          message: 'OAuth users cannot reset their password.',
          code: 'OAUTH_USER',
        },
        { status: 400 }
      )
    }

    // Rate limiting check
    const canRequest = await canRequestReset(email)
    if (!canRequest) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'You can only request a password reset once every 5 minutes.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    // Generate reset token
    const token = generateResetToken()

    // Save token
    await saveResetToken(email, token)

    // Generate reset link
    const resetUrl = `${ENV.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

    // Send email
    let emailSent = true
    try {
      await sendPasswordResetEmail(email, resetUrl)
    } catch (error) {
      emailSent = false

      if (error instanceof EmailNotConfiguredError) {
        logger.warn('[Auth] Email not configured - password reset email cannot be sent')
      } else if (error instanceof EmailSendError) {
        logger.error('[Auth] Failed to send password reset email:', error)
      } else {
        logger.error('[Auth] Unexpected email error:', error)
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_PASSWORD_RESET_REQUESTED',
        resource: 'User',
        resourceId: user.id,
        details: {
          email: user.email,
          requestedAt: new Date().toISOString(),
          emailSent,
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    // In development, return URL for testing
    if (ENV.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          message: emailSent
            ? 'Password reset link has been sent to your email.'
            : 'Failed to send password reset email. (Dev mode - use URL below)',
          success: true,
          // Return URL only in development
          resetUrl,
          emailSent,
        },
        { status: 200 }
      )
    }

    // Return success even in production (prevent email enumeration)
    // Log actual email failures only
    if (!emailSent) {
      logger.error('[Auth] Failed to send password reset email')
    }

    return NextResponse.json(
      {
        message: 'Password reset link has been sent to your email. Please check your inbox.',
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('[Auth] Forgot password error:', error)

    return NextResponse.json(
      {
        error: 'Forgot password failed',
        message: 'An error occurred while processing your password reset request.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
