'use client'

/**
 * Verify Detail Panel Component
 *
 * Displays detailed information about a selected verification.
 *
 * @module components/dashboard/verify/verify-detail-panel
 */

import {
  STATUS_STYLES,
  DOC_TYPE_ICONS,
  formatDate,
  type HashVerification,
} from './verify-constants'

// =============================================================================
// Types
// =============================================================================

export interface VerifyDetailPanelProps {
  selectedItem: HashVerification | null
  onShowQR: () => void
}

// =============================================================================
// Component
// =============================================================================

export function VerifyDetailPanel({
  selectedItem,
  onShowQR,
}: VerifyDetailPanelProps) {
  if (!selectedItem) {
    return <EmptyDetailState />
  }

  return (
    <>
      {/* Document Info */}
      <DocumentInfo item={selectedItem} onShowQR={onShowQR} />

      {/* Hash Chain */}
      <HashChainInfo item={selectedItem} />

      {/* Sensor Data Source */}
      {selectedItem.sensorData && (
        <SensorDataInfo sensorData={selectedItem.sensorData} />
      )}

      {/* Verification Info */}
      <VerificationInfo item={selectedItem} />
    </>
  )
}

// =============================================================================
// EmptyDetailState Component
// =============================================================================

function EmptyDetailState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
          <svg
            className="w-8 h-8 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <p className="text-zinc-400">Select a verification item</p>
        <p className="text-xs text-zinc-500 mt-1">
          View hash chain details
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// DocumentInfo Component
// =============================================================================

interface DocumentInfoProps {
  item: HashVerification
  onShowQR: () => void
}

function DocumentInfo({ item, onShowQR }: DocumentInfoProps) {
  const statusStyle = STATUS_STYLES[item.status]
  const docIcon = DOC_TYPE_ICONS[item.documentType]

  return (
    <div className="p-4 border-b border-white/10">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl">
          {docIcon.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium text-white mb-1">
            {item.documentName}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${statusStyle.bg} ${statusStyle.text}`}
            >
              {statusStyle.label}
            </span>
            <span className="text-xs text-zinc-500">{item.id}</span>
          </div>
        </div>
        <button
          onClick={onShowQR}
          className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          QR Verify
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// HashChainInfo Component
// =============================================================================

interface HashChainInfoProps {
  item: HashVerification
}

function HashChainInfo({ item }: HashChainInfoProps) {
  return (
    <div className="p-4 border-b border-white/5">
      <h4 className="text-xs font-medium text-zinc-400 mb-3">Hash Chain Info</h4>
      <div className="space-y-3">
        <div className="p-3 bg-zinc-800/50 rounded-lg ring-1 ring-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-zinc-500">Current Hash</span>
            <button className="text-[10px] text-zinc-400 hover:text-white">
              Copy
            </button>
          </div>
          <code className="text-xs text-emerald-400 font-mono break-all">
            {item.hash}
          </code>
        </div>

        {item.previousHash && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/10" />
            <svg
              className="w-4 h-4 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 11l5-5m0 0l5 5m-5-5v12"
              />
            </svg>
            <span className="text-[10px] text-zinc-500">Previous Block Link</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        )}

        {item.previousHash && (
          <div className="p-3 bg-zinc-800/30 rounded-lg ring-1 ring-white/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-zinc-500">Previous Hash</span>
            </div>
            <code className="text-xs text-zinc-500 font-mono break-all">
              {item.previousHash}
            </code>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// SensorDataInfo Component
// =============================================================================

interface SensorDataInfoProps {
  sensorData: NonNullable<HashVerification['sensorData']>
}

function SensorDataInfo({ sensorData }: SensorDataInfoProps) {
  return (
    <div className="p-4 border-b border-white/5">
      <h4 className="text-xs font-medium text-zinc-400 mb-3">
        Source Data Info
      </h4>
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-zinc-800/50 rounded-lg ring-1 ring-white/5">
          <div className="text-[10px] text-zinc-500 mb-1">Sensor Source</div>
          <div className="text-sm text-white font-mono">{sensorData.source}</div>
        </div>
        <div className="p-3 bg-zinc-800/50 rounded-lg ring-1 ring-white/5">
          <div className="text-[10px] text-zinc-500 mb-1">Readings</div>
          <div className="text-sm text-white">
            {sensorData.readings.toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-zinc-800/50 rounded-lg ring-1 ring-white/5">
          <div className="text-[10px] text-zinc-500 mb-1">Period</div>
          <div className="text-sm text-white">{sensorData.period}</div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// VerificationInfo Component
// =============================================================================

interface VerificationInfoProps {
  item: HashVerification
}

function VerificationInfo({ item }: VerificationInfoProps) {
  return (
    <div className="p-4">
      <h4 className="text-xs font-medium text-zinc-400 mb-3">Verification Info</h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <span className="text-xs text-zinc-500">Verified At</span>
          <span className="text-xs text-white">{formatDate(item.timestamp)}</span>
        </div>
        {item.verifiedBy && (
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-xs text-zinc-500">Verified By</span>
            <span className="text-xs text-emerald-400">{item.verifiedBy}</span>
          </div>
        )}
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-zinc-500">Algorithm</span>
          <span className="text-xs text-white">SHA-256</span>
        </div>
      </div>
    </div>
  )
}

export default VerifyDetailPanel
