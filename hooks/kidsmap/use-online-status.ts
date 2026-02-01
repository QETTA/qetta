'use client'

/**
 * Online Status Hook
 *
 * 네트워크 상태 감지 및 오프라인 지원
 * 2026 PWA 표준 - 오프라인 우선 UX
 *
 * @module hooks/kidsmap/use-online-status
 */

import { useState, useEffect, useCallback } from 'react'

// ============================================
// Types
// ============================================

export interface OnlineStatus {
  /** 현재 온라인 상태 */
  isOnline: boolean
  /** 오프라인 상태 */
  isOffline: boolean
  /** 마지막 온라인 시간 */
  lastOnlineAt: Date | null
  /** 연결 상태 변경 시간 */
  statusChangedAt: Date | null
  /** 오프라인 지속 시간 (초) */
  offlineDuration: number | null
}

export interface UseOnlineStatusOptions {
  /** 상태 변경 시 콜백 */
  onStatusChange?: (isOnline: boolean) => void
  /** 온라인 복귀 시 콜백 */
  onReconnect?: () => void
  /** 오프라인 전환 시 콜백 */
  onDisconnect?: () => void
}

// ============================================
// Hook Implementation
// ============================================

export function useOnlineStatus(options: UseOnlineStatusOptions = {}): OnlineStatus {
  const { onStatusChange, onReconnect, onDisconnect } = options

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine
    }
    return true // SSR에서는 온라인으로 가정
  })

  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(() => {
    // 초기 상태가 온라인이면 현재 시간으로 설정
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      return new Date()
    }
    return null
  })
  const [statusChangedAt, setStatusChangedAt] = useState<Date | null>(null)
  const [offlineDuration, setOfflineDuration] = useState<number | null>(null)

  // 온라인 전환 핸들러
  const handleOnline = useCallback(() => {
    const now = new Date()
    setIsOnline(true)
    setLastOnlineAt(now)
    setStatusChangedAt(now)

    // 오프라인 지속 시간 계산
    if (statusChangedAt) {
      setOfflineDuration(Math.floor((now.getTime() - statusChangedAt.getTime()) / 1000))
    }

    onStatusChange?.(true)
    onReconnect?.()
  }, [onStatusChange, onReconnect, statusChangedAt])

  // 오프라인 전환 핸들러
  const handleOffline = useCallback(() => {
    const now = new Date()
    setIsOnline(false)
    setStatusChangedAt(now)
    setOfflineDuration(null)

    onStatusChange?.(false)
    onDisconnect?.()
  }, [onStatusChange, onDisconnect])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 이벤트 리스너 등록
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnlineAt,
    statusChangedAt,
    offlineDuration,
  }
}

// ============================================
// Offline Indicator Component Props
// ============================================

export interface OfflineIndicatorProps {
  /** 표시 메시지 */
  message?: string
  /** 재시도 버튼 표시 */
  showRetry?: boolean
  /** 재시도 콜백 */
  onRetry?: () => void
}

export default useOnlineStatus
