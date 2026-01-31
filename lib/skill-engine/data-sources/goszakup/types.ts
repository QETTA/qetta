/**
 * Goszakup (카자흐스탄 전자조달) API 타입 정의
 *
 * @see https://ows.goszakup.gov.kz/
 *
 * 핵심 원칙:
 * - API에서 반환된 데이터만 사용 (예측/fabricate 금지!)
 * - 원본 URL 항상 보존
 * - 수집 시점(fetchedAt) 기록
 *
 * QETTA Global Tender 도메인 엔진 - 63만+ 글로벌 입찰 DB
 */

// ============================================
// API 요청 파라미터
// ============================================

export interface GoszakupApiParams {
  /** 검색 시작일 (YYYY-MM-DD) */
  startDate?: string

  /** 검색 종료일 (YYYY-MM-DD) */
  endDate?: string

  /** 검색어 */
  search?: string

  /** 공고 상태 */
  status?: GoszakupTenderStatus

  /** 페이지 번호 (0-based) */
  page?: number

  /** 페이지 크기 (기본: 20, 최대: 100) */
  limit?: number

  /** 정렬 필드 */
  sort?: 'publishDate' | 'endDate' | 'amount'

  /** 정렬 방향 */
  order?: 'asc' | 'desc'
}

// ============================================
// 공고 상태 코드
// ============================================

export const GOSZAKUP_TENDER_STATUS = {
  /** 공개 (진행 중) */
  PUBLISHED: 'published',
  /** 접수 중 */
  ACCEPTING: 'accepting',
  /** 평가 중 */
  EVALUATING: 'evaluating',
  /** 낙찰 */
  AWARDED: 'awarded',
  /** 취소 */
  CANCELLED: 'cancelled',
  /** 실패 */
  FAILED: 'failed',
} as const

export type GoszakupTenderStatus =
  (typeof GOSZAKUP_TENDER_STATUS)[keyof typeof GOSZAKUP_TENDER_STATUS]

// ============================================
// 조달 유형 코드
// ============================================

export const GOSZAKUP_PROCUREMENT_TYPES = {
  /** 공개 입찰 */
  OPEN_TENDER: 'open_tender',
  /** 제한 입찰 */
  RESTRICTED_TENDER: 'restricted_tender',
  /** 단독 계약 */
  SINGLE_SOURCE: 'single_source',
  /** 경쟁 입찰 */
  COMPETITIVE: 'competitive',
  /** 전자 경매 */
  E_AUCTION: 'e_auction',
} as const

export type GoszakupProcurementType =
  (typeof GOSZAKUP_PROCUREMENT_TYPES)[keyof typeof GOSZAKUP_PROCUREMENT_TYPES]

// ============================================
// API 응답 구조
// ============================================

export interface GoszakupApiResponse {
  /** 응답 상태 */
  success: boolean

  /** 응답 코드 */
  code?: string

  /** 응답 메시지 */
  message?: string

  /** 총 건수 */
  total?: number

  /** 현재 페이지 */
  page?: number

  /** 페이지 크기 */
  limit?: number

  /** 입찰 공고 목록 */
  items?: GoszakupTenderItem[]
}

// ============================================
// 입찰 공고 아이템 (원본 API)
// ============================================

export interface GoszakupTenderItem {
  /** 공고 ID */
  id: string

  /** 공고 번호 */
  announcementNumber?: string

  /** 공고 제목 (카자흐어/러시아어) */
  nameRu?: string

  /** 공고 제목 (카자흐어) */
  nameKz?: string

  /** 공고 설명 */
  description?: string

  /** 발주 기관 정보 */
  customer?: {
    /** 기관 ID */
    id?: string
    /** 기관명 (러시아어) */
    nameRu?: string
    /** 기관명 (카자흐어) */
    nameKz?: string
    /** BIN (사업자등록번호) */
    bin?: string
    /** 주소 */
    address?: string
  }

  /** 예산 금액 (KZT - 카자흐스탄 텡게) */
  totalAmount?: number

  /** 통화 코드 */
  currency?: string

  /** 공고 게시일 */
  publishDate?: string

  /** 접수 시작일 */
  startDate?: string

  /** 접수 마감일 */
  endDate?: string

  /** 낙찰 예정일 */
  awardDate?: string

  /** 조달 방식 */
  procurementMethod?: GoszakupProcurementType

  /** 공고 상태 */
  status?: GoszakupTenderStatus

  /** 카테고리 코드 */
  categoryCode?: string

