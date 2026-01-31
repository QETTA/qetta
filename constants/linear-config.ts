/**
 * Linear-Style Design System Configuration
 *
 * Gradient colors, positions, and animation settings for Linear App-style components.
 */

export const GRADIENT_COLORS = {
  zinc: 'bg-gradient-to-br from-zinc-500/30 via-zinc-600/20 to-zinc-700/10',
  emerald: 'bg-gradient-to-br from-emerald-400/30 via-teal-500/20 to-cyan-600/10',
  blue: 'bg-gradient-to-br from-blue-400/30 via-cyan-500/20 to-sky-600/10',
  fuchsia: 'bg-gradient-to-br from-fuchsia-400/30 via-pink-500/20 to-rose-600/10',
  amber: 'bg-gradient-to-br from-amber-400/30 via-orange-500/20 to-yellow-600/10',
} as const

export const ORB_SIZES = {
  sm: 'w-64 h-64',
  md: 'w-96 h-96',
  lg: 'w-[32rem] h-[32rem]',
  xl: 'w-[48rem] h-[48rem]',
} as const

export const ORB_POSITIONS = {
  'top-left': '-top-32 -left-32',
  'top-right': '-top-32 -right-32',
  'bottom-left': '-bottom-32 -left-32',
  'bottom-right': '-bottom-32 -right-32',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
} as const

export type GradientColor = keyof typeof GRADIENT_COLORS
export type OrbSize = keyof typeof ORB_SIZES
export type OrbPosition = keyof typeof ORB_POSITIONS

/**
 * Page-specific gradient color mappings
 */
export const PAGE_GRADIENT_MAP = {
  home: 'zinc',
  features: 'zinc',
  'how-it-works': 'emerald',
  product: 'blue',
  'solutions-companies': 'emerald',
  'solutions-partners': 'fuchsia',
  auth: 'zinc',
  settings: 'zinc',
} as const
