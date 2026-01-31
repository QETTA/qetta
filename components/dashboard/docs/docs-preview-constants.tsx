/**
 * Docs Preview Constants and Utilities
 *
 * Shared constants, styles, and utility functions for the docs preview component.
 *
 * @module components/dashboard/docs/docs-preview-constants
 */

import type { ReactNode } from 'react'

// =============================================================================
// Types
// =============================================================================

export interface StatusStyle {
  badge: string
  icon: string
  row: string
}

export interface TabData {
  name: string
  count: number
  verified: boolean
  active: boolean
}

export interface LanguageOption {
  code: string
  name: string
  active: boolean
}

export interface DownloadFormat {
  format: string
  icon: string
  color: string
}

export interface DataRow {
  row: string[]
  hash: string
  verified: boolean
}

// =============================================================================
// Status Styles (Catalyst Dark theme)
// =============================================================================

export const STATUS_STYLES: Record<string, StatusStyle> = {
  Normal: {
    badge: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
    icon: '✓',
    row: 'border-l-2 border-l-emerald-500',
  },
  Warning: {
    badge: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
    icon: '⚠',
    row: 'border-l-2 border-l-amber-500',
  },
  Danger: {
    badge: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
    icon: '✕',
    row: 'border-l-2 border-l-red-500 bg-red-500/5',
  },
  Logged: {
    badge: 'bg-zinc-500/10 text-zinc-400 ring-1 ring-white/10',
    icon: '◆',
    row: '',
  },
  Complete: {
    badge: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
    icon: '✓',
    row: '',
  },
}

// =============================================================================
// Sensor Icons
// =============================================================================

export const SENSOR_ICONS: Record<string, ReactNode> = {
  'Water Temp': (
    <svg
      className="w-4 h-4 text-blue-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M14 4v10.54a4 4 0 11-4 0V4a2 2 0 014 0z" />
    </svg>
  ),
  pH: (
    <svg
      className="w-4 h-4 text-cyan-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 2v6m0 0a4 4 0 100 8 4 4 0 000-8zm0 14v4" />
    </svg>
  ),
  DO: (
    <svg
      className="w-4 h-4 text-sky-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" />
    </svg>
  ),
  Flow: (
    <svg
      className="w-4 h-4 text-blue-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </svg>
  ),
  COD: (
    <svg
      className="w-4 h-4 text-purple-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9h2m-2 6h2m12-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  SS: (
    <svg
      className="w-4 h-4 text-orange-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Verify: (
    <svg
      className="w-4 h-4 text-emerald-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
}

// =============================================================================
// Default Data
// =============================================================================

export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export const DEFAULT_TAB_DATA: TabData[] = [
  { name: 'TMS Daily Report', count: 7, verified: true, active: true },
  { name: 'Sensor Raw', count: 7, verified: false, active: false },
  { name: 'Hash Chain', count: 3, verified: true, active: false },
]

export const LANGUAGES: LanguageOption[] = [
  { code: 'ko', name: '한국어', active: true },
  { code: 'en', name: 'English', active: false },
  { code: 'ru', name: 'Русский', active: false },
  { code: 'kk', name: 'Қазақ', active: false },
  { code: 'zh', name: '中文', active: false },
  { code: 'ar', name: 'العربية', active: false },
]

export const DOWNLOAD_FORMATS: DownloadFormat[] = [
  {
    format: 'DOCX',
    icon: '📄',
    color: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
  },
  {
    format: 'PDF',
    icon: '📕',
    color: 'bg-red-500/10 text-red-400 hover:bg-red-500/20',
  },
  {
    format: 'XLSX',
    icon: '📊',
    color: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
  },
]

export const DEFAULT_DATA: DataRow[] = [
  {
    row: ['Item', 'Value', 'Threshold', 'Unit', 'Status', 'Sensor ID', 'Time', 'Hash'],
    hash: '',
    verified: false,
  },
  {
    row: ['Water Temp', '18.5', '≤25', '°C', 'Normal', 'OTT-T100-01', '09:00', '8d24f7a3'],
    hash: '8d24f7a3',
    verified: true,
  },
  {
    row: ['pH', '7.2', '6.0~8.5', '-', 'Normal', 'OTT-T200-01', '09:00', 'a7ff92b1'],
    hash: 'a7ff92b1',
    verified: true,
  },
  {
    row: ['DO', '8.4', '≥5.0', 'mg/L', 'Normal', 'OTT-T200-02', '09:00', '97b2c4d8'],
    hash: '97b2c4d8',
    verified: true,
  },
  {
    row: ['Flow', '124.5', '-', 'L/min', 'Logged', 'OTT-F100-01', '09:00', 'c3e1a9f2'],
    hash: 'c3e1a9f2',
    verified: true,
  },
  {
    row: ['COD', '42.3', '≤90', 'mg/L', 'Normal', 'OTT-T200-03', '09:00', 'f8d47e2c'],
    hash: 'f8d47e2c',
    verified: true,
  },
  {
    row: ['SS', '28.7', '≤80', 'mg/L', 'Normal', 'OTT-T200-04', '09:00', '2b91d5a7'],
    hash: '2b91d5a7',
    verified: true,
  },
  { row: ['', '', '', '', '', '', '', ''], hash: '', verified: false },
  {
    row: ['Verify', '6/6 items passed', '', '', 'Complete', '', '09:05', '7f3a2b91'],
    hash: '7f3a2b91',
    verified: true,
  },
]

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get gauge color based on percentage
 */
export function getGaugeColor(pct: number): string {
  if (pct <= 60) return 'bg-emerald-500'
  if (pct <= 85) return 'bg-amber-500'
  return 'bg-red-500'
}

/**
 * Calculate percentage for gauge (based on threshold)
 */
export function calculatePercentage(
  value: string,
  threshold: string
): number | null {
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return null

  // Handle ≤ thresholds (e.g., ≤25)
  if (threshold.startsWith('≤')) {
    const max = parseFloat(threshold.slice(1))
    if (!isNaN(max)) return Math.min(100, Math.round((numValue / max) * 100))
  }

  // Handle ≥ thresholds (e.g., ≥5.0)
  if (threshold.startsWith('≥')) {
    const min = parseFloat(threshold.slice(1))
    if (!isNaN(min))
      return Math.min(100, Math.round((numValue / (min * 2)) * 100))
  }

  // Handle range thresholds (e.g., 6.0~8.5)
  if (threshold.includes('~')) {
    const [minStr, maxStr] = threshold.split('~')
    const min = parseFloat(minStr)
    const max = parseFloat(maxStr)
    if (!isNaN(min) && !isNaN(max)) {
      const mid = (min + max) / 2
      const range = max - min
      const deviation = Math.abs(numValue - mid)
      return Math.max(0, Math.min(100, Math.round((1 - deviation / range) * 100)))
    }
  }

  return null
}

/**
 * Calculate verification counts from data
 */
export function calculateVerificationCounts(data: DataRow[]): {
  verifiedCount: number
  totalCount: number
} {
  const verifiedCount = data.filter((d) => d.verified).length - 1 // Exclude header
  const totalCount = data.filter(
    (d) => d.row[0] && d.row[0] !== 'Verify' && d.row[0] !== 'Item'
  ).length
  return { verifiedCount, totalCount }
}
