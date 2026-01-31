'use client'

/**
 * Verify Preview Data Hook
 *
 * Manages API data fetching and scan state animation for verify preview.
 *
 * @module components/dashboard/verify/hooks/use-verify-preview-data
 */

import { useState, useEffect, useCallback } from 'react'
import { DISPLAY_METRICS } from '@/constants/metrics'
import { clientLogger } from '@/lib/logger/client'
import {
  type DocumentInfo,
  type SensorReading,
  type ScanState,
  type VerifyApiResponse,
  FALLBACK_DOCUMENT_INFO,
  FALLBACK_SENSOR_DATA,
} from '../verify-preview-constants'

// =============================================================================
// Types
// =============================================================================

interface UseVerifyPreviewDataOptions {
  documentId: string
  refreshInterval?: number
}

interface UseVerifyPreviewDataResult {
  documentInfo: DocumentInfo
  sensorData: SensorReading[]
  isLoading: boolean
  error: string | null
  confidence: number
  scanState: ScanState
  showParticles: boolean
  refetch: () => Promise<void>
}

// =============================================================================
// Hook
// =============================================================================

export function useVerifyPreviewData({
  documentId,
  refreshInterval = 0,
}: UseVerifyPreviewDataOptions): UseVerifyPreviewDataResult {
  // API data state
  const [documentInfo, setDocumentInfo] =
    useState<DocumentInfo>(FALLBACK_DOCUMENT_INFO)
  const [sensorData, setSensorData] =
    useState<SensorReading[]>(FALLBACK_SENSOR_DATA)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(
    parseFloat(DISPLAY_METRICS.apiUptime.value)
  )

  // UI animation state
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [showParticles, setShowParticles] = useState(false)

  // =============================================================================
  // API Fetching
  // =============================================================================

  const fetchVerificationData = useCallback(async () => {
    if (!documentId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/verify/${documentId}`)
      const result: VerifyApiResponse = await response.json()

      if (result.success && result.data) {
        setDocumentInfo(result.data.document)
        setSensorData(result.data.sensorData)
        setConfidence(result.data.verificationResult.confidence)
      } else {
        setError(result.error?.message || '검증 데이터를 불러올 수 없습니다.')
        // Keep fallback data
      }
    } catch (err) {
      clientLogger.error('[VERIFY] API error:', err)
      setError('서버 연결에 실패했습니다.')
      // Keep fallback data
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  // Initial load and auto-refresh
  useEffect(() => {
    fetchVerificationData()

    if (refreshInterval > 0) {
      const interval = setInterval(fetchVerificationData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchVerificationData, refreshInterval])

  // =============================================================================
  // Scan Animation Cycle
  // =============================================================================

  useEffect(() => {
    const cycleStates = () => {
      setScanState('scanning')
      setTimeout(() => {
        setScanState('verified')
        setShowParticles(true)
        setTimeout(() => {
          setShowParticles(false)
          setTimeout(() => {
            setScanState('idle')
          }, 2000)
        }, 1500)
      }, 2500)
    }

    // Start cycle after initial delay
    const initialDelay = setTimeout(cycleStates, 1000)
    // Repeat cycle
    const interval = setInterval(cycleStates, 8000)

    return () => {
      clearTimeout(initialDelay)
      clearInterval(interval)
    }
  }, [])

  return {
    documentInfo,
    sensorData,
    isLoading,
    error,
    confidence,
    scanState,
    showParticles,
    refetch: fetchVerificationData,
  }
}

export default useVerifyPreviewData
