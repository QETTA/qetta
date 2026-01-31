import { describe, it, expect } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  PASSWORD_REQUIREMENTS,
} from '../password'

describe('hashPassword', () => {
  it('returns a 60-char bcrypt hash', async () => {
    const hash = await hashPassword('Test1234')
    expect(hash).toHaveLength(60)
    expect(hash).toMatch(/^\$2[ab]\$/)
  })

  it('produces different hashes for same input (random salt)', async () => {
    const h1 = await hashPassword('Test1234')
    const h2 = await hashPassword('Test1234')
    expect(h1).not.toBe(h2)
  })
})

describe('verifyPassword', () => {
  it('returns true for matching password', async () => {
    const hash = await hashPassword('Test1234')
    expect(await verifyPassword('Test1234', hash)).toBe(true)
  })

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('Test1234')
    expect(await verifyPassword('Wrong999', hash)).toBe(false)
  })
})

describe('validatePassword', () => {
  it('accepts a valid password', () => {
    const result = validatePassword('MyPass1x')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects too short', () => {
    const result = validatePassword('Ab1')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects missing uppercase', () => {
    const result = validatePassword('lowercase1')
    expect(result.valid).toBe(false)
  })

  it('rejects missing lowercase', () => {
    const result = validatePassword('UPPERCASE1')
    expect(result.valid).toBe(false)
  })

  it('rejects missing number', () => {
    const result = validatePassword('NoNumberHere')
    expect(result.valid).toBe(false)
  })

  it('rejects too long', () => {
    const long = 'Aa1' + 'x'.repeat(126)
    expect(long.length).toBe(129)
    const result = validatePassword(long)
    expect(result.valid).toBe(false)
  })

  it('minLength matches PASSWORD_REQUIREMENTS', () => {
    expect(PASSWORD_REQUIREMENTS.minLength).toBe(8)
  })
})

describe('calculatePasswordStrength / getPasswordStrengthLabel', () => {
  it('weak password scores low', () => {
    const score = calculatePasswordStrength('abc')
    expect(score).toBeLessThan(40)
    expect(getPasswordStrengthLabel(score)).toBe('weak')
  })

  it('strong password scores high', () => {
    const score = calculatePasswordStrength('MyStr0ng!Pass#2026')
    expect(score).toBeGreaterThanOrEqual(80)
    expect(getPasswordStrengthLabel(score)).toBe('strong')
  })
})
