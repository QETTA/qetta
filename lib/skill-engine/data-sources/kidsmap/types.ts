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
  /** 놀이공원/테마파크 (야외) */
  AMUSEMENT_PARK: 'amusement_park',
  /** 동물원/수족관 (야외) */
  ZOO_AQUARIUM: 'zoo_aquarium',
  /** 키즈카페/실내놀이터 (실내) */
  KIDS_CAFE: 'kids_cafe',
  /** 박물관/체험관 (실내) */
  MUSEUM: 'museum',
  /** 자연/공원 (야외) */
  NATURE_PARK: 'nature_park',
  /** 놀이방 있는 식당 (실내) */
  RESTAURANT: 'restaurant',
  /** 공공시설 (육아나눔터, 장난감도서관 등) */
  PUBLIC_FACILITY: 'public_facility',
  /** 기타 */
  OTHER: 'other',
} as const

export type PlaceCategory = (typeof PLACE_CATEGORIES)[keyof typeof PLACE_CATEGORIES]

/** Quick Filter 카테고리 (야외/실내/공공/식당) */
export const FILTER_CATEGORIES = {
  /** 야외 (공원, 놀이터, 자연체험, 물놀이장, 농장) */
  OUTDOOR: 'outdoor',
  /** 실내 (키즈카페, 실내놀이터, 박물관, 도서관) */
  INDOOR: 'indoor',
  /** 공공시설 (육아나눔터, 장난감도서관, 공공수영장, 체육관) */
  PUBLIC: 'public',
  /** 식당 (놀이방 있는 식당, 키즈카페 식당, 패밀리 레스토랑) */
  RESTAURANT: 'restaurant',
} as const

export type FilterCategory = (typeof FILTER_CATEGORIES)[keyof typeof FILTER_CATEGORIES]

/** PlaceCategory → FilterCategory 매핑 */
export const PLACE_TO_FILTER_CATEGORY: Record<PlaceCategory, FilterCategory> = {
  amusement_park: 'outdoor',
  zoo_aquarium: 'outdoor',
  nature_park: 'outdoor',
  kids_cafe: 'indoor',
  museum: 'indoor',
  restaurant: 'restaurant',
  public_facility: 'public',
  other: 'indoor', // 기본값
}

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
  /** 기저귀 교환대 */
  diaperChangingStation?: boolean
  /** 주차장 */
  parking?: boolean
  /** 식당/카페 (boolean - 편의시설로서의 식당 유무) */
  restaurant?: boolean
  /** 화장실 */
  restroom?: boolean
  /** 휠체어 접근 가능 */
  wheelchairAccess?: boolean
  /** 아기 의자 */
  babyChair?: boolean
  /** 수유 쿠션 */
  nursingCushion?: boolean
}

/** 혼잡도 정보 (실시간 및 예측) */
export interface CrowdLevel {
  /** 현재 혼잡도 (1-5) */
  current?: number
  /** 시간대별 혼잡도 예측 */
  hourly?: Array<{
    hour: number // 0-23
    level: number // 1-5 (1=한산, 5=매우혼잡)
  }>
  /** 주말 혼잡도 */
  weekend?: number
  /** 공휴일 혼잡도 */
  holiday?: number
  /** 마지막 업데이트 */
  lastUpdated?: string
}

/** 예약 정보 */
export interface ReservationInfo {
  /** 예약 가능 여부 */
  available: boolean
  /** 예약 필수 여부 */
  required?: boolean
  /** 예약 URL */
  url?: string
  /** 전화 예약 */
  phoneOnly?: boolean
  /** 예약 가능 시간대 */
  availableHours?: string
  /** 취소 정책 */
  cancellationPolicy?: string
}

/** 식당 전용 메타데이터 (놀이방 있는 식당) */
export interface RestaurantMetadata {
  /** 놀이방 유무 */
  hasPlayroom: boolean

  /** 놀이방 크기 (평수) */
  playroomSize?: number

  /** 놀이방 연령대 */
  playroomAges?: AgeGroup[]

  /** 보호자 동반 필수 여부 */
  guardianRequired?: boolean

  /** 식사 중 돌봄 가능 여부 */
  attendantAvailable?: boolean

