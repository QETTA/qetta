'use client'

/**
 * Verify QR Modal Component
 *
 * Modal displaying QR code for document verification.
 *
 * @module components/dashboard/verify/verify-qr-modal
 */

import type { HashVerification } from './verify-constants'

// =============================================================================
// Types
// =============================================================================

export interface VerifyQRModalProps {
  isOpen: boolean
  onClose: () => void
  item: HashVerification | null
}

// =============================================================================
// Component
// =============================================================================

export function VerifyQRModal({ isOpen, onClose, item }: VerifyQRModalProps) {
  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl p-6 w-80 ring-1 ring-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-white">QR Verification Code</h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-white rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>
        <div className="w-48 h-48 mx-auto bg-white rounded-xl mb-4 flex items-center justify-center">
          <div className="text-6xl">📱</div>
        </div>
        <p className="text-xs text-zinc-400 text-center mb-4">
          Scan this QR code to verify document integrity
        </p>
        <div className="p-3 bg-zinc-800 rounded-lg">
          <code className="text-[10px] text-emerald-400 font-mono break-all">
            {item.hash.slice(0, 32)}...
          </code>
        </div>
      </div>
    </div>
  )
}

export default VerifyQRModal
