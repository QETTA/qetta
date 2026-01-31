/**
 * KidsMap 데이터 블록 모듈
 *
 * 대규모 장소/콘텐츠 데이터 저장 및 크롤링 시스템
 *
 * @example
 * ```ts
 * import {
 *   getPlaceBlockRepository,
 *   getContentBlockRepository,
 *   scheduleCrawlJob,
 *   startCrawlWorker,
 * } from '@/lib/skill-engine/data-sources/kidsmap/blocks'
 *
 * // 장소 블록 조회
 * const placeRepo = getPlaceBlockRepository()
 * const places = await placeRepo.search({
 *   categories: ['kids_cafe'],
 *   regionCodes: ['1'], // 서울
 *   qualityGrades: ['A', 'B'],
 * })
 *
 * // 크롤링 작업 스케줄
 * const jobId = await scheduleCrawlJob({
 *   type: 'REGION_CRAWL',
 *   config: { regionCodes: ['1', '31'] },
 * })
 *
 * // 워커 시작 (서버 사이드)
 * startCrawlWorker()
 * ```
 *
 * @module kidsmap/blocks
 */

// ============================================
// 타입 export
// ============================================

export type {
  // 블록 타입
  PlaceBlock,
  ContentBlock,
  BlockStatus,
  QualityGrade,
  FreshnessLevel,

  // 메타데이터
  PlaceBlockMetadata,
  PlaceEditHistory,
  ContentBlockMetadata,
  ContentAnalysis,

  // 크롤링 타입
  CrawlJob,
  CrawlJobType,
  CrawlJobStatus,
  CrawlJobConfig,
  CrawlProgress,
  CrawlResult,
  CrawlError,
  CrawlSchedule,

  // 통계
  BlockStats,

  // 필터/검색
  PlaceBlockFilter,
  ContentBlockFilter,
  PaginatedResponse,
} from './types'

// ============================================
// 저장소 export
// ============================================

export {
  // 장소 블록 저장소
  PlaceBlockRepository,
  getPlaceBlockRepository,

  // 콘텐츠 블록 저장소
  ContentBlockRepository,
  getContentBlockRepository,

  // 통계 저장소
  BlockStatsRepository,
  getBlockStatsRepository,

  // 유틸리티
  generatePlaceDedupeHash,
  generateContentDedupeHash,
  calculateCompleteness,
  calculateQualityGrade,
  extractSearchKeywords,
  extractRegionCode,
} from './repository'

// ============================================
// 크롤러 export
// ============================================

export {
  // 큐 관리
  getCrawlQueue,
  getQueueEvents,

  // 작업 스케줄링
  scheduleCrawlJob,
  scheduleFullCrawl,
  scheduleRegionCrawl,
  scheduleContentCrawl,

  // 워커
  startCrawlWorker,
  stopCrawlWorker,

  // 상태 조회
  getJobStatus,
  getQueueStats,
} from './crawler'

export type { CrawlJobOptions } from './crawler'

// ============================================
// 파이프라인 export
// ============================================

export {
  // ETL 파이프라인
  DataBlockPipeline,

  // 최적화
  BlockOptimizer,

  // 마이그레이션
  BlockMigrator,

  // 모니터링
  BlockMonitor,
} from './pipeline'

export type {
  PipelineConfig,
  PipelineResult,
  PipelineError,
  MigrationConfig,
  MigrationResult,
  MonitoringMetrics,
} from './pipeline'
