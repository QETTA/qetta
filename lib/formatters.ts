/**
 * Number/Date formatting utilities
 *
 * Centralizes scattered inline implementations across the codebase.
 *
 * @example
 * import { formatNumber, formatCompact, formatBytes, formatDate } from '@/lib/formatters'
 *
 * formatNumber(1234567)     // "1,234,567"
 * formatCompact(1500000)    // "1.5M"
 * formatBytes(2048)         // "2.0 KB"
 * formatDate(new Date())    // "Jan 29, 2026"
 */

const DAY_MS = 24 * 60 * 60 * 1000

/** Format number with Korean locale (1,234,567) */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR')
}

/** Format large numbers (1.2M, 3.5K) */
export function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(num)
}

/** Format bytes (1.5 KB, 2.3 MB) */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

/** Calculate days remaining until deadline */
export function calculateDaysLeft(deadline: Date | string): number {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline
  return Math.ceil((deadlineDate.getTime() - Date.now()) / DAY_MS)
}

/** Add days to today */
export function addDaysToToday(days: number): Date {
  return new Date(Date.now() + days * DAY_MS)
}

/** Format date for display */
export function formatDate(date: Date | string, locale = 'ko-KR'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Format date with time */
export function formatDateTime(date: Date | string, locale = 'ko-KR'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Format relative time (e.g., "2 hours ago") */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / DAY_MS)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  return formatDate(dateObj)
}

/** Format percentage with optional decimal places */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/** Format currency (KRW) */
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format currency (USD) */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
