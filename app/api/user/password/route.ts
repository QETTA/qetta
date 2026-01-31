/**
 * 비밀번호 변경 API
 *
 * POST /api/user/password
 *
 * 인증된 사용자의 비밀번호 변경
 * 현재 비밀번호 검증 필수
 *
 * @module api/user/password
 */

import { NextResponse } from 'next/server'

import { withAuth } from '@/lib/api/auth-middleware'
import { ENV } from '@/lib/env/validate'
import { hashPassword, validatePassword, verifyPassword } from '@/lib/auth/password'
import { logger } from '@/lib/api/logger'

/**
 * 비밀번호 변경 요청 타입
 */
interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/**
 * POST /api/user/password
 *
 * 사용자 비밀번호 변경
 *
 * @example
 * ```ts
 * const response = await fetch('/api/user/password', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     currentPassword: 'OldPass123',
 *     newPassword: 'NewSecurePass456'
 *   })
 * })
 * ```
 */
export const POST = withAuth(async (request, session) => {
  try {
    // Database 필수 확인
    if (!ENV.HAS_DATABASE) {
      return NextResponse.json(
        {
          error: 'Password change not available',
          message: 'Database is not configured. Running in demo mode.',
          code: 'DATABASE_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }

    // 요청 파싱
    const body = (await request.json()) as ChangePasswordRequest
    const { currentPassword, newPassword } = body

    // 입력 검증
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          error: 'Missing fields',
          message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      )
    }

    // 새 비밀번호 검증
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

    // 현재 비밀번호와 새 비밀번호가 같으면 에러
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          error: 'Same password',
          message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
          code: 'SAME_PASSWORD',
        },
        { status: 400 }
      )
    }

    // 동적 import로 Prisma 로드
    const { prisma } = await import('@/lib/db/prisma')

    // 사용자 조회 (비밀번호 포함)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
          message: '사용자를 찾을 수 없습니다.',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // OAuth 사용자 (비밀번호 없음)
    if (!user.password) {
      return NextResponse.json(
        {
          error: 'OAuth user',
          message: 'OAuth 로그인 사용자는 비밀번호를 변경할 수 없습니다.',
          code: 'OAUTH_USER',
        },
        { status: 400 }
      )
    }

    // 현재 비밀번호 검증
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.password
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          error: 'Invalid password',
          message: '현재 비밀번호가 일치하지 않습니다.',
          code: 'INVALID_CURRENT_PASSWORD',
        },
        { status: 401 }
      )
    }

    // 새 비밀번호 해싱
    const hashedNewPassword = await hashPassword(newPassword)

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedNewPassword,
      },
    })

    // 감사 로그 기록
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_PASSWORD_CHANGE',
        resource: 'User',
        resourceId: session.user.id,
        details: {
          email: user.email,
          changedAt: new Date().toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    // 선택사항: 모든 세션 무효화 (보안 강화)
    // 현재는 생략 - 필요시 Session 테이블에서 해당 userId의 세션 삭제

    return NextResponse.json(
      {
        message: '비밀번호가 변경되었습니다.',
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('[User] Password change error:', error)

    return NextResponse.json(
      {
        error: 'Password change failed',
        message: '비밀번호 변경 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
})
