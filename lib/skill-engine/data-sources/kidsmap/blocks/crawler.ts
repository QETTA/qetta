/**
 * KidsMap 크롤링 파이프라인
 *
 * Bull MQ 기반 배치 크롤링 시스템
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'
import type {
  CrawlJob,
  CrawlJobConfig,
  CrawlJobType,
  CrawlJobStatus,
  CrawlProgress,
  CrawlResult,
} from './types'
import {
  getPlaceBlockRepository,
  getContentBlockRepository,
  generatePlaceDedupeHash,
  generateContentDedupeHash,
} from './repository'
import { getKidsMapClient } from '../client'
import { getTourApiClient } from '../tour-api-client'
import { getContentClient } from '../content-client'
import { getKakaoLocalClient } from '../kakao-client'
import type { NormalizedPlace, NormalizedContent, TourApiAreaCode } from '../types'
import { TOUR_API_AREA_CODES } from '../types'

// ============================================
// Redis 연결
// ============================================

let _redisConnection: IORedis | null = null

function getRedisConnection(): IORedis {
  if (_redisConnection) return _redisConnection

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    throw new Error('REDIS_URL 환경변수가 설정되지 않았습니다.')
  }

  _redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

  return _redisConnection
}

// ============================================
// 크롤링 큐
// ============================================

const QUEUE_NAME = 'kidsmap-crawl'

let _crawlQueue: Queue | null = null
let _queueEvents: QueueEvents | null = null

export function getCrawlQueue(): Queue {
  if (_crawlQueue) return _crawlQueue

  _crawlQueue = new Queue(QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        count: 100,
      },
      removeOnFail: {
        count: 50,
      },
    },
  })

  return _crawlQueue
}

export function getQueueEvents(): QueueEvents {
  if (_queueEvents) return _queueEvents

  _queueEvents = new QueueEvents(QUEUE_NAME, {
    connection: getRedisConnection(),
  })

  return _queueEvents
}

// ============================================
// 크롤링 작업 스케줄러
// ============================================

export interface CrawlJobOptions {
  type: CrawlJobType
  config: Partial<CrawlJobConfig>
  priority?: number
  delay?: number
  scheduledAt?: Date
}

const DEFAULT_CRAWL_CONFIG: CrawlJobConfig = {
  sources: ['TOUR_API', 'PLAYGROUND_API'],
  pageSize: 50,
  maxPages: 100,
  requestDelay: 500,
  concurrency: 2,
  retryOnFail: true,
  skipDuplicates: true,
  updateExisting: false,
}

/**
 * 크롤링 작업 추가
 */
