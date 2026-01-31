'use client'

/**
 * useVerifyData Hook
 *
 * Handles data fetching for verification content.
 *
 * @module components/dashboard/verify/hooks/use-verify-data
 */

import { useState, useEffect, useCallback } from 'react'
import type { VerifiedDocument } from '@/types/documents'
import { apiGet } from '@/lib/api/client'
import { clientLogger } from '@/lib/logger/client'
import type { HashVerification } from '../verify-constants'

// =============================================================================
// Types
// =============================================================================

interface ListApiResponse {
  success: boolean
  totalDocuments?: number
  documents?: VerifiedDocument[]
  error?: {
    code: string
    message: string
  }
}

interface ChainIntegrityResponse {
  success: boolean
  data?: { chainIntegrity: boolean }
}

export interface UseVerifyDataReturn {
  verifications: HashVerification[]
  chainIntegrity: boolean
  isLoading: boolean
  error: string | null
  verifiedCount: number
  refetch: () => Promise<void>
}

// =============================================================================
// Transform Function
// =============================================================================

function transformToHashVerification(item: VerifiedDocument): HashVerification {
  // Extract file extension from filename
  const extension =
    item.metadata.filename.split('.').pop()?.toLowerCase() || 'pdf'
  const validType = ['docx', 'xlsx', 'pdf', 'hwp'].includes(extension)
    ? (extension as 'docx' | 'xlsx' | 'pdf' | 'hwp')
    : 'pdf'

  return {
    id: item.id,
    documentName: item.metadata.filename,
    documentType: validType,
    hash: item.documentHash,
    previousHash: item.previousHash,
    timestamp: item.timestamp,
    status: 'verified', // All documents in hash chain are verified
    verifiedBy: `Chain Position #${item.chainPosition}`,
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useVerifyData(
  selectedVerificationId?: string | null
): UseVerifyDataReturn & {
  selectedItem: HashVerification | null
  setSelectedItem: (item: HashVerification | null) => void
} {
  // API 데이터 상태
  const [verifications, setVerifications] = useState<HashVerification[]>([])
  const [chainIntegrity, setChainIntegrity] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 선택 상태
  const [selectedItem, setSelectedItem] = useState<HashVerification | null>(
    null
  )

  // API에서 데이터 가져오기
  const fetchVerifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await apiGet<ListApiResponse>('/api/verify/list')

      if (!data.success || !data.documents) {
        throw new Error(data.error?.message || 'Failed to fetch verifications')
      }

      const items = data.documents.map(transformToHashVerification)
      setVerifications(items)

      // 선택된 항목 설정
      if (selectedVerificationId) {
        const selected = items.find((v) => v.id === selectedVerificationId)
        if (selected) setSelectedItem(selected)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [selectedVerificationId])

  // 해시체인 무결성 상태 가져오기
  const fetchChainIntegrity = useCallback(async () => {
    try {
      const data = await apiGet<ChainIntegrityResponse>('/api/verify/chain')

      if (data.success && data.data) {
        setChainIntegrity(data.data.chainIntegrity)
      }
    } catch (err) {
      // Chain integrity check is non-critical, don't show error
      clientLogger.error('Failed to fetch chain integrity:', err)
    }
  }, [])

  // 초기 로딩
  useEffect(() => {
    fetchVerifications()
    fetchChainIntegrity()
  }, [fetchVerifications, fetchChainIntegrity])

  // 파일 검증 완료 시 목록 새로고침
  const refetch = useCallback(async () => {
    await fetchVerifications()
  }, [fetchVerifications])

  const verifiedCount = verifications.filter(
    (v) => v.status === 'verified'
  ).length

  return {
    verifications,
    chainIntegrity,
    isLoading,
    error,
    verifiedCount,
    refetch,
    selectedItem,
    setSelectedItem,
  }
}

export default useVerifyData
