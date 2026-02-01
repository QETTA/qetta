/**
 * 카카오 로컬 API 클라이언트
 *
 * @see https://developers.kakao.com/docs/latest/ko/local/dev-guide
 *
 * 카카오맵 기반 장소 검색
 * - 키워드 검색
 * - 카테고리 검색 (키즈카페, 놀이공원 등)
 * - 위치 기반 검색
 *
 * 환경변수:
 * - KAKAO_REST_API_KEY: 카카오 REST API 키
 */

import type { NormalizedPlace, PlaceCategory, KidsMapSearchResult } from './types'

import { PLACE_CATEGORIES, KidsMapApiError, KIDSMAP_ERROR_CODES } from './types'

// ============================================
// 상수
// ============================================

const KAKAO_API_BASE_URL = 'https://dapi.kakao.com/v2/local'

/** 카카오 카테고리 그룹 코드 */
export const KAKAO_CATEGORY_CODES = {
  /** 대형마트 */
  MART: 'MT1',
  /** 편의점 */
  CONVENIENCE: 'CS2',
  /** 어린이집, 유치원 */
  PRESCHOOL: 'PS3',
  /** 학교 */
  SCHOOL: 'SC4',
  /** 학원 */
  ACADEMY: 'AC5',
  /** 주차장 */
  PARKING: 'PK6',
  /** 주유소, 충전소 */
  GAS_STATION: 'OL7',
  /** 지하철역 */
  SUBWAY: 'SW8',
  /** 은행 */
  BANK: 'BK9',
  /** 문화시설 */
  CULTURE: 'CT1',
  /** 중개업소 */
  AGENCY: 'AG2',
  /** 공공기관 */
  PUBLIC: 'PO3',
  /** 관광명소 */
  TOURIST: 'AT4',
  /** 숙박 */
  ACCOMMODATION: 'AD5',
  /** 음식점 */
  RESTAURANT: 'FD6',
  /** 카페 */
  CAFE: 'CE7',
  /** 병원 */
  HOSPITAL: 'HP8',
  /** 약국 */
  PHARMACY: 'PM9',
} as const

export type KakaoCategoryCode = (typeof KAKAO_CATEGORY_CODES)[keyof typeof KAKAO_CATEGORY_CODES]

/** 어린이 관련 키워드 프리셋 */
export const KAKAO_KIDS_KEYWORDS = {
  /** 키즈카페 */
  KIDS_CAFE: ['키즈카페', '실내놀이터', '어린이놀이터'],
  /** 놀이공원 */
  AMUSEMENT_PARK: ['놀이공원', '테마파크', '어린이놀이공원'],
  /** 동물원 */
  ZOO: ['동물원', '아쿠아리움', '수족관'],
  /** 박물관 */
  MUSEUM: ['어린이박물관', '체험박물관', '과학관'],
  /** 공원 */
  PARK: ['어린이공원', '놀이터', '유아숲체험원'],
} as const

// ============================================
// 타입 정의
// ============================================

export interface KakaoClientConfig {
  /** REST API 키 */
  restApiKey: string
  /** 기본 페이지 크기 */
  defaultPageSize?: number
  /** 타임아웃 (ms) */
  timeout?: number
  /** 재시도 횟수 */
  retryCount?: number
  /** 캐시 TTL (분) */
  cacheTtlMinutes?: number
}

export interface KakaoSearchParams {
  /** 검색 키워드 */
  query: string
  /** 카테고리 그룹 코드 */
  category_group_code?: KakaoCategoryCode
  /** 중심 좌표 경도 */
  x?: string
  /** 중심 좌표 위도 */
  y?: string
  /** 반경 (미터, 최대 20000) */
  radius?: number
  /** 결과 페이지 번호 */
  page?: number
  /** 한 페이지에 보여질 문서 개수 (최대 15) */
  size?: number
  /** 정렬 기준 (distance: 거리순, accuracy: 정확도순) */
  sort?: 'distance' | 'accuracy'
}

export interface KakaoPlaceResponse {
  meta: {
    total_count: number
    pageable_count: number
    is_end: boolean
    same_name?: {
      region: string[]
      keyword: string
      selected_region: string
    }
  }
  documents: KakaoPlaceDocument[]
}

