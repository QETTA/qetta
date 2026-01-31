/**
 * 소상공인24 (SBiz24) API 타입 정의
 *
 * @see https://www.sbiz24.kr
 * @see https://www.data.go.kr (공공데이터포털 - 소상공인시장진흥공단)
 *
 * 마스터 플랜 우선순위: #2
 * 타겟: 소상공인 (연매출 10억 미만, 상시근로자 5인 미만)
 */

// ============================================
// API 응답 타입
// ============================================

export interface SBiz24ApiResponse {
  header: {
    resultCode: string
    resultMsg: string
  }
  body: {
    items: {
      item: SBiz24AnnouncementItem[]
    }
    numOfRows: number
    pageNo: number
    totalCount: number
  }
}

export interface SBiz24AnnouncementItem {
  // 기본 정보
  pblancId?: string // 공고 ID
  pblancNm?: string // 공고명
  jrsdInsttNm?: string // 주관기관명

  // 지원 정보
  bsnsSumryCn?: string // 사업요약
  trgetNm?: string // 지원대상
  sprtCn?: string // 지원내용
  sprtScale?: string // 지원규모

  // 기간 정보
  reqstBeginDe?: string // 신청시작일 (YYYYMMDD)
  reqstEndDe?: string // 신청종료일 (YYYYMMDD)
  rceptPrdCn?: string // 접수기간 텍스트

  // 상태
  pblancSttusNm?: string // 공고상태명

  // URL
  link?: string // 상세 페이지 URL
  detailPageUrl?: string // 상세 페이지 URL (대체)

  // 분류
  pldirSportRealmLclasCodeNm?: string // 대분류
  pldirSportRealmMlsfcCodeNm?: string // 중분류

  // 지역
  areaClNm?: string // 지역
}

// ============================================
// 클라이언트 설정
// ============================================

export interface SBiz24ClientConfig {
  apiKey?: string
  defaultPageSize?: number
  timeout?: number
  retryCount?: number
  retryDelay?: number
  cacheTtlMinutes?: number
  /**
   * true이면 에러 발생 시 예외를 throw
   * false(기본값)이면 { success: false, error: "..." } 반환
   *
   * @default false
   */
  throwOnError?: boolean
}

// ============================================
// 검색 필터
// ============================================

export interface SBiz24SearchFilters {
  keyword?: string
  category?: SBiz24CategoryCode
  region?: SBiz24RegionCode
  status?: 'open' | 'closed' | 'all'
  page?: number
  pageSize?: number
}

export interface SBiz24SearchResult {
  success: boolean
  data: NormalizedSBiz24Announcement[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
  error?: string
  cachedAt?: string
}

// ============================================
// 정규화된 데이터
// ============================================

export interface NormalizedSBiz24Announcement {
  // 식별
  id: string
  source: 'SBIZ24'
  sourceUrl: string

  // 기본 정보
  title: string
  organization: string
  summary: string

  // 지원 내용
  target: string
  supportContent: string
  supportScale: string

  // 기간
  applicationStart: string | null
  applicationEnd: string | null
  applicationPeriod: string

  // 상태
  status: 'upcoming' | 'open' | 'closed' | 'unknown'

  // 분류
  categoryMain: string
  categorySub: string
  region: string

  // 메타데이터
  fetchedAt: string
  normalizedAt: string
}

// ============================================
// 분류 코드
// ============================================

export type SBiz24CategoryCode =
  | 'financing' // 자금지원
  | 'consulting' // 경영지원/컨설팅
  | 'education' // 교육/훈련
  | 'sales' // 판로지원
  | 'startup' // 창업지원
  | 'tech' // 기술지원
  | 'policy' // 정책자금
  | 'other' // 기타

export const SBIZ24_CATEGORY_CODES: Record<
  SBiz24CategoryCode,
  { label: string; keywords: string[] }
> = {
  financing: { label: '자금지원', keywords: ['자금', '대출', '융자', '보증'] },
  consulting: {
    label: '경영지원/컨설팅',
    keywords: ['컨설팅', '경영', '진단', '멘토링'],
  },
  education: { label: '교육/훈련', keywords: ['교육', '훈련', '연수', '아카데미'] },
  sales: { label: '판로지원', keywords: ['판로', '마케팅', '수출', '온라인'] },
  startup: { label: '창업지원', keywords: ['창업', '예비창업', '초기창업'] },
  tech: { label: '기술지원', keywords: ['기술', 'R&D', '특허', '지식재산'] },
  policy: { label: '정책자금', keywords: ['정책', '소진공', '중진공'] },
  other: { label: '기타', keywords: [] },
}

// ============================================
// 지역 코드
// ============================================

export type SBiz24RegionCode =
  | 'seoul'
  | 'busan'
  | 'daegu'
  | 'incheon'
  | 'gwangju'
  | 'daejeon'
  | 'ulsan'
  | 'sejong'
  | 'gyeonggi'
  | 'gangwon'
  | 'chungbuk'
  | 'chungnam'
  | 'jeonbuk'
  | 'jeonnam'
  | 'gyeongbuk'
  | 'gyeongnam'
  | 'jeju'
  | 'nationwide'

export const SBIZ24_REGION_CODES: Record<SBiz24RegionCode, string> = {
  seoul: '서울',
  busan: '부산',
  daegu: '대구',
  incheon: '인천',
  gwangju: '광주',
  daejeon: '대전',
  ulsan: '울산',
  sejong: '세종',
  gyeonggi: '경기',
  gangwon: '강원',
  chungbuk: '충북',
  chungnam: '충남',
  jeonbuk: '전북',
  jeonnam: '전남',
  gyeongbuk: '경북',
  gyeongnam: '경남',
  jeju: '제주',
  nationwide: '전국',
}

// ============================================
// 에러 코드
// ============================================

export type SBiz24ErrorCode =
  | 'API_KEY_MISSING'
  | 'API_KEY_INVALID'
  | 'RATE_LIMIT'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'UNKNOWN'

export const SBIZ24_ERROR_CODES: Record<SBiz24ErrorCode, { message: string; retry: boolean }> = {
  API_KEY_MISSING: { message: '소상공인24 API 키가 설정되지 않았습니다.', retry: false },
  API_KEY_INVALID: { message: 'API 키가 유효하지 않습니다.', retry: false },
  RATE_LIMIT: { message: 'API 호출 한도를 초과했습니다.', retry: true },
  NETWORK_ERROR: { message: '네트워크 오류가 발생했습니다.', retry: true },
  PARSE_ERROR: { message: '응답 데이터 파싱에 실패했습니다.', retry: false },
  UNKNOWN: { message: '알 수 없는 오류가 발생했습니다.', retry: false },
}

export class SBiz24ApiError extends Error {
  constructor(
    public code: SBiz24ErrorCode,
    message?: string
  ) {
    super(message || SBIZ24_ERROR_CODES[code].message)
    this.name = 'SBiz24ApiError'
  }

  get retry(): boolean {
    return SBIZ24_ERROR_CODES[this.code].retry
  }
}
