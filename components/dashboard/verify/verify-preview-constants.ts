/**
 * Verify Preview Constants
 *
 * Types, styles, and fallback data for the verify preview component.
 *
 * @module components/dashboard/verify/verify-preview-constants
 */

// =============================================================================
// Types
// =============================================================================

export interface SensorReading {
  id: string
  type: string
  value: string
  time: string
  location: string
  dataHash?: string
}

export interface DocumentInfo {
  id: string
  name: string
  hash: string
  created: string
  issuer: string
  status: 'verified' | 'pending' | 'failed'
  fileSize?: string
  documentType?: string
}

export interface VerifyApiResponse {
  success: boolean
  data?: {
    document: DocumentInfo
    sensorData: SensorReading[]
    verificationResult: {
      isValid: boolean
      verifiedAt: string
      verifier: string
      confidence: number
    }
  }
  error?: {
    code: string
    message: string
  }
}

export type ScanState = 'idle' | 'scanning' | 'verified'

export interface VerifyStatusStyle {
  badge: string
  icon: string
  text: string
}

// =============================================================================
// Status Styles (Catalyst Dark theme)
// =============================================================================

export const VERIFY_STATUS_STYLES: Record<string, VerifyStatusStyle> = {
  verified: {
    badge: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
    icon: '✓',
    text: '검증 완료',
  },
  pending: {
    badge: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
    icon: '⏳',
    text: '검증 중',
  },
  failed: {
    badge: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
    icon: '✕',
    text: '검증 실패',
  },
}

// =============================================================================
// Fallback Data
// =============================================================================

export const FALLBACK_DOCUMENT_INFO: DocumentInfo = {
  id: 'demo-001',
  name: 'TMS-2026-01-20-001.pdf',
  hash: 'a3f7e2b1c9d8f4a5e6b7c8d9e0f1a2b3c4d5e6f7',
  created: '2026-01-20 14:32:15',
  issuer: 'QETTA Cert Authority',
  status: 'verified',
}

export const FALLBACK_SENSOR_DATA: SensorReading[] = [
  {
    id: 'OTT-T100-01',
    type: '수온',
    value: '18.5°C',
    time: '14:30:00',
    location: '수처리 A-1',
  },
  {
    id: 'OTT-T200-01',
    type: 'pH',
    value: '7.2',
    time: '14:30:00',
    location: '수처리 A-2',
  },
  {
    id: 'OTT-T200-02',
    type: 'DO',
    value: '8.4 mg/L',
    time: '14:30:00',
    location: '수처리 A-3',
  },
  {
    id: 'OTT-F100-01',
    type: '유량',
    value: '124.5 L/min',
    time: '14:30:00',
    location: '방류구 B-1',
  },
]

// =============================================================================
// QR Pattern Data (deterministic for React purity)
// =============================================================================

export const QR_PATTERN: number[] = [
  1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1,
  0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
]

/**
 * Check if a cell index is part of the QR code corner finder pattern
 */
export function isQRCornerPattern(index: number): boolean {
  const isCorner =
    (index < 7 || index >= 42 || index % 7 === 0 || index % 7 === 6) &&
    ((index < 21 && (index < 7 || index % 7 < 3)) ||
      (index < 21 && index % 7 > 3) ||
      (index >= 42 && index % 7 < 3))
  return isCorner
}