  /** 키즈 메뉴 제공 */
  kidsMenuAvailable?: boolean

  /** 키즈 메뉴 가격대 */
  kidsMenuPriceRange?: {
    min: number
    max: number
  }

  /** 아기 의자 개수 */
  babyChairCount?: number

  /** 수유실 유무 */
  nursingRoomAvailable?: boolean

  /** 기저귀 교환대 유무 */
  changingStationAvailable?: boolean

  /** 주차 정보 */
  parkingInfo?: {
    available: boolean
    free?: boolean
    capacity?: number
  }

  /** 예약 정보 */
  reservation?: ReservationInfo

  /** 대기 시간 (분, 실시간) */
  waitingTime?: number

  /** 음식 종류 */
  cuisineType?: string[]

  /** 가격대 (1-5) */
  priceLevel?: number
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

  /** 식당 전용 메타데이터 (놀이방 있는 식당인 경우) */
  restaurantMetadata?: RestaurantMetadata

  /** 혼잡도 정보 */
  crowdLevel?: CrowdLevel

  /** 예약 정보 */
  reservationInfo?: ReservationInfo

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

// ============================================
// 콘텐츠 소스 타입 (YouTube, 네이버 블로그, 클립)
// ============================================

/** 콘텐츠 소스 구분 */
export type ContentSource = 'YOUTUBE' | 'NAVER_BLOG' | 'NAVER_CLIP'

/** 콘텐츠 타입 */
export const CONTENT_TYPES = {
  /** 유튜브 영상 */
  VIDEO: 'video',
  /** 블로그 포스트 */
  BLOG_POST: 'blog_post',
  /** 짧은 영상 (클립/쇼츠) */
  SHORT_VIDEO: 'short_video',
} as const

export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES]

// ============================================
// 정규화된 콘텐츠 데이터
// ============================================

export interface NormalizedContent {
  /** 고유 ID */
  id: string

  /** 출처 */
  source: ContentSource

  /** 콘텐츠 타입 */
  type: ContentType

  /** 원본 URL */
  sourceUrl: string

  /** 수집 시점 */
  fetchedAt: string

  /** 제목 */
  title: string

  /** 설명/내용 요약 */
  description?: string

  /** 썸네일 URL */
  thumbnailUrl?: string

  /** 작성자/채널명 */
  author: string

  /** 작성자 프로필 URL */
  authorUrl?: string

  /** 작성자 프로필 이미지 */
  authorThumbnail?: string

  /** 게시일 */
  publishedAt: string

  /** 조회수 */
  viewCount?: number

  /** 좋아요 수 */
  likeCount?: number

  /** 댓글 수 */
  commentCount?: number

  /** 영상 길이 (초) - 영상 콘텐츠용 */
  duration?: number

  /** 관련 장소 ID */
  relatedPlaceId?: string

  /** 관련 장소명 */
  relatedPlaceName?: string

  /** 태그/키워드 */
  tags?: string[]

  /** 원본 데이터 */
  rawData: unknown
}

// ============================================
// YouTube API 타입
// ============================================

/** YouTube API 설정 */
export interface YouTubeClientConfig {
  /** API 키 */
  apiKey: string
  /** 기본 페이지 크기 */
  defaultPageSize?: number
  /** 타임아웃 (ms) */
  timeout?: number
  /** 재시도 횟수 */
  retryCount?: number
  /** 캐시 TTL (분) */
  cacheTtlMinutes?: number
}

/** YouTube 검색 파라미터 */
export interface YouTubeSearchParams {
  /** 검색 키워드 */
  query: string
  /** 페이지 크기 */
  maxResults?: number
  /** 페이지 토큰 */
  pageToken?: string
  /** 정렬 기준 */
  order?: 'date' | 'rating' | 'relevance' | 'viewCount'
  /** 영상 길이 */
  videoDuration?: 'any' | 'short' | 'medium' | 'long'
  /** 게시일 이후 */
  publishedAfter?: string
  /** 지역 코드 */
  regionCode?: string
  /** 안전 검색 */
  safeSearch?: 'none' | 'moderate' | 'strict'
}

/** YouTube API 응답 */
export interface YouTubeApiResponse {
  kind: string
  etag: string
  nextPageToken?: string
  prevPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
  items: YouTubeVideoItem[]
}

