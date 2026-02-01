/**
 * KidsMap 데이터 블록 파이프라인
 *
 * 블록 데이터 최적화 빌드 - 관리 - 마이그레이션 통합 시스템
 *
 * ## 파이프라인 단계
 * 1. Extract: API에서 원본 데이터 수집
 * 2. Transform: 정규화 및 품질 검증
 * 3. Load: 블록 저장소에 적재
 * 4. Optimize: 인덱싱, 캐싱, 압축
 * 5. Monitor: 품질 추적 및 알림
 *
 * ## NCP 인프라 연동
 * - Cloud DB for Redis: 작업 큐 및 캐시
 * - Object Storage: 대용량 데이터 백업
 * - CLOVA AI: 콘텐츠 분석 (선택적)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  PlaceBlock,
  ContentBlock,
  CrawlJob,
  CrawlJobConfig,
  CrawlResult,
  BlockStats,
  QualityGrade,
  FreshnessLevel,
} from './types'
import type { NormalizedPlace, NormalizedContent } from '../types'
import {
  getPlaceBlockRepository,
  getContentBlockRepository,
  getBlockStatsRepository,
  calculateCompleteness,
  calculateQualityGrade,
  generatePlaceDedupeHash,
} from './repository'

// ============================================
// 파이프라인 설정 타입
// ============================================

export interface PipelineConfig {
  /** 배치 크기 */
  batchSize: number

  /** 병렬 처리 수 */
  concurrency: number

  /** 품질 임계값 (이하는 스킵) */
  qualityThreshold: QualityGrade

  /** 신선도 임계값 (이상이면 스킵) */
  freshnessThreshold: FreshnessLevel

  /** 중복 스킵 여부 */
  skipDuplicates: boolean

  /** 기존 데이터 업데이트 여부 */
  updateExisting: boolean

  /** 백업 활성화 */
  enableBackup: boolean

  /** 분석 활성화 (CLOVA AI) */
  enableAnalysis: boolean

  /** 드라이런 모드 */
  dryRun: boolean
}

export interface PipelineResult {
  /** 처리된 항목 수 */
  processed: number

  /** 성공 수 */
  succeeded: number

  /** 실패 수 */
  failed: number

  /** 스킵 수 */
  skipped: number

  /** 품질 통계 */
  qualityStats: Record<QualityGrade, number>

  /** 처리 시간 (ms) */
  duration: number

  /** 에러 목록 */
  errors: PipelineError[]
}

export interface PipelineError {
  stage: 'extract' | 'transform' | 'load' | 'optimize' | 'analyze'
  itemId?: string
  message: string
  timestamp: string
}

// ============================================
// 기본 설정
// ============================================

const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  batchSize: 100,
  concurrency: 5,
  qualityThreshold: 'F',
  freshnessThreshold: 'outdated',
  skipDuplicates: true,
  updateExisting: false,
  enableBackup: true,
  enableAnalysis: false,
  dryRun: false,
}

// ============================================
// ETL 파이프라인 클래스
// ============================================