export interface KakaoPlaceDocument {
  /** 장소 ID */
  id: string
  /** 장소명 */
  place_name: string
  /** 카테고리 이름 */
  category_name: string
  /** 카테고리 그룹 코드 */
  category_group_code: string
  /** 카테고리 그룹명 */
  category_group_name: string
  /** 전화번호 */
  phone: string
  /** 지번 주소 */
  address_name: string
  /** 도로명 주소 */
  road_address_name: string
  /** 경도 */
  x: string
  /** 위도 */
  y: string
  /** 장소 상세페이지 URL */
  place_url: string
  /** 중심좌표까지의 거리 (m) */
  distance?: string
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 카카오 카테고리를 PlaceCategory로 매핑
 */
function mapCategoryFromKakao(categoryName: string, categoryGroupCode: string): PlaceCategory {
  const lowerName = categoryName.toLowerCase()

  // 카테고리 이름 기반 매핑
  if (lowerName.includes('키즈카페') || lowerName.includes('실내놀이터')) {
    return PLACE_CATEGORIES.KIDS_CAFE
  }
  if (lowerName.includes('놀이공원') || lowerName.includes('테마파크')) {
    return PLACE_CATEGORIES.AMUSEMENT_PARK
  }
  if (lowerName.includes('동물원') || lowerName.includes('수족관') || lowerName.includes('아쿠아리움')) {
    return PLACE_CATEGORIES.ZOO_AQUARIUM
  }
  if (lowerName.includes('박물관') || lowerName.includes('체험관') || lowerName.includes('과학관')) {
    return PLACE_CATEGORIES.MUSEUM
  }
  if (lowerName.includes('공원') || lowerName.includes('숲') || lowerName.includes('자연')) {
    return PLACE_CATEGORIES.NATURE_PARK
  }

  // 카테고리 그룹 코드 기반 매핑
  switch (categoryGroupCode) {
    case KAKAO_CATEGORY_CODES.CULTURE:
      return PLACE_CATEGORIES.MUSEUM
    case KAKAO_CATEGORY_CODES.TOURIST:
      return PLACE_CATEGORIES.AMUSEMENT_PARK
    default:
      return PLACE_CATEGORIES.OTHER
  }
}

/**
 * 카카오 장소를 정규화
 */
function normalizeKakaoPlace(doc: KakaoPlaceDocument, fetchedAt: string): NormalizedPlace {
  return {
    id: `kakao-${doc.id}`,
    source: 'KAKAO_MAP' as 'TOUR_API', // 타입 호환성을 위해 캐스팅
    sourceUrl: doc.place_url,
    fetchedAt,

    name: doc.place_name,
    category: mapCategoryFromKakao(doc.category_name, doc.category_group_code),
    address: doc.road_address_name || doc.address_name,
    addressDetail: doc.address_name !== doc.road_address_name ? doc.address_name : undefined,
    latitude: parseFloat(doc.y),
    longitude: parseFloat(doc.x),
    tel: doc.phone || undefined,

    description: doc.category_name,

    // 어린이 관련 장소는 기본 연령대 설정
    recommendedAges: ['toddler', 'child', 'elementary'],

    rawData: doc,
  }
}

// ============================================
// 메인 클라이언트 클래스
// ============================================

export class KakaoLocalClient {
  private config: Required<KakaoClientConfig>
  private cache: Map<string, { data: KidsMapSearchResult; timestamp: number }> = new Map()

