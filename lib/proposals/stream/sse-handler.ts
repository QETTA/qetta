/**
 * SSE Handler Utilities
 *
 * Server-Sent Events 생성 및 응답 헬퍼
 *
 * @module lib/proposals/stream/sse-handler
 */

import type {
  ProposalStreamEventType,
  StreamEventData,
  ProposalStreamEvent,
  SSEController,
  CompleteData,
  ProgressPhase,
} from './types'

// =============================================================================
// SSE Event Creation
// =============================================================================

/**
 * SSE 이벤트 문자열 생성
 */
export function createSSEEvent(
  type: ProposalStreamEventType,
  data: StreamEventData
): string {
  const event: ProposalStreamEvent = {
    type,
    timestamp: new Date().toISOString(),
    data,
  }
  return `event: ${type}\ndata: ${JSON.stringify(event)}\n\n`
}

// =============================================================================
// SSE Controller Factory
// =============================================================================

/**
 * SSE 컨트롤러 생성
 *
 * ReadableStream controller와 TextEncoder를 받아
 * 타입-안전한 이벤트 전송 메서드를 제공
 */
export function createSSEController(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder
): SSEController {
  return {
    sendProgress: (progress: number, phase: ProgressPhase, message?: string) => {
      const event = createSSEEvent('progress', { progress, phase, message })
      controller.enqueue(encoder.encode(event))
    },

    sendSection: (index: number, title: string, content: string) => {
      const event = createSSEEvent('section', { index, title, content })
      controller.enqueue(encoder.encode(event))
    },

    sendCacheHit: (
      contentHash: string,
      source: 'memory' | 'redis',
      savedTimeMs: number
    ) => {
      const event = createSSEEvent('cache-hit', { contentHash, source, savedTimeMs })
      controller.enqueue(encoder.encode(event))
    },

    sendComplete: (data: CompleteData) => {
      const event = createSSEEvent('complete', data)
      controller.enqueue(encoder.encode(event))
    },

    sendError: (code: string, message: string) => {
      const event = createSSEEvent('error', { code, message })
      controller.enqueue(encoder.encode(event))
    },

    close: () => {
      controller.close()
    },
  }
}

// =============================================================================
// SSE Response Headers
// =============================================================================

export const SSE_RESPONSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const

/**
 * SSE Response 생성 헬퍼
 */
export function createSSEResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: SSE_RESPONSE_HEADERS,
  })
}
