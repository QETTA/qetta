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
      DEFAULT: '#52525B', // zinc-600 (NO purple!)
      light: '#71717A', // zinc-500
      dark: '#3F3F46', // zinc-700
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

// ============================================
// Tailwind Class-based Tokens
// ============================================

/**
 * Tailwind class tokens for consistent component styling
 * IMPORTANT: Do NOT use violet, purple, or fuchsia (CLAUDE.md rule)
 */
export const tw = {
  // Background classes
  bg: {
    primary: 'bg-zinc-950',
    secondary: 'bg-zinc-900',
    card: 'bg-zinc-900/50',
    cardSubtle: 'bg-zinc-900/30',
    input: 'bg-zinc-900/50',
    hover: 'bg-zinc-800',
  },

  // Text classes
  text: {
    primary: 'text-white',
    secondary: 'text-zinc-300',
    muted: 'text-zinc-400',
    placeholder: 'text-zinc-500',
  },

  // Border classes
  border: {
    default: 'border-zinc-800',
    subtle: 'border-zinc-800/50',
    focus: 'ring-white/20',
    hover: 'border-zinc-700',
  },

  // Status classes
  status: {
    success: 'text-emerald-400',
    successBg: 'bg-emerald-500/10',
    error: 'text-red-400',
    errorBg: 'bg-red-500/10',
    warning: 'text-amber-400',
    warningBg: 'bg-amber-500/10',
    info: 'text-blue-400',
    infoBg: 'bg-blue-500/10',
  },

  // Feature colors (QETTA product tabs)
  feature: {
    docs: 'bg-emerald-500',
    verify: 'bg-blue-500',
    apply: 'bg-amber-500',
    monitor: 'bg-zinc-500', // NOT purple!
  },
} as const

/**
 * Button variant classes
 */
export const buttonVariants = {
  primary: 'bg-white text-zinc-900 hover:bg-zinc-100',
  secondary: 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700',
  ghost: 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  outline: 'border border-zinc-700 text-white hover:bg-zinc-800/50 hover:border-zinc-600',
} as const

/**
 * Button size classes
 */
export const buttonSizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
  xl: 'h-12 px-6 text-base',
} as const

/**
 * Input style classes
 */
export const inputStyles = {
  base: 'bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-500 transition-all',
  focus: 'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-700',
  error: 'border-red-500/50 focus:ring-red-500/30',
  disabled: 'opacity-50 cursor-not-allowed',
} as const

/**
 * Card variant classes
 */
export const cardVariants = {
  default: 'bg-zinc-900/50 border border-zinc-800 rounded-xl',
  subtle: 'bg-zinc-900/30 border border-zinc-800/50 rounded-lg',
  interactive: 'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer rounded-xl',
  glass: 'bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl',
} as const

/**
 * Focus ring utility
 */
export const focusRing = 'focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-zinc-950'

/**
 * Compose button classes
 */
export function composeButton(
  variant: keyof typeof buttonVariants = 'primary',
  size: keyof typeof buttonSizes = 'md'
): string {
  return [
    buttonVariants[variant],
    buttonSizes[size],
    'rounded-lg font-medium transition-all',
    focusRing,
  ].join(' ')
}

/**
 * Compose input classes
 */
export function composeInput(variant?: 'error' | 'disabled'): string {
  const classes: string[] = [inputStyles.base, inputStyles.focus]
  if (variant === 'error') classes.push(inputStyles.error)
  if (variant === 'disabled') classes.push(inputStyles.disabled)
  return classes.join(' ')
}
