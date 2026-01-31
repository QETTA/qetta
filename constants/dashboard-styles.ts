/**
 * Dashboard Badge & Card Styles
 *
 * Re-exports from centralized color-tokens for backward compatibility.
 *
 * @see constants/color-tokens.ts for the Single Source of Truth
 *
 * @example
 * import { DASHBOARD_BADGE_STYLES, DASHBOARD_CARD_VARIANTS } from '@/constants/dashboard-styles'
 *
 * <span className={DASHBOARD_BADGE_STYLES.violet}>Active</span>
 * <div className={DASHBOARD_CARD_VARIANTS.default}>Card content</div>
 */

import { BADGE_COLORS } from './color-tokens'
import type { ColorVariant } from '@/types/common'

// Re-export BADGE_COLORS as DASHBOARD_BADGE_STYLES for backward compatibility
export const DASHBOARD_BADGE_STYLES = BADGE_COLORS

// Re-export type for backward compatibility
export type DashboardBadgeColor = ColorVariant

export const DASHBOARD_CARD_VARIANTS = {
  /** Default card with subtle background */
  default: 'rounded-lg bg-zinc-800/50 p-4 ring-1 ring-white/10',
  /** Subtle variant for nested cards */
  subtle: 'rounded-md bg-zinc-900/50 p-3 ring-1 ring-white/5',
  /** Accent variant for highlighted content */
  accent: 'rounded-lg bg-violet-500/10 p-4 ring-1 ring-violet-500/20',
  /** Glass effect with blur */
  glass: 'rounded-lg bg-zinc-900/50 backdrop-blur-sm p-4 ring-1 ring-white/10',
  /** Interactive card with hover states */
  interactive:
    'rounded-lg bg-zinc-800/50 p-4 ring-1 ring-white/10 transition-all hover:bg-zinc-800/60 hover:ring-white/20',
} as const

export type DashboardCardVariant = keyof typeof DASHBOARD_CARD_VARIANTS

/** Status indicator colors for pings and dots */
export const DASHBOARD_STATUS_COLORS = {
  active: { ping: 'bg-emerald-400', solid: 'bg-emerald-500' },
  warning: { ping: 'bg-amber-400', solid: 'bg-amber-500' },
  error: { ping: 'bg-red-400', solid: 'bg-red-500' },
  info: { ping: 'bg-violet-400', solid: 'bg-violet-500' },
  neutral: { ping: 'bg-zinc-400', solid: 'bg-zinc-500' },
} as const

export type DashboardStatusType = keyof typeof DASHBOARD_STATUS_COLORS
