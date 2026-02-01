/**
 * KidsMap 통합 클라이언트
 *
 * 어린이 놀이 공간 정보를 위한 통합 API 클라이언트
 * - TourAPI (관광지, 테마파크, 동물원, 박물관 등)
 * - PlaygroundAPI (키즈카페, 실내놀이터, 어린이공원 등)
 *
 * @example
 * ```ts
 * const client = getKidsMapClient()
 *
 * // 통합 검색
 * const result = await client.search({
 *   categories: ['amusement_park', 'zoo_aquarium'],
 *   areaCode: 1, // 서울
 * })
 *
 * // 위치 기반 검색
 * const nearby = await client.searchNearby(37.5665, 126.9780, 3000)
 *
 * // 카테고리별 검색
 * const kidsCafes = await client.searchKidsCafes({ sidoCode: '11' })
 * const themeparks = await client.searchThemeParks({ areaCode: 1 })
 * ```
 */

import { TourApiClient, getTourApiClient, initTourApiClient } from './tour-api-client'
import {
  PlaygroundApiClient,
  getPlaygroundApiClient,
  initPlaygroundApiClient,
} from './playground-client'

import type {
  NormalizedPlace,
  PlaceCategory,
  KidsMapClientConfig,
  KidsMapSearchFilters,
  KidsMapSearchResult,
  TourApiAreaCode,
} from './types'

import {
  PLACE_CATEGORIES,
  KidsMapApiError,
  KIDSMAP_ERROR_CODES,
} from './types'

// ============================================
// 통합 클라이언트
// ============================================

export class KidsMapClient {
  private tourClient: TourApiClient | null = null
  private playgroundClient: PlaygroundApiClient | null = null
  private config: Partial<KidsMapClientConfig>

  constructor(config?: Partial<KidsMapClientConfig>) {
    this.config = config || {}

    // 환경변수가 있으면 클라이언트 초기화 시도
    try {
      if (config?.tourApiKey || process.env.TOUR_API_KEY) {
        this.tourClient = config?.tourApiKey
          ? initTourApiClient(config)
          : getTourApiClient()
      }
    } catch {
      console.warn('[KidsMap] TourAPI 클라이언트 초기화 실패')
    }

    try {
      if (config?.playgroundApiKey || process.env.PLAYGROUND_API_KEY) {
        this.playgroundClient = config?.playgroundApiKey
          ? initPlaygroundApiClient(config)
          : getPlaygroundApiClient()
      }
    } catch {
      console.warn('[KidsMap] PlaygroundAPI 클라이언트 초기화 실패')
    }
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 통합 검색
   */
  async search(filters?: KidsMapSearchFilters): Promise<KidsMapSearchResult> {
    const results: NormalizedPlace[] = []
    let totalCount = 0
    const errors: string[] = []

    const categories = filters?.categories || Object.values(PLACE_CATEGORIES)
    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 50

    // 카테고리별 소스 결정
    const tourCategories: PlaceCategory[] = [
      PLACE_CATEGORIES.AMUSEMENT_PARK,
      PLACE_CATEGORIES.ZOO_AQUARIUM,
      PLACE_CATEGORIES.MUSEUM,
      PLACE_CATEGORIES.NATURE_PARK,
    ]
    const needsTourApi = categories.some((c) => (tourCategories as PlaceCategory[]).includes(c))

    const playgroundCategories: PlaceCategory[] = [PLACE_CATEGORIES.KIDS_CAFE]
    const needsPlaygroundApi = categories.some((c) => (playgroundCategories as PlaceCategory[]).includes(c))

    // TourAPI 검색
    if (needsTourApi && this.tourClient) {
      try {
        const tourResult = await this.tourClient.searchKidsPlaces({
          areaCode: filters?.areaCode,
          page,
          pageSize: Math.floor(pageSize / (needsPlaygroundApi ? 2 : 1)),
        })
        results.push(...tourResult.places)
        totalCount += tourResult.totalCount
      } catch (error) {
        errors.push(`TourAPI: ${(error as Error).message}`)
      }
    }

    // PlaygroundAPI 검색
    if (needsPlaygroundApi && this.playgroundClient) {
      try {
        const areaCodeToSido = this.mapAreaCodeToSido(filters?.areaCode)
        const playgroundResult = await this.playgroundClient.searchKidsCafes({
          sidoCode: areaCodeToSido,
          page,
          pageSize: Math.floor(pageSize / (needsTourApi ? 2 : 1)),
        })
        results.push(...playgroundResult.places)
        totalCount += playgroundResult.totalCount
      } catch (error) {
        errors.push(`PlaygroundAPI: ${(error as Error).message}`)
      }
    }

    // 카테고리 필터 적용
    const filteredResults = filters?.categories
      ? results.filter((p) => filters.categories!.includes(p.category))
      : results

    // 위치 기반 필터 적용
    const locationFiltered = filters?.location
      ? this.filterByLocation(filteredResults, filters.location)
      : filteredResults

    // 연령대 필터 적용
    const ageFiltered = filters?.ageGroups
      ? locationFiltered.filter(
          (p) =>
            p.recommendedAges?.some((age) => filters.ageGroups!.includes(age))
        )
      : locationFiltered

    // 결과가 없고 에러만 있으면 throw
    if (ageFiltered.length === 0 && errors.length > 0) {
      console.warn('[KidsMap] Search errors:', errors)
    }

    return {
      places: ageFiltered,
      totalCount: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / pageSize),
      searchedAt: new Date().toISOString(),
      fromCache: false,
    }
  }

