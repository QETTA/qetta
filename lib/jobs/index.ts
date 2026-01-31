/**
 * Job Queue Module
 *
 * BullMQ 기반 백그라운드 작업 처리.
 *
 * 환경 변수:
 * - REDIS_URL: Redis 연결 문자열
 *
 * @example
 * ```ts
 * import { addDocumentGenerationJob, startDocumentWorker } from '@/lib/jobs'
 *
 * // Worker 시작 (서버 초기화 시)
 * startDocumentWorker()
 *
 * // Job 추가
 * const job = await addDocumentGenerationJob({
 *   userId: 'user-1',
 *   companyBlockId: 'block-1',
 *   programId: 'AI001',
 *   programName: 'AI바우처',
 * })
 *
 * // 상태 조회
 * const status = await getJobStatus('qetta:document', job.id)
 * ```
 *
 * @module jobs
 */

// ============================================
// Queue
// ============================================

export {
  // Queue instances
  getQueue,
  getDocumentQueue,
  getLearningQueue,
  getAnalysisQueue,
  getBatchQueue,

  // Job operations
  addJob,
  addDocumentGenerationJob,
  addFactLearningJob,
  addRejectionAnalysisJob,
  getJobStatus,
  cancelJob,
  getQueueStats,

  // Worker registration
  registerWorker,

  // Events
  getQueueEvents,
  waitForJob,

  // Lifecycle
  closeAll,
  healthCheck,

  // Constants
  QUEUE_NAMES,
  DEFAULT_JOB_OPTIONS,

  // Types
  type JobType,
  type JobStatus,
  type BaseJobData,
  type DocumentGenerationJobData,
  type FactLearningJobData,
  type RejectionAnalysisJobData,
  type BatchApiCallJobData,
  type JobData,
  type JobResult,
  type QueueConfig,
  type JobProcessor,
} from './queue'

// ============================================
// Workers
// ============================================

export {
  startDocumentWorker,
  __test__ as documentWorkerTest,
} from './workers/document-generator'

export {
  startFactLearnerWorker,
  __test__ as factLearnerTest,
} from './workers/fact-learner'

// ============================================
// Convenience: Start All Workers
// ============================================

import { startDocumentWorker } from './workers/document-generator'
import { startFactLearnerWorker } from './workers/fact-learner'
import { logger } from '@/lib/api/logger'

let workersStarted = false

/**
 * 모든 Worker를 시작합니다.
 * 서버 초기화 시 호출하세요.
 */
export function startAllWorkers(): void {
  if (workersStarted) {
    logger.warn('[Jobs] Workers already started')
    return
  }

  startDocumentWorker()
  startFactLearnerWorker()

  workersStarted = true
  logger.info('[Jobs] All workers started')
}

/**
 * Worker 시작 여부 확인
 */
export function areWorkersStarted(): boolean {
  return workersStarted
}
