/**
 * KidsMap 데이터 소스 모듈
 *
 * 어린이 놀이 공간 정보를 위한 공공 데이터 API 클라이언트 모음
 *
 * @example
 * ```ts
 * import { getKidsMapClient, PLACE_CATEGORIES, TOUR_API_AREA_CODES } from '@/lib/skill-engine/data-sources/kidsmap'
 *
 * const client = getKidsMapClient()
 *
 * // 서울 지역 테마파크 검색
 * const result = await client.searchThemeParks({
 *   areaCode: TOUR_API_AREA_CODES.SEOUL
 * })
 *
 * // 키즈카페 검색
 * const kidsCafes = await client.searchKidsCafes({
 *   sidoCode: '11' // 서울
 * })
 *
 * // 통합 검색
 * const all = await client.search({
 *   categories: [PLACE_CATEGORIES.AMUSEMENT_PARK, PLACE_CATEGORIES.ZOO_AQUARIUM],
 *   areaCode: TOUR_API_AREA_CODES.SEOUL,
 *   pageSize: 50
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

  // 에러
  KidsMapApiError,
  KIDSMAP_ERROR_CODES,
} from './types'

// ============================================
// 클라이언트 export
// ============================================

// 통합 클라이언트
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