  /**
   * 위치 기반 검색
   */
  async searchNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000,
    categories?: PlaceCategory[]
  ): Promise<KidsMapSearchResult> {
    if (!this.tourClient) {
      throw new KidsMapApiError(
        'TourAPI 클라이언트가 초기화되지 않았습니다.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    const result = await this.tourClient.searchByLocation(
      latitude,
      longitude,
      radiusMeters
    )

    // 카테고리 필터
    const filtered = categories
      ? result.places.filter((p) => categories.includes(p.category))
      : result.places

    return {
      ...result,
      places: filtered,
    }
  }

  /**
   * 키워드 검색
   */
  async searchByKeyword(
    keyword: string,
    options?: {
      areaCode?: TourApiAreaCode
      categories?: PlaceCategory[]
      page?: number
      pageSize?: number
    }
  ): Promise<KidsMapSearchResult> {
    if (!this.tourClient) {
      throw new KidsMapApiError(
        'TourAPI 클라이언트가 초기화되지 않았습니다.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    const result = await this.tourClient.searchByKeyword(keyword, undefined, {
      areaCode: options?.areaCode,
      page: options?.page,
      pageSize: options?.pageSize,
    })

    const filtered = options?.categories
      ? result.places.filter((p) => options.categories!.includes(p.category))
      : result.places

    return {
      ...result,
      places: filtered,
    }
  }

  /**
   * 어린이/가족 관련 장소 통합 검색 (TourAPI)
   */
  async searchKidsPlaces(options?: {
    areaCode?: TourApiAreaCode
    category?: PlaceCategory
    page?: number
    pageSize?: number
    numOfRows?: number
  }): Promise<KidsMapSearchResult> {
    if (!this.tourClient) {
      throw new KidsMapApiError(
        'TourAPI 클라이언트가 초기화되지 않았습니다.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    return this.tourClient.searchKidsPlaces(options)
  }

  /**
   * 테마파크/놀이공원 검색
   */
  async searchThemeParks(options?: {
    areaCode?: TourApiAreaCode
    page?: number
    pageSize?: number
  }): Promise<KidsMapSearchResult> {
    if (!this.tourClient) {
      throw new KidsMapApiError(
        'TourAPI 클라이언트가 초기화되지 않았습니다.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    return this.tourClient.searchKidsPlaces({
      ...options,
      category: PLACE_CATEGORIES.AMUSEMENT_PARK,
    })
  }

  /**
   * 동물원/수족관 검색
   */
  async searchZoosAndAquariums(options?: {
    areaCode?: TourApiAreaCode
    page?: number
    pageSize?: number
  }): Promise<KidsMapSearchResult> {
    if (!this.tourClient) {
      throw new KidsMapApiError(
        'TourAPI 클라이언트가 초기화되지 않았습니다.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    return this.tourClient.searchKidsPlaces({
      ...options,
      category: PLACE_CATEGORIES.ZOO_AQUARIUM,
    })
  }

  /**
   * 박물관/체험관 검색
   */
  async searchMuseums(options?: {
    areaCode?: TourApiAreaCode
    page?: number
    pageSize?: number
  }): Promise<KidsMapSearchResult> {
    if (!this.tourClient) {
      throw new KidsMapApiError(
        'TourAPI 클라이언트가 초기화되지 않았습니다.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    return this.tourClient.searchKidsPlaces({
      ...options,
      category: PLACE_CATEGORIES.MUSEUM,
    })
  }

  /**
   * 자연/공원 검색
   */
  async searchParks(options?: {
    areaCode?: TourApiAreaCode
    page?: number
    pageSize?: number
  }): Promise<KidsMapSearchResult> {
    if (!this.tourClient) {
      throw new KidsMapApiError(
        'TourAPI 클라이언트가 초기화되지 않았습니다.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    return this.tourClient.searchKidsPlaces({
      ...options,
      category: PLACE_CATEGORIES.NATURE_PARK,
    })
  }

  /**
   * 키즈카페/실내놀이터 검색
   */
  async searchKidsCafes(options?: {
    sidoCode?: string
    page?: number
    pageSize?: number
  }): Promise<KidsMapSearchResult> {
    if (!this.playgroundClient) {
      throw new KidsMapApiError(
        'PlaygroundAPI 클라이언트가 초기화되지 않았습니다.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    return this.playgroundClient.searchKidsCafes(options)
  }

  /**
   * 어린이공원 검색
   */
  async searchChildrenParks(options?: {
    sidoCode?: string
    page?: number
    pageSize?: number
  }): Promise<KidsMapSearchResult> {
    if (!this.playgroundClient) {
      throw new KidsMapApiError(
        'PlaygroundAPI 클라이언트가 초기화되지 않았습니다.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    return this.playgroundClient.searchChildrenParks(options)
  }

  /**
   * API 상태 확인
   */
  async healthCheck(): Promise<{
    tourApi: boolean
    playgroundApi: boolean
  }> {
    const [tourHealth, playgroundHealth] = await Promise.all([
      this.tourClient?.healthCheck().catch(() => false) ?? false,
      this.playgroundClient?.healthCheck().catch(() => false) ?? false,
    ])

    return {
      tourApi: tourHealth,
      playgroundApi: playgroundHealth,
    }
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.tourClient?.clearCache()
    this.playgroundClient?.clearCache()
  }

  /**
   * 사용 가능한 데이터 소스 확인
   */
  getAvailableSources(): {
    tourApi: boolean
    playgroundApi: boolean
  } {
    return {
      tourApi: this.tourClient !== null,
      playgroundApi: this.playgroundClient !== null,
    }
  }

  // ============================================
  // 내부 메서드
  // ============================================

  /**
   * TourAPI 지역코드를 시도코드로 변환
   */
  private mapAreaCodeToSido(areaCode?: TourApiAreaCode): string | undefined {
    if (!areaCode) return undefined

    const mapping: Record<number, string> = {
      1: '11',  // 서울
      2: '28',  // 인천
      3: '30',  // 대전
      4: '27',  // 대구
      5: '29',  // 광주
      6: '26',  // 부산
      7: '31',  // 울산
      8: '36',  // 세종
      31: '41', // 경기
      32: '42', // 강원
      33: '43', // 충북
      34: '44', // 충남
      35: '47', // 경북
      36: '48', // 경남
      37: '45', // 전북
      38: '46', // 전남
      39: '50', // 제주
    }

    return mapping[areaCode]
  }

  /**
   * 위치 기반 필터링
   */
  private filterByLocation(
    places: NormalizedPlace[],
    location: { latitude: number; longitude: number; radiusMeters: number }
  ): NormalizedPlace[] {
    return places.filter((place) => {
      if (!place.latitude || !place.longitude) return false

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        place.latitude,
        place.longitude
      )

      return distance <= location.radiusMeters
    })
  }

  /**
   * Haversine 공식으로 거리 계산 (미터)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000 // 지구 반지름 (미터)
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180)
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

let _kidsMapClient: KidsMapClient | null = null

/**
 * KidsMap 통합 클라이언트 싱글톤
 *
 * @example
 * ```ts
 * const client = getKidsMapClient()
 * const result = await client.search({ areaCode: 1 })
 * ```
 */
export function getKidsMapClient(): KidsMapClient {
  if (!_kidsMapClient) {
    _kidsMapClient = new KidsMapClient()
  }
  return _kidsMapClient
}

/**
 * 클라이언트 초기화 (테스트용)
 */
export function initKidsMapClient(config: Partial<KidsMapClientConfig>): KidsMapClient {
  _kidsMapClient = new KidsMapClient(config)
  return _kidsMapClient
}
