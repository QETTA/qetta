/**
 * Proposal Stream Types
 *
 * SSE 스트리밍 이벤트 타입 정의
 *
 * @module lib/proposals/stream/types
 */

// =============================================================================
// Event Types
// =============================================================================

export type ProposalStreamEventType =
  | 'progress'
  | 'section'
  | 'cache-hit'
  | 'complete'
  | 'error'

export type ProgressPhase =
  | 'initializing'
  | 'loading'
  | 'generating'
  | 'formatting'
  | 'caching'

// =============================================================================
// Event Data Types
// =============================================================================

export interface ProgressData {
  progress: number
  phase: ProgressPhase
  message?: string
}

export interface SectionData {
  index: number
  title: string
  content: string
}

export interface CacheHitData {
  contentHash: string
  source: 'memory' | 'redis'
  savedTimeMs: number
}

export interface CompleteData {
  jobId: string
  content: string
  sections: string[]
  tokensUsed: number
  generationTimeMs: number
  fromCache: boolean
}

export interface ErrorData {
  code: string
  message: string
}

export type StreamEventData =
  | ProgressData
  | SectionData
  | CacheHitData
  | CompleteData
  | ErrorData

// =============================================================================
// Event Structure
// =============================================================================

export interface ProposalStreamEvent {
  type: ProposalStreamEventType
  timestamp: string
  data: StreamEventData
}

// =============================================================================
// SSE Controller Interface
// =============================================================================

export interface SSEController {
  sendProgress: (progress: number, phase: ProgressPhase, message?: string) => void
  sendSection: (index: number, title: string, content: string) => void
  sendCacheHit: (contentHash: string, source: 'memory' | 'redis', savedTimeMs: number) => void
  sendComplete: (data: CompleteData) => void
  sendError: (code: string, message: string) => void
  close: () => void
}

// =============================================================================
// Job Status Map
// =============================================================================

export const JOB_STATUS_PROGRESS_MAP: Record<string, number> = {
  pending: 10,
  processing: 50,
  completed: 100,
  failed: 0,
}
