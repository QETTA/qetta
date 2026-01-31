/**
 * VerifyBadge Component Tests
 *
 * KidsMap getConfidenceBadge 패턴 적용 테스트
 */

import { describe, it, expect } from 'vitest'

// Test the status determination logic
describe('VerifyBadge Status Logic', () => {
  type VerificationStatus = 'verified' | 'warning' | 'invalid' | 'pending'

  interface HashVerificationResult {
    isValid: boolean
    chainIntegrity?: boolean
  }

  const getStatus = (
    isVerifying: boolean,
    result: HashVerificationResult | null
  ): VerificationStatus => {
    if (isVerifying) return 'pending'
    if (!result) return 'pending'
    if (result.isValid && result.chainIntegrity !== false) return 'verified'
    if (result.isValid && result.chainIntegrity === false) return 'warning'
    return 'invalid'
  }

  describe('pending state', () => {
    it('should return pending when isVerifying is true', () => {
      expect(getStatus(true, null)).toBe('pending')
      expect(getStatus(true, { isValid: true })).toBe('pending')
    })

    it('should return pending when result is null', () => {
      expect(getStatus(false, null)).toBe('pending')
    })
  })

  describe('verified state', () => {
    it('should return verified when valid with chain integrity', () => {
      expect(getStatus(false, { isValid: true, chainIntegrity: true })).toBe('verified')
    })

    it('should return verified when valid without chainIntegrity property', () => {
      expect(getStatus(false, { isValid: true })).toBe('verified')
    })
  })

  describe('warning state', () => {
    it('should return warning when valid but chain integrity is false', () => {
      expect(getStatus(false, { isValid: true, chainIntegrity: false })).toBe('warning')
    })
  })

  describe('invalid state', () => {
    it('should return invalid when isValid is false', () => {
      expect(getStatus(false, { isValid: false })).toBe('invalid')
      expect(getStatus(false, { isValid: false, chainIntegrity: true })).toBe('invalid')
      expect(getStatus(false, { isValid: false, chainIntegrity: false })).toBe('invalid')
    })
  })
})

describe('VerifyBadge Status Configuration', () => {
  const STATUS_CONFIG = {
    verified: {
      label: '✅ 해시체인 검증 완료',
      sublabel: '문서 무결성 확인됨',
    },
    warning: {
      label: '⚠️ 문서 유효, 체인 불일치',
      sublabel: '이전 버전과 연결 끊김',
    },
    invalid: {
      label: '❌ 위변조 감지',
      sublabel: '원본과 해시값 불일치',
    },
    pending: {
      label: '🔍 검증 중...',
      sublabel: 'SHA-256 해시 계산 중',
    },
  }

  it('should have all 4 KidsMap verification states', () => {
    const states = Object.keys(STATUS_CONFIG)
    expect(states).toHaveLength(4)
    expect(states).toContain('verified')
    expect(states).toContain('warning')
    expect(states).toContain('invalid')
    expect(states).toContain('pending')
  })

  it('should have emoji in all labels (KidsMap UX pattern)', () => {
    Object.values(STATUS_CONFIG).forEach((config) => {
      const hasEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[✅⚠️❌🔍]/u.test(
        config.label
      )
      expect(hasEmoji).toBe(true)
    })
  })

  it('should have meaningful sublabels', () => {
    Object.values(STATUS_CONFIG).forEach((config) => {
      expect(config.sublabel.length).toBeGreaterThan(5)
    })
  })
})

describe('ExpiryBadge Logic (KidsMap getExpiryUrgency pattern)', () => {
  const getDaysLeft = (expiresAt: Date): number => {
    const now = new Date()
    return Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getExpiryUrgency = (daysLeft: number): 'expired' | 'urgent' | 'soon' | null => {
    if (daysLeft <= 0) return 'expired'
    if (daysLeft <= 3) return 'urgent'
    if (daysLeft <= 7) return 'soon'
    return null
  }

  it('should classify expired dates correctly', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(getExpiryUrgency(getDaysLeft(yesterday))).toBe('expired')
  })

  it('should classify urgent dates (D-1 to D-3)', () => {
    expect(getExpiryUrgency(1)).toBe('urgent')
    expect(getExpiryUrgency(2)).toBe('urgent')
    expect(getExpiryUrgency(3)).toBe('urgent')
  })

  it('should classify soon dates (D-4 to D-7)', () => {
    expect(getExpiryUrgency(4)).toBe('soon')
    expect(getExpiryUrgency(5)).toBe('soon')
    expect(getExpiryUrgency(7)).toBe('soon')
  })

  it('should return null for non-urgent dates', () => {
    expect(getExpiryUrgency(8)).toBeNull()
    expect(getExpiryUrgency(30)).toBeNull()
    expect(getExpiryUrgency(365)).toBeNull()
  })
})

describe('Hash Truncation', () => {
  const truncateHash = (hash: string): string => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`
  }

  it('should truncate SHA-256 hash correctly', () => {
    const fullHash = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8'
    const truncated = truncateHash(fullHash)

    expect(truncated).toMatch(/^.{8}\.\.\..{8}$/)
    expect(truncated).toBe('a1b2c3d4...y5z6a7b8')
  })

  it('should handle different hash lengths', () => {
    const shortHash = '12345678abcdefgh'
    const truncated = truncateHash(shortHash)

    expect(truncated).toBe('12345678...abcdefgh')
  })
})
