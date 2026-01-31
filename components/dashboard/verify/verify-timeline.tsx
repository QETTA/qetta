'use client'

/**
 * Verify Timeline Component
 *
 * Displays the list of verified documents in a timeline format.
 *
 * @module components/dashboard/verify/verify-timeline
 */

import {
  STATUS_STYLES,
  DOC_TYPE_ICONS,
  formatDate,
  formatHash,
  type HashVerification,
} from './verify-constants'

// =============================================================================
// Types
// =============================================================================

export interface VerifyTimelineProps {
  verifications: HashVerification[]
  isLoading: boolean
  error: string | null
  selectedItem: HashVerification | null
  onSelectItem: (item: HashVerification) => void
  onRetry: () => void
  onShowUpload: () => void
}

// =============================================================================
// Component
// =============================================================================

export function VerifyTimeline({
  verifications,
  isLoading,
  error,
  selectedItem,
  onSelectItem,
  onRetry,
  onShowUpload,
}: VerifyTimelineProps) {
  return (
    <div className="w-80 border-r border-white/10 flex flex-col">
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="text-xs font-medium text-zinc-400">Verification Timeline</h3>
      </div>
      <div className="flex-1 overflow-auto">
        {/* 로딩 상태 */}
        {isLoading && <LoadingState />}

        {/* 에러 상태 */}
        {error && !isLoading && <ErrorState error={error} onRetry={onRetry} />}

        {/* 빈 상태 */}
        {!isLoading && !error && verifications.length === 0 && (
          <EmptyState onShowUpload={onShowUpload} />
        )}

        {/* 검증 목록 */}
        {!isLoading &&
          !error &&
          verifications.map((item, index) => (
            <TimelineItem
              key={item.id}
              item={item}
              index={index}
              totalCount={verifications.length}
              isSelected={selectedItem?.id === item.id}
              onSelect={() => onSelectItem(item)}
            />
          ))}
      </div>
    </div>
  )
}

// =============================================================================
// LoadingState Component
// =============================================================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <svg
          className="w-8 h-8 mx-auto text-zinc-400 animate-spin mb-2"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-xs text-zinc-500">Loading hash chain...</p>
      </div>
    </div>
  )
}

// =============================================================================
// ErrorState Component
// =============================================================================

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-xs text-red-400 mb-2">{error}</p>
        <button
          onClick={onRetry}
          className="text-xs text-zinc-400 hover:text-white"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// EmptyState Component
// =============================================================================

interface EmptyStateProps {
  onShowUpload: () => void
}

function EmptyState({ onShowUpload }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-xs text-zinc-500 mb-2">No documents registered</p>
        <button
          onClick={onShowUpload}
          className="text-xs text-zinc-400 hover:text-white"
        >
          Verify a File
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// TimelineItem Component
// =============================================================================

interface TimelineItemProps {
  item: HashVerification
  index: number
  totalCount: number
  isSelected: boolean
  onSelect: () => void
}

function TimelineItem({
  item,
  index,
  totalCount,
  isSelected,
  onSelect,
}: TimelineItemProps) {
  const style = STATUS_STYLES[item.status]
  const docIcon = DOC_TYPE_ICONS[item.documentType] || DOC_TYPE_ICONS.pdf

  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 text-left border-b border-white/5 transition-all hover:bg-white/5 ${
        isSelected ? 'bg-white/10' : ''
      }`}
    >
      {/* Timeline connector */}
      <div className="flex gap-3">
        <div className="relative flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${style.bg} ${style.text} ring-1 ${style.ring}`}
          >
            {item.status === 'checking' ? (
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : item.status === 'verified' ? (
              '✓'
            ) : item.status === 'failed' ? (
              '✕'
            ) : (
              '○'
            )}
          </div>
          {index < totalCount - 1 && (
            <div className="flex-1 w-px bg-white/10 mt-2" />
          )}
        </div>

        <div className="flex-1 min-w-0 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{docIcon.icon}</span>
            <span
              className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${style.bg} ${style.text}`}
            >
              {style.label}
            </span>
          </div>
          <p className="text-sm text-white truncate mb-1">{item.documentName}</p>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span className="font-mono">{formatHash(item.hash)}</span>
          </div>
          <p className="text-[10px] text-zinc-600 mt-1">
            {formatDate(item.timestamp)}
          </p>
        </div>
      </div>
    </button>
  )
}

export default VerifyTimeline
