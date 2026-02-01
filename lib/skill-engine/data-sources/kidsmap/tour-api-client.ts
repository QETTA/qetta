/**
 * 한국관광공사 TourAPI 클라이언트
 *
 * @see https://api.visitkorea.or.kr/
 * @see https://www.data.go.kr/data/15101578/openapi.do
 *
 * 핵심 원칙:
 * - API 우선 (공식 Open API 활용)
 * - Rate limiting 준수
 * - 에러 시 graceful degradation
 *
 * 환경변수:
 * - TOUR_API_KEY: 한국관광공사 TourAPI 인증키
 */

import type {
  TourApiParams,
  TourApiResponse,
  TourApiPlaceItem,
  TourApiDetailItem,
  TourApiAreaCode,
  TourApiContentType,
  NormalizedPlace,
  PlaceCategory,
  AgeGroup,
  KidsMapClientConfig,
  KidsMapSearchResult,
} from './types'

import {
  PLACE_CATEGORIES,
  TOUR_API_CONTENT_TYPE,
  TOUR_API_CAT2_KIDS,
  KidsMapApiError,
  KIDSMAP_ERROR_CODES,
} from './types'

// ============================================
// 상수
// ============================================

const TOUR_API_BASE_URL = 'https://apis.data.go.kr/B551011/KorService1'