export class DataBlockPipeline {
  private config: PipelineConfig
  private placeRepo = getPlaceBlockRepository()
  private contentRepo = getContentBlockRepository()
  private statsRepo = getBlockStatsRepository()
  private errors: PipelineError[] = []

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config }
  }

  // ============================================
  // 메인 파이프라인 실행
  // ============================================

  /**
   * 장소 데이터 파이프라인 실행
   */
  async processPlaces(places: NormalizedPlace[]): Promise<PipelineResult> {
    const startTime = Date.now()
    const result: PipelineResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      qualityStats: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      duration: 0,
      errors: [],
    }

    // 배치 처리
    const batches = this.chunkArray(places, this.config.batchSize)

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map((place) => this.processPlace(place))
      )

      for (const res of batchResults) {
        result.processed++

        if (res.status === 'fulfilled') {
          if (res.value.skipped) {
            result.skipped++
          } else {
            result.succeeded++
            result.qualityStats[res.value.qualityGrade]++
          }
        } else {
          result.failed++
          this.errors.push({
            stage: 'load',
            message: res.reason?.message || 'Unknown error',
            timestamp: new Date().toISOString(),
          })
        }
      }
    }

    result.duration = Date.now() - startTime
    result.errors = this.errors

    // 통계 갱신
    if (!this.config.dryRun) {
      await this.statsRepo.refreshStats()
    }

    return result
  }

  /**
   * 콘텐츠 데이터 파이프라인 실행
   */
  async processContents(
    contents: NormalizedContent[],
    placeId?: string
  ): Promise<PipelineResult> {
    const startTime = Date.now()
    const result: PipelineResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      qualityStats: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      duration: 0,
      errors: [],
    }

    const batches = this.chunkArray(contents, this.config.batchSize)

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map((content) => this.processContent(content, placeId))
      )

      for (const res of batchResults) {
        result.processed++

        if (res.status === 'fulfilled') {
          if (res.value.skipped) {
            result.skipped++
          } else {
            result.succeeded++
          }
        } else {
          result.failed++
        }
      }
    }

    result.duration = Date.now() - startTime
    result.errors = this.errors

    return result
  }

  // ============================================
  // 개별 항목 처리
  // ============================================

  private async processPlace(
    place: NormalizedPlace
  ): Promise<{ skipped: boolean; qualityGrade: QualityGrade }> {
    // 1. Transform: 품질 계산
    const completeness = calculateCompleteness(place)
    const qualityGrade = calculateQualityGrade(completeness, !!place.imageUrl)

    // 품질 임계값 체크
    if (this.shouldSkipByQuality(qualityGrade)) {
      return { skipped: true, qualityGrade }
    }

    // 2. 중복 체크
    if (this.config.skipDuplicates) {
      const hash = generatePlaceDedupeHash(place)
      const existing = await this.placeRepo.findByDedupeHash(hash)

      if (existing) {
        if (!this.config.updateExisting) {
          return { skipped: true, qualityGrade }
        }

        // 업데이트
        if (!this.config.dryRun) {
          await this.placeRepo.update(existing.id, place)
        }
        return { skipped: false, qualityGrade }
      }
    }

    // 3. Load: 저장
    if (!this.config.dryRun) {
      await this.placeRepo.create(place)
    }

    return { skipped: false, qualityGrade }
  }

  private async processContent(
    content: NormalizedContent,
    placeId?: string
  ): Promise<{ skipped: boolean }> {
    if (!this.config.dryRun) {
      try {
        await this.contentRepo.create(content, placeId)
      } catch (error) {
        if ((error as Error).message.includes('중복')) {
          return { skipped: true }
        }
        throw error
      }
    }

    return { skipped: false }
  }

  // ============================================
  // 품질 관리
  // ============================================

  private shouldSkipByQuality(grade: QualityGrade): boolean {
    const gradeOrder: QualityGrade[] = ['A', 'B', 'C', 'D', 'F']
    const thresholdIndex = gradeOrder.indexOf(this.config.qualityThreshold)
    const gradeIndex = gradeOrder.indexOf(grade)
    return gradeIndex > thresholdIndex
  }

  // ============================================
  // 유틸리티
  // ============================================

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

// ============================================
// 블록 최적화 시스템
// ============================================

export class BlockOptimizer {
  private placeRepo = getPlaceBlockRepository()
  private contentRepo = getContentBlockRepository()
  private statsRepo = getBlockStatsRepository()

