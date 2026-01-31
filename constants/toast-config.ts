/**
 * Toast notification configuration
 * Centralized constants for consistent toast behavior
 */

export const TOAST_CONFIG = {
  /** Auto-dismiss timeout in milliseconds */
  TIMEOUT: 4000,
  /** Maximum number of toasts visible at once */
  MAX_VISIBLE: 3,
  /** Animation duration for entrance/exit */
  ANIMATION_DURATION: 300,
} as const

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

export const TOAST_COLORS: Record<ToastType, { bg: string; text: string; border: string }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/30',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-500/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-500/30',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/30',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-500/30',
  },
}
