/**
 * KidsMap 데이터 블록 타입 정의
 *
 * 대규모 장소/콘텐츠 데이터 저장을 위한 블록 구조
 */

import type { NormalizedPlace, NormalizedContent, PlaceCategory, ContentSource } from '../types'

// ============================================
// 데이터 블록 기본 타입
// ============================================

/** 블록 상태 */
export type BlockStatus = 'draft' | 'active' | 'archived' | 'deleted'

/** 블록 품질 등급 */
export type QualityGrade = 'A' | 'B' | 'C' | 'D' | 'F'

/** 데이터 신선도 */
export type FreshnessLevel = 'fresh' | 'recent' | 'stale' | 'outdated'

// ============================================
// 장소 데이터 블록
// ============================================

export interface PlaceBlock {
  /** 블록 ID (UUID) */
  id: string

  /** 정규화된 장소 데이터 */
  data: NormalizedPlace

  /** 블록 상태 */
  status: BlockStatus

  /** 데이터 품질 등급 */
  qualityGrade: QualityGrade

  /** 신선도 레벨 */
  freshness: FreshnessLevel

  /** 데이터 완성도 (0-100) */
  completeness: number

  /** 중복 체크 해시 (name + address + lat/lng) */
  dedupeHash: string

  /** 관련 콘텐츠 블록 ID들 */
  relatedContentIds: string[]

  /** 검색용 키워드 */
  searchKeywords: string[]

  /** 지역 코드 (시도/시군구) */
  regionCode: string

  /** 메타데이터 */
  metadata: PlaceBlockMetadata

  /** 생성일 */
  createdAt: string

  /** 수정일 */
  updatedAt: string

  /** 마지막 크롤링 시점 */
  lastCrawledAt: string

  /** 크롤링 횟수 */
  crawlCount: number
}

export interface PlaceBlockMetadata {
  /** 원본 소스 */
  source: 'TOUR_API' | 'PLAYGROUND_API' | 'KAKAO_LOCAL' | 'MANUAL'

  /** 원본 ID */
  sourceId: string

  /** 데이터 버전 */
  version: number

  /** 검증 여부 */
  verified: boolean

  /** 검증자 */
  verifiedBy?: string

  /** 검증일 */
  verifiedAt?: string

  /** 보강 데이터 소스 */
  enrichedFrom?: string[]

  /** 사용자 수정 이력 */
  userEdits?: PlaceEditHistory[]
}

export interface PlaceEditHistory {
  userId: string
  field: string
  oldValue: unknown
  newValue: unknown
  editedAt: string
  reason?: string
}

// ============================================
// 콘텐츠 데이터 블록
// ============================================

export interface ContentBlock {
  /** 블록 ID */
  id: string

  /** 정규화된 콘텐츠 데이터 */
  data: NormalizedContent

  /** 블록 상태 */
  status: BlockStatus

  /** 품질 등급 */
  qualityGrade: QualityGrade

  /** 신선도 */
  freshness: FreshnessLevel

  /** 관련 장소 블록 ID */
  relatedPlaceId?: string

  /** 중복 체크 해시 */
  dedupeHash: string

  /** 콘텐츠 분석 결과 */
  analysis?: ContentAnalysis

  /** 메타데이터 */
  metadata: ContentBlockMetadata

  /** 생성일 */
  createdAt: string

  /** 수정일 */
  updatedAt: string

  /** 마지막 크롤링 시점 */
  lastCrawledAt: string
}

export interface ContentAnalysis {
  /** 감성 분석 (positive/negative/neutral) */
  sentiment?: 'positive' | 'negative' | 'neutral'

  /** 감성 점수 (-1 ~ 1) */
  sentimentScore?: number

  /** 추출된 키워드 */
  extractedKeywords?: string[]

  /** 언급된 장소명 */
  mentionedPlaces?: string[]

  /** 추천 연령대 */
  recommendedAges?: string[]

  /** 어린이 친화도 (0-100) */
  kidsFriendlyScore?: number

  /** 분석 모델 버전 */
  modelVersion?: string