/** YouTube 영상 아이템 */
export interface YouTubeVideoItem {
  kind: string
  etag: string
  id: {
    kind: string
    videoId: string
  }
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default?: { url: string; width: number; height: number }
      medium?: { url: string; width: number; height: number }
      high?: { url: string; width: number; height: number }
    }
    channelTitle: string
    liveBroadcastContent: string
    publishTime: string
  }
}

/** YouTube 영상 상세 정보 */
export interface YouTubeVideoDetails {
  id: string
  snippet: YouTubeVideoItem['snippet']
  contentDetails: {
    duration: string
    dimension: string
    definition: string
    caption: string
  }
  statistics: {
    viewCount: string
    likeCount: string
    commentCount: string
  }
}

// ============================================
// 네이버 API 타입
// ============================================

/** 네이버 API 설정 */
export interface NaverClientConfig {
  /** Client ID */
  clientId: string
  /** Client Secret */
  clientSecret: string
  /** 기본 페이지 크기 */
  defaultPageSize?: number
  /** 타임아웃 (ms) */
  timeout?: number
  /** 재시도 횟수 */
  retryCount?: number
  /** 캐시 TTL (분) */
  cacheTtlMinutes?: number
}

/** 네이버 검색 파라미터 */
export interface NaverSearchParams {
  /** 검색 키워드 */
  query: string
  /** 결과 개수 (기본 10, 최대 100) */
  display?: number
  /** 시작 위치 (기본 1, 최대 1000) */
  start?: number
  /** 정렬 기준 */
  sort?: 'sim' | 'date'
}

/** 네이버 블로그 검색 응답 */
export interface NaverBlogApiResponse {
  lastBuildDate: string
  total: number
  start: number
  display: number
  items: NaverBlogItem[]
}

/** 네이버 블로그 아이템 */
export interface NaverBlogItem {
  /** 블로그 제목 */
  title: string
  /** 블로그 URL */
  link: string
  /** 블로그 내용 요약 */
  description: string
  /** 블로거 이름 */
  bloggername: string
  /** 블로거 링크 */
  bloggerlink: string
  /** 게시일 (YYYYMMDD) */
  postdate: string
}

/** 네이버 클립 아이템 (비공식 - 크롤링 기반) */
export interface NaverClipItem {
  /** 클립 ID */
  clipId: string
  /** 제목 */
  title: string
  /** 클립 URL */
  url: string
  /** 썸네일 URL */
  thumbnailUrl: string
  /** 작성자 */
  author: string
  /** 작성자 프로필 URL */
  authorUrl?: string
  /** 조회수 */
  viewCount?: number
  /** 좋아요 수 */
  likeCount?: number
  /** 영상 길이 (초) */
  duration?: number
  /** 게시일 */
  publishedAt?: string
}

// ============================================
// 콘텐츠 검색 필터
// ============================================

export interface ContentSearchFilters {
  /** 검색 키워드 */
  keyword: string
  /** 콘텐츠 소스 */
  sources?: ContentSource[]
  /** 정렬 기준 */
  sortBy?: 'date' | 'relevance' | 'viewCount'
  /** 게시일 이후 (ISO 날짜) */
  publishedAfter?: string
  /** 페이지 번호 */
  page?: number
  /** 페이지 크기 */
  pageSize?: number
  /** 안전 검색 (어린이용) */
  safeSearch?: boolean
}

// ============================================
// 콘텐츠 검색 결과
// ============================================

export interface ContentSearchResult {
  /** 콘텐츠 목록 */
  contents: NormalizedContent[]
  /** 총 건수 */
  totalCount: number
  /** 현재 페이지 */
  currentPage: number
  /** 다음 페이지 토큰 (YouTube용) */
  nextPageToken?: string
  /** 검색 시점 */
  searchedAt: string
  /** 캐시 여부 */
  fromCache: boolean
}

// ============================================
// 통합 클라이언트 설정
// ============================================

export interface KidsMapFullClientConfig extends KidsMapClientConfig {
  /** YouTube API 키 */
  youtubeApiKey?: string
  /** 네이버 Client ID */
  naverClientId?: string
  /** 네이버 Client Secret */
  naverClientSecret?: string
}
