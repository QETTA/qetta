/**
 * Verify Constants
 *
 * Shared types, styles, and constants for the verify components.
 *
 * @module components/dashboard/verify/verify-constants
 */

// =============================================================================
// Types
// =============================================================================

export type VerificationStatus = 'verified' | 'pending' | 'failed' | 'checking'

export interface HashVerification {
  id: string
  documentName: string
  documentType: 'docx' | 'xlsx' | 'pdf' | 'hwp'
  hash: string
  previousHash: string | null
  timestamp: string
  status: VerificationStatus
  verifiedBy?: string
  sensorData?: {
    source: string
    readings: number
    period: string
  }
}

export interface StatusStyle {
  bg: string
  text: string
  ring: string
  label: string
}

export interface DocTypeIcon {
  icon: string
  color: string
}

// =============================================================================
// Status Styles
// =============================================================================

export const STATUS_STYLES: Record<VerificationStatus, StatusStyle> = {
  verified: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    ring: 'ring-emerald-500/20',
    label: '검증 완료',
  },
  pending: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    ring: 'ring-amber-500/20',
    label: '대기 중',
  },
  failed: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    ring: 'ring-red-500/20',
    label: '검증 실패',
  },
  checking: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    ring: 'ring-blue-500/20',
    label: '검증 중',
  },
}

// =============================================================================
// Document Type Icons
// =============================================================================

export const DOC_TYPE_ICONS: Record<string, DocTypeIcon> = {
  docx: { icon: '📄', color: 'text-blue-400' },
  xlsx: { icon: '📊', color: 'text-emerald-400' },
  pdf: { icon: '📕', color: 'text-red-400' },
  hwp: { icon: '📃', color: 'text-cyan-400' },
}

// =============================================================================
// Utility Functions
// =============================================================================

export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatHash(hash: string): string {
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`
}
