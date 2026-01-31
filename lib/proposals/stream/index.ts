/**
 * Proposal Stream Module
 *
 * SSE 스트리밍 기반 제안서 생성 모듈
 *
 * @module lib/proposals/stream
 */

// Types
export type {
  ProposalStreamEventType,
  ProgressPhase,
  ProgressData,
  SectionData,
  CacheHitData,
  CompleteData,
  ErrorData,
  StreamEventData,
  ProposalStreamEvent,
  SSEController,
} from './types'
export { JOB_STATUS_PROGRESS_MAP } from './types'

// SSE Handlers
export {
  createSSEEvent,
  createSSEController,
  createSSEResponse,
  SSE_RESPONSE_HEADERS,
} from './sse-handler'

// Job Processing
export { pollJobStatus, checkInitialJobStatus } from './job-processor'

// Claude Streaming
export type { GenerationParams, GenerationResult } from './claude-stream'
export { generateProposalWithStreaming, checkCache } from './claude-stream'
