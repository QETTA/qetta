/**
 * 비밀번호 재설정 유틸리티
 *
 * 토큰 생성, 저장, 검증 로직
 * @module lib/auth/password-reset
 */

import { randomBytes } from 'crypto'

/**
 * 비밀번호 재설정 토큰 생성
 *
 * @returns 32바이트 랜덤 토큰 (hex)
 */
export function generateResetToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * 토큰 만료 시간 계산
 *
 * @param hours 만료 시간 (기본: 1시간)
 * @returns 만료 시각
 */
export function getResetTokenExpiry(hours: number = 1): Date {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + hours)
  return expiry
}

/**
 * 비밀번호 재설정 토큰 저장
 *
 * @param email 이메일 주소
 * @param token 재설정 토큰
 */
export async function saveResetToken(email: string, token: string) {
  const { prisma } = await import('@/lib/db/prisma')

  // 기존 토큰 삭제 (이메일당 1개만 유지)
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: `password-reset:${email}`,
    },
  })

  // 새 토큰 저장 (1시간 유효)
  await prisma.verificationToken.create({
    data: {
      identifier: `password-reset:${email}`,
      token,
      expires: getResetTokenExpiry(1),
    },
  })
}

/**
 * 비밀번호 재설정 토큰 검증
 *
 * @param token 검증할 토큰
 * @returns 토큰이 유효하면 이메일 반환, 그렇지 않으면 null
 */
export async function verifyResetToken(token: string): Promise<string | null> {
  const { prisma } = await import('@/lib/db/prisma')

  const resetToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!resetToken) {
    return null
  }

  // identifier가 password-reset으로 시작하는지 확인
  if (!resetToken.identifier.startsWith('password-reset:')) {
    return null
  }

  // 만료 확인
  if (resetToken.expires < new Date()) {
    // 만료된 토큰 삭제
    await prisma.verificationToken.delete({
      where: { token },
    })
    return null
  }

  // "password-reset:" 접두어 제거하여 이메일 반환
  return resetToken.identifier.replace('password-reset:', '')
}

/**
 * 토큰 사용 후 삭제
 *
 * @param token 삭제할 토큰
 */
export async function consumeResetToken(token: string): Promise<void> {
  const { prisma } = await import('@/lib/db/prisma')

  await prisma.verificationToken.delete({
    where: { token },
  })
}

/**
 * 비밀번호 재설정 가능 여부 확인
 *
 * @param email 확인할 이메일
 * @returns 재설정 가능 여부
 */
export async function canRequestReset(email: string): Promise<boolean> {
  const { prisma } = await import('@/lib/db/prisma')

  const existingToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: `password-reset:${email}`,
    },
  })

  if (!existingToken) {
    return true
  }

  // Rate limiting: 5분에 한 번만 요청 가능
  const fiveMinutesAgo = new Date()
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

  // 토큰 만료 시간으로 대략 판단
  // 1시간 유효 토큰이므로, 55분 이상 남았으면 최근 발급
  const fiftyFiveMinutesLater = new Date()
  fiftyFiveMinutesLater.setMinutes(fiftyFiveMinutesLater.getMinutes() + 55)

  if (existingToken.expires > fiftyFiveMinutesLater) {
    return false // 최근에 발급됨
  }

  return true
}