  constructor(config?: Partial<KakaoClientConfig>) {
    const restApiKey = config?.restApiKey || process.env.KAKAO_REST_API_KEY

    if (!restApiKey) {
      throw new KidsMapApiError(
        '카카오 REST API 키가 설정되지 않았습니다. KAKAO_REST_API_KEY 환경변수를 확인하세요.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    this.config = {
      restApiKey,
      defaultPageSize: 15,
      timeout: 10000,
      retryCount: 3,
      cacheTtlMinutes: 30,
      ...config,
    } as Required<KakaoClientConfig>
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 키워드로 장소 검색
   */
  async searchByKeyword(
    keyword: string,
    options?: {
      x?: number
      y?: number
      radius?: number
      page?: number
      size?: number
      sort?: 'distance' | 'accuracy'
    }
  ): Promise<KidsMapSearchResult> {
    const cacheKey = this.getCacheKey('keyword', { keyword, ...options })
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const params: KakaoSearchParams = {
      query: keyword,
      page: options?.page || 1,
      size: options?.size || this.config.defaultPageSize,
      sort: options?.sort || 'accuracy',
    }

    if (options?.x) params.x = String(options.x)
    if (options?.y) params.y = String(options.y)
    if (options?.radius) params.radius = options.radius

    const response = await this.fetchWithRetry('/search/keyword.json', params)
    const result = this.processResponse(response, options?.page || 1)

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * 카테고리로 장소 검색
   */
  async searchByCategory(
    categoryCode: KakaoCategoryCode,
    options?: {
      x: number
      y: number
      radius?: number
      page?: number
      size?: number
      sort?: 'distance' | 'accuracy'
    }
  ): Promise<KidsMapSearchResult> {
    if (!options?.x || !options?.y) {
      throw new KidsMapApiError(
        '카테고리 검색은 중심 좌표(x, y)가 필수입니다.',
        KIDSMAP_ERROR_CODES.UNKNOWN
      )
    }

    const cacheKey = this.getCacheKey('category', { categoryCode, ...options })
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const params = new URLSearchParams({
      category_group_code: categoryCode,
      x: String(options.x),
      y: String(options.y),
      radius: String(options.radius || 5000),
      page: String(options.page || 1),
      size: String(options.size || this.config.defaultPageSize),
      sort: options.sort || 'distance',
    })

    const response = await this.fetchApi<KakaoPlaceResponse>(
      `/search/category.json?${params.toString()}`
    )
    const result = this.processResponse(response, options.page || 1)

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * 어린이 관련 장소 검색 (통합)
   */
  async searchKidsPlaces(
    category: keyof typeof KAKAO_KIDS_KEYWORDS,
    options?: {
      x?: number
      y?: number
      radius?: number
      page?: number
    }
  ): Promise<KidsMapSearchResult> {
    const keywords = KAKAO_KIDS_KEYWORDS[category]
    const allResults: NormalizedPlace[] = []
    let totalCount = 0

    // 각 키워드로 검색
    for (const keyword of keywords) {
      try {
        const result = await this.searchByKeyword(keyword, {
          x: options?.x,
          y: options?.y,
          radius: options?.radius,
          page: options?.page,
          size: 5, // 키워드당 5개씩
        })
        allResults.push(...result.places)
        totalCount += result.totalCount
      } catch {
        // 개별 키워드 실패는 무시
      }
    }

    // 중복 제거 (ID 기준)
    const uniquePlaces = Array.from(
      new Map(allResults.map((p) => [p.id, p])).values()
    )

    return {
      places: uniquePlaces,
      totalCount,
      currentPage: options?.page || 1,
      totalPages: Math.ceil(totalCount / this.config.defaultPageSize),
      searchedAt: new Date().toISOString(),
      fromCache: false,
    }
  }

  /**
   * 키즈카페 검색
   */
  async searchKidsCafes(options?: {
    x?: number
    y?: number
    radius?: number
    page?: number
  }): Promise<KidsMapSearchResult> {
    return this.searchKidsPlaces('KIDS_CAFE', options)
  }

  /**
   * 놀이공원 검색
   */
  async searchAmusementParks(options?: {
    x?: number
    y?: number
    radius?: number
    page?: number
  }): Promise<KidsMapSearchResult> {
    return this.searchKidsPlaces('AMUSEMENT_PARK', options)
  }

  /**
   * 동물원/수족관 검색
   */
  async searchZoos(options?: {
    x?: number
    y?: number
    radius?: number
    page?: number
  }): Promise<KidsMapSearchResult> {
    return this.searchKidsPlaces('ZOO', options)
  }

  /**
   * 박물관/체험관 검색
   */
  async searchMuseums(options?: {
    x?: number
    y?: number
    radius?: number
    page?: number
  }): Promise<KidsMapSearchResult> {
    return this.searchKidsPlaces('MUSEUM', options)
  }

  /**
   * 공원/자연 검색
   */
  async searchParks(options?: {
    x?: number
    y?: number
    radius?: number
    page?: number
  }): Promise<KidsMapSearchResult> {
    return this.searchKidsPlaces('PARK', options)
  }

  /**
   * 위치 기반 주변 어린이 장소 검색
   */
  async searchNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000
  ): Promise<KidsMapSearchResult> {
    const allResults: NormalizedPlace[] = []
    let totalCount = 0

    // 모든 카테고리에서 검색
    const categories = Object.keys(KAKAO_KIDS_KEYWORDS) as (keyof typeof KAKAO_KIDS_KEYWORDS)[]

    for (const category of categories) {
      try {
        const result = await this.searchKidsPlaces(category, {
          x: longitude,
          y: latitude,
          radius: radiusMeters,
        })
        allResults.push(...result.places)
        totalCount += result.totalCount
      } catch {
        // 개별 카테고리 실패는 무시
      }
    }

    // 중복 제거 및 거리순 정렬
    const uniquePlaces = Array.from(
      new Map(allResults.map((p) => [p.id, p])).values()
    ).sort((a, b) => {
      if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 0
      const distA = this.calculateDistance(latitude, longitude, a.latitude, a.longitude)
      const distB = this.calculateDistance(latitude, longitude, b.latitude, b.longitude)
      return distA - distB
    })

    return {
      places: uniquePlaces,
      totalCount,
      currentPage: 1,
      totalPages: 1,
      searchedAt: new Date().toISOString(),
      fromCache: false,
    }
  }

  /**
   * API 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.searchByKeyword('키즈카페', { size: 1 })
      return result.places.length >= 0
    } catch {
      return false
    }
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.cache.clear()
  }

  // ============================================
  // 내부 메서드
  // ============================================

  private async fetchWithRetry(
    endpoint: string,
    params: KakaoSearchParams
  ): Promise<KakaoPlaceResponse> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.set(key, String(value))
          }
        })

        return await this.fetchApi<KakaoPlaceResponse>(
          `${endpoint}?${searchParams.toString()}`
        )
      } catch (error) {
        lastError = error as Error
        console.warn(`[Kakao API] Attempt ${attempt} failed:`, error)

        if (attempt < this.config.retryCount) {
          await this.delay(1000 * attempt)
        }
      }
    }

    throw new KidsMapApiError(
      `API 호출 실패: ${lastError?.message}`,
      KIDSMAP_ERROR_CODES.NETWORK_ERROR
    )
  }

  private async fetchApi<T>(endpoint: string): Promise<T> {
    const url = `${KAKAO_API_BASE_URL}${endpoint}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `KakaoAK ${this.config.restApiKey}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new KidsMapApiError(
          errorData.message || `HTTP Error: ${response.status}`,
          errorData.code || KIDSMAP_ERROR_CODES.NETWORK_ERROR,
          response.status
        )
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof KidsMapApiError) {
        throw error
      }

      if ((error as Error).name === 'AbortError') {
        throw new KidsMapApiError(
          `요청 타임아웃 (${this.config.timeout}ms)`,
          KIDSMAP_ERROR_CODES.TIMEOUT
        )
      }

      throw new KidsMapApiError(
        `네트워크 오류: ${(error as Error).message}`,
        KIDSMAP_ERROR_CODES.NETWORK_ERROR
      )
    }
  }

  private processResponse(response: KakaoPlaceResponse, page: number): KidsMapSearchResult {
    const fetchedAt = new Date().toISOString()
    const places = response.documents.map((doc) => normalizeKakaoPlace(doc, fetchedAt))

    return {
      places,
      totalCount: response.meta.total_count,
      currentPage: page,
      totalPages: Math.ceil(response.meta.pageable_count / this.config.defaultPageSize),
      searchedAt: fetchedAt,
      fromCache: false,
    }
  }

  private getCacheKey(type: string, params: unknown): string {
    return `kakao-${type}:${JSON.stringify(params)}`
  }

  private getFromCache(key: string): KidsMapSearchResult | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const ttl = this.config.cacheTtlMinutes * 60 * 1000
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key)
      return null
    }

    return { ...cached.data, fromCache: true }
  }

  private setCache(key: string, data: KidsMapSearchResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000
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

let _kakaoClient: KakaoLocalClient | null = null

/**
 * 카카오 로컬 클라이언트 싱글톤
 */
export function getKakaoLocalClient(): KakaoLocalClient {
  if (!_kakaoClient) {
    _kakaoClient = new KakaoLocalClient()
  }
  return _kakaoClient
}

/**
 * 클라이언트 초기화 (테스트용)
 */
export function initKakaoLocalClient(config: Partial<KakaoClientConfig>): KakaoLocalClient {
  _kakaoClient = new KakaoLocalClient(config)
  return _kakaoClient
}
