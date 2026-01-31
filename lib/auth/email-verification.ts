/**
 * 이메일 인증 유틸리티
 *
 * 토큰 생성, 저장, 검증 로직
 * @module lib/auth/email-verification
 */

import { randomBytes } from 'crypto'

/**
 * 인증 토큰 생성
 *
 * @returns 32바이트 랜덤 토큰 (hex)
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * 토큰 만료 시간 계산
 *
 * @param hours 만료 시간 (기본: 24시간)
 * @returns 만료 시각
 */
export function getTokenExpiry(hours: number = 24): Date {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + hours)
  return expiry
}

/**
 * 인증 토큰 저장
 *
 * @param email 이메일 주소
 * @param token 인증 토큰
 */
export async function saveVerificationToken(email: string, token: string) {
  const { prisma } = await import('@/lib/db/prisma')

  // 기존 토큰 삭제 (이메일당 1개만 유지)
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  // 새 토큰 저장
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: getTokenExpiry(24), // 24시간 유효
    },
  })
}

/**
 * 인증 토큰 검증
 *
 * @param token 검증할 토큰
 * @returns 토큰이 유효하면 이메일 반환, 그렇지 않으면 null
 */
export async function verifyEmailToken(token: string): Promise<string | null> {
  const { prisma } = await import('@/lib/db/prisma')

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken) {
    return null
  }

  // 만료 확인
  if (verificationToken.expires < new Date()) {
    // 만료된 토큰 삭제
    await prisma.verificationToken.delete({
      where: { token },
    })
    return null
  }

  return verificationToken.identifier
}

/**
 * 토큰 사용 후 삭제
 *
 * @param token 삭제할 토큰
 */
export async function consumeVerificationToken(token: string): Promise<void> {
  const { prisma } = await import('@/lib/db/prisma')

  await prisma.verificationToken.delete({
    where: { token },
  })
}

/**
 * 이메일 인증 완료 처리
 *
 * @param email 인증할 이메일
 */
export async function markEmailAsVerified(email: string): Promise<void> {
  const { prisma } = await import('@/lib/db/prisma')

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  })
}

/**
 * 인증 이메일 재발송 가능 여부 확인
 *
 * @param email 확인할 이메일
 * @returns 재발송 가능 여부
 */
export async function canResendVerification(email: string): Promise<boolean> {
  const { prisma } = await import('@/lib/db/prisma')

  const existingToken = await prisma.verificationToken.findFirst({
    where: { identifier: email },
  })

  if (!existingToken) {
    return true
  }

  // 마지막 발송 후 1분 경과 여부 확인 (rate limiting)
  const oneMinuteAgo = new Date()
  oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1)

  // VerificationToken에는 createdAt이 없으므로 expires로 대략 판단
  // 실제로는 별도 테이블이나 Redis로 관리하는 것이 좋음
  return true // 현재는 항상 재발송 허용
}
