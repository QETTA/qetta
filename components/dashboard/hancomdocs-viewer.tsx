'use client'

/**
 * 한컴독스 인웹뷰어 컴포넌트
 *
 * 한컴독스 웹 에디터를 iframe으로 대시보드에 임베드
 *
 * 기능:
 * - 문서 뷰어/에디터 iframe 렌더링
 * - 로딩 상태 표시
 * - PostMessage 이벤트 핸들링
 * - 전체화면 토글
 * - 다크 테마 지원 (Catalyst Dark)
 *
 * @module components/dashboard/hancomdocs-viewer
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  DocumentIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowPathIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { HancomViewerEventType } from '@/lib/hancomdocs/types'
import { HANCOM_VIEWER_BASE_URL } from '@/lib/hancomdocs/types'

// ============================================
// 타입 정의
// ============================================

export interface HancomdocsViewerProps {
  /** 문서 ID 또는 전체 URL */
  documentId?: string
  url?: string
  /** 뷰어 모드 */
  mode?: 'view' | 'edit'
  /** 제목 표시 */
  title?: string
  /** 높이 (기본: 600px) */
  height?: string | number
  /** 전체화면 허용 */
  allowFullscreen?: boolean
  /** 툴바 표시 */
  showToolbar?: boolean
  /** 닫기 버튼 콜백 */
  onClose?: () => void
  /** 저장 이벤트 콜백 */
  onSave?: (event: HancomViewerEvent) => void
  /** 로드 완료 콜백 */
  onLoad?: () => void
  /** 에러 콜백 */
  onError?: (error: string) => void
  /** 로컬 모드 (API 미승인 시) */
  localMode?: boolean
  /** 로컬 파일 경로 */
  localFilePath?: string
  /** 클래스명 */
  className?: string
}

interface HancomViewerEvent {
  type: HancomViewerEventType
  documentId: string
  data?: Record<string, unknown>
  timestamp: number
}

// ============================================
// 메인 컴포넌트
// ============================================

export function HancomdocsViewer({
  documentId,
  url,
  mode = 'view',
  title,
  height = 600,
  allowFullscreen = true,
  showToolbar = true,
  onClose,
  onSave,
  onLoad,
  onError,
  localMode = false,
  localFilePath,
  className = '',
}: HancomdocsViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // iframe URL 생성
  const iframeUrl = url || (documentId ? `${HANCOM_VIEWER_BASE_URL}/${mode}/${documentId}` : null)

  // PostMessage 이벤트 핸들러
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 한컴독스 도메인 확인
      if (!event.origin.includes('hancomdocs.com')) return

      try {
        const data = event.data as HancomViewerEvent
        if (!data.type) return

        switch (data.type) {
          case 'ready':
          case 'loaded':
            setIsLoading(false)
            onLoad?.()
            break
          case 'error':
            setError(data.data?.message as string || 'Unknown error')
            onError?.(data.data?.message as string || 'Unknown error')
            break
          case 'save':
            onSave?.(data)
            break
        }
      } catch {
        // 파싱 에러 무시
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onLoad, onError, onSave])

  // 전체화면 토글
  const toggleFullscreen = useCallback(() => {
    if (!iframeRef.current) return

    if (!isFullscreen) {
      iframeRef.current.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }, [isFullscreen])

  // 새로고침
  const handleRefresh = useCallback(() => {
    if (iframeRef.current) {
      setIsLoading(true)
      iframeRef.current.src = iframeRef.current.src
    }
  }, [])

  // iframe 로드 완료
  const handleIframeLoad = () => {
    // 5초 후에도 ready 이벤트 없으면 로딩 해제
    setTimeout(() => setIsLoading(false), 5000)
  }

  // 로컬 모드 렌더링
  if (localMode) {
    return (
      <LocalModeView
        filePath={localFilePath}
        height={height}
        onClose={onClose}
        className={className}
      />
    )
  }

  // URL 없음
  if (!iframeUrl) {
    return (
      <EmptyStateView
        height={height}
        onClose={onClose}
        className={className}
      />
    )
  }

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10 ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* 툴바 */}
      {showToolbar && (
        <div className="flex h-12 items-center justify-between border-b border-white/10 bg-zinc-800/50 px-4">
          <div className="flex items-center gap-3">
            <DocumentIcon className="h-5 w-5 text-white" />
            <span className="text-sm font-medium text-white">
              {title || '한컴독스 뷰어'}
            </span>
            {mode === 'edit' && (
              <span className="rounded bg-zinc-500/20 px-2 py-0.5 text-xs text-white ring-1 ring-zinc-500/30">
                편집 모드
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* 새로고침 */}
            <button
              onClick={handleRefresh}
              className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
              title="새로고침"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            {/* 전체화면 */}
            {allowFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                title={isFullscreen ? '전체화면 종료' : '전체화면'}
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="h-4 w-4" />
                ) : (
                  <ArrowsPointingOutIcon className="h-4 w-4" />
                )}
              </button>
            )}
            {/* 닫기 */}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                title="닫기"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
            <span className="text-sm text-zinc-400">문서 로딩 중...</span>
          </div>
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80">
          <div className="flex flex-col items-center gap-3 text-center">
            <ExclamationTriangleIcon className="h-10 w-10 text-amber-500" />
            <span className="text-sm text-white">{error}</span>
            <button
              onClick={handleRefresh}
              className="rounded-md bg-zinc-600 px-4 py-2 text-sm text-white hover:bg-zinc-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* iframe */}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        className="flex-1 border-0 bg-white"
        onLoad={handleIframeLoad}
        allow="clipboard-write; clipboard-read"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
      />
    </div>
  )
}

// ============================================
// 로컬 모드 뷰
// ============================================

interface LocalModeViewProps {
  filePath?: string
  height: string | number
  onClose?: () => void
  className?: string
}

function LocalModeView({ filePath, height, onClose, className }: LocalModeViewProps) {
  const handleOpenHancomdocs = () => {
    window.open(`${HANCOM_VIEWER_BASE_URL}/ko/home`, '_blank')
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg bg-zinc-900 ring-1 ring-white/10 ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <CloudArrowUpIcon className="h-16 w-16 text-zinc-600" />
        <div>
          <h3 className="text-lg font-medium text-white">한컴독스 API 심사 중</h3>
          <p className="mt-1 text-sm text-zinc-400">
            API가 승인되면 여기서 직접 문서를 편집할 수 있습니다.
          </p>
        </div>

        {filePath && (
          <div className="rounded-lg bg-zinc-800/50 px-4 py-3 ring-1 ring-white/10">
            <p className="text-xs text-zinc-500">생성된 파일</p>
            <p className="mt-1 text-sm text-white">{filePath}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleOpenHancomdocs}
            className="flex items-center gap-2 rounded-md bg-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <CloudArrowUpIcon className="h-4 w-4" />
            한컴독스에서 열기
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// 빈 상태 뷰
// ============================================

interface EmptyStateViewProps {
  height: string | number
  onClose?: () => void
  className?: string
}

function EmptyStateView({ height, onClose, className }: EmptyStateViewProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg bg-zinc-900 ring-1 ring-white/10 ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <DocumentIcon className="h-16 w-16 text-zinc-600" />
        <div>
          <h3 className="text-lg font-medium text-white">문서를 선택하세요</h3>
          <p className="mt-1 text-sm text-zinc-400">
            좌측에서 문서를 생성하거나 선택하면 여기에 표시됩니다.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            닫기
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// Export
// ============================================

export default HancomdocsViewer
