/**
 * Proposal Stream Hook
 *
 * P2-2: SSE 기반 제안서 생성 스트리밍 훅
 *
 * 핵심 기능:
 * - EventSource 연결 관리 (자동 재연결)
 * - 진행률 상태 추적
 * - 캐시 히트 감지
 * - 타입 안전한 이벤트 핸들링
 *
 * @module hooks/use-proposal-stream
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { clientLogger } from '@/lib/logger/client'

// ============================================
// Types
// ============================================

/**
 * 생성 진행 단계
 */
export type ProposalPhase =
  | 'idle'
  | 'initializing'
  | 'loading'
  | 'generating'
  | 'formatting'
  | 'caching'
  | 'completed'
  | 'error'

/**
 * Progress 이벤트 데이터
 */
export interface ProgressData {
  progress: number
  phase: ProposalPhase
  message: string
}

/**
 * Section 이벤트 데이터
 */
export interface SectionData {
  sectionId: string
  sectionName: string
  contentPreview?: string
  tokensUsed?: number
}

/**
 * Cache Hit 이벤트 데이터
 */
export interface CacheHitData {
  source: 'memory' | 'redis'
  contentHash: string
  savedTimeMs: number
}

/**
 * Complete 이벤트 데이터
 */
export interface CompleteData {
  jobId: string
  contentHash: string
  filename: string
  totalTimeMs: number
  fromCache: boolean
  cacheSource: 'memory' | 'redis' | 'none'
}

/**
 * Error 이벤트 데이터
 */
export interface ErrorData {
  code: string
  message: string
  retryable: boolean
}

/**
 * SSE 이벤트 유니온 타입
 */
export type ProposalStreamEvent =
  | { type: 'progress'; data: ProgressData }
  | { type: 'section'; data: SectionData }
  | { type: 'cache-hit'; data: CacheHitData }
  | { type: 'complete'; data: CompleteData }
  | { type: 'error'; data: ErrorData }

/**
 * 훅 상태
 */
export interface ProposalStreamState {
  /** 연결 상태 */
  isConnected: boolean
  /** 스트리밍 중 */
  isStreaming: boolean
  /** 진행률 (0-100) */
  progress: number
  /** 현재 단계 */
  phase: ProposalPhase
  /** 진행 메시지 */
  message: string
  /** 완료된 섹션들 */
  sections: SectionData[]
  /** 캐시 히트 정보 (있으면) */
  cacheHit: CacheHitData | null
  /** 완료 결과 (있으면) */
  result: CompleteData | null
  /** 에러 (있으면) */
  error: ErrorData | null
}

/**
 * 훅 옵션
 */
export interface UseProposalStreamOptions {
  /** 자동 재연결 활성화 */
  autoReconnect?: boolean
  /** 최대 재연결 딜레이 (ms) */
  maxReconnectDelay?: number
  /** 기본 재연결 딜레이 (ms) */
  baseReconnectDelay?: number
  /** 이벤트 콜백 */
  onProgress?: (data: ProgressData) => void
  onSection?: (data: SectionData) => void
  onCacheHit?: (data: CacheHitData) => void
  onComplete?: (data: CompleteData) => void
  onError?: (data: ErrorData) => void
}

/**
 * 훅 반환 타입
 */
export interface UseProposalStreamReturn extends ProposalStreamState {
  /** 기존 Job 스트리밍 시작 */
  startStreaming: (jobId: string) => void
  /** 스트리밍 중지 */
  stopStreaming: () => void
  /** 상태 초기화 */
  reset: () => void
}

// ============================================
// Constants
// ============================================

const SSE_ENDPOINT = '/api/proposals/stream'
const DEFAULT_MAX_RECONNECT_DELAY = 30000 // 30초
const DEFAULT_BASE_RECONNECT_DELAY = 1000 // 1초

// ============================================
// Initial State
// ============================================

