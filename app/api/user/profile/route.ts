/**
 * 사용자 프로필 API
 *
 * PATCH /api/user/profile
 *
 * 인증된 사용자의 프로필 정보 업데이트
 * (이름, 이미지 URL 등)
 *
 * @module api/user/profile
 */

import { NextResponse } from 'next/server'

import { withAuth } from '@/lib/api/auth-middleware'
import { ENV } from '@/lib/env/validate'
import { logger } from '@/lib/api/logger'

/**
 * 프로필 업데이트 요청 타입
 */
interface UpdateProfileRequest {
  name?: string
  image?: string
}

/**
 * PATCH /api/user/profile
 *
 * 사용자 프로필 업데이트
 *
 * @example
 * ```ts
 * const response = await fetch('/api/user/profile', {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: 'John Doe',
 *     image: 'https://example.com/avatar.jpg'
 *   })
 * })
 * ```
 */
export const PATCH = withAuth(async (request, session) => {
  try {
    // Database 필수 확인
    if (!ENV.HAS_DATABASE) {
      return NextResponse.json(
        {
          error: 'Profile update not available',
          message: 'Database is not configured. Running in demo mode.',
          code: 'DATABASE_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }

    // 요청 파싱
    const body = (await request.json()) as UpdateProfileRequest
    const { name, image } = body

    // 최소한 하나의 필드는 제공되어야 함
    if (name === undefined && image === undefined) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: '업데이트할 정보를 입력해주세요.',
          code: 'NO_UPDATE_FIELDS',
        },
        { status: 400 }
      )
    }

    // 입력 검증
    if (name !== undefined) {
      const trimmedName = name.trim()
      if (trimmedName.length === 0) {
        return NextResponse.json(
          {
            error: 'Invalid name',
            message: '이름을 입력해주세요.',
            code: 'INVALID_NAME',
          },
          { status: 400 }
        )
      }
      if (trimmedName.length > 100) {
        return NextResponse.json(
          {
            error: 'Name too long',
            message: '이름은 100자를 초과할 수 없습니다.',
            code: 'NAME_TOO_LONG',
          },
          { status: 400 }
        )
      }
    }

    if (image !== undefined && image.length > 0) {
      // 기본 URL 형식 검증
      try {
        new URL(image)
      } catch {
        return NextResponse.json(
          {
            error: 'Invalid image URL',
            message: '유효한 이미지 URL을 입력해주세요.',
            code: 'INVALID_IMAGE_URL',
          },
          { status: 400 }
        )
      }
    }

    // 동적 import로 Prisma 로드
    const { prisma } = await import('@/lib/db/prisma')

    // 업데이트할 데이터 구성
    const updateData: { name?: string; image?: string | null } = {}
    if (name !== undefined) {
      updateData.name = name.trim()
    }
    if (image !== undefined) {
      updateData.image = image.length > 0 ? image : null
    }

    // 사용자 프로필 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        updatedAt: true,
      },
    })

    // 감사 로그 기록
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_PROFILE_UPDATE',
        resource: 'User',
        resourceId: session.user.id,
        details: {
          updatedFields: Object.keys(updateData),
          changes: updateData,
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json(
      {
        message: '프로필이 업데이트되었습니다.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          image: updatedUser.image,
          role: updatedUser.role,
          updatedAt: updatedUser.updatedAt,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('[User] Profile update error:', error)

    // Prisma 에러 처리
    if (error instanceof Error) {
      // 사용자를 찾을 수 없음
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          {
            error: 'User not found',
            message: '사용자를 찾을 수 없습니다.',
            code: 'USER_NOT_FOUND',
          },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Profile update failed',
        message: '프로필 업데이트 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
})
