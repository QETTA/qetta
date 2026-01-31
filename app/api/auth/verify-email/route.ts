/**
 * Email Verification API
 *
 * POST /api/auth/verify-email
 *
 * Verify token and complete email verification
 * @module api/auth/verify-email
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  verifyEmailToken,
  consumeVerificationToken,
  markEmailAsVerified,
} from '@/lib/auth/email-verification'
import { ENV } from '@/lib/env/validate'
import { logger } from '@/lib/api/logger'

/**
 * Email verification request type
 */
interface VerifyEmailRequest {
  token: string
}

/**
 * POST /api/auth/verify-email
 *
 * Verify email token
 *
 * @example
 * ```ts
 * const response = await fetch('/api/auth/verify-email', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ token: 'abc123...' })
 * })
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Database required check
    if (!ENV.HAS_DATABASE) {
      return NextResponse.json(
        {
          error: 'Verification not available',
          message: 'Database is not configured. Running in demo mode.',
          code: 'DATABASE_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }

    // Parse request
    const body = (await request.json()) as VerifyEmailRequest
    const { token } = body

    // Input validation
    if (!token) {
      return NextResponse.json(
        {
          error: 'Missing token',
          message: 'Verification token is required.',
          code: 'MISSING_TOKEN',
        },
        { status: 400 }
      )
    }

    // Verify token
    const email = await verifyEmailToken(token)

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
        emailVerified: true,
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

    // Already verified
    if (user.emailVerified) {
      // Delete token
      await consumeVerificationToken(token)

      return NextResponse.json(
        {
          message: 'Email is already verified.',
          success: true,
          alreadyVerified: true,
        },
        { status: 200 }
      )
    }

    // Complete email verification
    await markEmailAsVerified(email)

    // Delete token
    await consumeVerificationToken(token)

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_EMAIL_VERIFIED',
        resource: 'User',
        resourceId: user.id,
        details: {
          email,
          verifiedAt: new Date().toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    logger.info('[Auth] Email verified:', { email, userId: user.id })

    return NextResponse.json(
      {
        message: 'Email verification complete.',
        success: true,
        alreadyVerified: false,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('[Auth] Verify email error:', error)

    return NextResponse.json(
      {
        error: 'Verification failed',
        message: 'An error occurred during email verification.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
