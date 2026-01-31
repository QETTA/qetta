'use client'

/**
 * QettaVerifyContent Component
 *
 * Main content area for the verify page.
 * Split into sub-components for better maintainability.
 *
 * @module components/dashboard/verify/content
 */

import { useState, useCallback } from 'react'
import { QettaVerifyFileUpload } from './file-upload'
import { DISPLAY_METRICS } from '@/constants/metrics'
import { useVerifyData } from './hooks/use-verify-data'
import { VerifyTimeline } from './verify-timeline'
import { VerifyDetailPanel } from './verify-detail-panel'
import { VerifyQRModal } from './verify-qr-modal'

// =============================================================================
// Types
// =============================================================================

interface QettaVerifyContentProps {
  selectedVerificationId?: string | null
}

// =============================================================================
// Component
// =============================================================================

export function QettaVerifyContent({
  selectedVerificationId,
}: QettaVerifyContentProps) {
  // Data state
  const {
    verifications,
    chainIntegrity,
    isLoading,
    error,
    verifiedCount,
    refetch,
    selectedItem,
    setSelectedItem,
  } = useVerifyData(selectedVerificationId)

  // UI state
  const [showQRModal, setShowQRModal] = useState(false)
  const [showUploadPanel, setShowUploadPanel] = useState(false)

  // Handle verification complete
  const handleVerificationComplete = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <div className="flex flex-col h-full" data-testid="verify-content">
      {/* Header */}
      <VerifyHeader
        chainIntegrity={chainIntegrity}
        verifiedCount={verifiedCount}
        totalCount={verifications.length}
        showUploadPanel={showUploadPanel}
        onToggleUpload={() => setShowUploadPanel(!showUploadPanel)}
      />

      {/* Upload Panel */}
      {showUploadPanel && (
        <div className="px-4 py-4 border-b border-white/10 bg-zinc-800/50">
          <QettaVerifyFileUpload
            onVerificationComplete={handleVerificationComplete}
            className="max-w-xl mx-auto"
          />
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Timeline List */}
        <VerifyTimeline
          verifications={verifications}
          isLoading={isLoading}
          error={error}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
          onRetry={refetch}
          onShowUpload={() => setShowUploadPanel(true)}
        />

        {/* Detail Panel */}
        <div className="flex-1 flex flex-col overflow-auto">
          <VerifyDetailPanel
            selectedItem={selectedItem}
            onShowQR={() => setShowQRModal(true)}
          />
        </div>
      </div>

      {/* Footer */}
      <VerifyFooter />

      {/* QR Modal */}
      <VerifyQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        item={selectedItem}
      />
    </div>
  )
}

// =============================================================================
// VerifyHeader Component
// =============================================================================

interface VerifyHeaderProps {
  chainIntegrity: boolean
  verifiedCount: number
  totalCount: number
  showUploadPanel: boolean
  onToggleUpload: () => void
}

function VerifyHeader({
  chainIntegrity,
  verifiedCount,
  totalCount,
  showUploadPanel,
  onToggleUpload,
}: VerifyHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-white/10 bg-zinc-900">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-white">QETTA VERIFY</h2>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 rounded-full ring-1 ring-emerald-500/20">
            SHA-256 Hash Chain
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Chain integrity status */}
          <span
            className={`px-2 py-0.5 text-[10px] font-medium rounded-full ring-1 ${
              chainIntegrity
                ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                : 'bg-red-500/10 text-red-400 ring-red-500/20'
            }`}
          >
            {chainIntegrity ? 'Chain OK' : 'Chain Error'}
          </span>
          <span className="text-xs text-zinc-500">
            {verifiedCount}/{totalCount} verified
          </span>
          <button
            onClick={onToggleUpload}
            className="px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            {showUploadPanel ? 'Close' : 'Verify File'}
          </button>
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        All documents are verified for integrity via SHA-256 hash chain.
        QR code enables traceability to source data.
      </p>
    </div>
  )
}

// =============================================================================
// VerifyFooter Component
// =============================================================================

function VerifyFooter() {
  return (
    <div className="px-4 py-3 border-t border-white/10 bg-zinc-900/50">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            SHA-256 Hash Chain Protection
          </div>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-500">
            API Uptime{' '}
            <span className="text-white">{DISPLAY_METRICS.apiUptime.value}</span>
          </span>
        </div>
        <span className="text-zinc-500">SHA-256 Hash Chain Integrity Verification</span>
      </div>
    </div>
  )
}

export default QettaVerifyContent
