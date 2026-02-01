/**
 * 알림 설정 API
 *
 * GET/PATCH /api/user/notifications
 *
 * 인증된 사용자의 이메일/푸시 알림 설정 관리
 *
 * @module api/user/notifications
 */

import { NextResponse } from 'next/server'

import { withAuth } from '@/lib/api/auth-middleware'
import { ENV } from '@/lib/env/validate'
import { logger } from '@/lib/api/logger'

/**
 * 알림 설정 타입
 */
interface NotificationPreferences {
  email?: {
    applicationStatus?: boolean
    documentGeneration?: boolean
    systemUpdates?: boolean
    weeklyDigest?: boolean
    marketingEmails?: boolean
  }
  push?: {
    applicationUpdates?: boolean
    documentReady?: boolean
    systemAlerts?: boolean
  }
}

/**
 * 기본 알림 설정
 */
const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: {
    applicationStatus: true,
    documentGeneration: true,
    systemUpdates: true,
    weeklyDigest: true,
    marketingEmails: false,
  },
  push: {
    applicationUpdates: true,
    documentReady: true,
    systemAlerts: true,
  },
}

/**
 * GET /api/user/notifications
 *
 * 현재 알림 설정 조회
 *
 * @example
 * ```ts
 * const response = await fetch('/api/user/notifications')
 * const data = await response.json()
 * console.log(data.preferences)
 * ```
 */
export const GET = withAuth(async (request, session) => {
  try {
    // Database 필수 확인
    if (!ENV.HAS_DATABASE) {
      return NextResponse.json(
        {
          error: 'Notifications not available',
          message: 'Database is not configured. Running in demo mode.',
          code: 'DATABASE_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }

    // 동적 import로 Prisma 로드
    const { prisma } = await import('@/lib/db/prisma')

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        notificationPreferences: true,
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

    // 저장된 설정이 없으면 기본값 반환
    const preferences =
      (user.notificationPreferences as NotificationPreferences | null) || DEFAULT_PREFERENCES

    return NextResponse.json(
      {
        preferences,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('[User] Get notifications error:', error)

    return NextResponse.json(
      {
        error: 'Failed to get notifications',
        message: '알림 설정 조회 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
})

/**
 * PATCH /api/user/notifications
 *
 * 알림 설정 업데이트 (부분 업데이트 지원)
 *
 * @example
 * ```ts
 * const response = await fetch('/api/user/notifications', {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     email: {
 *       applicationStatus: true,
 *       weeklyDigest: false
 *     },
 *     push: {
 *       applicationUpdates: true
 *     }
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
          error: 'Notifications update not available',
          message: 'Database is not configured. Running in demo mode.',
          code: 'DATABASE_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }

    // 요청 파싱
    const body = (await request.json()) as Partial<NotificationPreferences>

    // 입력 검증
    if (!body.email && !body.push) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: '업데이트할 알림 설정을 입력해주세요.',
          code: 'NO_UPDATE_FIELDS',
        },
        { status: 400 }
      )
    }

    // 동적 import로 Prisma 로드
    const { prisma } = await import('@/lib/db/prisma')

    // 현재 설정 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        notificationPreferences: true,
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

    // 기존 설정과 병합 (부분 업데이트)
    const currentPreferences =
      (user.notificationPreferences as NotificationPreferences | null) || DEFAULT_PREFERENCES

    const updatedPreferences: NotificationPreferences = {
      email: {
        ...currentPreferences.email,
        ...body.email,
      },
      push: {
        ...currentPreferences.push,
        ...body.push,
      },
    }

    // 설정 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
        notificationPreferences: updatedPreferences as any,
      },
      select: {
        id: true,
        notificationPreferences: true,
        updatedAt: true,
      },
    })

    // 감사 로그 기록
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_NOTIFICATIONS_UPDATE',
        resource: 'User',
        resourceId: session.user.id,
        details: {
          changes: body,
          updatedPreferences,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
        } as any,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json(
      {
        message: '알림 설정이 업데이트되었습니다.',
        preferences: updatedUser.notificationPreferences as NotificationPreferences,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('[User] Update notifications error:', error)

    return NextResponse.json(
      {
        error: 'Notifications update failed',
        message: '알림 설정 업데이트 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
})
