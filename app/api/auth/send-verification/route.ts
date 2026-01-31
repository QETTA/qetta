/**
 * 이메일 인증 전송 API
 *
 * POST /api/auth/send-verification
 *
 * 회원가입 후 인증 이메일 발송
 * @module api/auth/send-verification
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateVerificationToken,
  saveVerificationToken,
  canResendVerification,
} from '@/lib/auth/email-verification'
import {
  sendVerificationEmail,
  EmailNotConfiguredError,
  EmailSendError,
} from '@/lib/email/service'
import { ENV } from '@/lib/env/validate'
import { logger } from '@/lib/api/logger'

/**
 * 인증 이메일 전송 요청 타입
 */
interface SendVerificationRequest {
  email: string
}

/**
 * POST /api/auth/send-verification
 *
 * 이메일 인증 링크 전송
 *
 * @example
 * ```ts
 * const response = await fetch('/api/auth/send-verification', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email: 'user@example.com' })
 * })
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Database 필수 확인
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

    // 요청 파싱
    const body = (await request.json()) as SendVerificationRequest
    const { email } = body

    // 입력 검증
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        {
          error: 'Invalid email',
          message: '유효한 이메일 주소를 입력해주세요.',
          code: 'INVALID_EMAIL',
        },
        { status: 400 }
      )
    }

    // 동적 import로 Prisma 로드
    const { prisma } = await import('@/lib/db/prisma')

    // 사용자 존재 여부 확인
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
          message: '해당 이메일로 가입된 사용자가 없습니다.',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // 이미 인증된 경우
    if (user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Already verified',
          message: '이미 인증된 이메일입니다.',
          code: 'ALREADY_VERIFIED',
        },
        { status: 400 }
      )
    }

    // Rate limiting 확인
    const canResend = await canResendVerification(email)
    if (!canResend) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: '인증 이메일은 1분에 한 번만 발송할 수 있습니다.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    // 인증 토큰 생성
    const token = generateVerificationToken()

    // 토큰 저장
    await saveVerificationToken(email, token)

    // 인증 링크 생성
    const verificationUrl = `${ENV.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

    // 이메일 발송
    let emailSent = true
    try {
      await sendVerificationEmail(email, verificationUrl)
    } catch (error) {
      emailSent = false

      if (error instanceof EmailNotConfiguredError) {
        logger.warn('[Auth] Email not configured - verification email cannot be sent')
      } else if (error instanceof EmailSendError) {
        logger.error('[Auth] Failed to send verification email:', error)
      } else {
        logger.error('[Auth] Unexpected email error:', error)
      }
    }

    // 개발 환경에서는 URL을 반환 (테스트용)
    if (ENV.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          message: emailSent
            ? '인증 이메일이 발송되었습니다.'
            : '인증 이메일 발송에 실패했습니다. (개발 모드 - 아래 URL 사용)',
          success: true,
          // 개발 환경에서만 URL 반환
          verificationUrl,
          emailSent,
        },
        { status: 200 }
      )
    }

    // 프로덕션 환경
    if (!emailSent) {
      logger.error('[Auth] Failed to send verification email')
      return NextResponse.json(
        {
          error: 'Email send failed',
          message: '인증 이메일 발송에 실패했습니다. 나중에 다시 시도해주세요.',
          code: 'EMAIL_SEND_FAILED',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: '인증 이메일이 발송되었습니다. 메일함을 확인해주세요.',
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('[Auth] Send verification error:', error)

    return NextResponse.json(
      {
        error: 'Send verification failed',
        message: '인증 이메일 발송 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
