/**
 * Brand Colors Tests
 *
 * QETTA 브랜드 색상 시스템 테스트
 * - 색상 상수
 * - 유틸리티 함수
 * - 타입 검증
 */

import { describe, it, expect } from 'vitest'
import {
  QETTA_COLORS,
  DARK_THEME,
  DOMAIN_COLORS,
  COMPONENT_STYLES,
  getDomainColors,
  cn,
} from '../brand-colors'

describe('QETTA_COLORS', () => {
  it('has primary brand colors', () => {
    expect(QETTA_COLORS.primary.DEFAULT).toBe('#8b5cf6')
    expect(QETTA_COLORS.primary.light).toBe('#a78bfa')
    expect(QETTA_COLORS.primary.dark).toBe('#7c3aed')
    expect(QETTA_COLORS.primary.subtle).toContain('rgba')
    expect(QETTA_COLORS.primary.ring).toContain('rgba')
  })

  it('has neutral scale', () => {
    expect(QETTA_COLORS.neutral[50]).toBe('#fafafa')
    expect(QETTA_COLORS.neutral[950]).toBe('#09090b')
    expect(QETTA_COLORS.neutral[850]).toBeDefined()
  })

  it('has semantic colors', () => {
    expect(QETTA_COLORS.success).toBe('#10b981')
    expect(QETTA_COLORS.warning).toBe('#f59e0b')
    expect(QETTA_COLORS.error).toBe('#ef4444')
    expect(QETTA_COLORS.info).toBe('#3b82f6')
  })
})

describe('DARK_THEME', () => {
  it('has background tokens', () => {
    expect(DARK_THEME.bg.page).toContain('bg-zinc')
    expect(DARK_THEME.bg.card).toContain('bg-zinc')
    expect(DARK_THEME.bg.input).toContain('bg-zinc')
  })

  it('has text tokens', () => {
    expect(DARK_THEME.text.primary).toContain('text-')
    expect(DARK_THEME.text.secondary).toContain('text-')
    expect(DARK_THEME.text.tertiary).toContain('text-')
    expect(DARK_THEME.text.disabled).toContain('text-')
    expect(DARK_THEME.text.accent).toContain('text-')
  })

  it('has border tokens', () => {
    expect(DARK_THEME.border.default).toContain('border-')
    expect(DARK_THEME.border.subtle).toContain('border-')
    expect(DARK_THEME.border.strong).toContain('border-')
  })

  it('has accent styles', () => {
    expect(DARK_THEME.accent.bg).toContain('bg-')
    expect(DARK_THEME.accent.text).toContain('text-')
    expect(DARK_THEME.accent.button).toContain('bg-')
  })
})

describe('DOMAIN_COLORS', () => {
  const domains = ['MANUFACTURING', 'ENVIRONMENT', 'DIGITAL', 'EXPORT', 'FINANCE', 'STARTUP'] as const

  domains.forEach((domain) => {
    it(`has ${domain} domain colors`, () => {
      expect(DOMAIN_COLORS[domain]).toBeDefined()
      expect(DOMAIN_COLORS[domain].bg).toBeDefined()
      expect(DOMAIN_COLORS[domain].text).toBeDefined()
      expect(DOMAIN_COLORS[domain].ring).toBeDefined()
      expect(DOMAIN_COLORS[domain].badge).toBeDefined()
      expect(DOMAIN_COLORS[domain].dot).toBeDefined()
      expect(DOMAIN_COLORS[domain].name).toBe(domain)
    })
  })

  it('has labels and icons', () => {
    expect(DOMAIN_COLORS.MANUFACTURING.label).toBe('제조/스마트공장')
    expect(DOMAIN_COLORS.MANUFACTURING.icon).toBe('⚙️')
    expect(DOMAIN_COLORS.ENVIRONMENT.label).toBe('환경/TMS')
    expect(DOMAIN_COLORS.DIGITAL.label).toBe('AI/SW')
  })
})

