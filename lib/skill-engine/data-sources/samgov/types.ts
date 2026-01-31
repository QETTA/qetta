/**
 * SAM.gov (미국 연방 조달) API 타입 정의
 *
 * @see https://api.sam.gov/opportunities/v2
 * @see https://open.gsa.gov/api/get-opportunities-public-api/
 *
 * 핵심 원칙:
 * - API에서 반환된 데이터만 사용 (예측/fabricate 금지!)
 * - 원본 URL 항상 보존
 * - 수집 시점(fetchedAt) 기록
 *
 * QETTA Global Tender 도메인 엔진 - 63만+ 글로벌 입찰 DB
 */

// ============================================
// Notice Types (공고 유형)
// ============================================

export const SAM_NOTICE_TYPES = {
  /** Presolicitation (사전 공고) */
  PRESOLICITATION: 'p',
  /** Combined Synopsis/Solicitation (통합 공고) */
  COMBINED: 'k',
  /** Award Notice (낙찰 공고) */
  AWARD: 'a',
  /** Justification (정당화 공고) */
  JUSTIFICATION: 'j',
  /** Intent to Bundle (번들 의향) */
  INTENT_BUNDLE: 'i',
  /** Sources Sought (공급원 탐색) */
  SOURCES_SOUGHT: 'r',
  /** Special Notice (특별 공고) */
  SPECIAL_NOTICE: 's',
  /** Sale of Surplus Property (잉여 재산 판매) */
  SALE_OF_SURPLUS: 'g',
} as const

export type SamNoticeType = (typeof SAM_NOTICE_TYPES)[keyof typeof SAM_NOTICE_TYPES]

// ============================================
// Set-Aside Types (우대 유형)
// ============================================

export const SAM_SET_ASIDE_TYPES = {
  /** Small Business */
  SBA: 'Small Business',
  /** Small Business Set-Aside - Partial */
  SBP: 'Small Business Set-Aside - Partial',
  /** Service-Disabled Veteran-Owned Small Business */
  SDVOSBC: 'Service-Disabled Veteran-Owned Small Business',
  /** Women-Owned Small Business */
  WOSB: 'Women-Owned Small Business',
  /** HUBZone */
  HUBZONE: 'HUBZone',
  /** 8(a) Set-Aside */
  '8A': '8(a) Set-Aside',
  /** Historically Underutilized Business Zone */
  HUBZ: 'Historically Underutilized Business Zone',
  /** Economically Disadvantaged Women-Owned Small Business */
  EDWOSB: 'Economically Disadvantaged Women-Owned Small Business',
  /** Total Small Business Set-Aside */
  TSB: 'Total Small Business Set-Aside',
} as const

export type SamSetAsideType = keyof typeof SAM_SET_ASIDE_TYPES

// ============================================
// Federal Agencies (연방 기관)
// ============================================

export const SAM_FEDERAL_AGENCIES = {
  DOD: 'Department of Defense',
  HHS: 'Department of Health and Human Services',
  DHS: 'Department of Homeland Security',
  DOE: 'Department of Energy',
  EPA: 'Environmental Protection Agency',
  NASA: 'National Aeronautics and Space Administration',
  DOT: 'Department of Transportation',
  DOJ: 'Department of Justice',
  DOI: 'Department of the Interior',
  USDA: 'Department of Agriculture',
  DOC: 'Department of Commerce',
  DOL: 'Department of Labor',
  ED: 'Department of Education',
  VA: 'Department of Veterans Affairs',
  HUD: 'Department of Housing and Urban Development',
  STATE: 'Department of State',
  TREASURY: 'Department of the Treasury',
  GSA: 'General Services Administration',
  SBA: 'Small Business Administration',
  SSA: 'Social Security Administration',
} as const

export type SamFederalAgency = keyof typeof SAM_FEDERAL_AGENCIES

// ============================================
// API 요청 파라미터
// ============================================

export interface SamGovApiParams {
  /** API Key */
  api_key?: string

  /** 검색 키워드 */
  keyword?: string

  /** 공고 유형 */
  ptype?: SamNoticeType

  /** 게시일 (from) - MM/DD/YYYY */
  postedFrom?: string

  /** 게시일 (to) - MM/DD/YYYY */
  postedTo?: string

  /** 응답 마감일 (from) - MM/DD/YYYY */
  rdlfrom?: string

  /** 응답 마감일 (to) - MM/DD/YYYY */
  rdlto?: string

  /** NAICS 코드 */
  naics?: string

  /** PSC (Product Service Code) */
  psc?: string

  /** 공고 ID */
  noticeId?: string

  /** Set-Aside 유형 */
  typeOfSetAside?: string

  /** 연방 기관 코드 */
  deptname?: string

  /** 하위 기관 */
  subtier?: string

  /** 상태 (active, inactive, archived) */
  status?: string

  /** 결과 시작 인덱스 (0-based) */
  start?: number

  /** 결과 크기 (최대 1000) */
  rows?: number

  /** 정렬 필드 */
  sortBy?: string

  /** 정렬 방향 */
  orderBy?: 'asc' | 'desc'
}

// ============================================
// API 응답 구조
// ============================================

export interface SamGovApiResponse {
  /** 총 건수 */
  totalRecords?: number

  /** 현재 페이지 결과 건수 */
  returnedRecords?: number

  /** 기회 목록 */
  opportunitiesData?: SamGovOpportunityItem[]

  /** 에러 메시지 */
  error?: {
    code?: string
    message?: string
  }
}

