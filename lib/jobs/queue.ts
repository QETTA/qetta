/**
 * Job Queue (BullMQ)
 *
 * Redis 기반 백그라운드 작업 큐.
 * - 대용량 제안서 생성
 * - Fact 자동 학습
 * - 외부 API 배치 처리
 *
 * 환경 변수:
 * - REDIS_URL: Redis 연결 문자열 (필수)
 * - REDIS_HOST, REDIS_PORT: 개별 설정 (선택)
 */

import { Queue, Worker, Job, QueueEvents, ConnectionOptions } from 'bullmq'
import IORedis from 'ioredis'
import { logger } from '@/lib/api/logger'

// ============================================
// Types
// ============================================

export type JobType =
  | 'document_generation'
  | 'fact_learning'
  | 'rejection_analysis'
  | 'batch_api_call'

export interface BaseJobData {
  userId: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface DocumentGenerationJobData extends BaseJobData {
  companyBlockId: string
  programId: string
  programName: string
  templateId?: string
}

export interface FactLearningJobData extends BaseJobData {
  companyId: string
  source: 'rejection' | 'application' | 'document'
  sourceId: string
  content: string
}

export interface RejectionAnalysisJobData extends BaseJobData {
  companyId: string
  applicationId: string
  rejectionReason: string
  programName: string
}

export interface BatchApiCallJobData extends BaseJobData {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  payload?: unknown
  retryCount?: number
}

export type JobData =
  | DocumentGenerationJobData
  | FactLearningJobData
  | RejectionAnalysisJobData
  | BatchApiCallJobData

export interface JobResult {
  success: boolean
  data?: unknown
  error?: string
  completedAt: string
}

export interface QueueConfig {
  /** 큐 이름 */
  name: string
  /** 기본 재시도 횟수 */
  defaultRetries?: number
  /** 재시도 딜레이 (ms) */
  retryDelay?: number
  /** 작업 타임아웃 (ms) */
  timeout?: number
}

// ============================================
// Constants
// ============================================

export const QUEUE_NAMES = {
  DOCUMENT: 'qetta:document',
  LEARNING: 'qetta:learning',
  ANALYSIS: 'qetta:analysis',
  BATCH: 'qetta:batch',
} as const

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    age: 24 * 60 * 60, // 24시간 후 삭제
    count: 1000, // 최대 1000개 유지
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60, // 7일 후 삭제
  },
}

// ============================================
// Redis Connection
// ============================================

let redisConnection: IORedis | null = null

/**
 * Redis 연결 옵션을 생성합니다.
 */
function getRedisConnection(): IORedis {
  if (redisConnection) {
    return redisConnection
  }

  const redisUrl = process.env.REDIS_URL
  const redisHost = process.env.REDIS_HOST ?? 'localhost'
  const redisPort = parseInt(process.env.REDIS_PORT ?? '6379', 10)

  if (redisUrl) {
    redisConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  } else {
    redisConnection = new IORedis(redisPort, redisHost, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  }

  redisConnection.on('connect', () => {
    logger.info('[JobQueue] Redis connected')
  })

  redisConnection.on('error', (err) => {
    logger.error('[JobQueue] Redis error', { error: err })
  })

  return redisConnection
}

/**
 * BullMQ 연결 옵션
 */
function getConnectionOptions(): { connection: IORedis } {
  return {
    connection: getRedisConnection(),
  }
}

// ============================================
// Queue Factory
// ============================================

const queues = new Map<string, Queue>()
const workers = new Map<string, Worker>()
const queueEvents = new Map<string, QueueEvents>()

/**
 * 큐 인스턴스를 가져옵니다.
 */
export function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      ...getConnectionOptions(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    })
    queues.set(name, queue)
    logger.info(`[JobQueue] Queue created: ${name}`)
  }
  return queues.get(name)!
}

/**
 * 문서 생성 큐
 */
export function getDocumentQueue(): Queue<DocumentGenerationJobData, JobResult> {
  return getQueue(QUEUE_NAMES.DOCUMENT) as Queue<DocumentGenerationJobData, JobResult>
}

/**
 * 학습 큐
 */
