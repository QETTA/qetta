/**
 * Color Tokens - Single Source of Truth for color system
 *
 * Consolidates color definitions from:
 * - dashboard-styles.ts (DASHBOARD_BADGE_STYLES)
 * - feature-colors.ts (FEATURE_CARD_COLORS)
 * - GlassBadge.tsx (COLOR_STYLES)
 * - card-styles.ts (STATUS_PING_COLORS)
 * - metrics.ts (ENGINE_PRESETS.color)
 *
 * Pattern: `bg-{color}-500/10 text-{color}-400 ring-1 ring-{color}-500/20`
 *
 * @example
 * import { COLOR_TOKENS, getColorClasses } from '@/constants/color-tokens'
 *
 * // Direct access
 * <span className={COLOR_TOKENS.badge.violet}>Active</span>
 *
 * // Helper function
 * <div className={getColorClasses('emerald', 'badge')}>Success</div>
 */

import type { ColorVariant } from '@/types/common'

// ============================================================================
// Base Color Palette
// ============================================================================

/**
 * 8 color variants used throughout the application
 * This is the canonical list of colors for badges, cards, and indicators.
 */
export const COLORS = [
  'violet',
  'emerald',
  'amber',
  'blue',
  'indigo',
  'fuchsia',
  'red',
  'zinc',
] as const

// Re-export ColorVariant type for convenience
export type { ColorVariant }

// ============================================================================
// Badge Color Tokens
// ============================================================================

/**
 * Glass morphism badge styles
 * Pattern: semi-transparent background + text color + ring
 */
export const BADGE_COLORS: Record<ColorVariant, string> = {
  violet: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  blue: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-400 ring-1 ring-fuchsia-500/20',
  red: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
  zinc: 'bg-zinc-700/50 text-zinc-300 ring-1 ring-white/10',
}

// ============================================================================
// Card Color Tokens
// ============================================================================

/**
 * Feature card color styles
 * Each color includes bg, text, ring, and gradient
 */
export const CARD_COLORS: Record<
  ColorVariant,
  {
    bg: string
    text: string
    ring: string
    gradient: string
  }
> = {
  violet: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    ring: 'ring-violet-500/20',
    gradient: 'bg-gradient-to-r from-transparent via-violet-500 to-transparent',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    ring: 'ring-emerald-500/20',
    gradient: 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    ring: 'ring-amber-500/20',
    gradient: 'bg-gradient-to-r from-transparent via-amber-500 to-transparent',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    ring: 'ring-blue-500/20',
    gradient: 'bg-gradient-to-r from-transparent via-blue-500 to-transparent',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    ring: 'ring-indigo-500/20',
    gradient: 'bg-gradient-to-r from-transparent via-indigo-500 to-transparent',
  },
  fuchsia: {
    bg: 'bg-fuchsia-500/10',
    text: 'text-fuchsia-400',
    ring: 'ring-fuchsia-500/20',
    gradient: 'bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent',
  },
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    ring: 'ring-red-500/20',
    gradient: 'bg-gradient-to-r from-transparent via-red-500 to-transparent',
  },
  zinc: {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    ring: 'ring-zinc-500/20',
    gradient: 'bg-gradient-to-r from-transparent via-zinc-500 to-transparent',
  },
}

// ============================================================================
// Status Indicator Tokens
// ============================================================================

/**
 * Status indicator colors (ping animation + solid dot)
 */
export const STATUS_COLORS: Record<
  ColorVariant,
  {
    ping: string
    solid: string
  }
> = {
  violet: { ping: 'bg-violet-400', solid: 'bg-violet-500' },
  emerald: { ping: 'bg-emerald-400', solid: 'bg-emerald-500' },
  amber: { ping: 'bg-amber-400', solid: 'bg-amber-500' },
  blue: { ping: 'bg-blue-400', solid: 'bg-blue-500' },
  indigo: { ping: 'bg-indigo-400', solid: 'bg-indigo-500' },
  fuchsia: { ping: 'bg-fuchsia-400', solid: 'bg-fuchsia-500' },
  red: { ping: 'bg-red-400', solid: 'bg-red-500' },
  zinc: { ping: 'bg-zinc-400', solid: 'bg-zinc-500' },
}

// ============================================================================
// Text Color Tokens
// ============================================================================

/**
 * Text color classes for values and labels
 */
export const TEXT_COLORS: Record<ColorVariant, string> = {
  violet: 'text-violet-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  indigo: 'text-indigo-400',
  fuchsia: 'text-fuchsia-400',
  red: 'text-red-400',
  zinc: 'text-zinc-400',
}

// ============================================================================
// Dot Indicator Tokens
// ============================================================================

/**
 * Dot indicator background colors
 */
export const DOT_COLORS: Record<ColorVariant, string> = {
  violet: 'bg-violet-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  blue: 'bg-blue-400',
  indigo: 'bg-indigo-400',
  fuchsia: 'bg-fuchsia-400',
  red: 'bg-red-400',
  zinc: 'bg-zinc-400',
}

// ============================================================================
// Semantic Tokens
// ============================================================================

/**
 * Semantic color mapping for common use cases
 */
export const SEMANTIC_COLORS = {
  // Status
  success: 'emerald' as ColorVariant,
  warning: 'amber' as ColorVariant,
  error: 'red' as ColorVariant,
  info: 'blue' as ColorVariant,

  // Brand
  primary: 'violet' as ColorVariant,
  secondary: 'zinc' as ColorVariant,
  accent: 'fuchsia' as ColorVariant,

  // Domain engines
  manufacturing: 'blue' as ColorVariant,
  environment: 'emerald' as ColorVariant,
  digital: 'violet' as ColorVariant,
  finance: 'indigo' as ColorVariant,
  startup: 'fuchsia' as ColorVariant,
  export: 'amber' as ColorVariant,
} as const

// ============================================================================
// Consolidated Tokens Object
// ============================================================================

/**
 * Single access point for all color tokens
 */
export const COLOR_TOKENS = {
  badge: BADGE_COLORS,
  card: CARD_COLORS,
  status: STATUS_COLORS,
  text: TEXT_COLORS,
  dot: DOT_COLORS,
  semantic: SEMANTIC_COLORS,
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get color classes for a specific color and usage
 *
 * @param color - The color variant
 * @param usage - The usage type ('badge' | 'card' | 'text' | 'dot')
 * @returns The appropriate CSS classes
 *
 * @example
 * getColorClasses('emerald', 'badge') // 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
 * getColorClasses('violet', 'text')   // 'text-violet-400'
 */
export function getColorClasses(
  color: ColorVariant,
  usage: 'badge' | 'text' | 'dot'
): string
export function getColorClasses(
  color: ColorVariant,
  usage: 'card'
): { bg: string; text: string; ring: string; gradient: string }
export function getColorClasses(
  color: ColorVariant,
  usage: 'status'
): { ping: string; solid: string }
export function getColorClasses(
  color: ColorVariant,
  usage: 'badge' | 'card' | 'status' | 'text' | 'dot'
) {
  switch (usage) {
    case 'badge':
      return BADGE_COLORS[color]
    case 'card':
      return CARD_COLORS[color]
    case 'status':
      return STATUS_COLORS[color]
    case 'text':
      return TEXT_COLORS[color]
    case 'dot':
      return DOT_COLORS[color]
  }
}

/**
 * Get semantic color for a specific use case
 *
 * @param semantic - The semantic key
 * @returns The color variant
 *
 * @example
 * getSemanticColor('success') // 'emerald'
 * getSemanticColor('manufacturing') // 'blue'
 */
export function getSemanticColor(
  semantic: keyof typeof SEMANTIC_COLORS
): ColorVariant {
  return SEMANTIC_COLORS[semantic]
}
