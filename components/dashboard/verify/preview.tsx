'use client'

/**
 * QettaVerifyPreview Component
 *
 * Document verification preview with QR scan and result display.
 * Refactored to use extracted hooks and components.
 *
 * @module components/dashboard/verify/preview
 */

import { useVerifyPreviewData } from './hooks/use-verify-preview-data'
import { VerifyPreviewQRScan } from './verify-preview-qr-scan'
import { VerifyPreviewResult } from './verify-preview-result'

// =============================================================================
// Types
// =============================================================================

interface QettaVerifyPreviewProps {
  /** 검증할 문서 ID (없으면 데모 모드) */
  documentId?: string
  /** 자동 새로고침 간격 (ms, 0이면 비활성화) */
  refreshInterval?: number
}

// =============================================================================
// Sub-components
// =============================================================================

interface HeaderBarProps {
  isLoading: boolean
  error: string | null
}

function HeaderBar({ isLoading, error }: HeaderBarProps) {
  return (
    <div className="h-[40px] bg-zinc-800 flex items-center px-3 sm:px-4 gap-2 border-b border-white/10">
      {/* Qetta VERIFY Icon */}
      <div className="w-[28px] h-[28px] flex items-center justify-center flex-shrink-0">
        <svg
          className="w-[20px] h-[20px] text-emerald-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <span className="text-white text-[14px] font-semibold">Qetta.VERIFY</span>
      <span className="text-zinc-500 text-[12px] ml-1 hidden sm:inline">
        Verification Portal
      </span>

      <div className="flex-1" />

      {/* Status indicator */}
      <StatusIndicator isLoading={isLoading} error={error} />
    </div>
  )
}

interface StatusIndicatorProps {
  isLoading: boolean
  error: string | null
}

function StatusIndicator({ isLoading, error }: StatusIndicatorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-zinc-300 text-[11px]">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <span className="text-zinc-300 text-[11px]">Offline</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-zinc-300 text-[11px]">Online</span>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function QettaVerifyPreview({
  documentId = 'demo-001',
  refreshInterval = 0,
}: QettaVerifyPreviewProps) {
  const {
    documentInfo,
    sensorData,
    isLoading,
    error,
    confidence,
    scanState,
    showParticles,
  } = useVerifyPreviewData({ documentId, refreshInterval })

  return (
    <div className="rounded-lg bg-zinc-900 shadow-2xl overflow-hidden flex flex-col max-h-[580px] lg:h-[580px] ring-1 ring-white/10 transition-shadow hover:shadow-3xl">
      {/* Header Bar */}
      <HeaderBar isLoading={isLoading} error={error} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: QR Scan Area */}
        <VerifyPreviewQRScan scanState={scanState} showParticles={showParticles} />

        {/* Right: Verification Result */}
        <VerifyPreviewResult
          documentInfo={documentInfo}
          sensorData={sensorData}
          confidence={confidence}
        />
      </div>
    </div>
  )
}

export default QettaVerifyPreview
