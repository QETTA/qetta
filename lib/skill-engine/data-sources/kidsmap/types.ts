/**
 * KidsMap 데이터 소스 타입 정의
 *
 * 어린이 놀이 공간 정보를 위한 공공 데이터 API 타입
 * - 한국관광공사 TourAPI
 * - 행정안전부 전국어린이놀이시설정보서비스
 *
 * @see https://api.visitkorea.or.kr/
 * @see https://www.data.go.kr/data/15124519/openapi.do
 */

// ============================================
// 공통 타입
// ============================================

/** 데이터 소스 구분 */
export type KidsMapDataSource = 'TOUR_API' | 'PLAYGROUND_API'

/** 장소 카테고리 */
export const PLACE_CATEGORIES = {
  /** 놀이공원/테마파크 */
  AMUSEMENT_PARK: 'amusement_park',
  /** 동물원/수족관 */
  ZOO_AQUARIUM: 'zoo_aquarium',
  /** 키즈카페/실내놀이터 */
  KIDS_CAFE: 'kids_cafe',
  /** 박물관/체험관 */
  MUSEUM: 'museum',
  /** 자연/공원 */
  NATURE_PARK: 'nature_park',
  /** 기타 */
  OTHER: 'other',
} as const

export type PlaceCategory = (typeof PLACE_CATEGORIES)[keyof typeof PLACE_CATEGORIES]

/** 연령대 적합성 */
export const AGE_GROUPS = {
  /** 영아 (0-2세) */
  INFANT: 'infant',
  /** 유아 (3-5세) */
  TODDLER: 'toddler',
  /** 아동 (6-9세) */
  CHILD: 'child',
  /** 초등 (10-12세) */
  ELEMENTARY: 'elementary',
} as const

export type AgeGroup = (typeof AGE_GROUPS)[keyof typeof AGE_GROUPS]

/** 편의시설 */
export interface Amenities {
  /** 유모차 접근 가능 */
  strollerAccess?: boolean
  /** 수유실 */
  nursingRoom?: boolean
  /** 주차장 */
  parking?: boolean
  /** 식당/카페 */
  restaurant?: boolean
  /** 화장실 */
  restroom?: boolean
  /** 휠체어 접근 가능 */
  wheelchairAccess?: boolean
}

/** 운영 시간 */
export interface OperatingHours {
  /** 월-금 */
  weekday?: string
  /** 토요일 */
  saturday?: string
  /** 일요일/공휴일 */
  sunday?: string
  /** 휴무일 */
  closedDays?: string
}

/** 입장료 정보 */
export interface AdmissionFee {
  /** 무료 여부 */
  isFree: boolean
  /** 성인 요금 */
  adult?: number
  /** 아동 요금 */
  child?: number
  /** 유아 요금 */
  infant?: number
  /** 요금 설명 */
  description?: string
}

// ============================================
// 정규화된 장소 데이터
// ============================================

export interface NormalizedPlace {
  /** 고유 ID */
  id: string

  /** 출처 */
  source: KidsMapDataSource

  /** 원본 URL */
  sourceUrl: string

  /** 수집 시점 */
  fetchedAt: string

  /** 장소명 */
  name: string

  /** 카테고리 */
  category: PlaceCategory

  /** 주소 */
  address: string

  /** 상세 주소 */
  addressDetail?: string

  /** 위도 */
  latitude?: number

  /** 경도 */
  longitude?: number

  /** 지역 코드 */
  areaCode?: string

  /** 시군구 코드 */
  sigunguCode?: string

  /** 전화번호 */
  tel?: string

  /** 홈페이지 URL */
  homepage?: string

  /** 설명 */
  description?: string

  /** 대표 이미지 URL */
  imageUrl?: string

  /** 썸네일 이미지 URL */
  thumbnailUrl?: string

  /** 추천 연령대 */
  recommendedAges?: AgeGroup[]

  /** 편의시설 */
  amenities?: Amenities

  /** 운영 시간 */
  operatingHours?: OperatingHours

  /** 입장료 */
  admissionFee?: AdmissionFee

  /** 원본 데이터 */
  rawData: unknown
}

// ============================================
// TourAPI 타입 (한국관광공사)
// ============================================

/** TourAPI 콘텐츠 타입 코드 */
export const TOUR_API_CONTENT_TYPE = {
  /** 관광지 */
  TOURIST_SPOT: 12,
  /** 문화시설 */
  CULTURAL_FACILITY: 14,
  /** 레포츠 */
  LEISURE_SPORTS: 28,
  /** 행사/공연/축제 */
  EVENT: 15,
} as const

export type TourApiContentType =
  (typeof TOUR_API_CONTENT_TYPE)[keyof typeof TOUR_API_CONTENT_TYPE]

