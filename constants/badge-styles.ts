/**
 * Shared badge styles for QETTA dashboard components
 * Dark-mode only design with opacity-based patterns (Linear.app style)
 */

// Domain Engine badge styles (6 Engine Presets)
export const DOMAIN_BADGE_STYLES = {
  manufacturing: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  environment: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  digital: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
  finance: 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20',
  startup: 'bg-fuchsia-500/10 text-fuchsia-400 ring-1 ring-fuchsia-500/20',
  export: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
} as const

// Status badge styles (dark mode only)
export const STATUS_BADGE_STYLES = {
  success: 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30',
  error: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30',
  info: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30',
  neutral: 'bg-white/10 text-zinc-400 ring-1 ring-white/10',
} as const

// Korean status labels mapping
export const STATUS_LABEL_STYLES = {
  정상: { badge: STATUS_BADGE_STYLES.success, icon: '✓' },
  주의: { badge: STATUS_BADGE_STYLES.warning, icon: '⚠' },
  위험: { badge: STATUS_BADGE_STYLES.error, icon: '✕' },
  기록: { badge: STATUS_BADGE_STYLES.neutral, icon: '◆' },
  완료: { badge: STATUS_BADGE_STYLES.success, icon: '✓' },
  작성중: { badge: STATUS_BADGE_STYLES.info, icon: '✎' },
  검토: { badge: STATUS_BADGE_STYLES.warning, icon: '⏳' },
  검증완료: { badge: STATUS_BADGE_STYLES.success, icon: '✓' },
  검증중: { badge: STATUS_BADGE_STYLES.info, icon: '⏳' },
  대기: { badge: STATUS_BADGE_STYLES.neutral, icon: '◯' },
  자격충족: { badge: STATUS_BADGE_STYLES.success, icon: '✓' },
  검토중: { badge: STATUS_BADGE_STYLES.warning, icon: '⏳' },
} as const

// Verification status styles (document verification)
export const VERIFICATION_BADGE_STYLES = {
  verified: {
    badge: STATUS_BADGE_STYLES.success,
    icon: '✓',
    text: '검증 완료',
  },
  pending: {
    badge: STATUS_BADGE_STYLES.warning,
    icon: '⏳',
    text: '검증 중',
  },
  failed: {
    badge: STATUS_BADGE_STYLES.error,
    icon: '✕',
    text: '검증 실패',
  },
} as const

// Qualification status styles (tender eligibility)
export const QUALIFICATION_BADGE_STYLES = {
  qualified: { badge: STATUS_BADGE_STYLES.success, icon: '✓' },
  pending: { badge: STATUS_BADGE_STYLES.warning, icon: '⏳' },
  notQualified: { badge: STATUS_BADGE_STYLES.error, icon: '✕' },
  new: { badge: STATUS_BADGE_STYLES.info, icon: '★' },
} as const

// Common card container styles (dark mode only)
export const CARD_STYLES = {
  container: 'rounded-lg bg-zinc-950 shadow-2xl shadow-black/20 overflow-hidden ring-1 ring-white/10 transition-shadow hover:shadow-3xl',
  border: 'border border-white/10',
  borderHover: 'hover:border-white/20',
} as const

// Common text color styles (dark mode only)
export const TEXT_STYLES = {
  primary: 'text-white',
  secondary: 'text-zinc-400',
  muted: 'text-zinc-500',
  label: 'text-zinc-500',
} as const

// Match score colors for tender matching
export const MATCH_SCORE_STYLES = {
  high: 'bg-emerald-500/20 text-emerald-400', // 90%+
  medium: 'bg-amber-500/20 text-amber-400',   // 70-89%
  low: 'bg-red-500/20 text-red-400',          // <70%
} as const

/**
 * Get status badge classes by Korean label
 * @example getStatusBadge('완료') // returns { badge: '...', icon: '✓' }
 */
export function getStatusBadge(status: keyof typeof STATUS_LABEL_STYLES) {
  return STATUS_LABEL_STYLES[status] ?? { badge: STATUS_BADGE_STYLES.neutral, icon: '?' }
}

/**
 * Get domain badge class by engine preset
 * @example getDomainBadge('manufacturing') // returns 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20'
 */
export function getDomainBadge(domain: keyof typeof DOMAIN_BADGE_STYLES) {
  return DOMAIN_BADGE_STYLES[domain] ?? DOMAIN_BADGE_STYLES.manufacturing
}