// ============================================
// 입찰 공고 아이템 (원본 API)
// ============================================

export interface SamGovOpportunityItem {
  /** 기회 ID */
  noticeId?: string

  /** 공고 제목 */
  title?: string

  /** 공고 번호 */
  solicitationNumber?: string

  /** 전체 부모 경로 ID */
  fullParentPathId?: string

  /** 부모 공고 ID */
  parentNoticeId?: string

  /** 발주 기관 정보 */
  department?: string

  /** 하위 기관 */
  subtier?: string

  /** 사무소 정보 */
  office?: string

  /** 게시일 (ISO 8601 또는 MM/DD/YYYY) */
  postedDate?: string

  /** 공고 유형 */
  type?: string

  /** 기본 공고 유형 */
  baseType?: string

  /** 보관 유형 */
  archiveType?: string

  /** 보관 날짜 */
  archiveDate?: string

  /** Set-Aside 코드 */
  typeOfSetAsideDescription?: string

  /** Set-Aside */
  typeOfSetAside?: string

  /** 응답 마감일 (ISO 8601) */
  responseDeadLine?: string

  /** NAICS 코드 */
  naicsCode?: string

  /** NAICS 설명 */
  naicsCodes?: Array<{
    code?: string
    description?: string
  }>

  /** PSC 코드 */
  classificationCode?: string

  /** 활성 여부 */
  active?: string

  /** 설명 */
  description?: string

  /** 조직 유형 */
  organizationType?: string

  /** UI 링크 */
  uiLink?: string

  /** 연락처 정보 */
  pointOfContact?: Array<{
    fax?: string
    type?: string
    email?: string
    phone?: string
    title?: string
    fullName?: string
  }>

  /** 수상 정보 (Award인 경우) */
  award?: {
    date?: string
    number?: string
    amount?: string
    awardee?: {
      name?: string
      location?: {
        streetAddress?: string
        city?: {
          code?: string
          name?: string
        }
        state?: {
          code?: string
          name?: string
        }
        zip?: string
        country?: {
          code?: string
          name?: string
        }
      }
      ueiSAM?: string
      cageCode?: string
    }
  }

  /** 링크 정보 */
  links?: Array<{
    rel?: string
    href?: string
    additionalInfo?: {
      content?: string
    }
  }>

  /** 장소 정보 */
  placeOfPerformance?: {
    streetAddress?: string
    city?: {
      code?: string
      name?: string
    }
    state?: {
      code?: string
      name?: string
    }
    zip?: string
    country?: {
      code?: string
      name?: string
    }
  }

  /** 추가 데이터 */
  additionalInfoLink?: string

  /** 오프라인 액세스 */
  officeAddress?: {
    zipcode?: string
    city?: string
    countryCode?: string
    state?: string
  }

  /** 리소스 링크 */
  resourceLinks?: string[]
}

// ============================================
// 정규화된 입찰 데이터 (TenderItem 호환)
// ============================================

export type NormalizedTenderStatus = 'qualified' | 'pending' | 'new' | 'notQualified'

export interface NormalizedSamGovTender {
  /** 공고 ID */
  id: string

  /** 플랫폼 식별자 */
  platform: 'SAM'

  /** 국가 플래그 */
  country: '🇺🇸'

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

  /** 카테고리 (NAICS description) */
  category?: string

  /** 기관명 */
  agency?: string

  /** 상세 URL */
  detailUrl?: string

  /** 공고 유형 (Combined, Presolicitation, etc.) */
  noticeType?: string

  /** 공고 번호 */
  solicitationNumber?: string

  /** NAICS 코드 */
  naicsCode?: string

  /** Set-Aside 유형 */
  setAside?: string

  /** 하위 기관 */
  subtier?: string

  /** 사무소 */
  office?: string

  /** 수행 장소 */
  placeOfPerformance?: string

  /** 출처 */
  source: 'SAM_GOV'

  /** 원본 URL */
  sourceUrl: string

  /** 수집 시점 */
  fetchedAt: string

  /** 원본 데이터 보존 */
  rawData: SamGovOpportunityItem
}

// ============================================
// API 클라이언트 설정
// ============================================

export interface SamGovClientConfig {
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

export interface SamGovSearchFilters {
  /** 키워드 검색 */
  keyword?: string

  /** 공고 유형 */
  noticeType?: SamNoticeType

  /** 게시일 시작 (YYYY-MM-DD) */
  postedFrom?: string

  /** 게시일 종료 (YYYY-MM-DD) */
  postedTo?: string

  /** 마감일 시작 (YYYY-MM-DD) */
  deadlineFrom?: string

  /** 마감일 종료 (YYYY-MM-DD) */
  deadlineTo?: string

  /** NAICS 코드 */
  naicsCode?: string

  /** Set-Aside 유형 */
  setAside?: SamSetAsideType

  /** 연방 기관 */
  agency?: SamFederalAgency

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
  sortBy?: 'postedDate' | 'responseDeadLine' | 'title'

  /** 정렬 방향 */
  sortOrder?: 'asc' | 'desc'
}

// ============================================
// 검색 결과
// ============================================

export interface SamGovSearchResult {
  /** 입찰 공고 목록 */
  tenders: NormalizedSamGovTender[]

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

export class SamGovApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'SamGovApiError'
  }
}

export const SAM_GOV_ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  TIMEOUT: 'TIMEOUT',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN: 'UNKNOWN',
} as const

export type SamGovErrorCode = (typeof SAM_GOV_ERROR_CODES)[keyof typeof SAM_GOV_ERROR_CODES]