/** TourAPI 카테고리 코드 (대분류) */
export const TOUR_API_CAT1 = {
  /** 자연 */
  NATURE: 'A01',
  /** 인문(문화/예술/역사) */
  CULTURE: 'A02',
  /** 레포츠 */
  LEISURE: 'A03',
  /** 쇼핑 */
  SHOPPING: 'A04',
  /** 음식 */
  FOOD: 'A05',
} as const

/** TourAPI 카테고리 코드 (중분류) - 어린이 관련 */
export const TOUR_API_CAT2_KIDS = {
  /** 자연휴양림 */
  NATURE_RECREATION: 'A0101',
  /** 수목원 */
  ARBORETUM: 'A0102',
  /** 공원 */
  PARK: 'A0103',
  /** 동/식물원 */
  ZOO_BOTANICAL: 'A0104',
  /** 박물관 */
  MUSEUM: 'A0201',
  /** 기념관 */
  MEMORIAL: 'A0202',
  /** 전시관 */
  EXHIBITION: 'A0203',
  /** 미술관/화랑 */
  GALLERY: 'A0204',
  /** 테마공원 */
  THEME_PARK: 'A0205',
  /** 레저스포츠 */
  LEISURE_SPORTS: 'A0301',
} as const

/** TourAPI 지역 코드 */
export const TOUR_API_AREA_CODES = {
  SEOUL: 1,
  INCHEON: 2,
  DAEJEON: 3,
  DAEGU: 4,
  GWANGJU: 5,
  BUSAN: 6,
  ULSAN: 7,
  SEJONG: 8,
  GYEONGGI: 31,
  GANGWON: 32,
  CHUNGBUK: 33,
  CHUNGNAM: 34,
  GYEONGBUK: 35,
  GYEONGNAM: 36,
  JEONBUK: 37,
  JEONNAM: 38,
  JEJU: 39,
} as const

export type TourApiAreaCode =
  (typeof TOUR_API_AREA_CODES)[keyof typeof TOUR_API_AREA_CODES]

/** TourAPI 요청 파라미터 */
export interface TourApiParams {
  /** 인증키 */
  serviceKey: string
  /** 페이지 번호 */
  pageNo?: number
  /** 한 페이지 결과 수 */
  numOfRows?: number
  /** 응답 타입 */
  MobileOS?: 'ETC' | 'IOS' | 'AND' | 'WIN'
  /** 응답 형식 */
  MobileApp?: string
  /** 응답 형식 */
  _type?: 'json' | 'xml'
  /** 지역 코드 */
  areaCode?: number
  /** 시군구 코드 */
  sigunguCode?: number
  /** 콘텐츠 타입 */
  contentTypeId?: number
  /** 대분류 */
  cat1?: string
  /** 중분류 */
  cat2?: string
  /** 소분류 */
  cat3?: string
  /** 정렬 기준 (A=제목, C=수정일, D=생성일, E=거리) */
  arrange?: 'A' | 'C' | 'D' | 'E'
  /** 위도 */
  mapX?: number
  /** 경도 */
  mapY?: number
  /** 거리 반경 (m) */
  radius?: number
  /** 키워드 */
  keyword?: string
}

/** TourAPI 응답 구조 */
export interface TourApiResponse<T> {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body: {
      items: {
        item: T | T[]
      }
      numOfRows: number
      pageNo: number
      totalCount: number
    }
  }
}

/** TourAPI 장소 아이템 */
export interface TourApiPlaceItem {
  /** 콘텐츠 ID */
  contentid: string
  /** 콘텐츠 타입 ID */
  contenttypeid: string
  /** 제목 */
  title: string
  /** 주소 */
  addr1?: string
  /** 상세 주소 */
  addr2?: string
  /** 지역 코드 */
  areacode?: string
  /** 시군구 코드 */
  sigungucode?: string
  /** 대분류 */
  cat1?: string
  /** 중분류 */
  cat2?: string
  /** 소분류 */
  cat3?: string
  /** 생성일 */
  createdtime?: string
  /** 수정일 */
  modifiedtime?: string
  /** 대표 이미지 URL */
  firstimage?: string
  /** 썸네일 이미지 URL */
  firstimage2?: string
  /** 경도 */
  mapx?: string
  /** 위도 */
  mapy?: string
  /** 전화번호 */
  tel?: string
  /** 우편번호 */
  zipcode?: string
  /** 홈페이지 URL (HTML 포함 가능) */
  homepage?: string
  /** 개요 */
  overview?: string
}

/** TourAPI 상세 정보 아이템 */
export interface TourApiDetailItem extends TourApiPlaceItem {
  /** 이용 시간 */
  usetime?: string
  /** 휴무일 */
  restdate?: string
  /** 입장료 */
  usefee?: string
  /** 주차 정보 */
  parking?: string
  /** 유모차 대여 */
  chkbabycarriage?: string
  /** 반려동물 동반 */
  chkpet?: string
  /** 신용카드 */
  chkcreditcard?: string
  /** 체험 안내 */
  expguide?: string
  /** 체험 연령 */
  expagerange?: string
}

