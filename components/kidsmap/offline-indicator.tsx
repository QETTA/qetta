'use client'

/**
 * Offline Indicator Component
 *
 * 네트워크 상태 표시 배너
 * 오프라인 시 사용자에게 명확한 피드백 제공
 *
 * @module components/kidsmap/offline-indicator
 */

import { useOnlineStatus } from '@/hooks/kidsmap/use-online-status'
import { useEffect, useState } from 'react'

// ============================================
// Props
// ============================================

interface OfflineIndicatorProps {
  /** 오프라인 메시지 */
  offlineMessage?: string
  /** 재연결 메시지 */
  reconnectMessage?: string
  /** 재시도 버튼 표시 */
  showRetry?: boolean
  /** 재시도 콜백 */
  onRetry?: () => void
  /** 자동 숨김 딜레이 (ms) - 재연결 후 */
  autoHideDelay?: number
}

// ============================================
// Component
// ============================================

export function OfflineIndicator({
  offlineMessage = '인터넷 연결이 끊어졌습니다',
  reconnectMessage = '다시 연결되었습니다',
  showRetry = true,
  onRetry,
  autoHideDelay = 3000,
}: OfflineIndicatorProps) {
  const [showReconnected, setShowReconnected] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  const { isOnline, isOffline } = useOnlineStatus({
    onReconnect: () => {
      if (wasOffline) {
        setShowReconnected(true)
      }
    },
    onDisconnect: () => {
      setWasOffline(true)
      setShowReconnected(false)
    },
  })

  // 재연결 메시지 자동 숨김
  useEffect(() => {
    if (showReconnected) {
      const timer = setTimeout(() => {
        setShowReconnected(false)
      }, autoHideDelay)
      return () => clearTimeout(timer)
    }
  }, [showReconnected, autoHideDelay])

  // 아무것도 표시하지 않을 때
  if (isOnline && !showReconnected) {
    return null
  }

  return (
    <div
      className={`fixed top-0 inset-x-0 z-[100] transition-all duration-300 ${
        isOffline ? 'translate-y-0' : showReconnected ? 'translate-y-0' : '-translate-y-full'
      }`}
      role="alert"
      aria-live="polite"
    >
      {/* Safe Area 고려 */}
      <div
        className={`pt-[env(safe-area-inset-top)] ${
          isOffline
            ? 'bg-red-500 dark:bg-red-600'
            : 'bg-green-500 dark:bg-green-600'
        }`}
      >
        <div className="flex items-center justify-center gap-3 px-4 py-2.5">
          {/* 아이콘 */}
          {isOffline ? (
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}

          {/* 메시지 */}
          <span className="text-sm font-medium text-white">
            {isOffline ? offlineMessage : reconnectMessage}
          </span>

          {/* 재시도 버튼 */}
          {isOffline && showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="ml-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/30 transition-colors min-h-[32px]"
            >
              재시도
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfflineIndicator
