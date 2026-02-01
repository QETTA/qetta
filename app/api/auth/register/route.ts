/**
 * 회원가입 API
 *
 * POST /api/auth/register
 *
 * 새 사용자 등록 (Credentials Provider용)
 * bcrypt로 비밀번호 해싱, Prisma로 DB 저장
 *
 * @module api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server'

import { ENV } from '@/lib/env/validate'
import { hashPassword, validatePassword } from '@/lib/auth/password'
import {
  generateVerificationToken,
  getTokenExpiry,
} from '@/lib/auth/email-verification'
import {
  sendVerificationEmail,
  EmailNotConfiguredError,
  EmailSendError,
} from '@/lib/email/service'
import { logger } from '@/lib/api/logger'

/**
 * 회원가입 요청 타입
 */
interface RegisterRequest {
  email: string
  password: string
  name?: string
}

/**
 * 이메일 형식 검증
 */
function isValidEmail(email: string): boolean {
  // RFC 5322 simplified: local@domain.tld with stricter domain validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) return false
  if (email.length > 254) return false // RFC 5321 max length
  return true
}

/**
 * POST /api/auth/register
 *
 * 새 사용자 등록
 *
 * @example
 * ```ts
 * const response = await fetch('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     email: 'user@example.com',
 *     password: 'SecurePass123',
 *     name: 'John Doe'
 *   })
 * })
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Database 필수 확인
    if (!ENV.HAS_DATABASE) {
      return NextResponse.json(
        {
          error: 'Registration not available',
          message: 'Database is not configured. Running in demo mode.',
          code: 'DATABASE_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }

    // 요청 파싱 - JSON 파싱 오류 처리
    let body: RegisterRequest
    try {
      body = (await request.json()) as RegisterRequest
    } catch (error) {
      // SyntaxError: JSON 파싱 실패 (잘못된 JSON 형식, 이스케이프 문제 등)
      if (error instanceof SyntaxError) {
        logger.warn('[Auth] Invalid JSON in registration request:', error.message)
        return NextResponse.json(
          {
            error: 'Invalid request format',
            message: '잘못된 요청 형식입니다. 입력값을 확인해주세요.',
            code: 'INVALID_JSON',
          },
          { status: 400 }
        )
      }
      // 예상치 못한 에러는 상위로 전파
      throw error
    }

    const { email, password, name } = body

    // 이메일 검증
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          error: 'Invalid email',
          message: '유효한 이메일 주소를 입력해주세요.',
          code: 'INVALID_EMAIL',
        },
        { status: 400 }
      )
    }

    // 비밀번호 검증
    if (!password) {
      return NextResponse.json(
        {
          error: 'Password required',
          message: '비밀번호를 입력해주세요.',
          code: 'PASSWORD_REQUIRED',
        },
        { status: 400 }
      )
    }

    const passwordValidation = validatePassword(password)
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

    // 동적 import로 Prisma 로드
    const { prisma } = await import('@/lib/db/prisma')

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })

    // SECURITY: 이메일 열거 공격 방지
    // 기존 이메일이어도 성공 응답을 반환하여 계정 존재 여부를 노출하지 않음
    if (existingUser) {
      logger.warn('[Auth] Registration attempt for existing email:', {
        email: email.toLowerCase(),
      })

      return NextResponse.json(
        {
          message: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.',
          success: true,
        },
        { status: 200 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password)

    // SECURITY: 트랜잭션으로 사용자 생성과 토큰 저장을 원자적으로 처리
    // 이메일 발송은 트랜잭션 외부에서 처리하여 발송 실패 시에도 사용자가 생성되도록 함
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma transaction client type unavailable without prisma generate
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. 사용자 생성
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name?.trim() || null,
          role: 'USER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      })

      // 2. 인증 토큰 생성 및 저장
      const verificationToken = generateVerificationToken()

      // 기존 토큰 삭제 (이메일당 1개만 유지)
      await tx.verificationToken.deleteMany({
        where: { identifier: user.email },
      })

      // 새 토큰 저장
      await tx.verificationToken.create({
        data: {
          identifier: user.email,
          token: verificationToken,
          expires: getTokenExpiry(24), // 24시간 유효
        },
      })

      return { user, verificationToken }
    })

    // 인증 링크 생성
    const verificationUrl = `${ENV.NEXT_PUBLIC_APP_URL}/verify-email?token=${result.verificationToken}`

    // 이메일 발송 (트랜잭션 외부)
    // SECURITY: 이메일 발송 실패 시에도 사용자는 생성됨
    // 사용자는 나중에 재발송 요청 가능
    let emailSent = true
    try {
      await sendVerificationEmail(result.user.email, verificationUrl)
    } catch (error) {
      emailSent = false

      if (error instanceof EmailNotConfiguredError) {
        logger.warn('[Auth] Email not configured - user can request resend later')
      } else if (error instanceof EmailSendError) {
        logger.error('[Auth] Email send failed:', error)
      } else {
        logger.error('[Auth] Unexpected email error:', error)
      }
    }

    // 감사 로그 기록
    await prisma.auditLog.create({
      data: {
        userId: result.user.id,
        action: 'USER_REGISTER',
        resource: 'User',
        resourceId: result.user.id,
        details: {
          email: result.user.email,
          method: 'credentials',
          verificationEmailSent: emailSent,
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json(
      {
        message: emailSent
          ? '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.'
          : '회원가입이 완료되었습니다. 이메일 발송에 실패했습니다. 인증 이메일 재발송을 요청해주세요.',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        emailSent,
        // 개발 환경에서만 URL 반환 (테스트용)
        ...(ENV.NODE_ENV === 'development' && { verificationUrl }),
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('[Auth] Registration error:', error)

    // Prisma 고유 제약 조건 위반 (동시 등록 등)
    // SECURITY: 이메일 열거 공격 방지 - 성공으로 처리
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      logger.warn('[Auth] Race condition - email already exists during registration')

      return NextResponse.json(
        {
          message: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.',
          success: true,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        error: 'Registration failed',
        message: '회원가입 처리 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