  /** 분석 시점 */
  analyzedAt?: string
}

export interface ContentBlockMetadata {
  /** 원본 소스 */
  source: ContentSource

  /** 원본 ID */
  sourceId: string

  /** 데이터 버전 */
  version: number

  /** 자동 연결된 장소 */
  autoLinkedPlace?: {
    placeId: string
    confidence: number
    method: 'keyword' | 'location' | 'manual'
  }
}

// ============================================
// 크롤링 작업 타입
// ============================================

export type CrawlJobType =
  | 'FULL_CRAWL'           // 전체 크롤링
  | 'INCREMENTAL'          // 증분 크롤링
  | 'REGION_CRAWL'         // 지역별 크롤링
  | 'CATEGORY_CRAWL'       // 카테고리별 크롤링
  | 'CONTENT_REFRESH'      // 콘텐츠 새로고침
  | 'QUALITY_CHECK'        // 품질 검사
  | 'DEDUP_SCAN'           // 중복 스캔

export type CrawlJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'

export interface CrawlJob {
  /** 작업 ID */
  id: string

  /** 작업 타입 */
  type: CrawlJobType

  /** 작업 상태 */
  status: CrawlJobStatus

  /** 우선순위 (1-10, 높을수록 우선) */
  priority: number

  /** 작업 설정 */
  config: CrawlJobConfig

  /** 진행 상황 */
  progress: CrawlProgress

  /** 결과 */
  result?: CrawlResult

  /** 에러 정보 */
  error?: CrawlError

  /** 생성일 */
  createdAt: string

  /** 시작일 */
  startedAt?: string

  /** 완료일 */
  completedAt?: string

  /** 예약 실행 시간 */
  scheduledAt?: string

  /** 재시도 횟수 */
  retryCount: number

  /** 최대 재시도 */
  maxRetries: number
}

export interface CrawlJobConfig {
  /** 대상 소스 */
  sources: Array<'TOUR_API' | 'PLAYGROUND_API' | 'YOUTUBE' | 'NAVER_BLOG' | 'NAVER_CLIP' | 'KAKAO_LOCAL'>

  /** 대상 지역 코드 (없으면 전국) */
  regionCodes?: string[]

  /** 대상 카테고리 */
  categories?: PlaceCategory[]

  /** 검색 키워드 (콘텐츠용) */
  keywords?: string[]

  /** 페이지당 항목 수 */
  pageSize: number

  /** 최대 페이지 */
  maxPages: number

  /** 요청 간 딜레이 (ms) */
  requestDelay: number

  /** 병렬 요청 수 */
  concurrency: number

  /** 실패 시 재시도 */
  retryOnFail: boolean

  /** 중복 스킵 */
  skipDuplicates: boolean

  /** 기존 데이터 업데이트 */
  updateExisting: boolean
}

export interface CrawlProgress {
  /** 전체 예상 항목 수 */
  totalEstimated: number

  /** 처리 완료 수 */
  processed: number

  /** 성공 수 */
  succeeded: number

  /** 실패 수 */
  failed: number

  /** 스킵 수 (중복 등) */
  skipped: number

  /** 현재 처리 중인 소스 */
  currentSource?: string

  /** 현재 페이지 */
  currentPage?: number

  /** 진행률 (0-100) */
  percentage: number

  /** 예상 남은 시간 (초) */
  estimatedTimeRemaining?: number
}

export interface CrawlResult {
  /** 새로 추가된 블록 수 */
  newBlocks: number

  /** 업데이트된 블록 수 */
  updatedBlocks: number

  /** 삭제된 블록 수 */
  deletedBlocks: number

  /** 중복으로 스킵된 수 */
  duplicatesSkipped: number

  /** 소스별 통계 */
  sourceStats: Record<string, {
    total: number
    success: number
    failed: number
  }>

  /** 처리 시간 (ms) */
  duration: number
}

export interface CrawlError {
  /** 에러 코드 */
  code: string

  /** 에러 메시지 */
  message: string

  /** 스택 트레이스 */
  stack?: string

