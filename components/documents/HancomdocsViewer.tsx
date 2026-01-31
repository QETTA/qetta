/**
 * 한컴독스 웹 뷰어 컴포넌트
 *
 * iframe 기반으로 한컴독스 문서를 표시합니다.
 * PostMessage를 통해 뷰어 이벤트를 수신합니다.
 *
 * @see lib/hancomdocs/types.ts (HancomViewerEvent)
 * @see lib/hancomdocs/client.ts (generateViewerUrl)
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { HancomViewerEvent, HancomViewerEventType } from '@/lib/hancomdocs/types'

// ============================================
// Types
// ============================================

export interface HancomdocsViewerProps {
  /** 뷰어 URL (generateViewerUrl에서 생성) */
  viewerUrl: string
  /** 문서 ID */
  documentId: string
  /** 뷰어 모드 */
  mode?: 'view' | 'edit' | 'comment'
  /** 최소 높이 (기본: 600px) */
  minHeight?: number
  /** 클래스명 */
  className?: string
  /** 로딩 완료 콜백 */
  onLoad?: () => void
  /** 에러 콜백 */
  onError?: (error: Error) => void
  /** 저장 콜백 (edit 모드) */
  onSave?: (data: { documentId: string }) => void
  /** 페이지 변경 콜백 */
  onPageChange?: (page: number, totalPages: number) => void
  /** 뷰어 닫기 콜백 */
  onClose?: () => void
}

interface ViewerState {
  isLoading: boolean
  error: string | null
  currentPage: number
  totalPages: number
}

// ============================================
// Constants
// ============================================

const HANCOM_ORIGIN = 'https://docs.hancomdocs.com'
const LOAD_TIMEOUT_MS = 30000 // 30초

// ============================================
// Component
// ============================================

export function HancomdocsViewer({
  viewerUrl,
  documentId,
  mode = 'view',
  minHeight = 600,
  className,
  onLoad,
  onError,
  onSave,
  onPageChange,
  onClose,
}: HancomdocsViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [state, setState] = useState<ViewerState>({
    isLoading: true,
    error: null,
    currentPage: 1,
    totalPages: 1,
  })

  // ============================================
  // Event Handlers
  // ============================================

  const handleViewerEvent = useCallback(
    (event: HancomViewerEvent) => {
      const handlers: Partial<Record<HancomViewerEventType, () => void>> = {
        ready: () => {
          setState(prev => ({ ...prev, isLoading: false }))
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current)
            loadTimeoutRef.current = null
          }
          onLoad?.()
        },
        loaded: () => {
          setState(prev => ({ ...prev, isLoading: false }))
        },
        error: () => {
          const errorMessage = (event.data?.message as string) || 'Unknown viewer error'
          setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
          onError?.(new Error(errorMessage))
        },
        save: () => {
          onSave?.({ documentId: event.documentId })
        },
        close: () => {
          onClose?.()
        },
        pageChange: () => {
          const page = (event.data?.page as number) || 1
          const total = (event.data?.totalPages as number) || 1
          setState(prev => ({ ...prev, currentPage: page, totalPages: total }))
          onPageChange?.(page, total)
        },
      }

      handlers[event.type]?.()
    },
    [onLoad, onError, onSave, onClose, onPageChange]
  )

  // ============================================
  // PostMessage Listener
  // ============================================

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 출처 검증
      if (!event.origin.includes('hancomdocs.com')) {
        return
      }

      // 한컴독스 이벤트 형식 검증
      if (!event.data || typeof event.data !== 'object') {
        return
      }

      const { type, documentId: eventDocId, data, timestamp } = event.data

      // documentId 일치 확인
      if (eventDocId && eventDocId !== documentId) {
        return
      }

      const viewerEvent: HancomViewerEvent = {
        type: type as HancomViewerEventType,
        documentId: eventDocId || documentId,
        data,
        timestamp: timestamp || Date.now(),
      }

      handleViewerEvent(viewerEvent)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [documentId, handleViewerEvent])

  // ============================================
  // Load Timeout
  // ============================================

  useEffect(() => {
    loadTimeoutRef.current = setTimeout(() => {
      if (state.isLoading) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: '문서 로딩 시간이 초과되었습니다. 다시 시도해주세요.',
        }))
        onError?.(new Error('Document load timeout'))
      }
    }, LOAD_TIMEOUT_MS)

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [viewerUrl, state.isLoading, onError])

  // ============================================
  // iframe Load Handler
  // ============================================

  const handleIframeLoad = useCallback(() => {
    // PostMessage ready 이벤트를 기다리지만, 일정 시간 후 로딩 완료로 처리
    setTimeout(() => {
      if (state.isLoading) {
        setState(prev => ({ ...prev, isLoading: false }))
        onLoad?.()
      }
    }, 2000)
  }, [state.isLoading, onLoad])

  // ============================================
  // Render
  // ============================================

  if (state.error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200',
          className
        )}
        style={{ minHeight }}
      >
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-gray-700 font-medium mb-2">문서를 불러올 수 없습니다</p>
        <p className="text-gray-500 text-sm mb-4">{state.error}</p>
        <button
          onClick={() => {
            setState({ isLoading: true, error: null, currentPage: 1, totalPages: 1 })
            iframeRef.current?.contentWindow?.location.reload()
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className={cn('relative w-full', className)} style={{ minHeight }}>
      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600">문서를 불러오는 중...</p>
        </div>
      )}

      {/* Page Indicator (view/comment mode) */}
      {!state.isLoading && mode !== 'edit' && state.totalPages > 1 && (
        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm z-10">
          {state.currentPage} / {state.totalPages}
        </div>
      )}

      {/* Viewer iframe */}
      <iframe
        ref={iframeRef}
        src={viewerUrl}
        className="w-full h-full border-0 rounded-lg"
        style={{ minHeight }}
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        title={`Document Viewer - ${documentId}`}
        onLoad={handleIframeLoad}
      />
    </div>
  )
}

// ============================================
// Loading Placeholder
// ============================================

export function HancomdocsViewerSkeleton({
  minHeight = 600,
  className,
}: {
  minHeight?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-gray-100 rounded-lg animate-pulse',
        className
      )}
      style={{ minHeight }}
    >
      <div className="w-16 h-16 bg-gray-200 rounded-lg mb-4" />
      <div className="w-48 h-4 bg-gray-200 rounded mb-2" />
      <div className="w-32 h-3 bg-gray-200 rounded" />
    </div>
  )
}

// ============================================
// Export
// ============================================

export default HancomdocsViewer
