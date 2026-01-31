/**
 * Card Styles - Shared visual constants for landing page components
 *
 * Centralizes frequently repeated card/container styles to reduce duplication.
 *
 * @module constants/card-styles
 */

/**
 * Card container variants
 *
 * Glass morphism style commonly used throughout landing pages.
 */
export const CARD_VARIANTS = {
  /** Standard glass card: semi-transparent with subtle ring */
  glass: 'rounded-lg bg-zinc-900/50 ring-1 ring-white/15',

  /** Interactive glass card with hover state */
  glassHover:
    'rounded-lg bg-zinc-900/50 ring-1 ring-white/15 hover:bg-zinc-900/60 hover:ring-white/20 transition-all',

  /** Solid dark card */
  solid: 'rounded-lg bg-zinc-900 ring-1 ring-white/15',

  /** Gradient accent card (amber/orange) */
  gradientAmber:
    'rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 ring-1 ring-amber-500/20',

  /** Linear-style card: backdrop blur + subtle ring */
  linear: 'rounded-lg bg-zinc-900/30 backdrop-blur-xl ring-1 ring-white/10',

  /** Interactive Linear card with hover glow */
  linearHover:
    'rounded-lg bg-zinc-900/30 backdrop-blur-xl ring-1 ring-white/10 hover:bg-zinc-900/40 hover:ring-white/15 hover:shadow-lg hover:shadow-zinc-500/10 transition-all duration-300',

  /** Linear card with constant glow effect */
  linearGlow:
    'rounded-lg bg-zinc-900/30 backdrop-blur-xl ring-1 ring-white/10 shadow-lg shadow-zinc-500/20',
} as const

/**
 * Card padding presets
 */
export const CARD_PADDINGS = {
  /** None: no padding (use with caution) */
  none: '',

  /** Small: badges, compact items */
  sm: 'px-3 py-2',

  /** Medium: default cards */
  md: 'px-4 py-3',

  /** Large: featured cards */
  lg: 'px-6 py-4',

  /** Extra Large: hero sections, prominent CTAs */
  xl: 'px-8 py-6',
} as const

/**
 * Status ping animation color sets
 *
 * Used for live status indicators (ping + solid dot).
 */
export const STATUS_PING_COLORS = {
  emerald: {
    ping: 'bg-emerald-400',
    solid: 'bg-emerald-500',
  },
  amber: {
    ping: 'bg-amber-400',
    solid: 'bg-amber-500',
  },
  zinc: {
    ping: 'bg-zinc-400',
    solid: 'bg-zinc-300',
  },
  blue: {
    ping: 'bg-blue-400',
    solid: 'bg-blue-500',
  },
  violet: {
    ping: 'bg-violet-400',
    solid: 'bg-violet-500',
  },
} as const

/**
 * Shadow variants for cards and elevated elements
 *
 * Consistent shadow system for visual hierarchy.
 */
export const SHADOW_VARIANTS = {
  /** No shadow */
  none: '',

  /** Subtle shadow for minimal elevation */
  sm: 'shadow-sm shadow-black/10',

  /** Default shadow for cards */
  md: 'shadow-md shadow-black/20',

  /** Prominent shadow for modals, dialogs */
  lg: 'shadow-lg shadow-black/30',

  /** Dramatic shadow for floating elements */
  xl: 'shadow-xl shadow-black/40',

  /** Glow effect for accent elements */
  glow: 'shadow-lg shadow-zinc-500/20',

  /** Emerald glow for success states */
  glowEmerald: 'shadow-lg shadow-emerald-500/20',

  /** Amber glow for warning states */
  glowAmber: 'shadow-lg shadow-amber-500/20',
} as const

export type CardVariant = keyof typeof CARD_VARIANTS
export type CardPadding = keyof typeof CARD_PADDINGS
export type StatusPingColor = keyof typeof STATUS_PING_COLORS
export type ShadowVariant = keyof typeof SHADOW_VARIANTS