export function getLearningQueue(): Queue<FactLearningJobData, JobResult> {
  return getQueue(QUEUE_NAMES.LEARNING) as Queue<FactLearningJobData, JobResult>
}

/**
 * 분석 큐
 */
export function getAnalysisQueue(): Queue<RejectionAnalysisJobData, JobResult> {
  return getQueue(QUEUE_NAMES.ANALYSIS) as Queue<RejectionAnalysisJobData, JobResult>
}

/**
 * 배치 큐
 */
export function getBatchQueue(): Queue<BatchApiCallJobData, JobResult> {
  return getQueue(QUEUE_NAMES.BATCH) as Queue<BatchApiCallJobData, JobResult>
}

// ============================================
// Job Operations
// ============================================

/**
 * 작업을 추가합니다.
 */
export async function addJob<T extends JobData>(
  queueName: string,
  data: T,
  options: {
    priority?: number
    delay?: number
    jobId?: string
  } = {}
): Promise<Job<T, JobResult>> {
  const queue = getQueue(queueName)
  const job = await queue.add(
    'job',
    data,
    {
      priority: options.priority,
      delay: options.delay,
      jobId: options.jobId,
    }
  )
  logger.info(`[JobQueue] Job added: ${job.id} to ${queueName}`)
  return job as Job<T, JobResult>
}

/**
 * 문서 생성 작업을 추가합니다.
 */
export async function addDocumentGenerationJob(
  data: Omit<DocumentGenerationJobData, 'createdAt'>,
  options?: { priority?: number; delay?: number }
): Promise<Job<DocumentGenerationJobData, JobResult>> {
  return addJob(QUEUE_NAMES.DOCUMENT, {
    ...data,
    createdAt: new Date().toISOString(),
  }, options)
}

/**
 * Fact 학습 작업을 추가합니다.
 */
export async function addFactLearningJob(
  data: Omit<FactLearningJobData, 'createdAt'>,
  options?: { priority?: number; delay?: number }
): Promise<Job<FactLearningJobData, JobResult>> {
  return addJob(QUEUE_NAMES.LEARNING, {
    ...data,
    createdAt: new Date().toISOString(),
  }, options)
}

/**
 * 탈락 분석 작업을 추가합니다.
 */
export async function addRejectionAnalysisJob(
  data: Omit<RejectionAnalysisJobData, 'createdAt'>,
  options?: { priority?: number; delay?: number }
): Promise<Job<RejectionAnalysisJobData, JobResult>> {
  return addJob(QUEUE_NAMES.ANALYSIS, {
    ...data,
    createdAt: new Date().toISOString(),
  }, options)
}

/** Job 상태 타입 */
export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'prioritized' | 'unknown'

/**
 * 작업 상태를 조회합니다.
 */
export async function getJobStatus(
  queueName: string,
  jobId: string
): Promise<{
  id: string
  status: JobStatus
  progress: number
  data: JobData | null
  result: JobResult | null
  failedReason: string | null
  attemptsMade: number
  timestamp: number
} | null> {
  const queue = getQueue(queueName)
  const job = await queue.getJob(jobId)

  if (!job) {
    return null
  }

  const state = await job.getState()

  return {
    id: job.id ?? jobId,
    status: state as JobStatus,
    progress: job.progress as number,
    data: job.data as JobData,
    result: job.returnvalue as JobResult | null,
    failedReason: job.failedReason ?? null,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
  }
}

/**
 * 작업을 취소합니다.
 */
export async function cancelJob(queueName: string, jobId: string): Promise<boolean> {
  const queue = getQueue(queueName)
  const job = await queue.getJob(jobId)

  if (!job) {
    return false
  }

  const state = await job.getState()
  if (state === 'waiting' || state === 'delayed') {
    await job.remove()
    logger.info(`[JobQueue] Job cancelled: ${jobId}`)
    return true
  }

  return false
}

/**
 * 대기 중인 작업 수를 조회합니다.
 */
export async function getQueueStats(queueName: string): Promise<{
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
}> {
  const queue = getQueue(queueName)
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ])

  return { waiting, active, completed, failed, delayed }
}

// ============================================
// Worker Registration
// ============================================

export type JobProcessor<T extends JobData> = (job: Job<T, JobResult>) => Promise<JobResult>

