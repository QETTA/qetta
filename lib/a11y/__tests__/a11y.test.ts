/**
 * Accessibility Utilities Tests
 *
 * DOM 환경 없이 순수 함수 테스트에 집중합니다.
 * 키보드 네비게이션과 reduced motion 테스트는 통합 테스트에서 수행합니다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CONTRAST_RATIOS,
  getRelativeLuminance,
  getContrastRatio,
  meetsContrastRequirement,
} from '../index'

// ============================================
// Constants Tests
// ============================================

describe('WCAG Contrast Ratio Constants', () => {
  it('should have correct normal text ratio (4.5:1)', () => {
    expect(CONTRAST_RATIOS.NORMAL_TEXT).toBe(4.5)
  })

  it('should have correct large text ratio (3:1)', () => {
    expect(CONTRAST_RATIOS.LARGE_TEXT).toBe(3.0)
  })

  it('should have correct UI component ratio (3:1)', () => {
    expect(CONTRAST_RATIOS.UI_COMPONENT).toBe(3.0)
  })
})

// ============================================
// Color Contrast Tests
// ============================================

describe('Relative Luminance Calculation', () => {
  it('should return 0 for pure black', () => {
    const luminance = getRelativeLuminance(0, 0, 0)
    expect(luminance).toBe(0)
  })

  it('should return 1 for pure white', () => {
    const luminance = getRelativeLuminance(255, 255, 255)
    expect(luminance).toBeCloseTo(1, 5)
  })

  it('should calculate luminance for mid-gray', () => {
    const luminance = getRelativeLuminance(128, 128, 128)
    expect(luminance).toBeGreaterThan(0)
    expect(luminance).toBeLessThan(1)
  })

  it('should weight green higher than red and blue', () => {
    const redLum = getRelativeLuminance(255, 0, 0)
    const greenLum = getRelativeLuminance(0, 255, 0)
    const blueLum = getRelativeLuminance(0, 0, 255)

    // Green has highest weight (0.7152)
    expect(greenLum).toBeGreaterThan(redLum)
    expect(greenLum).toBeGreaterThan(blueLum)
  })

  it('should handle sRGB gamma correction', () => {
    // Low values use linear formula (c/12.92)
    // High values use gamma formula ((c+0.055)/1.055)^2.4
    const lowValue = getRelativeLuminance(10, 10, 10)
    const highValue = getRelativeLuminance(200, 200, 200)

    expect(lowValue).toBeLessThan(0.01) // Low values should be very small
    expect(highValue).toBeGreaterThan(0.5) // High values should be closer to 1
  })
})

describe('Contrast Ratio Calculation', () => {
  it('should return 21:1 for black on white', () => {
    const ratio = getContrastRatio(
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 }
    )
    expect(ratio).toBeCloseTo(21, 0)
  })

  it('should return 1:1 for same colors', () => {
    const ratio = getContrastRatio(
      { r: 128, g: 128, b: 128 },
      { r: 128, g: 128, b: 128 }
    )
    expect(ratio).toBeCloseTo(1, 0)
  })

  it('should be commutative (order does not matter)', () => {
    const ratio1 = getContrastRatio(
      { r: 100, g: 100, b: 100 },
      { r: 200, g: 200, b: 200 }
    )
    const ratio2 = getContrastRatio(
      { r: 200, g: 200, b: 200 },
      { r: 100, g: 100, b: 100 }
    )
    expect(ratio1).toBeCloseTo(ratio2, 5)
  })

  it('should handle QETTA brand colors', () => {
    // violet-500 (#8b5cf6) on zinc-950 (#09090b)
    const ratio = getContrastRatio(
      { r: 139, g: 92, b: 246 },
      { r: 9, g: 9, b: 11 }
    )
    // Should have good contrast
    expect(ratio).toBeGreaterThan(4)
  })

  it('should calculate ratio using WCAG formula', () => {
    // Ratio = (L1 + 0.05) / (L2 + 0.05) where L1 is lighter
    const white = { r: 255, g: 255, b: 255 }
    const black = { r: 0, g: 0, b: 0 }
    const ratio = getContrastRatio(white, black)

    // White luminance ≈ 1, Black luminance = 0
    // (1 + 0.05) / (0 + 0.05) = 21
    expect(ratio).toBeCloseTo(21, 0)
  })
})

describe('WCAG Requirement Checks', () => {
  it('should pass normal text requirement at 4.5:1', () => {
    expect(meetsContrastRequirement(4.5, 'normal')).toBe(true)
    expect(meetsContrastRequirement(4.49, 'normal')).toBe(false)
  })

  it('should pass large text requirement at 3:1', () => {
    expect(meetsContrastRequirement(3.0, 'large')).toBe(true)
    expect(meetsContrastRequirement(2.99, 'large')).toBe(false)
  })

  it('should pass UI component requirement at 3:1', () => {
    expect(meetsContrastRequirement(3.0, 'ui')).toBe(true)
    expect(meetsContrastRequirement(2.99, 'ui')).toBe(false)
  })

  it('should default to normal text level', () => {
    expect(meetsContrastRequirement(4.5)).toBe(true)
    expect(meetsContrastRequirement(4.49)).toBe(false)
  })

  it('should handle edge cases', () => {
    expect(meetsContrastRequirement(21, 'normal')).toBe(true) // Max ratio
    expect(meetsContrastRequirement(1, 'normal')).toBe(false) // Min ratio
    expect(meetsContrastRequirement(0, 'normal')).toBe(false) // Invalid
  })
})

// ============================================
// Integration Tests
// ============================================

describe('Accessibility Integration', () => {
  it('should validate QETTA color palette accessibility', () => {
    // QETTA primary colors
    const colors = {
      background: { r: 9, g: 9, b: 11 },      // zinc-950
      foreground: { r: 250, g: 250, b: 250 }, // zinc-50
      primary: { r: 139, g: 92, b: 246 },     // violet-500
      muted: { r: 161, g: 161, b: 170 },      // zinc-400
    }

    // Foreground on background (main text)
    const mainTextRatio = getContrastRatio(colors.foreground, colors.background)
    expect(meetsContrastRequirement(mainTextRatio, 'normal')).toBe(true)

    // Primary on background (buttons, links)
    const primaryRatio = getContrastRatio(colors.primary, colors.background)
    expect(meetsContrastRequirement(primaryRatio, 'large')).toBe(true)

    // Muted on background (secondary text)
    const mutedRatio = getContrastRatio(colors.muted, colors.background)
    expect(mutedRatio).toBeGreaterThan(3) // At least UI component level
  })

  it('should provide all necessary WCAG constants', () => {
    expect(CONTRAST_RATIOS.NORMAL_TEXT).toBeDefined()
    expect(CONTRAST_RATIOS.LARGE_TEXT).toBeDefined()
    expect(CONTRAST_RATIOS.UI_COMPONENT).toBeDefined()
  })

  it('should verify QETTA text on dark theme meets AA', () => {
    const darkBg = { r: 24, g: 24, b: 27 }      // zinc-900
    const lightText = { r: 250, g: 250, b: 250 } // zinc-50

    const ratio = getContrastRatio(lightText, darkBg)
    expect(ratio).toBeGreaterThan(4.5) // AA for normal text
  })

  it('should verify link colors on dark theme', () => {
    const darkBg = { r: 9, g: 9, b: 11 }        // zinc-950
    const linkColor = { r: 167, g: 139, b: 250 } // violet-400

    const ratio = getContrastRatio(linkColor, darkBg)
    expect(ratio).toBeGreaterThan(3) // At least large text AA
  })
})

// ============================================
// Type Export Tests
// ============================================

describe('Type Exports', () => {
  // Note: A11yProps is a TypeScript type, not a runtime value.
  // Type exports are verified at compile time, not runtime.
  // If this file compiles, the type is properly exported.

  it('should export SR_ONLY constants', async () => {
    const { SR_ONLY_CLASS, SR_ONLY_FOCUSABLE_CLASS } = await import('../index')
    expect(SR_ONLY_CLASS).toBe('sr-only')
    expect(SR_ONLY_FOCUSABLE_CLASS).toBe('sr-only focus:not-sr-only')
  })
})
