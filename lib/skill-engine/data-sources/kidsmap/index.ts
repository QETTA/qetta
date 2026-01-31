/**
 * KidsMap 데이터 소스 모듈
 *
 * 어린이 놀이 공간 정보를 위한 통합 데이터 수집 클라이언트
 *
 * ## 장소 데이터 API
 * - TourAPI (한국관광공사) - 놀이공원, 동물원, 박물관, 공원
 * - PlaygroundAPI (행정안전부) - 키즈카페, 실내놀이터
 * - KakaoLocal (카카오맵) - 키워드/위치 기반 장소 검색
 *
 * ## 콘텐츠 크롤링 API
 * - YouTube - 영상 리뷰, 브이로그
 * - 네이버 블로그 - 후기, 체험기
 * - 네이버 클립 - 짧은 영상
 *
 * @example
 * ```ts
 * import {
 *   getKidsMapClient,
 *   getKakaoLocalClient,
 *   getContentClient,
 *   PLACE_CATEGORIES,
 *   TOUR_API_AREA_CODES
 * } from '@/lib/skill-engine/data-sources/kidsmap'
 *
 * // 장소 검색 (공공데이터)
 * const placeClient = getKidsMapClient()
 * const places = await placeClient.searchThemeParks({
 *   areaCode: TOUR_API_AREA_CODES.SEOUL
 * })
 *
 * // 카카오맵 검색
 * const kakaoClient = getKakaoLocalClient()
 * const kidsCafes = await kakaoClient.searchKidsCafes({
 *   x: 127.0, y: 37.5, radius: 5000
 * })
 *
 * // 콘텐츠 검색
 * const contentClient = getContentClient()
 * const contents = await contentClient.search({
 *   keyword: '에버랜드 아이',
 *   sources: ['YOUTUBE', 'NAVER_BLOG'],
 *   safeSearch: true,
 * })
 * ```
 *
 * @module kidsmap
 */

// ============================================
// 타입 export
// ============================================

export type {
  // 공통 타입
  KidsMapDataSource,
  PlaceCategory,
  AgeGroup,
  Amenities,
  OperatingHours,
  AdmissionFee,
  NormalizedPlace,

  // TourAPI 타입
  TourApiContentType,
  TourApiAreaCode,
  TourApiParams,
  TourApiResponse,
  TourApiPlaceItem,
  TourApiDetailItem,

  // PlaygroundAPI 타입
  PlaygroundLocationCode,
  PlaygroundApiParams,
  PlaygroundApiResponse,
  PlaygroundApiItem,

  // 클라이언트 타입
  KidsMapClientConfig,
  KidsMapSearchFilters,
  KidsMapSearchResult,
  KidsMapErrorCode,

  // 콘텐츠 타입
  ContentSource,
  ContentType,
  NormalizedContent,
  ContentSearchFilters,
  ContentSearchResult,

  // YouTube 타입
  YouTubeClientConfig,
  YouTubeSearchParams,
  YouTubeApiResponse,
  YouTubeVideoItem,
  YouTubeVideoDetails,

  // 네이버 타입
  NaverClientConfig,
  NaverSearchParams,
  NaverBlogApiResponse,
  NaverBlogItem,
  NaverClipItem,

  // 통합 설정
  KidsMapFullClientConfig,
} from './types'

// ============================================
// 상수 export
// ============================================

export {
  // 카테고리
  PLACE_CATEGORIES,
  AGE_GROUPS,

  // TourAPI 코드
  TOUR_API_CONTENT_TYPE,
  TOUR_API_CAT1,
  TOUR_API_CAT2_KIDS,
  TOUR_API_AREA_CODES,

  // PlaygroundAPI 코드
  PLAYGROUND_LOCATION_CODES,

  // 콘텐츠 타입
  CONTENT_TYPES,

  // 에러
  KidsMapApiError,
  KIDSMAP_ERROR_CODES,
} from './types'

// ============================================
// 장소 클라이언트 export
// ============================================

// 통합 장소 클라이언트
export {
  KidsMapClient,
  getKidsMapClient,
  initKidsMapClient,
} from './client'

// TourAPI 클라이언트
export {
  TourApiClient,
  getTourApiClient,
  initTourApiClient,
} from './tour-api-client'

// PlaygroundAPI 클라이언트
export {
  PlaygroundApiClient,
  getPlaygroundApiClient,
  initPlaygroundApiClient,
} from './playground-client'

// ============================================
// 콘텐츠 클라이언트 export
// ============================================

// YouTube 클라이언트
export {
  YouTubeClient,
  getYouTubeClient,
  initYouTubeClient,
  KIDS_SEARCH_PRESETS,
} from './youtube-client'

// 네이버 블로그/클립 클라이언트
export {
  NaverBlogClient,
  NaverClipClient,
  getNaverBlogClient,
  getNaverClipClient,
  initNaverBlogClient,
  initNaverClipClient,
  NAVER_KIDS_SEARCH_PRESETS,
} from './naver-client'

// 통합 콘텐츠 클라이언트
export {
  ContentClient,
  getContentClient,
  initContentClient,
} from './content-client'

// ============================================
// 카카오 클라이언트 export
// ============================================

export {
  KakaoLocalClient,
  getKakaoLocalClient,
  initKakaoLocalClient,
  KAKAO_CATEGORY_CODES,
  KAKAO_KIDS_KEYWORDS,
} from './kakao-client'

export type {
  KakaoClientConfig,
  KakaoSearchParams,
  KakaoPlaceResponse,
  KakaoPlaceDocument,
  KakaoCategoryCode,
} from './kakao-client'