describe('COMPONENT_STYLES', () => {
  it('has card styles', () => {
    expect(COMPONENT_STYLES.card).toBeDefined()
    expect(COMPONENT_STYLES.card.default).toContain('rounded')
    expect(COMPONENT_STYLES.card.interactive).toContain('hover')
    expect(COMPONENT_STYLES.card.selected).toContain('ring')
  })

  it('has button styles', () => {
    expect(COMPONENT_STYLES.button).toBeDefined()
    expect(COMPONENT_STYLES.button.primary).toContain('bg-')
    expect(COMPONENT_STYLES.button.secondary).toContain('bg-')
    expect(COMPONENT_STYLES.button.ghost).toContain('hover')
    expect(COMPONENT_STYLES.button.icon).toContain('p-')
  })

  it('has input styles', () => {
    expect(COMPONENT_STYLES.input).toBeDefined()
    expect(COMPONENT_STYLES.input.default).toContain('bg-')
    expect(COMPONENT_STYLES.input.textarea).toContain('resize-none')
  })

  it('has badge styles', () => {
    expect(COMPONENT_STYLES.badge).toBeDefined()
    expect(COMPONENT_STYLES.badge.default).toContain('bg-')
    expect(COMPONENT_STYLES.badge.success).toContain('bg-')
    expect(COMPONENT_STYLES.badge.accent).toContain('violet')
    expect(COMPONENT_STYLES.badge.warning).toContain('amber')
    expect(COMPONENT_STYLES.badge.error).toContain('red')
  })

  it('has message bubble styles', () => {
    expect(COMPONENT_STYLES.message).toBeDefined()
    expect(COMPONENT_STYLES.message.user).toContain('bg-')
    expect(COMPONENT_STYLES.message.assistant).toContain('bg-')
  })

  it('has navigation styles', () => {
    expect(COMPONENT_STYLES.nav).toBeDefined()
    expect(COMPONENT_STYLES.nav.item).toContain('hover')
    expect(COMPONENT_STYLES.nav.itemActive).toContain('bg-')
  })

  it('has panel styles', () => {
    expect(COMPONENT_STYLES.panel).toBeDefined()
    expect(COMPONENT_STYLES.panel.sidebar).toContain('bg-')
    expect(COMPONENT_STYLES.panel.main).toContain('bg-')
    expect(COMPONENT_STYLES.panel.right).toContain('border-')
  })
})

describe('getDomainColors', () => {
  it('returns colors for MANUFACTURING domain', () => {
    const colors = getDomainColors('MANUFACTURING')
    expect(colors).toBe(DOMAIN_COLORS.MANUFACTURING)
    expect(colors.bg).toBeDefined()
    expect(colors.text).toBeDefined()
    expect(colors.ring).toBeDefined()
  })

  it('returns colors for ENVIRONMENT domain', () => {
    const colors = getDomainColors('ENVIRONMENT')
    expect(colors).toBe(DOMAIN_COLORS.ENVIRONMENT)
    expect(colors.color).toBe('emerald')
  })

  it('returns colors for DIGITAL domain', () => {
    const colors = getDomainColors('DIGITAL')
    expect(colors).toBe(DOMAIN_COLORS.DIGITAL)
    expect(colors.color).toBe('violet')
  })

  it('returns colors for EXPORT domain', () => {
    const colors = getDomainColors('EXPORT')
    expect(colors).toBe(DOMAIN_COLORS.EXPORT)
    expect(colors.color).toBe('amber')
  })

  it('returns colors for FINANCE domain', () => {
    const colors = getDomainColors('FINANCE')
    expect(colors).toBe(DOMAIN_COLORS.FINANCE)
    expect(colors.color).toBe('indigo')
  })

  it('returns colors for STARTUP domain', () => {
    const colors = getDomainColors('STARTUP')
    expect(colors).toBe(DOMAIN_COLORS.STARTUP)
    expect(colors.color).toBe('fuchsia')
  })
})

describe('cn utility', () => {
  it('combines class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('filters out falsy values', () => {
    expect(cn('class1', undefined, 'class2')).toBe('class1 class2')
    expect(cn('class1', null, 'class2')).toBe('class1 class2')
    expect(cn('class1', false, 'class2')).toBe('class1 class2')
    expect(cn('class1', '', 'class2')).toBe('class1 class2')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
    expect(cn(undefined)).toBe('')
    expect(cn(null)).toBe('')
    expect(cn(false)).toBe('')
  })

  it('handles single class', () => {
    expect(cn('single')).toBe('single')
  })

  it('handles all falsy values', () => {
    expect(cn(undefined, null, false, '')).toBe('')
  })
})