const initialState: ProposalStreamState = {
  isConnected: false,
  isStreaming: false,
  progress: 0,
  phase: 'idle',
  message: '',
  sections: [],
  cacheHit: null,
  result: null,
  error: null,
}

// ============================================
// Hook Implementation
// ============================================

/**
 * 제안서 생성 SSE 스트리밍 훅
 *
 * @example
 * ```tsx
 * function ProposalGenerator({ jobId }: { jobId: string }) {
 *   const {
 *     isStreaming,
 *     progress,
 *     phase,
 *     message,
 *     sections,
 *     result,
 *     error,
 *     startStreaming,
 *     stopStreaming,
 *   } = useProposalStream({
 *     onComplete: (data) => {
 *       console.log('Generation complete!', data.filename)
 *     },
 *   })
 *
 *   useEffect(() => {
 *     startStreaming(jobId)
 *     return () => stopStreaming()
 *   }, [jobId])
 *
 *   return (
 *     <div>
 *       <Progress value={progress} />
 *       <p>{message}</p>
 *       {sections.map(s => <p key={s.sectionId}>{s.sectionName}</p>)}
 *     </div>
 *   )
 * }
 * ```
 */
export function useProposalStream(
  options: UseProposalStreamOptions = {}
): UseProposalStreamReturn {
  const {
    autoReconnect = true,
    maxReconnectDelay = DEFAULT_MAX_RECONNECT_DELAY,
    baseReconnectDelay = DEFAULT_BASE_RECONNECT_DELAY,
    onProgress,
    onSection,
    onCacheHit,
    onComplete,
    onError,
  } = options

  // State
  const [state, setState] = useState<ProposalStreamState>(initialState)

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const currentJobIdRef = useRef<string | null>(null)

  /**
   * 상태 업데이트 헬퍼
   */
  const updateState = useCallback(
    (updates: Partial<ProposalStreamState>) => {
      setState((prev) => ({ ...prev, ...updates }))
    },
    []
  )

  /**
   * 연결 정리
   */
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  /**
   * 스트리밍 중지
   */
  const stopStreaming = useCallback(() => {
    cleanup()
    currentJobIdRef.current = null
    updateState({
      isConnected: false,
      isStreaming: false,
    })
  }, [cleanup, updateState])

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    stopStreaming()
    setState(initialState)
  }, [stopStreaming])

  /**
   * SSE 연결 시작
   */
  const connect = useCallback(
    (jobId: string) => {
      try {
        const url = `${SSE_ENDPOINT}?jobId=${encodeURIComponent(jobId)}`
        const eventSource = new EventSource(url)
        eventSourceRef.current = eventSource

        // Progress 이벤트
        eventSource.addEventListener('progress', (event) => {
          try {
            const parsed = JSON.parse(event.data) as { data: ProgressData }
            const data = parsed.data

            updateState({
              progress: data.progress,
              phase: data.phase,
              message: data.message,
            })

            onProgress?.(data)
          } catch (err) {
            clientLogger.error('[ProposalStream] progress parse error:', err)
          }
        })

        // Section 이벤트
        eventSource.addEventListener('section', (event) => {
          try {
            const parsed = JSON.parse(event.data) as { data: SectionData }
            const data = parsed.data

            setState((prev) => ({
              ...prev,
              sections: [...prev.sections, data],
            }))

            onSection?.(data)
          } catch (err) {
            clientLogger.error('[ProposalStream] section parse error:', err)
          }
        })

        // Cache Hit 이벤트
        eventSource.addEventListener('cache-hit', (event) => {
          try {
            const parsed = JSON.parse(event.data) as { data: CacheHitData }
            const data = parsed.data

            updateState({
              cacheHit: data,
              progress: 100,
              phase: 'completed',
              message: `캐시에서 로드됨 (${data.source}, ${data.savedTimeMs}ms 절약)`,
            })

            onCacheHit?.(data)
          } catch (err) {
            clientLogger.error('[ProposalStream] cache-hit parse error:', err)
          }
        })

        // Complete 이벤트
        eventSource.addEventListener('complete', (event) => {
          try {
            const parsed = JSON.parse(event.data) as { data: CompleteData }
            const data = parsed.data

            updateState({
              result: data,
              progress: 100,
              phase: 'completed',
              message: '생성 완료',
              isStreaming: false,
            })

            onComplete?.(data)

            // 완료 시 연결 종료
            cleanup()
          } catch (err) {
            clientLogger.error('[ProposalStream] complete parse error:', err)
          }
        })

        // Error 이벤트
        eventSource.addEventListener('error', (event) => {
          try {
            // SSE error 이벤트는 두 종류:
            // 1. 서버에서 보낸 'error' 타입 이벤트 (data 있음)
            // 2. 연결 오류 (data 없음)
            if ('data' in event && event.data) {
              const parsed = JSON.parse(event.data as string) as { data: ErrorData }
              const data = parsed.data

              updateState({
                error: data,
                phase: 'error',
                message: data.message,
                isStreaming: false,
              })

              onError?.(data)

              // 재시도 불가능한 에러면 연결 종료
              if (!data.retryable) {
                cleanup()
              }
            }
          } catch (err) {
            clientLogger.error('[ProposalStream] error event parse error:', err)
          }
        })

        // 연결 성공
        eventSource.onopen = () => {
          updateState({
            isConnected: true,
            isStreaming: true,
            error: null,
          })
          reconnectAttemptsRef.current = 0 // 재연결 카운터 초기화
        }

        // 연결 오류 (서버가 보낸 error 이벤트가 아님)
        eventSource.onerror = () => {
          clientLogger.error('[ProposalStream] Connection error')
          updateState({
            isConnected: false,
          })
          eventSource.close()

          // 자동 재연결
          if (autoReconnect && currentJobIdRef.current) {
            const delay = Math.min(
              baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
              maxReconnectDelay
            )
            reconnectAttemptsRef.current++

            clientLogger.info(`[ProposalStream] Reconnecting in ${delay}ms...`)

            reconnectTimeoutRef.current = setTimeout(() => {
              if (currentJobIdRef.current) {
                connect(currentJobIdRef.current)
              }
            }, delay)
          }
        }
      } catch (err) {
        clientLogger.error('[ProposalStream] Failed to create EventSource:', err)
        updateState({
          error: {
            code: 'CONNECTION_FAILED',
            message: 'SSE 연결 실패',
            retryable: true,
          },
          phase: 'error',
          isStreaming: false,
        })
      }
    },
    [
      autoReconnect,
      baseReconnectDelay,
      maxReconnectDelay,
      cleanup,
      updateState,
      onProgress,
      onSection,
      onCacheHit,
      onComplete,
      onError,
    ]
  )

  /**
   * 스트리밍 시작
   */
  const startStreaming = useCallback(
    (jobId: string) => {
      // 기존 연결 정리
      cleanup()

      // 상태 초기화
      setState({
        ...initialState,
        isStreaming: true,
        phase: 'initializing',
        message: '연결 중...',
      })

      // Job ID 저장
      currentJobIdRef.current = jobId
      reconnectAttemptsRef.current = 0

      // 연결 시작
      connect(jobId)
    },
    [cleanup, connect]
  )

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    ...state,
    startStreaming,
    stopStreaming,
    reset,
  }
}

/**
 * 편의 훅: 자동 시작
 *
 * @example
 * ```tsx
 * function ProposalStatus({ jobId }: { jobId: string }) {
 *   const { progress, message, result } = useProposalStreamAuto(jobId)
 *   return <Progress value={progress} label={message} />
 * }
 * ```
 */
export function useProposalStreamAuto(
  jobId: string | null,
  options: UseProposalStreamOptions = {}
): UseProposalStreamReturn {
  const stream = useProposalStream(options)

  useEffect(() => {
    if (jobId) {
      stream.startStreaming(jobId)
    } else {
      stream.reset()
    }

    return () => {
      stream.stopStreaming()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  return stream
}
