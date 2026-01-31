// lib/design-tokens.ts
// QETTA Design System Tokens (Linear-inspired)

/**
 * Line type constants for code diff component
 * Uses const assertion for type safety
 */
export const LINE_TYPES = {
  ADDED: 'added',
  REMOVED: 'removed',
  CONTEXT: 'context',
  COMMENT: 'comment',
} as const

export type LineType = (typeof LINE_TYPES)[keyof typeof LINE_TYPES]

/**
 * Design tokens matching CSS variables in globals.css
 * Use these for TypeScript type safety and documentation
 */
export const designTokens = {
  colors: {
    background: {
      DEFAULT: '#08090A',
      secondary: '#0D0E10',
      elevated: '#141517',
      hover: '#1A1D21',
      active: '#22252A',
    },
    foreground: {
      DEFAULT: '#E6EDF3',
      secondary: '#8A8F98',
      muted: '#484F58',
      disabled: '#343941',
    },
    border: {
      DEFAULT: 'rgba(255, 255, 255, 0.08)',
      subtle: 'rgba(255, 255, 255, 0.05)',
      medium: 'rgba(255, 255, 255, 0.12)',
      strong: 'rgba(255, 255, 255, 0.20)',
    },
    brand: {
      DEFAULT: '#7C3AED',
      light: '#A78BFA',
      dark: '#5B21B6',
    },
    diff: {
      red: '#F85149',
      redBg: 'rgba(248, 81, 73, 0.15)',
      green: '#3FB950',
      greenBg: 'rgba(63, 185, 80, 0.15)',
      commentBefore: '#F97583',
      commentAfter: '#85E89D',
    },
    // Semantic colors (v3.1)
    success: { DEFAULT: '#3FB950', bg: 'rgba(63, 185, 80, 0.15)' },
    error: { DEFAULT: '#F85149', bg: 'rgba(248, 81, 73, 0.15)' },
    warning: { DEFAULT: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
    info: { DEFAULT: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  },
  typography: {
    hero: { size: '90px', lineHeight: '0.95', letterSpacing: '-0.03em' },
    heroSm: { size: '56px', lineHeight: '1', letterSpacing: '-0.02em' },
    display: { size: '32px', lineHeight: '1.2', letterSpacing: '-0.01em' },
  },
  spacing: {
    navbarHeight: '56px',
    sectionPadding: '80px',
    containerMaxWidth: '1200px',
  },
  animation: {
    stagger: '0.05s',
    duration: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.6s',
    },
  },
} as const

/**
 * Semantic tokens for component-level design decisions
 * Maps to CSS variables defined in globals.css
 */
export const semanticTokens = {
  button: {
    primary: {
      bg: '#1F2023',
      bgHover: '#292B2F',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.12)',
    },
  },
} as const

export type DesignTokens = typeof designTokens

/**
 * Helper to get CSS variable value
 */
export function getCSSVar(name: string): string {
  return `var(--${name})`
}