const DEFAULT_CONFIG: Omit<Required<KidsMapClientConfig>, 'tourApiKey' | 'playgroundApiKey'> = {
  defaultPageSize: 50,
  timeout: 15000,
  retryCount: 3,
  retryDelay: 1000,
  cacheTtlMinutes: 60,
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * TourAPI 카테고리를 PlaceCategory로 변환
 */
function mapCategoryFromTourApi(cat2?: string, cat3?: string): PlaceCategory {
  if (!cat2) return PLACE_CATEGORIES.OTHER

  switch (cat2) {
    case TOUR_API_CAT2_KIDS.THEME_PARK:
      return PLACE_CATEGORIES.AMUSEMENT_PARK

    case TOUR_API_CAT2_KIDS.ZOO_BOTANICAL:
      return PLACE_CATEGORIES.ZOO_AQUARIUM

    case TOUR_API_CAT2_KIDS.MUSEUM:
    case TOUR_API_CAT2_KIDS.MEMORIAL:
    case TOUR_API_CAT2_KIDS.EXHIBITION:
    case TOUR_API_CAT2_KIDS.GALLERY:
      return PLACE_CATEGORIES.MUSEUM

    case TOUR_API_CAT2_KIDS.NATURE_RECREATION:
    case TOUR_API_CAT2_KIDS.ARBORETUM:
    case TOUR_API_CAT2_KIDS.PARK:
      return PLACE_CATEGORIES.NATURE_PARK

    case TOUR_API_CAT2_KIDS.LEISURE_SPORTS:
      // 소분류에 따라 구분 가능
      return PLACE_CATEGORIES.AMUSEMENT_PARK

    default:
      return PLACE_CATEGORIES.OTHER
  }
}

/**
 * HTML 태그 제거
 */
function stripHtml(html?: string): string | undefined {
  if (!html) return undefined
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * 홈페이지 URL 추출 (HTML에서)
 */
function extractUrl(html?: string): string | undefined {
  if (!html) return undefined
  const match = html.match(/href="([^"]+)"/)
  return match ? match[1] : stripHtml(html)
}

/**
 * 연령대 추정 (제목/설명 기반)
 */
function inferAgeGroups(title: string, description?: string): AgeGroup[] | undefined {
  const text = `${title} ${description || ''}`.toLowerCase()
  const ages: AgeGroup[] = []

  // 키워드 기반 추정
  if (text.includes('영아') || text.includes('0세') || text.includes('1세') || text.includes('2세')) {
    ages.push('infant')
  }
  if (text.includes('유아') || text.includes('3세') || text.includes('4세') || text.includes('5세') || text.includes('어린이')) {
    ages.push('toddler')
  }
  if (text.includes('아동') || text.includes('초등') || text.includes('키즈')) {
    ages.push('child', 'elementary')
  }

  // 기본값: 모든 연령
  return ages.length > 0 ? ages : ['toddler', 'child', 'elementary']
}

/**
 * 장소 아이템 정규화
 */
function normalizePlace(
  item: TourApiPlaceItem | TourApiDetailItem,
  fetchedAt: string
): NormalizedPlace {
  const id = `tour-${item.contentid}`
  const detailItem = item as TourApiDetailItem

  return {
    id,
    source: 'TOUR_API',
    sourceUrl: `https://www.visitkorea.or.kr/kfes/detail/detailL.do?cid=${item.contentid}`,
    fetchedAt,

    name: item.title,
    category: mapCategoryFromTourApi(item.cat2, item.cat3),
    address: item.addr1 || '',
    addressDetail: item.addr2,
    latitude: item.mapy ? parseFloat(item.mapy) : undefined,
    longitude: item.mapx ? parseFloat(item.mapx) : undefined,
    areaCode: item.areacode,
    sigunguCode: item.sigungucode,
    tel: item.tel,
    homepage: extractUrl(item.homepage),
    description: stripHtml(item.overview),
    imageUrl: item.firstimage,
    thumbnailUrl: item.firstimage2,

    recommendedAges: inferAgeGroups(item.title, item.overview),

    amenities: {
      strollerAccess: detailItem.chkbabycarriage?.includes('가능') || detailItem.chkbabycarriage?.includes('있음'),
      parking: detailItem.parking?.includes('가능') || detailItem.parking?.includes('있음'),
    },

    operatingHours: detailItem.usetime
      ? {
          weekday: stripHtml(detailItem.usetime),
          closedDays: stripHtml(detailItem.restdate),
        }
      : undefined,

    admissionFee: detailItem.usefee
      ? {
          isFree: detailItem.usefee.includes('무료'),
          description: stripHtml(detailItem.usefee),
        }
      : undefined,

    rawData: item,
  }
}

// ============================================
// 메인 클라이언트 클래스
// ============================================

export class TourApiClient {
  private config: Required<Omit<KidsMapClientConfig, 'playgroundApiKey'>> & { tourApiKey: string }
  private cache: Map<string, { data: KidsMapSearchResult; timestamp: number }> = new Map()

  constructor(config?: Partial<KidsMapClientConfig>) {
    const apiKey = config?.tourApiKey || process.env.TOUR_API_KEY

    if (!apiKey) {
      throw new KidsMapApiError(
        'TourAPI 인증키가 설정되지 않았습니다. TOUR_API_KEY 환경변수를 확인하세요.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    this.config = {
      tourApiKey: apiKey,
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<Omit<KidsMapClientConfig, 'playgroundApiKey'>> & { tourApiKey: string }
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 지역 기반 관광정보 조회
   */
  async searchByArea(
    areaCode?: TourApiAreaCode,
    contentTypeId?: TourApiContentType,
    options?: {
      sigunguCode?: number
      cat1?: string
      cat2?: string
      cat3?: string
      page?: number
      pageSize?: number
    }
  ): Promise<KidsMapSearchResult> {
    const cacheKey = this.getCacheKey('area', { areaCode, contentTypeId, ...options })
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const params: TourApiParams = {
      serviceKey: this.config.tourApiKey,
      MobileOS: 'ETC',
      MobileApp: 'KidsMap',
      _type: 'json',
      pageNo: options?.page || 1,
      numOfRows: options?.pageSize || this.config.defaultPageSize,
      arrange: 'C', // 수정일순
    }

    if (areaCode) params.areaCode = areaCode
    if (contentTypeId) params.contentTypeId = contentTypeId
    if (options?.sigunguCode) params.sigunguCode = options.sigunguCode
    if (options?.cat1) params.cat1 = options.cat1
    if (options?.cat2) params.cat2 = options.cat2
    if (options?.cat3) params.cat3 = options.cat3

    const response = await this.fetchWithRetry<TourApiPlaceItem>(
      '/areaBasedList1',
      params
    )

    const result = this.processResponse(response, options?.page || 1, options?.pageSize)
    this.setCache(cacheKey, result)
    return result
  }

  /**
   * 위치 기반 관광정보 조회
   */
  async searchByLocation(
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000,
    contentTypeId?: TourApiContentType,
    options?: {
      page?: number
      pageSize?: number
    }
  ): Promise<KidsMapSearchResult> {
    const cacheKey = this.getCacheKey('location', { latitude, longitude, radiusMeters, contentTypeId, ...options })
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const params: TourApiParams = {
      serviceKey: this.config.tourApiKey,
      MobileOS: 'ETC',
      MobileApp: 'KidsMap',
      _type: 'json',
      pageNo: options?.page || 1,
      numOfRows: options?.pageSize || this.config.defaultPageSize,
      mapX: longitude,
      mapY: latitude,
      radius: radiusMeters,
      arrange: 'E', // 거리순
    }

    if (contentTypeId) params.contentTypeId = contentTypeId

    const response = await this.fetchWithRetry<TourApiPlaceItem>(
      '/locationBasedList1',
      params
    )

    const result = this.processResponse(response, options?.page || 1, options?.pageSize)
    this.setCache(cacheKey, result)
    return result
  }

  /**
   * 키워드 검색
   */
  async searchByKeyword(
    keyword: string,
    contentTypeId?: TourApiContentType,
    options?: {
      areaCode?: TourApiAreaCode
      page?: number
      pageSize?: number
    }
  ): Promise<KidsMapSearchResult> {
    const cacheKey = this.getCacheKey('keyword', { keyword, contentTypeId, ...options })
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const params: TourApiParams = {
      serviceKey: this.config.tourApiKey,
      MobileOS: 'ETC',
      MobileApp: 'KidsMap',
      _type: 'json',
      pageNo: options?.page || 1,
      numOfRows: options?.pageSize || this.config.defaultPageSize,
      keyword: encodeURIComponent(keyword),
      arrange: 'C',
    }

    if (contentTypeId) params.contentTypeId = contentTypeId
    if (options?.areaCode) params.areaCode = options.areaCode

    const response = await this.fetchWithRetry<TourApiPlaceItem>(
      '/searchKeyword1',
      params
    )

    const result = this.processResponse(response, options?.page || 1, options?.pageSize)
    this.setCache(cacheKey, result)
    return result
  }

  /**
   * 상세 정보 조회
   */
  async getDetail(contentId: string, contentTypeId: TourApiContentType): Promise<NormalizedPlace | null> {
    const params: TourApiParams = {
      serviceKey: this.config.tourApiKey,
      MobileOS: 'ETC',
      MobileApp: 'KidsMap',
      _type: 'json',
      contentId: contentId as unknown as string,
      contentTypeId: contentTypeId as unknown as number,
      defaultYN: 'Y',
      firstImageYN: 'Y',
      areacodeYN: 'Y',
      catcodeYN: 'Y',
      addrinfoYN: 'Y',
      mapinfoYN: 'Y',
      overviewYN: 'Y',
    } as TourApiParams & { contentId: string; defaultYN: string; firstImageYN: string; areacodeYN: string; catcodeYN: string; addrinfoYN: string; mapinfoYN: string; overviewYN: string }

    try {
      const response = await this.fetchWithRetry<TourApiDetailItem>(
        '/detailCommon1',
        params
      )

      const items = this.extractItems(response)
      if (items.length === 0) return null

      return normalizePlace(items[0], new Date().toISOString())
    } catch {
      return null
    }
  }

  /**
   * 어린이/가족 관련 장소 검색 (통합)
   */
  async searchKidsPlaces(options?: {
    areaCode?: TourApiAreaCode
    category?: PlaceCategory
    page?: number
    pageSize?: number
  }): Promise<KidsMapSearchResult> {
    const cacheKey = this.getCacheKey('kids', options || {})
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    // 카테고리에 따른 cat2 결정
    let cat2: string | undefined
    switch (options?.category) {
      case PLACE_CATEGORIES.AMUSEMENT_PARK:
        cat2 = TOUR_API_CAT2_KIDS.THEME_PARK
        break
      case PLACE_CATEGORIES.ZOO_AQUARIUM:
        cat2 = TOUR_API_CAT2_KIDS.ZOO_BOTANICAL
        break
      case PLACE_CATEGORIES.MUSEUM:
        cat2 = TOUR_API_CAT2_KIDS.MUSEUM
        break
      case PLACE_CATEGORIES.NATURE_PARK:
        cat2 = TOUR_API_CAT2_KIDS.PARK
        break
    }

    // 복수 콘텐츠 타입 조회 (관광지 + 문화시설)
    const results = await Promise.all([
      this.searchByArea(options?.areaCode, TOUR_API_CONTENT_TYPE.TOURIST_SPOT, {
        cat2,
        page: options?.page,
        pageSize: Math.floor((options?.pageSize || this.config.defaultPageSize) / 2),
      }),
      this.searchByArea(options?.areaCode, TOUR_API_CONTENT_TYPE.CULTURAL_FACILITY, {
        cat2,
        page: options?.page,
        pageSize: Math.floor((options?.pageSize || this.config.defaultPageSize) / 2),
      }),
    ])

    // 결과 병합
    const fetchedAt = new Date().toISOString()
    const allPlaces = [...results[0].places, ...results[1].places]
    const totalCount = results[0].totalCount + results[1].totalCount

    const result: KidsMapSearchResult = {
      places: allPlaces,
      totalCount,
      currentPage: options?.page || 1,
      totalPages: Math.ceil(totalCount / (options?.pageSize || this.config.defaultPageSize)),
      searchedAt: fetchedAt,
      fromCache: false,
    }

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * API 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.searchByArea(undefined, undefined, { pageSize: 1 })
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

  private async fetchWithRetry<T>(
    endpoint: string,
    params: TourApiParams
  ): Promise<TourApiResponse<T>> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        return await this.fetchApi<T>(endpoint, params)
      } catch (error) {
        lastError = error as Error
        console.warn(`[TourAPI] Attempt ${attempt} failed:`, error)

        if (attempt < this.config.retryCount) {
          await this.delay(this.config.retryDelay * attempt)
        }
      }
    }

    throw new KidsMapApiError(
      `API 호출 실패 (${this.config.retryCount}회 재시도 후): ${lastError?.message}`,
      KIDSMAP_ERROR_CODES.NETWORK_ERROR
    )
  }

  private async fetchApi<T>(
    endpoint: string,
    params: TourApiParams
  ): Promise<TourApiResponse<T>> {
    const url = new URL(`${TOUR_API_BASE_URL}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new KidsMapApiError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          KIDSMAP_ERROR_CODES.NETWORK_ERROR,
          response.status
        )
      }

      const data = await response.json()

      // 에러 응답 처리
      if (data.response?.header?.resultCode !== '0000') {
        throw new KidsMapApiError(
          data.response?.header?.resultMsg || 'API Error',
          data.response?.header?.resultCode || KIDSMAP_ERROR_CODES.UNKNOWN
        )
      }

      return data as TourApiResponse<T>
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

  private extractItems<T>(response: TourApiResponse<T>): T[] {
    const items = response.response?.body?.items?.item
    if (!items) return []
    return Array.isArray(items) ? items : [items]
  }

  private processResponse(
    response: TourApiResponse<TourApiPlaceItem>,
    page: number,
    pageSize?: number
  ): KidsMapSearchResult {
    const fetchedAt = new Date().toISOString()
    const items = this.extractItems(response)
    const places = items.map((item) => normalizePlace(item, fetchedAt))
    const totalCount = response.response?.body?.totalCount || 0

    return {
      places,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / (pageSize || this.config.defaultPageSize)),
      searchedAt: fetchedAt,
      fromCache: false,
    }
  }

  private getCacheKey(type: string, params: Record<string, unknown>): string {
    return `${type}:${JSON.stringify(params)}`
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
}

// ============================================
// 싱글톤 인스턴스
// ============================================

let _tourApiClient: TourApiClient | null = null

/**
 * TourAPI 클라이언트 싱글톤
 */
export function getTourApiClient(): TourApiClient {
  if (!_tourApiClient) {
    _tourApiClient = new TourApiClient()
  }
  return _tourApiClient
}

/**
 * 클라이언트 초기화 (테스트용)
 */
export function initTourApiClient(config: Partial<KidsMapClientConfig>): TourApiClient {
  _tourApiClient = new TourApiClient(config)
  return _tourApiClient
}
