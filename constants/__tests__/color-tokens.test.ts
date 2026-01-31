/**
 * Color Tokens Tests
 *
 * QETTA 색상 시스템 통합 테스트
 * - 색상 상수
 * - getColorClasses 헬퍼
 * - getSemanticColor 헬퍼
 */

import { describe, it, expect } from 'vitest'
import {
  COLORS,
  BADGE_COLORS,
  CARD_COLORS,
  STATUS_COLORS,
  TEXT_COLORS,
  DOT_COLORS,
  SEMANTIC_COLORS,
  COLOR_TOKENS,
  getColorClasses,
  getSemanticColor,
} from '../color-tokens'
import type { ColorVariant } from '../color-tokens'

describe('COLORS constant', () => {
  it('contains all 8 color variants', () => {
    expect(COLORS).toHaveLength(8)
    expect(COLORS).toContain('violet')
    expect(COLORS).toContain('emerald')
    expect(COLORS).toContain('amber')
    expect(COLORS).toContain('blue')
    expect(COLORS).toContain('indigo')
    expect(COLORS).toContain('fuchsia')
    expect(COLORS).toContain('red')
    expect(COLORS).toContain('zinc')
  })
})

describe('BADGE_COLORS', () => {
  const colors: ColorVariant[] = ['violet', 'emerald', 'amber', 'blue', 'indigo', 'fuchsia', 'red', 'zinc']

  colors.forEach((color) => {
    it(`has ${color} badge style`, () => {
      expect(BADGE_COLORS[color]).toBeDefined()
      expect(BADGE_COLORS[color]).toContain('bg-')
      expect(BADGE_COLORS[color]).toContain('text-')
      expect(BADGE_COLORS[color]).toContain('ring-')
    })
  })
})

describe('CARD_COLORS', () => {
  const colors: ColorVariant[] = ['violet', 'emerald', 'amber', 'blue', 'indigo', 'fuchsia', 'red', 'zinc']

  colors.forEach((color) => {
    it(`has ${color} card styles`, () => {
      expect(CARD_COLORS[color]).toBeDefined()
      expect(CARD_COLORS[color].bg).toContain('bg-')
      expect(CARD_COLORS[color].text).toContain('text-')
      expect(CARD_COLORS[color].ring).toContain('ring-')
      expect(CARD_COLORS[color].gradient).toContain('gradient')
    })
  })
})

describe('STATUS_COLORS', () => {
  const colors: ColorVariant[] = ['violet', 'emerald', 'amber', 'blue', 'indigo', 'fuchsia', 'red', 'zinc']

  colors.forEach((color) => {
    it(`has ${color} status colors`, () => {
      expect(STATUS_COLORS[color]).toBeDefined()
      expect(STATUS_COLORS[color].ping).toContain('bg-')
      expect(STATUS_COLORS[color].solid).toContain('bg-')
    })
  })
})

describe('TEXT_COLORS', () => {
  const colors: ColorVariant[] = ['violet', 'emerald', 'amber', 'blue', 'indigo', 'fuchsia', 'red', 'zinc']

  colors.forEach((color) => {
    it(`has ${color} text color`, () => {
      expect(TEXT_COLORS[color]).toBeDefined()
      expect(TEXT_COLORS[color]).toContain('text-')
    })
  })
})

describe('DOT_COLORS', () => {
  const colors: ColorVariant[] = ['violet', 'emerald', 'amber', 'blue', 'indigo', 'fuchsia', 'red', 'zinc']

  colors.forEach((color) => {
    it(`has ${color} dot color`, () => {
      expect(DOT_COLORS[color]).toBeDefined()
      expect(DOT_COLORS[color]).toContain('bg-')
    })
  })
})

describe('SEMANTIC_COLORS', () => {
  it('has status colors', () => {
    expect(SEMANTIC_COLORS.success).toBe('emerald')
    expect(SEMANTIC_COLORS.warning).toBe('amber')
    expect(SEMANTIC_COLORS.error).toBe('red')
    expect(SEMANTIC_COLORS.info).toBe('blue')
  })

  it('has brand colors', () => {
    expect(SEMANTIC_COLORS.primary).toBe('violet')
    expect(SEMANTIC_COLORS.secondary).toBe('zinc')
    expect(SEMANTIC_COLORS.accent).toBe('fuchsia')
  })

  it('has domain engine colors', () => {
    expect(SEMANTIC_COLORS.manufacturing).toBe('blue')
    expect(SEMANTIC_COLORS.environment).toBe('emerald')
    expect(SEMANTIC_COLORS.digital).toBe('violet')
    expect(SEMANTIC_COLORS.finance).toBe('indigo')
    expect(SEMANTIC_COLORS.startup).toBe('fuchsia')
    expect(SEMANTIC_COLORS.export).toBe('amber')
  })
})