export async function scheduleCrawlJob(options: CrawlJobOptions): Promise<string> {
  const queue = getCrawlQueue()

  const config: CrawlJobConfig = {
    ...DEFAULT_CRAWL_CONFIG,
    ...options.config,
  }

  const jobData: Omit<CrawlJob, 'id' | 'status' | 'createdAt'> = {
    type: options.type,
    priority: options.priority || 5,
    config,
    progress: {
      totalEstimated: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      percentage: 0,
    },
    retryCount: 0,
    maxRetries: 3,
  }

  const job = await queue.add(options.type, jobData, {
    priority: 10 - (options.priority || 5), // Bull MQ는 낮을수록 우선
    delay: options.delay,
    jobId: `crawl-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  })

  return job.id!
}

/**
 * 전체 크롤링 스케줄
 */
export async function scheduleFullCrawl(): Promise<string> {
  return scheduleCrawlJob({
    type: 'FULL_CRAWL',
    config: {
      sources: ['TOUR_API', 'PLAYGROUND_API', 'KAKAO_LOCAL'],
      maxPages: 200,
    },
    priority: 3,
  })
}

/**
 * 지역별 크롤링 스케줄
 */
export async function scheduleRegionCrawl(regionCodes: string[]): Promise<string> {
  return scheduleCrawlJob({
    type: 'REGION_CRAWL',
    config: {
      regionCodes,
      sources: ['TOUR_API', 'PLAYGROUND_API'],
    },
    priority: 5,
  })
}

/**
 * 콘텐츠 크롤링 스케줄
 */
export async function scheduleContentCrawl(keywords: string[]): Promise<string> {
  return scheduleCrawlJob({
    type: 'CONTENT_REFRESH',
    config: {
      sources: ['YOUTUBE', 'NAVER_BLOG', 'NAVER_CLIP'],
      keywords,
      maxPages: 50,
    },
    priority: 6,
  })
}

// ============================================
// 크롤러 구현
// ============================================

/**
 * TourAPI 크롤러
 */
async function crawlTourApi(
  config: CrawlJobConfig,
  onProgress: (progress: Partial<CrawlProgress>) => void
): Promise<NormalizedPlace[]> {
  const tourClient = getTourApiClient()
  const places: NormalizedPlace[] = []
  const regionCodes = config.regionCodes || Object.values(TOUR_API_AREA_CODES)

  let processed = 0
  const totalRegions = regionCodes.length

  for (const areaCode of regionCodes) {
    try {
      onProgress({ currentSource: 'TOUR_API', currentPage: processed + 1 })

      // 어린이 관련 장소 검색
      const result = await tourClient.searchKidsPlaces({
        areaCode: areaCode as TourApiAreaCode,
        page: 1,
        pageSize: config.pageSize,
      })

      places.push(...result.places)
      processed++

      onProgress({
        processed,
        percentage: Math.round((processed / totalRegions) * 100),
      })

      // 요청 간 딜레이
      await delay(config.requestDelay)
    } catch (error) {
      console.error(`[TourAPI] 지역 ${areaCode} 크롤링 실패:`, error)
      if (!config.retryOnFail) throw error
    }
  }

  return places
}

/**
 * PlaygroundAPI 크롤러
 */
async function crawlPlaygroundApi(
  config: CrawlJobConfig,
  onProgress: (progress: Partial<CrawlProgress>) => void
): Promise<NormalizedPlace[]> {
  const client = getKidsMapClient()
  const places: NormalizedPlace[] = []

  try {
    onProgress({ currentSource: 'PLAYGROUND_API' })

    // 키즈카페 검색
    const kidsCafes = await client.searchKidsCafes({
      pageSize: config.pageSize * config.maxPages,
    })
    places.push(...kidsCafes.places)

    onProgress({ processed: places.length })
  } catch (error) {
    console.error('[PlaygroundAPI] 크롤링 실패:', error)
    if (!config.retryOnFail) throw error
  }

  return places
}

/**
 * Kakao Local 크롤러
 */
async function crawlKakaoLocal(
  config: CrawlJobConfig,
  onProgress: (progress: Partial<CrawlProgress>) => void
): Promise<NormalizedPlace[]> {
  const client = getKakaoLocalClient()
  const places: NormalizedPlace[] = []

  const keywords = ['키즈카페', '어린이 놀이터', '실내 놀이터', '아이랑 갈만한곳']
  let processed = 0

  for (const keyword of keywords) {
    try {
      onProgress({ currentSource: 'KAKAO_LOCAL', currentPage: processed + 1 })

      const result = await client.searchByKeyword(keyword, {
        size: 15,
      })

      // Kakao 결과는 이미 NormalizedPlace로 반환됨
      places.push(...result.places)

      processed++
      await delay(config.requestDelay)
    } catch (error) {
      console.error(`[KakaoLocal] 키워드 "${keyword}" 크롤링 실패:`, error)
    }
  }

  return places
}

/**
 * 콘텐츠 크롤러 (YouTube, Naver)
 */
async function crawlContent(
  config: CrawlJobConfig,
  onProgress: (progress: Partial<CrawlProgress>) => void
): Promise<NormalizedContent[]> {
  const client = getContentClient()
  const contents: NormalizedContent[] = []

  const keywords = config.keywords || [
    '키즈카페 추천',
    '아이랑 놀이공원',
    '어린이 박물관 후기',
    '실내놀이터 브이로그',
  ]

  let processed = 0

  for (const keyword of keywords) {
    try {
      for (const source of config.sources.filter((s) =>
        ['YOUTUBE', 'NAVER_BLOG', 'NAVER_CLIP'].includes(s)
      )) {
        onProgress({ currentSource: source, currentPage: processed + 1 })

        const result = await client.search({
          keyword,
          sources: [source as 'YOUTUBE' | 'NAVER_BLOG' | 'NAVER_CLIP'],
          pageSize: config.pageSize,
          safeSearch: true,
        })

        contents.push(...result.contents)
        processed++

        await delay(config.requestDelay)
      }
    } catch (error) {
      console.error(`[Content] 키워드 "${keyword}" 크롤링 실패:`, error)
    }
  }

  return contents
}

// ============================================
// 워커 프로세서
// ============================================

async function processCrawlJob(job: Job<CrawlJob>): Promise<CrawlResult> {
  const { type, config } = job.data
  const placeRepo = getPlaceBlockRepository()
  const contentRepo = getContentBlockRepository()

  const result: CrawlResult = {
    newBlocks: 0,
    updatedBlocks: 0,
    deletedBlocks: 0,
    duplicatesSkipped: 0,
    sourceStats: {},
    duration: 0,
  }

  const startTime = Date.now()

  const updateProgress = async (progress: Partial<CrawlProgress>) => {
    const currentProgress = job.data.progress
    await job.updateProgress({
      ...currentProgress,
      ...progress,
    })
  }

  try {
    const places: NormalizedPlace[] = []
    let contents: NormalizedContent[] = []

    // 타입별 크롤링 실행
    switch (type) {
      case 'FULL_CRAWL':
      case 'REGION_CRAWL':
      case 'CATEGORY_CRAWL':
        if (config.sources.includes('TOUR_API')) {
          const tourPlaces = await crawlTourApi(config, updateProgress)
          places.push(...tourPlaces)
          result.sourceStats['TOUR_API'] = {
            total: tourPlaces.length,
            success: tourPlaces.length,
            failed: 0,
          }
        }

        if (config.sources.includes('PLAYGROUND_API')) {
          const pgPlaces = await crawlPlaygroundApi(config, updateProgress)
          places.push(...pgPlaces)
          result.sourceStats['PLAYGROUND_API'] = {
            total: pgPlaces.length,
            success: pgPlaces.length,
            failed: 0,
          }
        }

        if (config.sources.includes('KAKAO_LOCAL')) {
          const kakaoPlaces = await crawlKakaoLocal(config, updateProgress)
          places.push(...kakaoPlaces)
          result.sourceStats['KAKAO_LOCAL'] = {
            total: kakaoPlaces.length,
            success: kakaoPlaces.length,
            failed: 0,
          }
        }
        break

      case 'CONTENT_REFRESH':
        contents = await crawlContent(config, updateProgress)
        break

      case 'INCREMENTAL':
        // 최근 업데이트된 항목만 크롤링
        // TODO: 구현
        break
    }

    // 장소 데이터 저장
    for (const place of places) {
      try {
        const dedupeHash = generatePlaceDedupeHash(place)
        const existing = await placeRepo.findByDedupeHash(dedupeHash)

        if (existing) {
          if (config.skipDuplicates) {
            result.duplicatesSkipped++
          } else if (config.updateExisting) {
            await placeRepo.update(existing.id, place)
            result.updatedBlocks++
          } else {
            result.duplicatesSkipped++
          }
        } else {
          await placeRepo.create(place)
          result.newBlocks++
        }
      } catch (error) {
        console.error('[Crawler] 장소 저장 실패:', error)
      }
    }

    // 콘텐츠 데이터 저장
    for (const content of contents) {
      try {
        generateContentDedupeHash(content)
        // 중복 체크 후 저장
        await contentRepo.create(content)
        result.newBlocks++
      } catch (error) {
        if ((error as Error).message.includes('중복')) {
          result.duplicatesSkipped++
        } else {
          console.error('[Crawler] 콘텐츠 저장 실패:', error)
        }
      }
    }

    result.duration = Date.now() - startTime

    await updateProgress({
      percentage: 100,
      processed: places.length + contents.length,
      succeeded: result.newBlocks + result.updatedBlocks,
      skipped: result.duplicatesSkipped,
    })

    return result
  } catch (error) {
    console.error('[Crawler] 작업 실패:', error)
    throw error
  }
}

// ============================================
// 워커 시작
// ============================================

let _worker: Worker | null = null

export function startCrawlWorker(): Worker {
  if (_worker) return _worker

  _worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      console.log(`[Worker] 작업 시작: ${job.id} (${job.data.type})`)
      const result = await processCrawlJob(job)
      console.log(`[Worker] 작업 완료: ${job.id}`, result)
      return result
    },
    {
      connection: getRedisConnection(),
      concurrency: 2,
      limiter: {
        max: 10,
        duration: 60000, // 분당 10개 작업
      },
    }
  )

  _worker.on('completed', (job, result) => {
    console.log(`[Worker] 완료: ${job.id}`, result)
  })

  _worker.on('failed', (job, error) => {
    console.error(`[Worker] 실패: ${job?.id}`, error)
  })

  _worker.on('progress', (job, progress) => {
    console.log(`[Worker] 진행: ${job.id}`, progress)
  })

  return _worker
}

export async function stopCrawlWorker(): Promise<void> {
  if (_worker) {
    await _worker.close()
    _worker = null
  }
}

// ============================================
// 유틸리티
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}


// ============================================
// 작업 상태 조회
// ============================================

export async function getJobStatus(jobId: string): Promise<{
  status: CrawlJobStatus
  progress: CrawlProgress
  result?: CrawlResult
}> {
  const queue = getCrawlQueue()
  const job = await queue.getJob(jobId)

  if (!job) {
    throw new Error('작업을 찾을 수 없습니다.')
  }

  const state = await job.getState()
  const status: CrawlJobStatus =
    state === 'active'
      ? 'running'
      : state === 'completed'
        ? 'completed'
        : state === 'failed'
          ? 'failed'
          : state === 'delayed'
            ? 'pending'
            : 'pending'

  return {
    status,
    progress: (job.progress as CrawlProgress) || job.data.progress,
    result: job.returnvalue as CrawlResult | undefined,
  }
}

export async function getQueueStats(): Promise<{
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
}> {
  const queue = getCrawlQueue()

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ])

  return { waiting, active, completed, failed, delayed }
}
