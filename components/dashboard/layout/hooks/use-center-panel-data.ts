'use client'

/**
 * Center Panel Data Hook
 *
 * Fetches and manages document data for the center panel.
 * Handles VERIFY tab API calls and data transformation.
 *
 * @module components/dashboard/layout/hooks/use-center-panel-data
 */

import { useState, useEffect, useMemo } from 'react'
import type { ProductTab, DocumentItem } from '@/types/inbox'
import { apiGet } from '@/lib/api/client'
import { clientLogger } from '@/lib/logger/client'
import {
  type DomainTag,
  type DocumentWithTags,
  DOCUMENTS_BY_TAB,
  sortByPriority,
} from '../center-panel-constants'

// =============================================================================
// Types
// =============================================================================

interface VerifyListResponse {
  success: boolean
  documents: Array<{
    id: string
    documentHash: string
    previousHash: string | null
    timestamp: string
    metadata: {
      documentId: string
      documentType: string
      enginePreset: string
      filename: string
    }
    chainPosition: number
  }>
}

interface UseCenterPanelDataResult {
  documents: DocumentWithTags[]
  isLoading: boolean
  error: string | null
}

// =============================================================================
// Utility Functions
// =============================================================================

function calculateRelativeTime(timestamp: string): {
  timeStr: string
  diffHours: number
  diffDays: number
} {
  const docDate = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - docDate.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  let timeStr: string
  if (diffHours < 1) timeStr = 'Just now'
  else if (diffHours < 24) timeStr = `${diffHours}h ago`
  else if (diffDays < 7) timeStr = `${diffDays}d ago`
  else timeStr = `${Math.floor(diffDays / 7)}w ago`

  return { timeStr, diffHours, diffDays }
}

function transformVerifyDocument(
  doc: VerifyListResponse['documents'][number]
): DocumentWithTags {
  const { timeStr, diffHours, diffDays } = calculateRelativeTime(doc.timestamp)

  // Determine priority based on recency
  let priority: 'critical' | 'high' | 'medium' | 'low'
  if (diffHours < 3) priority = 'high'
  else if (diffHours < 24) priority = 'medium'
  else priority = 'low'

  // Recent items are unread (within 1 day)
  const unread = diffHours < 24

  // Generate title and preview
  const filename =
    doc.metadata.filename || `Document #${doc.metadata.documentId.slice(0, 8)}`
  const title = `Verify: ${filename}`
  const hashPreview = `${doc.documentHash.slice(0, 8)}...${doc.documentHash.slice(-6)}`
  const preview = `SHA-256 Hash: ${hashPreview}. Chain position: #${doc.chainPosition}. ${doc.previousHash ? 'Linked to previous hash' : 'First document in chain'}.`

  return {
    id: doc.id,
    title,
    preview,
    time: timeStr,
    status: diffHours < 6 ? 'active' : diffDays < 2 ? 'pending' : 'completed',
    unread,
    priority,
    domainTag: doc.metadata.enginePreset as DomainTag | undefined,
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useCenterPanelData(
  activeTab: ProductTab,
  onError?: (message: string) => void
): UseCenterPanelDataResult {
  const [verifyDocuments, setVerifyDocuments] = useState<DocumentWithTags[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch VERIFY documents from API
  useEffect(() => {
    if (activeTab !== 'VERIFY') return

    async function fetchVerifyDocuments() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await apiGet<VerifyListResponse>('/api/verify/list')

        if (data.success && data.documents) {
          const transformedDocs = data.documents.map(transformVerifyDocument)
          setVerifyDocuments(transformedDocs)
        } else {
          const errorMsg = 'Failed to load verification documents'
          setError(errorMsg)
          onError?.(errorMsg)
        }
      } catch (err) {
        clientLogger.error('[VERIFY] Failed to fetch documents:', err)
        const errorMsg = 'Failed to load verification documents'
        setError(errorMsg)
        onError?.(errorMsg)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVerifyDocuments()
  }, [activeTab, onError])

  // Apply priority sorting - use API data for VERIFY tab
  const documents = useMemo(() => {
    const docs =
      activeTab === 'VERIFY' && verifyDocuments.length > 0
        ? verifyDocuments
        : DOCUMENTS_BY_TAB[activeTab]
    return sortByPriority(docs)
  }, [activeTab, verifyDocuments])

  return {
    documents,
    isLoading: isLoading && activeTab === 'VERIFY',
    error,
  }
}

export default useCenterPanelData