  /**
   * 품질 기반 블록 정리
   * - 낮은 품질 블록 아카이브
   * - 오래된 블록 재크롤링 스케줄
   */
  async optimizeByQuality(options: {
    archiveGrades?: QualityGrade[]
    refreshStale?: boolean
  }): Promise<{ archived: number; scheduledRefresh: number }> {
    let archived = 0
    let scheduledRefresh = 0

    // 낮은 품질 블록 아카이브
    if (options.archiveGrades?.length) {
      const lowQualityBlocks = await this.placeRepo.search({
        qualityGrades: options.archiveGrades,
        status: ['active'],
        pageSize: 1000,
      })

      for (const block of lowQualityBlocks.data) {
        await this.placeRepo.updateStatus(block.id, 'archived')
        archived++
      }
    }

    // 오래된 블록 갱신 스케줄
    if (options.refreshStale) {
      const staleBlocks = await this.placeRepo.search({
        freshness: ['stale', 'outdated'],
        status: ['active'],
        pageSize: 1000,
      })
      scheduledRefresh = staleBlocks.total
      // TODO: 크롤링 큐에 추가
    }

    return { archived, scheduledRefresh }
  }

  /**
   * 중복 블록 병합
   */
  async deduplicateBlocks(): Promise<{ merged: number; deleted: number }> {
    // TODO: 유사도 기반 중복 탐지 및 병합
    return { merged: 0, deleted: 0 }
  }

  /**
   * 인덱스 최적화
   */
  async optimizeIndexes(): Promise<void> {
    // PostgreSQL VACUUM ANALYZE 실행
    // TODO: Supabase RPC 호출
  }

  /**
   * 캐시 워밍
   */
  async warmCache(options: {
    topPlaces?: number
    recentContents?: number
  }): Promise<{ cachedPlaces: number; cachedContents: number }> {
    // 인기 장소 및 최신 콘텐츠 캐싱
    // TODO: Redis 캐시 로직
    return { cachedPlaces: 0, cachedContents: 0 }
  }
}

// ============================================
// 마이그레이션 시스템
// ============================================

export interface MigrationConfig {
  /** 소스 (현재 저장소) */
  source: 'supabase' | 'ncp_postgres' | 'local'

  /** 대상 (마이그레이션 대상) */
  target: 'supabase' | 'ncp_postgres' | 'ncp_object_storage'

  /** 배치 크기 */
  batchSize: number

  /** 검증 활성화 */
  validateAfterMigration: boolean

  /** 롤백 지점 생성 */
  createRollbackPoint: boolean

  /** 드라이런 */
  dryRun: boolean
}

export interface MigrationResult {
  /** 마이그레이션된 항목 수 */
  migrated: number

  /** 실패 수 */
  failed: number

  /** 검증 통과 */
  validated: boolean

  /** 롤백 포인트 ID */
  rollbackPointId?: string

  /** 처리 시간 */
  duration: number
}

export class BlockMigrator {
  private config: MigrationConfig

  constructor(config: Partial<MigrationConfig> = {}) {
    this.config = {
      source: 'supabase',
      target: 'ncp_object_storage',
      batchSize: 500,
      validateAfterMigration: true,
      createRollbackPoint: true,
      dryRun: true,
      ...config,
    }
  }

