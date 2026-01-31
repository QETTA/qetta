/**
 * Proposal Job Processor
 *
 * Job 상태 폴링 및 처리 로직
 *
 * @module lib/proposals/stream/job-processor
 */

import { getProposalJobById } from '@/lib/block-engine/proposal-job-store'
import { logger } from '@/lib/api/logger'
import type { SSEController } from './types'
import { JOB_STATUS_PROGRESS_MAP } from './types'

// =============================================================================
// Constants
// =============================================================================

const MAX_POLL_ATTEMPTS = 60 // 최대 60초
const POLL_INTERVAL_MS = 1000 // 1초 간격

// =============================================================================
// Job Status Polling
// =============================================================================

/**
 * 기존 Job 상태를 폴링하며 SSE로 전송
 *
 * @param jobId - 폴링할 Job ID
 * @param sse - SSE 컨트롤러
 */
export async function pollJobStatus(
  jobId: string,
  sse: SSEController
): Promise<void> {
  let attempts = 0

  const poll = async (): Promise<void> => {
    attempts++

    try {
      const currentJob = await getProposalJobById(jobId)

      if (!currentJob) {
        sse.sendError('JOB_NOT_FOUND', 'Job disappeared')
        sse.close()
        return
      }

      // 상태별 진행률 전송
      sse.sendProgress(
        JOB_STATUS_PROGRESS_MAP[currentJob.status] || 0,
        currentJob.status === 'pending' ? 'initializing' : 'generating',
        `상태: ${currentJob.status}`
      )

      // 완료 상태
      if (currentJob.status === 'completed' && currentJob.result) {
        sse.sendComplete({
          jobId: currentJob.id,
          content: currentJob.result.content,
          sections: currentJob.result.sections,
          tokensUsed: currentJob.result.tokensUsed,
          generationTimeMs: 0,
          fromCache: false,
        })
        sse.close()
        return
      }

      // 실패 상태
      if (currentJob.status === 'failed' && currentJob.error) {
        sse.sendError(currentJob.error.code, currentJob.error.message)
        sse.close()
        return
      }

      // 타임아웃 체크
      if (attempts >= MAX_POLL_ATTEMPTS) {
        sse.sendError('TIMEOUT', '작업 시간 초과')
        sse.close()
        return
      }

      // 다음 폴링 예약
      setTimeout(poll, POLL_INTERVAL_MS)
    } catch (error) {
      logger.error('[Job Processor] Poll error:', error)
      sse.sendError(
        'POLL_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
      sse.close()
    }
  }

  await poll()
}

// =============================================================================
// Initial Job Status Check
// =============================================================================

/**
 * Job 초기 상태 확인 및 즉시 응답
 *
 * @returns true if job is already terminal (completed/failed), false if needs polling
 */
export async function checkInitialJobStatus(
  jobId: string,
  sse: SSEController
): Promise<boolean> {
  const job = await getProposalJobById(jobId)

  if (!job) {
    return false // 호출자가 404 처리
  }

  // 이미 완료된 경우
  if (job.status === 'completed' && job.result) {
    sse.sendComplete({
      jobId: job.id,
      content: job.result.content,
      sections: job.result.sections,
      tokensUsed: job.result.tokensUsed,
      generationTimeMs: 0,
      fromCache: false,
    })
    sse.close()
    return true
  }

  // 이미 실패한 경우
  if (job.status === 'failed' && job.error) {
    sse.sendError(job.error.code, job.error.message)
    sse.close()
    return true
  }

  return false // 폴링 필요
}