/**
 * Worker를 등록합니다.
 */
export function registerWorker<T extends JobData>(
  queueName: string,
  processor: JobProcessor<T>,
  options: {
    concurrency?: number
    limiter?: { max: number; duration: number }
  } = {}
): Worker<T, JobResult> {
  if (workers.has(queueName)) {
    logger.warn(`[JobQueue] Worker already registered for ${queueName}`)
    return workers.get(queueName) as Worker<T, JobResult>
  }

  const worker = new Worker<T, JobResult>(
    queueName,
    async (job) => {
      logger.info(`[JobQueue] Processing job: ${job.id} in ${queueName}`)
      try {
        const result = await processor(job)
        logger.info(`[JobQueue] Job completed: ${job.id}`)
        return result
      } catch (error) {
        logger.error(`[JobQueue] Job failed: ${job.id}`, { error })
        throw error
      }
    },
    {
      ...getConnectionOptions(),
      concurrency: options.concurrency ?? 5,
      limiter: options.limiter,
    }
  )

  worker.on('completed', (job) => {
    logger.debug(`[JobQueue] Job ${job?.id} completed`)
  })

  worker.on('failed', (job, error) => {
    logger.error(`[JobQueue] Job ${job?.id} failed`, { error })
  })

  worker.on('error', (error) => {
    logger.error('[JobQueue] Worker error', { error })
  })

  workers.set(queueName, worker)
  logger.info(`[JobQueue] Worker registered: ${queueName}`)

  return worker
}

// ============================================
// Queue Events
// ============================================

/**
 * Queue 이벤트 리스너를 등록합니다.
 */
export function getQueueEvents(queueName: string): QueueEvents {
  if (!queueEvents.has(queueName)) {
    const events = new QueueEvents(queueName, getConnectionOptions())
    queueEvents.set(queueName, events)
  }
  return queueEvents.get(queueName)!
}

/**
 * 작업 완료를 대기합니다.
 */
export async function waitForJob(
  queueName: string,
  jobId: string,
  timeout: number = 30000
): Promise<JobResult | null> {
  const events = getQueueEvents(queueName)

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(null)
    }, timeout)

    events.on('completed', ({ jobId: completedId, returnvalue }) => {
      if (completedId === jobId) {
        clearTimeout(timer)
        // returnvalue는 JSON 문자열로 전달되므로 파싱 필요
        const result = typeof returnvalue === 'string'
          ? JSON.parse(returnvalue) as JobResult
          : returnvalue as unknown as JobResult
        resolve(result)
      }
    })

    events.on('failed', ({ jobId: failedId, failedReason }) => {
      if (failedId === jobId) {
        clearTimeout(timer)
        resolve({
          success: false,
          error: failedReason,
          completedAt: new Date().toISOString(),
        })
      }
    })
  })
}

// ============================================
// Cleanup
// ============================================

/**
 * 모든 큐와 워커를 정리합니다.
 */
export async function closeAll(): Promise<void> {
  // Workers 종료
  for (const [name, worker] of workers) {
    await worker.close()
    logger.info(`[JobQueue] Worker closed: ${name}`)
  }
  workers.clear()

  // Queue Events 종료
  for (const [name, events] of queueEvents) {
    await events.close()
    logger.info(`[JobQueue] QueueEvents closed: ${name}`)
  }
  queueEvents.clear()

  // Queues 종료
  for (const [name, queue] of queues) {
    await queue.close()
    logger.info(`[JobQueue] Queue closed: ${name}`)
  }
  queues.clear()

  // Redis 연결 종료
  if (redisConnection) {
    await redisConnection.quit()
    redisConnection = null
    logger.info('[JobQueue] Redis connection closed')
  }
}

// ============================================
// Health Check
// ============================================

/**
 * Redis 연결 상태를 확인합니다.
 */
export async function healthCheck(): Promise<{
  connected: boolean
  latencyMs: number | null
}> {
  try {
    const redis = getRedisConnection()
    const start = Date.now()
    await redis.ping()
    const latency = Date.now() - start

    return { connected: true, latencyMs: latency }
  } catch (error) {
    logger.error('[JobQueue] Health check failed', { error })
    return { connected: false, latencyMs: null }
  }
}
