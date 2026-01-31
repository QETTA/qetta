/**
 * Type Guard Functions
 *
 * 런타임 타입 검증 함수들. `as unknown as` 패턴을 안전하게 대체합니다.
 *
 * @module utils/type-guards
 */

import type { Prisma } from '@prisma/client'

/**
 * Prisma InputJsonValue 타입 가드
 *
 * JSON 직렬화 가능한 값인지 검증합니다.
 * Prisma의 Json 필드에 저장 가능한 값만 허용합니다.
 */
export function isPrismaJsonValue(value: unknown): value is Prisma.InputJsonValue {
  if (value === null) return true
  if (typeof value === 'string') return true
  if (typeof value === 'number') return true
  if (typeof value === 'boolean') return true

  if (Array.isArray(value)) {
    return value.every(isPrismaJsonValue)
  }

  if (typeof value === 'object') {
    return Object.values(value).every(isPrismaJsonValue)
  }

  return false
}

/**
 * 해시체인 메타데이터 타입 가드
 */
export interface HashChainMetadata {
  documentType: string
  version: string
  createdAt: string
  createdBy: string
  algorithm: 'SHA-256'
  [key: string]: unknown
}

export function isHashChainMetadata(value: unknown): value is HashChainMetadata {
  if (!value || typeof value !== 'object') return false

  const obj = value as Record<string, unknown>

  return (
    typeof obj.documentType === 'string' &&
    typeof obj.version === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.createdBy === 'string' &&
    obj.algorithm === 'SHA-256'
  )
}

/**
 * 비어있지 않은 문자열인지 확인
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * 유효한 ISO 날짜 문자열인지 확인
 */
export function isISODateString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return !isNaN(date.getTime())
}

/**
 * 객체를 Prisma JsonValue로 안전하게 변환
 * 변환 불가 시 null 반환
 */
export function toPrismaJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (isPrismaJsonValue(value)) {
    return value
  }

  // JSON 직렬화 시도
  try {
    const json = JSON.stringify(value)
    return JSON.parse(json)
  } catch {
    return null
  }
}
