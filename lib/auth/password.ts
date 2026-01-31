/**
 * Password Hashing Utility
 *
 * bcrypt 기반 비밀번호 해싱 및 검증
 * OWASP 권장 설정 적용
 *
 * @module lib/auth/password
 */

import bcrypt from 'bcryptjs'

/**
 * Salt Rounds (해싱 복잡도)
 *
 * OWASP 권장: 10-12
 * 12 = 약 2-3초 해싱 시간 (보안과 성능의 균형)
 */
const SALT_ROUNDS = 12

/**
 * 비밀번호 최소 요구사항
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // 특수문자는 선택
} as const

/**
 * 비밀번호 강도 검증 결과
 */
export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * 비밀번호 강도 검증
 *
 * @param password - 검증할 비밀번호
 * @returns 검증 결과
 *
 * @example
 * ```ts
 * const result = validatePassword('MyP@ss123')
 * if (!result.valid) {
 *   console.log(result.errors) // ['비밀번호는 특수문자를 포함해야 합니다']
 * }
 * ```
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`비밀번호는 최소 ${PASSWORD_REQUIREMENTS.minLength}자 이상이어야 합니다`)
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`비밀번호는 최대 ${PASSWORD_REQUIREMENTS.maxLength}자까지 가능합니다`)
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('비밀번호는 대문자를 포함해야 합니다')
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('비밀번호는 소문자를 포함해야 합니다')
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('비밀번호는 숫자를 포함해야 합니다')
  }

  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('비밀번호는 특수문자를 포함해야 합니다')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 비밀번호 해싱
 *
 * @param password - 원본 비밀번호
 * @returns 해시된 비밀번호
 *
 * @example
 * ```ts
 * const hash = await hashPassword('MySecureP@ss123')
 * // $2a$12$... (bcrypt 해시)
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * 비밀번호 검증
 *
 * @param password - 입력된 비밀번호
 * @param hashedPassword - 저장된 해시
 * @returns 일치 여부
 *
 * @example
 * ```ts
 * const isValid = await verifyPassword('input', user.passwordHash)
 * if (!isValid) {
 *   throw new Error('비밀번호가 일치하지 않습니다')
 * }
 * ```
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * 비밀번호 강도 점수 계산 (0-100)
 *
 * @param password - 비밀번호
 * @returns 강도 점수
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0

  // 길이 점수 (최대 30점)
  score += Math.min(password.length * 3, 30)

  // 대문자 (10점)
  if (/[A-Z]/.test(password)) score += 10

  // 소문자 (10점)
  if (/[a-z]/.test(password)) score += 10

  // 숫자 (10점)
  if (/[0-9]/.test(password)) score += 10

  // 특수문자 (20점)
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20

  // 다양성 보너스 (20점)
  const uniqueChars = new Set(password).size
  score += Math.min(uniqueChars * 2, 20)

  return Math.min(score, 100)
}

/**
 * 비밀번호 강도 라벨
 *
 * @param score - 강도 점수
 * @returns 라벨 ('weak' | 'fair' | 'good' | 'strong')
 */
export function getPasswordStrengthLabel(
  score: number
): 'weak' | 'fair' | 'good' | 'strong' {
  if (score < 40) return 'weak'
  if (score < 60) return 'fair'
  if (score < 80) return 'good'
  return 'strong'
}
