'use client'

/**
 * QettaCenterPanel Component
 *
 * Document list panel showing documents by tab (DOCS, VERIFY, APPLY, MONITOR).
 * Refactored to use extracted hooks and components for maintainability.
 *
 * @module components/dashboard/layout/center-panel
 */

import { memo } from 'react'
import type { ProductTab } from '@/types/inbox'
import { useCrossFunctional } from '../context'
import { useCenterPanelData } from './hooks/use-center-panel-data'
import { CenterPanelDocumentItem } from './center-panel-document-item'
import { TAB_TITLES } from './center-panel-constants'

// =============================================================================
// Types
// =============================================================================

interface QettaCenterPanelProps {
  activeTab: ProductTab
  selectedDocument: string | null
  onSelectDocument: (id: string) => void
}

// =============================================================================
// Sub-components
// =============================================================================

function LoadingState() {
  return (
    <div className="flex h-32 items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-zinc-500" />
        <span className="text-sm text-zinc-500">Loading documents...</span>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-32 items-center justify-center">
      <span className="text-sm text-zinc-500">No documents</span>
    </div>
  )
}

interface HeaderProps {
  title: string
  onSortClick: () => void
  onFilterClick: () => void
}

function Header({ title, onSortClick, onFilterClick }: HeaderProps) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-white/5 px-5">
      <h2 id="document-list-title" className="text-base font-semibold text-white">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        <button
          onClick={onSortClick}
          data-testid="document-sort-button"
          className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 focus:ring-2 focus:ring-white/30 focus:outline-none"
          aria-label="Change sort order"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
            />
          </svg>
        </button>
        <button
          onClick={onFilterClick}
          data-testid="document-filter-button"
          className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 focus:ring-2 focus:ring-white/30 focus:outline-none"
          aria-label="Filter options"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

interface FooterProps {
  totalCount: number
  unreadCount: number
}

function Footer({ totalCount, unreadCount }: FooterProps) {
  return (
    <div className="border-t border-white/5 bg-zinc-900/50 px-5 py-3">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Total {totalCount}</span>
        <span>{unreadCount} unread</span>
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export const QettaCenterPanel = memo(function QettaCenterPanel({
  activeTab,
  selectedDocument,
  onSelectDocument,
}: QettaCenterPanelProps) {
  const { showToast } = useCrossFunctional()

  const { documents, isLoading } = useCenterPanelData(activeTab, (message) => {
    showToast(message, 'error')
  })

  const handleSortClick = () => {
    showToast('정렬 기능 준비 중입니다', 'info')
  }

  const handleFilterClick = () => {
    showToast('필터 기능 준비 중입니다', 'info')
  }

  const unreadCount = documents.filter((d) => d.unread).length

  return (
    <div className="flex w-96 flex-shrink-0 flex-col border-r border-white/10 bg-zinc-900">
      {/* Header */}
      <Header
        title={TAB_TITLES[activeTab]}
        onSortClick={handleSortClick}
        onFilterClick={handleFilterClick}
      />

      {/* Document List */}
      <div
        className="flex-1 overflow-y-auto"
        role="listbox"
        aria-labelledby="document-list-title"
        aria-activedescendant={selectedDocument || undefined}
        data-testid="document-list"
      >
        {isLoading ? (
          <LoadingState />
        ) : documents.length === 0 ? (
          <EmptyState />
        ) : (
          documents.map((doc) => (
            <CenterPanelDocumentItem
              key={doc.id}
              doc={doc}
              isSelected={selectedDocument === doc.id}
              onSelect={() => onSelectDocument(doc.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <Footer totalCount={documents.length} unreadCount={unreadCount} />
    </div>
  )
})

export default QettaCenterPanel
