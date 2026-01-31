import { describe, it, expect } from 'vitest'
import {
  calculateOEE,
  getOEEGrade,
  getOEEColor,
  getOEEBgColor,
  generateOEEByStatus,
  findOEEBottleneck,
  DEFAULT_THRESHOLDS,
} from '../oee'

describe('calculateOEE', () => {
  it('calculates OEE from percentage inputs', () => {
    const result = calculateOEE(95, 90, 99)
    // 95 * 90 * 99 / 10000 = 84.645 → 84.6
    expect(result.overall).toBe(84.6)
    expect(result.availability).toBe(95)
    expect(result.performance).toBe(90)
    expect(result.quality).toBe(99)
  })

  it('returns 0 for all-zero inputs', () => {
    const result = calculateOEE(0, 0, 0)
    expect(result.overall).toBe(0)
  })

  it('returns 100 for perfect inputs', () => {
    const result = calculateOEE(100, 100, 100)
    expect(result.overall).toBe(100)
  })

  it('clamps values above 100', () => {
    const result = calculateOEE(150, 100, 100)
    expect(result.availability).toBe(100)
    expect(result.overall).toBe(100)
  })

  it('clamps negative values to 0', () => {
    const result = calculateOEE(-10, 50, 50)
    expect(result.availability).toBe(0)
    expect(result.overall).toBe(0)
  })

  it('rounds to 1 decimal place', () => {
    const result = calculateOEE(92.35, 87.44, 98.76)
    expect(result.availability).toBe(92.4)
    expect(result.performance).toBe(87.4)
    expect(result.quality).toBe(98.8)
  })
})

describe('getOEEGrade', () => {
  it('returns world-class for OEE >= 85', () => {
    expect(getOEEGrade(85)).toBe('world-class')
    expect(getOEEGrade(99)).toBe('world-class')
  })

  it('returns good for 75 <= OEE < 85', () => {
    expect(getOEEGrade(75)).toBe('good')
    expect(getOEEGrade(84.9)).toBe('good')
  })

  it('returns acceptable for 60 <= OEE < 75', () => {
    expect(getOEEGrade(60)).toBe('acceptable')
    expect(getOEEGrade(74.9)).toBe('acceptable')
  })

  it('returns low for OEE < 60', () => {
    expect(getOEEGrade(59.9)).toBe('low')
    expect(getOEEGrade(0)).toBe('low')
  })

  it('uses custom thresholds', () => {
    expect(getOEEGrade(90, { worldClass: 95, good: 80, acceptable: 65 })).toBe('good')
  })
})

describe('getOEEColor', () => {
  it('returns emerald for world-class', () => {
    expect(getOEEColor(90)).toContain('emerald')
  })

  it('returns blue for good', () => {
    expect(getOEEColor(80)).toContain('blue')
  })

  it('returns amber for acceptable', () => {
    expect(getOEEColor(65)).toContain('amber')
  })

  it('returns red for low', () => {
    expect(getOEEColor(30)).toContain('red')
  })
})

describe('getOEEBgColor', () => {
  it('returns emerald for world-class (85+)', () => {
    expect(getOEEBgColor(90)).toContain('ring-1')
    expect(getOEEBgColor(90)).toContain('emerald')
  })

  it('returns blue for good (75-84)', () => {
    expect(getOEEBgColor(78)).toContain('blue')
    expect(getOEEBgColor(78)).toContain('ring-1')
  })

  it('returns amber for acceptable (60-74)', () => {
    expect(getOEEBgColor(65)).toContain('amber')
    expect(getOEEBgColor(65)).toContain('ring-1')
  })

  it('returns red for low (<60)', () => {
    expect(getOEEBgColor(50)).toContain('red')
    expect(getOEEBgColor(50)).toContain('ring-1')
  })
})

describe('generateOEEByStatus', () => {
  it('generates valid OEE for normal status', () => {
    const oee = generateOEEByStatus('normal')
    expect(oee.overall).toBeGreaterThan(0)
    expect(oee.availability).toBeGreaterThan(80)
  })

  it('generates zero availability for maintenance', () => {
    const oee = generateOEEByStatus('maintenance')
    expect(oee.availability).toBe(0)
    expect(oee.performance).toBe(0)
    expect(oee.quality).toBe(100)
    expect(oee.overall).toBe(0)
  })

  it('generates lower OEE for critical vs normal', () => {
    // Run multiple times due to randomness
    const normals = Array.from({ length: 20 }, () => generateOEEByStatus('normal').overall)
    const criticals = Array.from({ length: 20 }, () => generateOEEByStatus('critical').overall)

    const avgNormal = normals.reduce((a, b) => a + b) / normals.length
    const avgCritical = criticals.reduce((a, b) => a + b) / criticals.length

    expect(avgNormal).toBeGreaterThan(avgCritical)
  })

  it('generates valid metrics for warning status', () => {
    const oee = generateOEEByStatus('warning')
    expect(oee.overall).toBeGreaterThan(0)
    expect(oee.availability).toBeLessThan(100)
  })
})

describe('findOEEBottleneck', () => {
  it('identifies availability as bottleneck', () => {
    expect(findOEEBottleneck({ availability: 70, performance: 90, quality: 95, overall: 59.9 }))
      .toBe('availability')
  })

  it('identifies performance as bottleneck', () => {
    expect(findOEEBottleneck({ availability: 95, performance: 70, quality: 95, overall: 63.2 }))
      .toBe('performance')
  })

  it('identifies quality as bottleneck', () => {
    expect(findOEEBottleneck({ availability: 95, performance: 90, quality: 70, overall: 59.9 }))
      .toBe('quality')
  })
})

