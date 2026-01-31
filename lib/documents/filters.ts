/**
 * Documents Filters and Statistics
 *
 * 문서 필터링 및 통계 계산 유틸리티
 *
 * @module lib/documents/filters
 */

import type { EnginePresetType } from '@/types/inbox'
import type {
  DocumentStatus,
  DocumentType,
  DocumentInfo,
} from '@/types/documents'

// =============================================================================
// Types
// =============================================================================

export interface DocumentFilters {
  domain?: EnginePresetType
  status?: DocumentStatus
  type?: DocumentType
}

export interface DocumentStats {
  byStatus: Record<DocumentStatus, number>
  byDomain: Record<EnginePresetType, number>
}

// =============================================================================
// Filtering
// =============================================================================

/**
 * 문서 목록 필터링
 */
export function filterDocuments(
  documents: DocumentInfo[],
  filters: DocumentFilters
): DocumentInfo[] {
  let result = documents

  if (filters.domain) {
    result = result.filter((doc) => doc.domain === filters.domain)
  }

  if (filters.status) {
    result = result.filter((doc) => doc.status === filters.status)
  }

  if (filters.type) {
    result = result.filter((doc) => doc.type === filters.type)
  }

  return result
}

/**
 * ID로 문서 찾기
 */
export function findDocumentById(
  documents: DocumentInfo[],
  id: string
): DocumentInfo | undefined {
  return documents.find((doc) => doc.id === id)
}

// =============================================================================
// Statistics
// =============================================================================

/**
 * 문서 통계 계산
 */
export function calculateStats(documents: DocumentInfo[]): DocumentStats {
  const byStatus: Record<DocumentStatus, number> = {
    processing: 0,
    pending: 0,
    completed: 0,
    warning: 0,
    error: 0,
  }

  const byDomain: Record<EnginePresetType, number> = {
    MANUFACTURING: 0,
    ENVIRONMENT: 0,
    DIGITAL: 0,
    FINANCE: 0,
    STARTUP: 0,
    EXPORT: 0,
  }

  documents.forEach((doc) => {
    byStatus[doc.status]++
    byDomain[doc.domain]++
  })

  return { byStatus, byDomain }
}
