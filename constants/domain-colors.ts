/**
 * Domain Engine Colors
 *
 * Re-exports from lib/design/brand-colors.ts for convenient access
 * Single Source of Truth: lib/design/brand-colors.ts
 *
 * @example
 * import { DOMAIN_COLORS, getDomainColors } from '@/constants/domain-colors'
 */

export {
  DOMAIN_COLORS,
  getDomainColors,
  type DomainColorKey,
} from '@/lib/design/brand-colors'

/**
 * Domain Options for UI selectors (e.g., editor.tsx)
 * Uses DOMAIN_COLORS as source for color classes
 */
export const DOMAIN_OPTIONS = [
  {
    value: 'ENVIRONMENT' as const,
    label: 'TMS (환경부)',
    activeClass: 'bg-emerald-500/10 ring-2 ring-emerald-500/50 text-emerald-400',
    inactiveClass: 'bg-zinc-800/50 ring-1 ring-white/10 text-zinc-300 hover:bg-zinc-800 hover:ring-white/20',
  },
  {
    value: 'MANUFACTURING' as const,
    label: '스마트공장',
    activeClass: 'bg-blue-500/10 ring-2 ring-blue-500/50 text-blue-400',
    inactiveClass: 'bg-zinc-800/50 ring-1 ring-white/10 text-zinc-300 hover:bg-zinc-800 hover:ring-white/20',
  },
  {
    value: 'DIGITAL' as const,
    label: 'AI 바우처',
    activeClass: 'bg-violet-500/10 ring-2 ring-violet-500/50 text-violet-400',
    inactiveClass: 'bg-zinc-800/50 ring-1 ring-white/10 text-zinc-300 hover:bg-zinc-800 hover:ring-white/20',
  },
  {
    value: 'FINANCE' as const,
    label: '융자/보증',
    activeClass: 'bg-indigo-500/10 ring-2 ring-indigo-500/50 text-indigo-400',
    inactiveClass: 'bg-zinc-800/50 ring-1 ring-white/10 text-zinc-300 hover:bg-zinc-800 hover:ring-white/20',
  },
  {
    value: 'STARTUP' as const,
    label: '창업지원',
    activeClass: 'bg-fuchsia-500/10 ring-2 ring-fuchsia-500/50 text-fuchsia-400',
    inactiveClass: 'bg-zinc-800/50 ring-1 ring-white/10 text-zinc-300 hover:bg-zinc-800 hover:ring-white/20',
  },
  {
    value: 'EXPORT' as const,
    label: '해외입찰',
    activeClass: 'bg-amber-500/10 ring-2 ring-amber-500/50 text-amber-400',
    inactiveClass: 'bg-zinc-800/50 ring-1 ring-white/10 text-zinc-300 hover:bg-zinc-800 hover:ring-white/20',
  },
] as const

export type DomainOptionValue = (typeof DOMAIN_OPTIONS)[number]['value']

/**
 * View Mode Styles for editor status bar
 * All classes are static strings for Tailwind analysis
 */
export const VIEW_MODE_STYLES = {
  generate: 'bg-violet-500/10 text-violet-400',
  preview: 'bg-cyan-500/10 text-cyan-400',
  hancomdocs: 'bg-emerald-500/10 text-emerald-400',
  edit: 'bg-amber-500/10 text-amber-400',
  view: 'bg-blue-500/10 text-blue-400',
} as const

export type ViewModeStyleKey = keyof typeof VIEW_MODE_STYLES

/**
 * Domain Engine Gradient Colors (v4.0)
 * For metric blocks, cards, and editor components (Catalyst Dark)
 */
export const DOMAIN_GRADIENT_COLORS = {
  MANUFACTURING: {
    bgGradient: 'from-blue-500/20 to-blue-500/5',
    accentColor: 'text-blue-400',
    ringColor: 'ring-blue-500/30',
  },
  ENVIRONMENT: {
    bgGradient: 'from-emerald-500/20 to-emerald-500/5',
    accentColor: 'text-emerald-400',
    ringColor: 'ring-emerald-500/30',
  },
  DIGITAL: {
    bgGradient: 'from-violet-500/20 to-violet-500/5',
    accentColor: 'text-violet-400',
    ringColor: 'ring-violet-500/30',
  },
  FINANCE: {
    bgGradient: 'from-indigo-500/20 to-indigo-500/5',
    accentColor: 'text-indigo-400',
    ringColor: 'ring-indigo-500/30',
  },
  STARTUP: {
    bgGradient: 'from-fuchsia-500/20 to-fuchsia-500/5',
    accentColor: 'text-fuchsia-400',
    ringColor: 'ring-fuchsia-500/30',
  },
  EXPORT: {
    bgGradient: 'from-amber-500/20 to-amber-500/5',
    accentColor: 'text-amber-400',
    ringColor: 'ring-amber-500/30',
  },
} as const

export type DomainGradientKey = keyof typeof DOMAIN_GRADIENT_COLORS

/**
 * Industry BLOCK Colors (v4.0)
 * Re-exports from lib/super-model for convenient access
 */
export { INDUSTRY_BLOCK_COLORS, ENGINE_PRESET_COLORS } from '@/lib/super-model'
