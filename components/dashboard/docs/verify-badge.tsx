'use client'

/**
 * Verify Badge - Hash chain verification badge visualization
 *
 * CSS-based animation (replaces framer-motion)
 * Clearly visualizes 4 verification states (verified/warning/invalid/pending)
 *
 * @module dashboard/docs/verify-badge
 */

import { useState, useCallback, useEffect } from 'react'
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/solid'
import { clsx } from 'clsx'

// 4 verification states
type VerificationStatus = 'verified' | 'warning' | 'invalid' | 'pending'

interface HashVerificationResult {
  isValid: boolean
  chainIntegrity?: boolean
  hash?: string
  previousHash?: string | null
  message?: string
}

interface VerifyBadgeProps {
  /** Hash chain verification result */
  result?: HashVerificationResult | null
  /** Whether verification is in progress */
  isVerifying?: boolean
  /** Hash chain ID (for verification API call) */
  hashChainId?: string
  /** Hash value */
  hash?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show detailed information */
  showDetails?: boolean
  className?: string
}

const STATUS_CONFIG: Record<
  VerificationStatus,
  {
    icon: typeof ShieldCheckIcon
    label: string
    sublabel: string
    bgColor: string
    textColor: string
    iconColor: string
    ringColor: string
  }
> = {
  verified: {
    icon: ShieldCheckIcon,
    label: 'Hash chain verified',
    sublabel: 'Document integrity confirmed',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    iconColor: 'text-emerald-500',
    ringColor: 'ring-emerald-500/30',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    label: 'Document valid, chain mismatch',
    sublabel: 'Disconnected from previous version',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    iconColor: 'text-amber-500',
    ringColor: 'ring-amber-500/30',
  },
  invalid: {
    icon: XCircleIcon,
    label: 'Tampering detected',
    sublabel: 'Hash mismatch with original',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    iconColor: 'text-red-500',
    ringColor: 'ring-red-500/30',
  },
  pending: {
    icon: ClockIcon,
    label: 'Verifying...',
    sublabel: 'Computing SHA-256 hash',
    bgColor: 'bg-zinc-500/10',
    textColor: 'text-zinc-400',
    iconColor: 'text-zinc-500',
    ringColor: 'ring-zinc-500/30',
  },
}

const SIZE_CONFIG = {
  sm: { container: 'px-2 py-1', icon: 'h-4 w-4', text: 'text-xs' },
  md: { container: 'px-3 py-2', icon: 'h-5 w-5', text: 'text-sm' },
  lg: { container: 'px-4 py-3', icon: 'h-6 w-6', text: 'text-base' },
}

export function VerifyBadge({
  result,
  isVerifying = false,
  hashChainId,
  hash,
  size = 'md',
  showDetails = false,
  className = '',
}: VerifyBadgeProps) {
  const [checking, setChecking] = useState(false)
  const [verificationResult, setVerificationResult] = useState<HashVerificationResult | null>(
    result || null
  )
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 상태 결정
  const getStatus = useCallback((): VerificationStatus => {
    if (isVerifying || checking) return 'pending'
    if (!verificationResult) return 'pending'
    if (verificationResult.isValid && verificationResult.chainIntegrity !== false)
      return 'verified'
    if (verificationResult.isValid && verificationResult.chainIntegrity === false)
      return 'warning'
    return 'invalid'
  }, [isVerifying, checking, verificationResult])

  // API 호출로 검증
  const handleVerify = async () => {
    if (!hashChainId) return
    setChecking(true)
    try {
      const res = await fetch('/api/verify/chain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: hashChainId }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setVerificationResult({
          isValid: json.data.verification.isValid,
          chainIntegrity: json.data.verification.chainIntegrity,
          hash: json.data.verification.hash,
          previousHash: json.data.verification.previousHash,
          message: json.data.verification.message,
        })
      }
    } catch {
      setVerificationResult({ isValid: false, message: 'Verification failed' })
    } finally {
      setChecking(false)
    }
  }

  const status = getStatus()
  const config = STATUS_CONFIG[status]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  const displayHash = hash || verificationResult?.hash
  const truncatedHash = displayHash
    ? `${displayHash.slice(0, 8)}...${displayHash.slice(-8)}`
    : null

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg',
        'transition-all duration-300',
        isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        config.bgColor,
        sizeConfig.container,
        'ring-1',
        config.ringColor,
        className
      )}
    >
      {/* Icon - CSS pulse animation (pending state) */}
      <div className={status === 'pending' ? 'animate-pulse' : ''}>
        <Icon className={clsx(sizeConfig.icon, config.iconColor)} />
      </div>

      {/* Label */}
      <div>
        <span className={clsx('font-medium', config.textColor, sizeConfig.text)}>
          {config.label}
        </span>

        {showDetails && (
          <p className={clsx(config.textColor, 'opacity-70', sizeConfig.text)}>
            {verificationResult?.message || config.sublabel}
          </p>
        )}
      </div>

      {/* Detailed info (lg size + showDetails) */}
      {showDetails && verificationResult && size === 'lg' && (
        <div className="ml-4 border-l border-white/10 pl-4">
          <div className="text-xs text-zinc-500">
            {truncatedHash && <p>Hash: {truncatedHash}</p>}
            {verificationResult.previousHash && (
              <p>
                Previous: {verificationResult.previousHash.slice(0, 8)}...
                {verificationResult.previousHash.slice(-8)}
              </p>
            )}
            <p>Verified at: {new Date().toLocaleTimeString('en-US')}</p>
          </div>
        </div>
      )}

      {/* Re-verify button (when hashChainId exists and not yet verified) */}
      {hashChainId && status !== 'verified' && status !== 'pending' && (
        <button
          type="button"
          onClick={handleVerify}
          disabled={checking}
          className={clsx(
            'ml-2 rounded px-2 py-0.5 text-xs font-medium',
            'bg-zinc-700 text-white hover:bg-zinc-600',
            'transition-colors duration-150',
            'disabled:opacity-50'
          )}
        >
          Re-verify
        </button>
      )}
    </div>
  )
}

// Expiry badge
interface ExpiryBadgeProps {
  expiresAt?: string | Date | null
  className?: string
}

export function ExpiryBadge({ expiresAt, className = '' }: ExpiryBadgeProps) {
  if (!expiresAt) return null

  const expiry = new Date(expiresAt)
  const now = new Date()
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft <= 0) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 rounded',
          'bg-red-500/20 px-2 py-0.5 text-xs text-red-400',
          'ring-1 ring-red-500/30',
          className
        )}
      >
        Expired
      </span>
    )
  }

  if (daysLeft <= 3) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 rounded animate-pulse',
          'bg-gradient-to-r from-red-500/20 to-orange-500/20',
          'px-2 py-0.5 text-xs text-orange-400',
          'ring-1 ring-orange-500/30',
          className
        )}
      >
        D-{daysLeft}
      </span>
    )
  }

  if (daysLeft <= 7) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 rounded',
          'bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400',
          'ring-1 ring-amber-500/30',
          className
        )}
      >
        D-{daysLeft}
      </span>
    )
  }

  return null
}

// Named export for backwards compatibility
export default VerifyBadge
