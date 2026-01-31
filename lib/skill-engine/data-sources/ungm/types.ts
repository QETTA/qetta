/**
 * UNGM (UN Global Marketplace) API 타입 정의
 *
 * @see https://www.ungm.org/
 *
 * 핵심 원칙:
 * - API에서 반환된 데이터만 사용 (예측/fabricate 금지!)
 * - 원본 URL 항상 보존
 * - 수집 시점(fetchedAt) 기록
 *
 * QETTA Global Tender 도메인 엔진 - 63만+ 글로벌 입찰 DB
 */

// ============================================
// UN 기관 상수
// ============================================

export const UN_AGENCIES = {
  UNEP: 'UN Environment Programme',
  FAO: 'Food and Agriculture Organization',
  UNDP: 'UN Development Programme',
  UNICEF: "UN Children's Fund",
  WHO: 'World Health Organization',
  UNHCR: 'UN High Commissioner for Refugees',
  WFP: 'World Food Programme',
  UNOPS: 'UN Office for Project Services',
  UNESCO: 'UN Educational, Scientific and Cultural Organization',
  UNFPA: 'UN Population Fund',
  ILO: 'International Labour Organization',
  IAEA: 'International Atomic Energy Agency',
  ITU: 'International Telecommunication Union',
  WIPO: 'World Intellectual Property Organization',
  WMO: 'World Meteorological Organization',
  IMO: 'International Maritime Organization',
  ICAO: 'International Civil Aviation Organization',
  UNIDO: 'UN Industrial Development Organization',
  IFAD: 'International Fund for Agricultural Development',
  OCHA: 'Office for the Coordination of Humanitarian Affairs',
  UNCTAD: 'UN Conference on Trade and Development',
} as const

export type UnAgency = keyof typeof UN_AGENCIES

// ============================================
// API 요청 파라미터
// ============================================

export interface UngmApiParams {
  /** 검색어 */
  Title?: string

  /** UN 기관 코드 */
  AgencyId?: string

  /** 공고 상태 */
  Status?: UngmNoticeStatus

  /** 마감일 (from) - YYYY-MM-DD */
  DeadlineFrom?: string

  /** 마감일 (to) - YYYY-MM-DD */
  DeadlineTo?: string

  /** 게시일 (from) - YYYY-MM-DD */
  PublishedFrom?: string

  /** 게시일 (to) - YYYY-MM-DD */
  PublishedTo?: string

  /** 카테고리 코드 */
  CategoryId?: string

  /** 국가 코드 (ISO 3166-1 alpha-2) */
  CountryCode?: string

  /** 페이지 번호 (1-based) */
  PageIndex?: number

  /** 페이지 크기 (기본: 20, 최대: 100) */
  PageSize?: number

  /** 정렬 필드 */
  SortField?: 'Deadline' | 'PublishedDate' | 'Title'

  /** 정렬 방향 */
  SortOrder?: 'asc' | 'desc'
}

// ============================================
// 공고 상태 코드
// ============================================

export const UNGM_NOTICE_STATUS = {
  /** 활성 (진행 중) */
  ACTIVE: 'active',
  /** 마감 임박 */
  CLOSING_SOON: 'closing_soon',
  /** 마감됨 */
  CLOSED: 'closed',
  /** 낙찰됨 */
  AWARDED: 'awarded',
  /** 취소됨 */
  CANCELLED: 'cancelled',
} as const

export type UngmNoticeStatus = (typeof UNGM_NOTICE_STATUS)[keyof typeof UNGM_NOTICE_STATUS]

// ============================================
// 조달 유형 코드
// ============================================

export const UNGM_PROCUREMENT_TYPES = {
  /** 초청 입찰 */
  ITB: 'ITB',
  /** 제안 요청 */
  RFP: 'RFP',
  /** 견적 요청 */
  RFQ: 'RFQ',
  /** 입찰 의향서 요청 */
  EOI: 'EOI',
  /** 정보 요청 */
  RFI: 'RFI',
  /** 장기 협정 */
  LTA: 'LTA',
} as const

export type UngmProcurementType = (typeof UNGM_PROCUREMENT_TYPES)[keyof typeof UNGM_PROCUREMENT_TYPES]

// ============================================
// API 응답 구조
// ============================================

export interface UngmApiResponse {
  /** 응답 상태 */
  success: boolean

  /** 응답 코드 */
  code?: string

  /** 응답 메시지 */
  message?: string

  /** 총 건수 */
  totalCount?: number

  /** 현재 페이지 */
  pageIndex?: number

  /** 페이지 크기 */
  pageSize?: number

  /** 입찰 공고 목록 */
  notices?: UngmNoticeItem[]
}

// ============================================
// 입찰 공고 아이템 (원본 API)
// ============================================

export interface UngmNoticeItem {
  /** 공고 ID */
  id: string