describe('COLOR_TOKENS', () => {
  it('consolidates all token types', () => {
    expect(COLOR_TOKENS.badge).toBe(BADGE_COLORS)
    expect(COLOR_TOKENS.card).toBe(CARD_COLORS)
    expect(COLOR_TOKENS.status).toBe(STATUS_COLORS)
    expect(COLOR_TOKENS.text).toBe(TEXT_COLORS)
    expect(COLOR_TOKENS.dot).toBe(DOT_COLORS)
    expect(COLOR_TOKENS.semantic).toBe(SEMANTIC_COLORS)
  })
})

describe('getColorClasses', () => {
  describe('badge usage', () => {
    it('returns badge classes for violet', () => {
      const result = getColorClasses('violet', 'badge')
      expect(result).toBe(BADGE_COLORS.violet)
      expect(typeof result).toBe('string')
    })

    it('returns badge classes for emerald', () => {
      const result = getColorClasses('emerald', 'badge')
      expect(result).toContain('emerald')
    })
  })

  describe('card usage', () => {
    it('returns card object for violet', () => {
      const result = getColorClasses('violet', 'card')
      expect(result).toEqual(CARD_COLORS.violet)
      expect(result.bg).toContain('bg-')
      expect(result.text).toContain('text-')
      expect(result.ring).toContain('ring-')
      expect(result.gradient).toContain('gradient')
    })

    it('returns card object for emerald', () => {
      const result = getColorClasses('emerald', 'card')
      expect(result.bg).toContain('emerald')
    })
  })

  describe('status usage', () => {
    it('returns status object for violet', () => {
      const result = getColorClasses('violet', 'status')
      expect(result).toEqual(STATUS_COLORS.violet)
      expect(result.ping).toBeDefined()
      expect(result.solid).toBeDefined()
    })

    it('returns status object for red', () => {
      const result = getColorClasses('red', 'status')
      expect(result.ping).toContain('red')
      expect(result.solid).toContain('red')
    })
  })

  describe('text usage', () => {
    it('returns text class for violet', () => {
      const result = getColorClasses('violet', 'text')
      expect(result).toBe(TEXT_COLORS.violet)
      expect(typeof result).toBe('string')
    })

    it('returns text class for amber', () => {
      const result = getColorClasses('amber', 'text')
      expect(result).toContain('text-amber')
    })
  })

  describe('dot usage', () => {
    it('returns dot class for violet', () => {
      const result = getColorClasses('violet', 'dot')
      expect(result).toBe(DOT_COLORS.violet)
      expect(typeof result).toBe('string')
    })

    it('returns dot class for blue', () => {
      const result = getColorClasses('blue', 'dot')
      expect(result).toContain('bg-blue')
    })
  })
})

describe('getSemanticColor', () => {
  it('returns semantic colors for status', () => {
    expect(getSemanticColor('success')).toBe('emerald')
    expect(getSemanticColor('warning')).toBe('amber')
    expect(getSemanticColor('error')).toBe('red')
    expect(getSemanticColor('info')).toBe('blue')
  })

  it('returns semantic colors for brand', () => {
    expect(getSemanticColor('primary')).toBe('violet')
    expect(getSemanticColor('secondary')).toBe('zinc')
    expect(getSemanticColor('accent')).toBe('fuchsia')
  })

  it('returns semantic colors for domain engines', () => {
    expect(getSemanticColor('manufacturing')).toBe('blue')
    expect(getSemanticColor('environment')).toBe('emerald')
    expect(getSemanticColor('digital')).toBe('violet')
    expect(getSemanticColor('finance')).toBe('indigo')
    expect(getSemanticColor('startup')).toBe('fuchsia')
    expect(getSemanticColor('export')).toBe('amber')
  })
})