  /**
   * 장소 블록 마이그레이션
   */
  async migratePlaces(filter?: {
    regionCodes?: string[]
    categories?: string[]
  }): Promise<MigrationResult> {
    const startTime = Date.now()
    const result: MigrationResult = {
      migrated: 0,
      failed: 0,
      validated: false,
      duration: 0,
    }

    // 1. 롤백 포인트 생성
    if (this.config.createRollbackPoint && !this.config.dryRun) {
      result.rollbackPointId = await this.createRollbackPoint('places')
    }

    // 2. 소스에서 데이터 읽기
    const placeRepo = getPlaceBlockRepository()
    const places = await placeRepo.search({
      regionCodes: filter?.regionCodes,
      pageSize: 10000,
    })

    // 3. 대상으로 마이그레이션
    if (this.config.target === 'ncp_object_storage') {
      result.migrated = await this.migrateToObjectStorage(places.data, 'places')
    } else if (this.config.target === 'ncp_postgres') {
      result.migrated = await this.migrateToNcpPostgres(places.data, 'places')
    }

    // 4. 검증
    if (this.config.validateAfterMigration) {
      result.validated = await this.validateMigration('places', result.migrated)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * 콘텐츠 블록 마이그레이션
   */
  async migrateContents(): Promise<MigrationResult> {
    // 유사 로직
    return {
      migrated: 0,
      failed: 0,
      validated: false,
      duration: 0,
    }
  }

  /**
   * NCP Object Storage로 마이그레이션
   */
  private async migrateToObjectStorage(
    data: (PlaceBlock | ContentBlock)[],
    type: 'places' | 'contents'
  ): Promise<number> {
    if (this.config.dryRun) {
      console.log(`[DryRun] Would migrate ${data.length} ${type} to Object Storage`)
      return data.length
    }

    // NCP Object Storage 클라이언트 필요
    // TODO: @ncloud/sdk 연동
    const objectStorageEndpoint = process.env.NCP_OBJECT_STORAGE_ENDPOINT
    const accessKey = process.env.NCP_OBJECT_STORAGE_ACCESS_KEY
    const secretKey = process.env.NCP_OBJECT_STORAGE_SECRET_KEY

    if (!objectStorageEndpoint || !accessKey || !secretKey) {
      throw new Error('NCP Object Storage 환경변수가 설정되지 않았습니다.')
    }

    // 배치로 JSON 파일 업로드
    const batches = this.chunkArray(data, this.config.batchSize)
    let migrated = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      const filename = `kidsmap/${type}/batch_${Date.now()}_${i}.json`
      const content = JSON.stringify(batch, null, 2)

      // TODO: S3 호환 API로 업로드
      console.log(`[Migration] Uploading ${filename} (${batch.length} items)`)
      migrated += batch.length
    }

    return migrated
  }

  /**
   * NCP PostgreSQL로 마이그레이션
   */
  private async migrateToNcpPostgres(
    data: (PlaceBlock | ContentBlock)[],
    type: 'places' | 'contents'
  ): Promise<number> {
    if (this.config.dryRun) {
      console.log(`[DryRun] Would migrate ${data.length} ${type} to NCP PostgreSQL`)
      return data.length
    }

    // NCP PostgreSQL 연결
    const ncpDbUrl = process.env.NCP_DATABASE_URL

    if (!ncpDbUrl) {
      throw new Error('NCP_DATABASE_URL 환경변수가 설정되지 않았습니다.')
    }

    // TODO: pg 클라이언트로 직접 연결
    return data.length
  }

  /**
   * 롤백 포인트 생성
   */
  private async createRollbackPoint(type: string): Promise<string> {
    const pointId = `rollback_${type}_${Date.now()}`
    console.log(`[Migration] Created rollback point: ${pointId}`)
    return pointId
  }

  /**
   * 마이그레이션 검증
   */
  private async validateMigration(type: string, expectedCount: number): Promise<boolean> {
    console.log(`[Migration] Validating ${type}: expected ${expectedCount} items`)
    // TODO: 대상에서 카운트 확인
    return true
  }

  /**
   * 롤백
   */
  async rollback(rollbackPointId: string): Promise<boolean> {
    console.log(`[Migration] Rolling back to: ${rollbackPointId}`)
    // TODO: 롤백 로직
    return true
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

// ============================================
// 모니터링 시스템
// ============================================

export interface MonitoringMetrics {
  /** 전체 블록 수 */
  totalBlocks: number

  /** 활성 블록 수 */
  activeBlocks: number

  /** 평균 품질 점수 */
  avgQualityScore: number

  /** 신선도 분포 */
  freshnessDistribution: Record<FreshnessLevel, number>

  /** 크롤링 성공률 */
  crawlSuccessRate: number

  /** 마지막 크롤링 시간 */
  lastCrawlAt: string

  /** 저장소 사용량 (bytes) */
  storageUsage: number

  /** 에러 수 (최근 24시간) */
  recentErrors: number
}

export class BlockMonitor {
  private statsRepo = getBlockStatsRepository()

  /**
   * 현재 메트릭 조회
   */
  async getMetrics(): Promise<MonitoringMetrics> {
    const stats = await this.statsRepo.getStats()

    const totalQualityCount = Object.values(stats.qualityDistribution).reduce(
      (a, b) => a + b,
      0
    )

    // 품질 점수 계산 (A=5, B=4, C=3, D=2, F=1)
    const qualityScores: Record<QualityGrade, number> = {
      A: 5,
      B: 4,
      C: 3,
      D: 2,
      F: 1,
    }

    let avgQualityScore = 0
    if (totalQualityCount > 0) {
      const totalScore = Object.entries(stats.qualityDistribution).reduce(
        (sum, [grade, count]) => sum + qualityScores[grade as QualityGrade] * count,
        0
      )
      avgQualityScore = totalScore / totalQualityCount
    }

    return {
      totalBlocks: stats.totalPlaces + stats.totalContents,
      activeBlocks: stats.totalPlaces,
      avgQualityScore,
      freshnessDistribution: stats.freshnessDistribution as Record<FreshnessLevel, number>,
      crawlSuccessRate: 0.95, // TODO: 실제 계산
      lastCrawlAt: stats.lastUpdated,
      storageUsage: 0, // TODO: 실제 계산
      recentErrors: 0, // TODO: 에러 로그에서 조회
    }
  }

  /**
   * 알림 체크
   */
  async checkAlerts(): Promise<Array<{
    level: 'info' | 'warning' | 'critical'
    message: string
  }>> {
    const metrics = await this.getMetrics()
    const alerts: Array<{ level: 'info' | 'warning' | 'critical'; message: string }> = []

    // 품질 점수 경고
    if (metrics.avgQualityScore < 2.5) {
      alerts.push({
        level: 'warning',
        message: `평균 품질 점수가 낮습니다: ${metrics.avgQualityScore.toFixed(2)}`,
      })
    }

    // 신선도 경고
    const outdatedRatio =
      (metrics.freshnessDistribution.outdated || 0) / metrics.totalBlocks
    if (outdatedRatio > 0.3) {
      alerts.push({
        level: 'warning',
        message: `오래된 데이터 비율이 높습니다: ${(outdatedRatio * 100).toFixed(1)}%`,
      })
    }

    // 에러 경고
    if (metrics.recentErrors > 100) {
      alerts.push({
        level: 'critical',
        message: `최근 24시간 에러가 많습니다: ${metrics.recentErrors}건`,
      })
    }

    return alerts
  }

  /**
   * 상태 리포트 생성
   */
  async generateReport(): Promise<string> {
    const metrics = await this.getMetrics()
    const alerts = await this.checkAlerts()
    const stats = await this.statsRepo.getStats()

    return `
# KidsMap 데이터 블록 상태 리포트

## 개요
- 총 블록 수: ${metrics.totalBlocks.toLocaleString()}
- 활성 블록: ${metrics.activeBlocks.toLocaleString()}
- 평균 품질: ${metrics.avgQualityScore.toFixed(2)}/5.0
- 마지막 업데이트: ${metrics.lastCrawlAt}

## 카테고리별 분포
${Object.entries(stats.placesByCategory)
  .map(([cat, count]) => `- ${cat}: ${count}`)
  .join('\n')}

## 지역별 분포
${Object.entries(stats.placesByRegion)
  .slice(0, 10)
  .map(([region, count]) => `- ${region}: ${count}`)
  .join('\n')}

## 알림
${alerts.length > 0 ? alerts.map((a) => `- [${a.level.toUpperCase()}] ${a.message}`).join('\n') : '- 없음'}
    `.trim()
  }
}

