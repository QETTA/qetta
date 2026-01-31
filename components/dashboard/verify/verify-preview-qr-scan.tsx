'use client'

/**
 * Verify Preview QR Scan Component
 *
 * QR code scan area with animation effects.
 *
 * @module components/dashboard/verify/verify-preview-qr-scan
 */

import { type ScanState, QR_PATTERN, isQRCornerPattern } from './verify-preview-constants'

// =============================================================================
// Types
// =============================================================================

export interface VerifyPreviewQRScanProps {
  scanState: ScanState
  showParticles: boolean
}

// =============================================================================
// Sub-components
// =============================================================================

function PulsingRings({ scanState }: { scanState: ScanState }) {
  if (scanState !== 'scanning' && scanState !== 'verified') return null

  const borderColor =
    scanState === 'verified' ? 'border-emerald-400' : 'border-white/40'
  const innerBorderColor =
    scanState === 'verified' ? 'border-emerald-300' : 'border-white/30'

  return (
    <>
      <div
        className={`absolute inset-0 -m-3 rounded-xl border-2 ${borderColor} animate-ping opacity-30`}
      />
      <div
        className={`absolute inset-0 -m-1.5 rounded-lg border ${innerBorderColor} animate-pulse-ring`}
      />
    </>
  )
}

function SuccessParticles({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {[...Array(8)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute top-1/2 left-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-particle"
          style={
            {
              '--angle': `${i * 45}deg`,
              animationDelay: `${i * 50}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

function QRPattern({ scanState }: { scanState: ScanState }) {
  return (
    <div
      className={`grid grid-cols-7 gap-[3px] p-3 transition-all duration-500 ${
        scanState === 'verified' ? 'scale-90 opacity-80' : 'group-hover:scale-95'
      }`}
    >
      {[...Array(49)].map((_, i) => {
        const isCorner = isQRCornerPattern(i)
        const isFilled = QR_PATTERN[i] === 1

        return (
          <div
            key={`qr-${i}`}
            className={`w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] rounded-sm transition-colors duration-300 ${
              scanState === 'verified'
                ? isCorner
                  ? 'bg-emerald-500'
                  : isFilled
                    ? 'bg-emerald-400'
                    : 'bg-emerald-900/30'
                : isCorner
                  ? 'bg-zinc-300'
                  : isFilled
                    ? 'bg-zinc-400'
                    : 'bg-zinc-700'
            }`}
          />
        )
      })}
    </div>
  )
}

function VerifiedOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg animate-scale-in">
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
            className="animate-check-draw"
            style={{ strokeDasharray: 30, strokeDashoffset: 0 }}
          />
        </svg>
      </div>
    </div>
  )
}

function ScanAnimation() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-x-0 h-[4px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scan shadow-[0_0_15px_rgba(16,185,129,0.7)]" />
    </div>
  )
}

function CornerMarkers({ scanState }: { scanState: ScanState }) {
  const borderColor =
    scanState === 'verified' ? 'border-emerald-500' : 'border-emerald-500/50'

  return (
    <>
      <div className={`absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 transition-colors ${borderColor}`} />
      <div className={`absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 transition-colors ${borderColor}`} />
      <div className={`absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 transition-colors ${borderColor}`} />
      <div className={`absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 transition-colors ${borderColor}`} />
    </>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function VerifyPreviewQRScan({
  scanState,
  showParticles,
}: VerifyPreviewQRScanProps) {
  const containerClasses = `w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] bg-zinc-800 rounded-lg shadow-lg border-2 flex items-center justify-center relative overflow-hidden transition-all duration-500 group ${
    scanState === 'verified'
      ? 'border-emerald-400 shadow-emerald-500/20 shadow-xl scale-105'
      : scanState === 'scanning'
        ? 'border-white/40 shadow-white/10'
        : 'border-zinc-700 hover:shadow-xl hover:border-emerald-400'
  }`

  return (
    <div className="lg:w-[40%] p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col items-center justify-center bg-zinc-800/30">
      <div className="text-[12px] text-zinc-400 mb-3">
        Scan the document QR code
      </div>

      {/* QR Code Visual with Enhanced Animation */}
      <div className="relative">
        <PulsingRings scanState={scanState} />
        <SuccessParticles show={showParticles} />

        <div className={containerClasses}>
          <QRPattern scanState={scanState} />
          {scanState === 'verified' && <VerifiedOverlay />}
          {scanState === 'scanning' && <ScanAnimation />}
          <CornerMarkers scanState={scanState} />
        </div>
      </div>

      {/* Scan instruction */}
      <div className="mt-4 flex items-center gap-2 text-[11px] text-zinc-500">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 4v1m6 11h2m-6 0a2 2 0 100-4m0 4a2 2 0 110-4m0 4v1m0-5V9m-6 2H4m16 0a8 8 0 11-16 0 8 8 0 0116 0z" />
        </svg>
        <span>Scan with camera or upload file</span>
      </div>
    </div>
  )
}

export default VerifyPreviewQRScan
