'use client'

/**
 * Document List - Document History Sidebar
 *
 * Displays generated document list and supports version tracking.
 *
 * @module dashboard/docs/document-list
 */

import { useState, useEffect, useCallback } from 'react'
import type { EnginePresetType } from '@/types/inbox'

interface DocumentItem {
  id: string
  title: string
  type: string
  status: string
  domain: EnginePresetType
  summary: string
  metadata?: {
    createdAt?: string
    fileSize?: string
    hash?: string
    version?: number
    parentDocumentId?: string
  }
}

interface DocumentListProps {
  domain?: EnginePresetType
  onSelect?: (doc: DocumentItem) => void
  className?: string
}

const STATUS_COLORS: Record<string, string> = {
  processing: 'bg-blue-500/10 text-blue-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
  completed: 'bg-green-500/10 text-green-400',
  warning: 'bg-orange-500/10 text-orange-400',
  error: 'bg-red-500/10 text-red-400',
}

export default function DocumentList({ domain, onSelect, className = '' }: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (domain) params.set('domain', domain)
      const res = await fetch(`/api/documents?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setDocuments(json.data.documents)
      }
    } catch {
      // fetch failed silently
    } finally {
      setLoading(false)
    }
  }, [domain])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleSelect = (doc: DocumentItem) => {
    setSelectedId(doc.id)
    onSelect?.(doc)
  }

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={`skeleton-${i}`} className="h-16 rounded-lg bg-zinc-800/50" />
          ))}
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className={`p-4 text-center text-sm text-zinc-500 ${className}`}>
        No documents generated.
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        Document History ({documents.length})
      </h3>
      <div className="space-y-1">
        {documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => handleSelect(doc)}
            className={`w-full rounded-lg p-3 text-left transition-colors ${
              selectedId === doc.id
                ? 'bg-zinc-800 ring-1 ring-white/30'
                : 'hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200 truncate">
                {doc.title}
              </span>
              {doc.metadata?.version && doc.metadata.version > 1 && (
                <span className="ml-2 text-xs text-zinc-500">v{doc.metadata.version}</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[doc.status] || 'bg-zinc-800 text-zinc-400'}`}>
                {doc.status}
              </span>
              {doc.metadata?.createdAt && (
                <span className="text-xs text-zinc-500">
                  {new Date(doc.metadata.createdAt).toLocaleDateString('en-US')}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