  /** 실패한 항목들 */
  failedItems?: Array<{
    source: string
    id: string
    error: string
  }>
}

// ============================================
// 스케줄 타입
// ============================================

export interface CrawlSchedule {
  /** 스케줄 ID */
  id: string

  /** 스케줄 이름 */
  name: string

  /** 크론 표현식 */
  cron: string

  /** 활성화 여부 */
  enabled: boolean

  /** 작업 설정 */
  jobConfig: CrawlJobConfig

  /** 마지막 실행 시점 */
  lastRunAt?: string

  /** 다음 실행 예정 시점 */
  nextRunAt?: string

  /** 생성일 */
  createdAt: string
}

// ============================================
// 통계 타입
// ============================================

export interface BlockStats {
  /** 전체 장소 블록 수 */
  totalPlaces: number

  /** 전체 콘텐츠 블록 수 */
  totalContents: number

  /** 상태별 장소 블록 수 */
  placesByStatus: Record<BlockStatus, number>

  /** 카테고리별 장소 수 */
  placesByCategory: Record<PlaceCategory, number>

  /** 지역별 장소 수 */
  placesByRegion: Record<string, number>

  /** 소스별 콘텐츠 수 */
  contentsBySource: Record<ContentSource, number>

  /** 품질 등급별 분포 */
  qualityDistribution: Record<QualityGrade, number>

  /** 신선도 분포 */
  freshnessDistribution: Record<FreshnessLevel, number>

  /** 평균 완성도 */
  averageCompleteness: number

  /** 마지막 업데이트 */
  lastUpdated: string
}

// ============================================
// 검색/필터 타입
// ============================================

export interface PlaceBlockFilter {
  /** 상태 */
  status?: BlockStatus[]

  /** 카테고리 */
  categories?: PlaceCategory[]

  /** 지역 코드 */
  regionCodes?: string[]

  /** 품질 등급 */
  qualityGrades?: QualityGrade[]

  /** 신선도 */
  freshness?: FreshnessLevel[]

  /** 검색 키워드 */
  keyword?: string

  /** 위치 기반 검색 */
  location?: {
    latitude: number
    longitude: number
    radiusKm: number
  }

  /** 완성도 범위 */
  completenessRange?: {
    min: number
    max: number
  }

  /** 크롤링 일자 범위 */
  crawledAtRange?: {
    from: string
    to: string
  }

  /** 정렬 */
  sortBy?: 'createdAt' | 'updatedAt' | 'completeness' | 'qualityGrade' | 'name'

  /** 정렬 방향 */
  sortOrder?: 'asc' | 'desc'

  /** 페이지 */
  page?: number

  /** 페이지 크기 */
  pageSize?: number
}

export interface ContentBlockFilter {
  /** 상태 */
  status?: BlockStatus[]

  /** 소스 */
  sources?: ContentSource[]

  /** 관련 장소 ID */
  relatedPlaceId?: string

  /** 품질 등급 */
  qualityGrades?: QualityGrade[]

  /** 검색 키워드 */
  keyword?: string

  /** 감성 */
  sentiment?: 'positive' | 'negative' | 'neutral'

  /** 어린이 친화도 범위 */
  kidsFriendlyRange?: {
    min: number
    max: number
  }

  /** 정렬 */
  sortBy?: 'createdAt' | 'publishedAt' | 'viewCount' | 'likeCount'

  /** 정렬 방향 */
  sortOrder?: 'asc' | 'desc'

  /** 페이지 */
  page?: number

  /** 페이지 크기 */
  pageSize?: number
}

// ============================================
// 응답 타입
// ============================================

export interface PaginatedResponse<T> {
  /** 데이터 */
  data: T[]

  /** 전체 개수 */
  total: number

  /** 현재 페이지 */
  page: number

  /** 페이지 크기 */
  pageSize: number

  /** 전체 페이지 수 */
  totalPages: number

  /** 다음 페이지 존재 여부 */
  hasNext: boolean

  /** 이전 페이지 존재 여부 */
  hasPrev: boolean
}