// ============================================
// 어린이놀이시설 API 타입 (행정안전부)
// ============================================

/** 어린이놀이시설 설치장소 코드 */
export const PLAYGROUND_LOCATION_CODES = {
  /** 주택단지 */
  RESIDENTIAL: '01',
  /** 어린이집 */
  DAYCARE: '02',
  /** 유치원 */
  KINDERGARTEN: '03',
  /** 초등학교 */
  ELEMENTARY_SCHOOL: '04',
  /** 특수학교 */
  SPECIAL_SCHOOL: '05',
  /** 도시공원 */
  URBAN_PARK: '06',
  /** 어린이공원 */
  CHILDREN_PARK: '07',
  /** 놀이제공영업소 (키즈카페 등) */
  PLAY_BUSINESS: '08',
  /** 대규모 점포 */
  LARGE_STORE: '09',
  /** 아동복지시설 */
  CHILD_WELFARE: '10',
  /** 식품접객업소 */
  RESTAURANT: '11',
  /** 의료기관 */
  MEDICAL: '12',
  /** 기타 */
  OTHER: '99',
} as const

export type PlaygroundLocationCode =
  (typeof PLAYGROUND_LOCATION_CODES)[keyof typeof PLAYGROUND_LOCATION_CODES]

/** 어린이놀이시설 API 요청 파라미터 */
export interface PlaygroundApiParams {
  /** 인증키 */
  serviceKey: string
  /** 페이지 번호 */
  pageNo?: number
  /** 한 페이지 결과 수 */
  numOfRows?: number
  /** 응답 형식 */
  type?: 'json' | 'xml'
  /** 시도 코드 */
  sidoCode?: string
  /** 시군구 코드 */
  sigunguCode?: string
  /** 설치장소 코드 */
  locCode?: string
}

/** 어린이놀이시설 API 응답 구조 */
export interface PlaygroundApiResponse {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body: {
      items: {
        item: PlaygroundApiItem | PlaygroundApiItem[]
      }
      numOfRows: number
      pageNo: number
      totalCount: number
    }
  }
}

/** 어린이놀이시설 아이템 */
export interface PlaygroundApiItem {
  /** 시설 일련번호 */
  pfctSn?: string
  /** 시설명 */
  pfctNm?: string
  /** 설치장소 코드 */
  locCd?: string
  /** 설치장소명 */
  locNm?: string
  /** 시도 코드 */
  sidoCd?: string
  /** 시도명 */
  sidoNm?: string
  /** 시군구 코드 */
  sigunguCd?: string
  /** 시군구명 */
  sigunguNm?: string
  /** 읍면동명 */
  emdNm?: string
  /** 도로명 주소 */
  ronaAddr?: string
  /** 지번 주소 */
  lotnoAddr?: string
  /** 위도 */
  lat?: string
  /** 경도 */
  lot?: string
  /** 관리 기관명 */
  mngInstNm?: string
  /** 관리 기관 전화번호 */
  mngInstTelno?: string
  /** 안전검사 일자 */
  safetyInspDe?: string
  /** 안전검사 결과 */
  safetyInspResult?: string
  /** 설치 년월 */
  instlYm?: string
  /** 놀이기구 수 */
  eqpCnt?: string
}

// ============================================
// 클라이언트 설정
// ============================================

export interface KidsMapClientConfig {
  /** TourAPI 인증키 */
  tourApiKey?: string
  /** 어린이놀이시설 API 인증키 */
  playgroundApiKey?: string
  /** 기본 페이지 크기 */
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

export interface KidsMapSearchFilters {
  /** 카테고리 필터 */
  categories?: PlaceCategory[]
  /** 지역 코드 */
  areaCode?: TourApiAreaCode
  /** 시군구 코드 */
  sigunguCode?: string
  /** 키워드 검색 */
  keyword?: string
  /** 위치 기반 검색 */
  location?: {
    latitude: number
    longitude: number
    radiusMeters: number
  }
  /** 추천 연령대 */
  ageGroups?: AgeGroup[]
  /** 페이지 번호 */
  page?: number
  /** 페이지 크기 */
  pageSize?: number
}

// ============================================
// 검색 결과
// ============================================

export interface KidsMapSearchResult {
  /** 장소 목록 */
  places: NormalizedPlace[]
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

export class KidsMapApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'KidsMapApiError'
  }
}

export const KIDSMAP_ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  TIMEOUT: 'TIMEOUT',
  NO_DATA: 'NO_DATA',
  UNKNOWN: 'UNKNOWN',
} as const

export type KidsMapErrorCode =
  (typeof KIDSMAP_ERROR_CODES)[keyof typeof KIDSMAP_ERROR_CODES]