  /** 카테고리명 */
  categoryName?: string

  /** 품목 목록 */
  lots?: GoszakupLotItem[]

  /** 공고 상세 URL */
  link?: string

  /** 지역 코드 */
  regionCode?: string

  /** 지역명 */
  regionName?: string
}

export interface GoszakupLotItem {
  /** 품목 ID */
  id?: string

  /** 품목 번호 */
  lotNumber?: number

  /** 품목명 */
  name?: string

  /** 수량 */
  quantity?: number

  /** 단위 */
  unit?: string

  /** 단가 */
  unitPrice?: number

  /** 총액 */
  amount?: number

  /** 납품 장소 */
  deliveryPlace?: string

  /** 납품 기한 */
  deliveryTerm?: string
}

// ============================================
// 정규화된 입찰 데이터 (TenderItem 호환)
// ============================================

export type NormalizedTenderStatus = 'qualified' | 'pending' | 'new' | 'notQualified'

export interface NormalizedGoszakupTender {
  /** 공고 ID */
  id: string

  /** 플랫폼 식별자 */
  platform: 'goszakup'

  /** 국가 플래그 */
  country: '🇰🇿'

  /** 공고 제목 */
  title: string

  /** 예산 (포맷팅된 문자열) */
  budget: string

  /** 예산 (숫자) */
  budgetAmount: number

  /** 마감일 (YYYY-MM-DD) */
  deadline: string

  /** D-day 계산 */
  dDay: string

  /** 매칭 점수 (65-99) */
  matchScore: number

  /** 상태 */
  status: NormalizedTenderStatus

  /** 카테고리 */
  category?: string

  /** 기관명 */
  agency?: string

  /** 상세 URL */
  detailUrl?: string

  /** 조달 방식 */
  procurementMethod?: GoszakupProcurementType

  /** 지역 */
  region?: string

  /** 품목 수 */
  lotCount?: number

  /** 출처 */
  source: 'GOSZAKUP'

  /** 원본 URL */
  sourceUrl: string

  /** 수집 시점 */
  fetchedAt: string

  /** 원본 데이터 보존 */
  rawData: GoszakupTenderItem
}

// ============================================
// API 클라이언트 설정
// ============================================

export interface GoszakupClientConfig {
  /** API 키 */
  apiKey: string

  /** 기본 조회 건수 */
  defaultPageSize?: number

  /** 타임아웃 (ms) */
  timeout?: number

  /** 재시도 횟수 */
  retryCount?: number

  /** 재시도 딜레이 (ms) */
  retryDelay?: number

  /** 캐시 TTL (분) */
  cacheTtlMinutes?: number
}

// ============================================
// 검색 필터
// ============================================

export interface GoszakupSearchFilters {
  /** 키워드 검색 */
  keyword?: string

  /** 검색 시작일 (YYYY-MM-DD) */
  startDate?: string

  /** 검색 종료일 (YYYY-MM-DD) */
  endDate?: string

  /** 공고 상태 */
  status?: GoszakupTenderStatus

  /** 조달 방식 */
  procurementMethod?: GoszakupProcurementType

  /** 최소 예산 (KZT) */
  minBudget?: number

  /** 최대 예산 (KZT) */
  maxBudget?: number

  /** 진행 중인 것만 */
  activeOnly?: boolean

  /** 페이지 번호 */
  page?: number

  /** 페이지 크기 */
  pageSize?: number

  /** 정렬 기준 */
  sortBy?: 'publishDate' | 'endDate' | 'amount'

  /** 정렬 방향 */
  sortOrder?: 'asc' | 'desc'
}

// ============================================
// 검색 결과
// ============================================

export interface GoszakupSearchResult {
  /** 입찰 공고 목록 */
  tenders: NormalizedGoszakupTender[]

  /** 총 건수 */
  totalCount: number

  /** 현재 페이지 */
  currentPage: number

  /** 총 페이지 수 */
  totalPages: number

  /** 검색 시점 */
  searchedAt: string

  /** 캐시 여부 */
  fromCache: boolean
}

// ============================================
// 에러 타입
// ============================================

export class GoszakupApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'GoszakupApiError'
  }
}

export const GOSZAKUP_ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  TIMEOUT: 'TIMEOUT',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN: 'UNKNOWN',
} as const

export type GoszakupErrorCode = (typeof GOSZAKUP_ERROR_CODES)[keyof typeof GOSZAKUP_ERROR_CODES]
