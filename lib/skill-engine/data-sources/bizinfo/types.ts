/**
 * 기업마당 (BizInfo) API 타입 정의
 *
 * @see https://www.bizinfo.go.kr/web/lay1/program/S1T175C174/apiDetail.do?id=bizinfoApi
 *
 * 핵심 원칙:
 * - API에서 반환된 데이터만 사용 (예측/fabricate 금지!)
 * - 원본 URL 항상 보존
 * - 수집 시점(fetchedAt) 기록
 */

// ============================================
// API 요청 파라미터
// ============================================

export interface BizInfoApiParams {
  /** 인증키 (필수) */
  crtfcKey: string

  /** 데이터 형식: 'json' | 'rss' */
  dataType?: 'json' | 'rss'

  /** 조회 건수 (기본: 20, 최대: 500) */
  searchCnt?: number

  /** 페이지 번호 (기본: 1) */
  pageIndex?: number

  /** 분야+지역 태그 (예: '금융,서울') */
  hashtags?: string

  /** 검색 키워드 */
  keyword?: string
}

// ============================================
// 분야 코드 (hashtags 파라미터)
// ============================================

export const BIZINFO_FIELD_CODES = {
  /** 금융 */
  FINANCE: '금융',
  /** 기술 */
  TECHNOLOGY: '기술',
  /** 인력 */
  MANPOWER: '인력',
  /** 수출 */
  EXPORT: '수출',
  /** 내수 */
  DOMESTIC: '내수',
  /** 창업 */
  STARTUP: '창업',
  /** 경영 */
  MANAGEMENT: '경영',
  /** 기타 */
  OTHER: '기타',
} as const

export type BizInfoFieldCode =
  (typeof BIZINFO_FIELD_CODES)[keyof typeof BIZINFO_FIELD_CODES]

// ============================================
// 지역 코드 (hashtags 파라미터)
// ============================================

export const BIZINFO_REGION_CODES = {
  SEOUL: '서울',
  BUSAN: '부산',
  DAEGU: '대구',
  INCHEON: '인천',
  GWANGJU: '광주',
  DAEJEON: '대전',
  ULSAN: '울산',
  SEJONG: '세종',
  GYEONGGI: '경기',
  GANGWON: '강원',
  CHUNGBUK: '충북',
  CHUNGNAM: '충남',
  JEONBUK: '전북',
  JEONNAM: '전남',
  GYEONGBUK: '경북',
  GYEONGNAM: '경남',
  JEJU: '제주',
  NATIONWIDE: '전국',
} as const

export type BizInfoRegionCode =
  (typeof BIZINFO_REGION_CODES)[keyof typeof BIZINFO_REGION_CODES]

// ============================================
// API 응답 구조 (JSON)
// ============================================

export interface BizInfoApiResponse {
  /** 응답 코드 */
  code: string

  /** 응답 메시지 */
  message?: string

  /** 총 건수 */
  totalCount?: number

  /** 채널 정보 */
  channel?: BizInfoChannel

  /** 공고 목록 */
  items?: BizInfoAnnouncementItem[]
}

export interface BizInfoChannel {
  /** 채널 제목 */
  title: string

  /** 채널 링크 */
  link: string

  /** 마지막 빌드 일시 */
  lastBuildDate?: string

  /** 설명 */
  description?: string
}

// ============================================
// 공고 아이템 (지원사업)
// ============================================

export interface BizInfoAnnouncementItem {
  /** 공고 제목 */
  title: string

  /** 상세 페이지 URL */
  link: string

  /** 공고 내용 요약 */
  description?: string

  /** 공고 ID (고유 식별자) */
  pblancId?: string

  /** 소관 기관명 */
  jrsdInsttNm?: string

  /** 수행 기관명 */
  excInsttNm?: string

  /** 접수 기관명 */
  rcptInsttNm?: string

  /** 분야 (금융, 기술 등) */
  hashtags?: string

  /** 지역 */
  areaNm?: string

  /** 신청 시작일 (YYYYMMDD) */
  reqstBeginDe?: string

  /** 신청 종료일 (YYYYMMDD) */
  reqstEndDe?: string

  /** 등록일 (YYYYMMDD) */
  registDe?: string

  /** 접수 상태 */
  pblancSttusNm?: string

  /** 지원 대상 */
  trgetNm?: string

  /** 지원 규모/금액 */
  sporCn?: string

  /** 신청 방법 */
  reqstMthNm?: string

  /** 공고 첨부파일 URL */
  atchFileUrl?: string

  /** 공고 원문 URL */
  detailPageUrl?: string
}

// ============================================
// 정규화된 공고 데이터 (내부 사용)
// ============================================

export interface NormalizedBizInfoAnnouncement {
  /** 고유 ID (pblancId 또는 생성된 ID) */
  id: string

  /** 출처 */
  source: 'BIZINFO'

  /** 원본 URL */
  sourceUrl: string

  /** 수집 시점 */
  fetchedAt: string

  /** 공고 제목 */
  title: string

  /** 소관 기관 */
  agency: string

  /** 수행 기관 */
  executor?: string

  /** 접수 기관 */
  receiver?: string

  /** 분야 */
  field?: BizInfoFieldCode

  /** 지역 */
  region?: BizInfoRegionCode | '전국'

  /** 신청 기간 */
  applicationPeriod: {
    start: string | null
    end: string | null
  }

  /** 등록일 */
  registeredAt: string | null

  /** 접수 상태 */
  status: 'upcoming' | 'open' | 'closed' | 'unknown'

  /** 지원 대상 설명 */
  targetDescription?: string

  /** 지원 내용 설명 */
  supportDescription?: string

  /** 신청 방법 */
  applicationMethod?: string

  /** 첨부파일 URL */
  attachmentUrl?: string

  /** 원본 데이터 보존 */
  rawData: BizInfoAnnouncementItem
}

// ============================================
// API 클라이언트 설정
// ============================================

export interface BizInfoClientConfig {
  /** API 인증키 */
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

export interface BizInfoSearchFilters {
  /** 키워드 검색 */
  keyword?: string

  /** 분야 필터 */
  fields?: BizInfoFieldCode[]

  /** 지역 필터 */
  regions?: BizInfoRegionCode[]

  /** 접수 중인 것만 */
  activeOnly?: boolean

  /** 최소 지원금액 (만원) */
  minSupportAmount?: number

  /** 페이지 번호 */
  page?: number

  /** 페이지 크기 */
  pageSize?: number
}

// ============================================
// 검색 결과
// ============================================

export interface BizInfoSearchResult {
  /** 공고 목록 */
  announcements: NormalizedBizInfoAnnouncement[]

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

export class BizInfoApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'BizInfoApiError'
  }
}

export const BIZINFO_ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN',
} as const

export type BizInfoErrorCode =
  (typeof BIZINFO_ERROR_CODES)[keyof typeof BIZINFO_ERROR_CODES]