  /** UNGM 참조 번호 */
  referenceNumber?: string

  /** 공고 제목 */
  title?: string

  /** 공고 설명 */
  description?: string

  /** UN 기관 정보 */
  agency?: {
    /** 기관 ID */
    id?: string
    /** 기관 코드 (UNDP, UNICEF, etc.) */
    code?: string
    /** 기관 전체명 */
    name?: string
    /** 로고 URL */
    logoUrl?: string
  }

  /** 예산 정보 */
  budget?: {
    /** 예산 금액 */
    amount?: number
    /** 통화 코드 (USD, EUR, etc.) */
    currency?: string
    /** 최소 금액 */
    minAmount?: number
    /** 최대 금액 */
    maxAmount?: number
  }

  /** 게시일 (ISO 8601) */
  publishedDate?: string

  /** 마감일 (ISO 8601) */
  deadline?: string

  /** 낙찰 예정일 */
  awardDate?: string

  /** 조달 유형 */
  procurementType?: UngmProcurementType

  /** 공고 상태 */
  status?: UngmNoticeStatus

  /** 카테고리 정보 */
  category?: {
    /** 카테고리 ID */
    id?: string
    /** 카테고리명 */
    name?: string
    /** UNSPSC 코드 */
    unspscCode?: string
  }

  /** 대상 국가/지역 */
  targetCountries?: string[]

  /** 언어 */
  language?: string

  /** 첨부 파일 목록 */
  attachments?: Array<{
    /** 파일명 */
    name?: string
    /** 파일 URL */
    url?: string
    /** 파일 크기 (bytes) */
    size?: number
  }>

  /** 연락처 정보 */
  contact?: {
    /** 담당자명 */
    name?: string
    /** 이메일 */
    email?: string
    /** 전화번호 */
    phone?: string
  }

  /** 공고 상세 URL */
  detailUrl?: string

  /** 제출 URL */
  submissionUrl?: string

  /** 수정일 */
  lastModified?: string
}

// ============================================
// 정규화된 입찰 데이터 (TenderItem 호환)
// ============================================

export type NormalizedTenderStatus = 'qualified' | 'pending' | 'new' | 'notQualified'

export interface NormalizedUngmTender {
  /** 공고 ID */
  id: string

  /** 플랫폼 식별자 */
  platform: 'UNGM'

  /** 국가 플래그 */
  country: string

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

  /** 기관명 (UN 기관) */
  agency?: string

  /** 상세 URL */
  detailUrl?: string

  /** UN 기관 코드 (UNDP, UNICEF, etc.) */
  unAgency?: string

  /** UNGM 참조 번호 */
  referenceNumber?: string

  /** 조달 유형 */
  procurementType?: UngmProcurementType

  /** 대상 국가 목록 */
  targetCountries?: string[]

  /** 출처 */
  source: 'UNGM'

  /** 원본 URL */
  sourceUrl: string

  /** 수집 시점 */
  fetchedAt: string

  /** 원본 데이터 보존 */
  rawData: UngmNoticeItem
}

// ============================================
// API 클라이언트 설정
// ============================================

export interface UngmClientConfig {
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

export interface UngmSearchFilters {
  /** 키워드 검색 */
  keyword?: string

  /** UN 기관 코드 필터 */
  agency?: UnAgency

  /** 마감일 시작 (YYYY-MM-DD) */
  deadlineFrom?: string

  /** 마감일 종료 (YYYY-MM-DD) */
  deadlineTo?: string

  /** 게시일 시작 (YYYY-MM-DD) */
  publishedFrom?: string

  /** 게시일 종료 (YYYY-MM-DD) */
  publishedTo?: string

  /** 공고 상태 */
  status?: UngmNoticeStatus

  /** 조달 유형 */
  procurementType?: UngmProcurementType

  /** 카테고리 ID */
  categoryId?: string

  /** 대상 국가 코드 */
  countryCode?: string

  /** 최소 예산 (USD) */
  minBudget?: number

  /** 최대 예산 (USD) */
  maxBudget?: number

  /** 진행 중인 것만 */
  activeOnly?: boolean

  /** 페이지 번호 (1-based) */
  page?: number

  /** 페이지 크기 */
  pageSize?: number

  /** 정렬 기준 */
  sortBy?: 'Deadline' | 'PublishedDate' | 'Title'

  /** 정렬 방향 */
  sortOrder?: 'asc' | 'desc'
}

// ============================================
// 검색 결과
// ============================================

export interface UngmSearchResult {
  /** 입찰 공고 목록 */
  tenders: NormalizedUngmTender[]

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

export class UngmApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'UngmApiError'
  }
}

export const UNGM_ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  TIMEOUT: 'TIMEOUT',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN: 'UNKNOWN',
} as const

export type UngmErrorCode = (typeof UNGM_ERROR_CODES)[keyof typeof UNGM_ERROR_CODES]
