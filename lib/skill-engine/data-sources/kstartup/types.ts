/**
 * K-Startup API Types
 *
 * 창업진흥원 K-Startup 공고 API 타입 정의
 * - 창업 특화 지원사업 공고 데이터
 * - 투자단계, 기술분야, 창업연차 등 창업 특화 필드
 *
 * @module data-sources/kstartup
 */

// ============================================================
// API 요청 파라미터
// ============================================================

/**
 * K-Startup API 검색 파라미터
 */
export interface KStartupSearchParams {
  /** 검색 키워드 */
  keyword?: string
  /** 페이지 번호 (1부터 시작) */
  page?: number
  /** 페이지당 항목 수 (기본 20, 최대 100) */
  pageSize?: number
  /** 지원분야 코드 */
  supportField?: KStartupSupportField
  /** 창업연차 */
  startupYear?: KStartupYear
  /** 투자단계 */
  investmentStage?: KStartupInvestmentStage
  /** 기술분야 */
  techField?: KStartupTechField
  /** 지역 */
  region?: string
  /** 마감일 기준 필터 (마감 전 공고만) */
  beforeDeadline?: boolean
}

/**
 * 지원분야 코드
 */
export type KStartupSupportField =
  | 'FUNDING'        // 자금지원
  | 'SPACE'          // 시설/공간
  | 'MENTORING'      // 멘토링/컨설팅
  | 'EDUCATION'      // 교육
  | 'OVERSEAS'       // 해외진출
  | 'TECH_COMMERC'   // 기술사업화
  | 'NETWORK'        // 네트워킹
  | 'RND'            // R&D
  | 'OTHER'          // 기타

/**
 * 창업연차 코드
 */
export type KStartupYear =
  | 'PREP'           // 예비창업자
  | 'Y1'             // 1년 미만
  | 'Y1_3'           // 1~3년
  | 'Y3_7'           // 3~7년
  | 'Y7_PLUS'        // 7년 이상

/**
 * 투자단계 코드
 */
export type KStartupInvestmentStage =
  | 'SEED'           // 시드
  | 'PRE_A'          // 프리A
  | 'SERIES_A'       // 시리즈A
  | 'SERIES_B'       // 시리즈B
  | 'SERIES_C_PLUS'  // 시리즈C 이상

/**
 * 기술분야 코드
 */
export type KStartupTechField =
  | 'AI'             // AI/빅데이터
  | 'BIOHEALTH'      // 바이오/헬스케어
  | 'FINTECH'        // 핀테크
  | 'MOBILITY'       // 모빌리티
  | 'GREENTECH'      // 그린테크/에너지
  | 'CONTENTS'       // 콘텐츠/미디어
  | 'MANUFACTURING'  // 제조/하드웨어
  | 'PLATFORM'       // 플랫폼/서비스
  | 'OTHER'          // 기타

// ============================================================
// API 응답 타입
// ============================================================

/**
 * K-Startup API 응답 구조
 */
export interface KStartupApiResponse {
  /** 응답 코드 */
  resultCode: string
  /** 응답 메시지 */
  resultMsg: string
  /** 전체 건수 */
  totalCount: number
  /** 현재 페이지 */
  currentPage: number
  /** 전체 페이지 수 */
  totalPages: number
  /** 공고 목록 */
  items: KStartupRawAnnouncement[]
}

/**
 * K-Startup 원본 공고 데이터
 */
export interface KStartupRawAnnouncement {
  /** 공고 ID */
  pbancSn: string
  /** 공고명 */
  pbancNm: string
  /** 주관기관명 */
  jrsdInsttNm: string
  /** 사업명 */
  bizNm?: string
  /** 공고 상태 (접수중, 접수예정, 접수마감) */
  pbancStts: string
  /** 접수 시작일 (YYYY-MM-DD) */
  rcptBgngDt: string
  /** 접수 종료일 (YYYY-MM-DD) */
  rcptEndDt: string
  /** 공고일 (YYYY-MM-DD) */
  pbancDt: string
  /** 지원분야 */
  sprtFld?: string
  /** 지원규모 (텍스트) */
  sprtScale?: string
  /** 지원금액 (숫자) */
  sprtAmt?: number
  /** 기술분야 */
  techFld?: string
  /** 창업연차 조건 */
  strtpYear?: string
  /** 투자단계 조건 */
  invstStage?: string
  /** 지역 */
  region?: string
  /** 상세 URL */
  dtlUrl?: string
  /** 첨부파일 URL */
  atchFileUrl?: string
  /** 조회수 */
  rdcnt?: number
}

// ============================================================
// 정규화된 타입
// ============================================================

/**
 * 정규화된 K-Startup 공고 상태
 */
export type NormalizedKStartupStatus =
  | 'open'          // 접수중
  | 'upcoming'      // 접수예정
  | 'closed'        // 접수마감

/**
 * 정규화된 K-Startup 공고
 */
export interface NormalizedKStartupAnnouncement {
  /** 고유 ID (platform prefix 포함) */
  id: string
  /** 플랫폼 */
  platform: 'kstartup'
  /** 공고명 */
  title: string
  /** 주관기관 */
  agency: string
  /** 사업명 */
  businessName?: string
  /** 상태 */
  status: NormalizedKStartupStatus
  /** 접수 시작일 */
  startDate: Date | null
  /** 접수 종료일 */
  endDate: Date | null
  /** 공고일 */
  announcementDate: Date | null
  /** D-Day (마감까지 남은 일수) */
  dDay: number | null
  /** 지원분야 */
  supportField?: string
  /** 지원규모 (텍스트) */
  supportScale?: string
  /** 지원금액 (원) */
  supportAmount?: number
  /** 기술분야 */
  techField?: string
  /** 창업연차 조건 */
  startupYear?: string
  /** 투자단계 조건 */
  investmentStage?: string
  /** 지역 */
  region?: string
  /** 상세 URL */
  detailUrl?: string
  /** 첨부파일 URL */
  attachmentUrl?: string
  /** 원본 데이터 */
  rawData: KStartupRawAnnouncement
}

/**
 * K-Startup 검색 결과
 */
export interface KStartupSearchResult {
  /** 공고 목록 */
  announcements: NormalizedKStartupAnnouncement[]
  /** 전체 건수 */
  totalCount: number
  /** 현재 페이지 */
  currentPage: number
  /** 전체 페이지 수 */
  totalPages: number
  /** 데이터 조회 시각 */
  fetchedAt: Date
}

// ============================================================
// 클라이언트 설정
// ============================================================

/**
 * K-Startup 클라이언트 설정
 */
export interface KStartupClientConfig {
  /** API 키 (옵션 - 일부 엔드포인트는 공개) */
  apiKey?: string
  /** 기본 URL */
  baseUrl?: string
  /** 타임아웃 (ms) */
  timeout?: number
  /** 캐시 TTL (ms) */
  cacheTtl?: number
  /** 디버그 모드 */
  debug?: boolean
}
