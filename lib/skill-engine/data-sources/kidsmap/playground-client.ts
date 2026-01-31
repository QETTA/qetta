/**
 * 행정안전부 전국어린이놀이시설정보서비스 클라이언트
 *
 * @see https://www.data.go.kr/data/15124519/openapi.do
 *
 * 핵심 원칙:
 * - 공식 API 활용
 * - Rate limiting 준수
 * - 에러 시 graceful degradation
 *
 * 환경변수:
 * - PLAYGROUND_API_KEY: 어린이놀이시설 API 인증키
 */

import type {
  PlaygroundApiParams,
  PlaygroundApiResponse,
  PlaygroundApiItem,
  PlaygroundLocationCode,
  NormalizedPlace,
  KidsMapClientConfig,
  KidsMapSearchResult,
} from './types'

import {
  PLACE_CATEGORIES,
  PLAYGROUND_LOCATION_CODES,
  KidsMapApiError,
  KIDSMAP_ERROR_CODES,
} from './types'

// ============================================
// 상수
// ============================================

const PLAYGROUND_API_BASE_URL =
  'https://apis.data.go.kr/1741000/SafePlaygroundInfoService2'

const DEFAULT_CONFIG: Omit<Required<KidsMapClientConfig>, 'tourApiKey' | 'playgroundApiKey'> = {
  defaultPageSize: 100,
  timeout: 15000,
  retryCount: 3,
  retryDelay: 1000,
  cacheTtlMinutes: 60,
}

/** 시도 코드 매핑 */
const SIDO_CODES: Record<string, string> = {
  서울: '11',
  부산: '26',
  대구: '27',
  인천: '28',
  광주: '29',
  대전: '30',
  울산: '31',
  세종: '36',
  경기: '41',
  강원: '42',
  충북: '43',
  충남: '44',
  전북: '45',
  전남: '46',
  경북: '47',
  경남: '48',
  제주: '50',
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 설치장소 코드로 카테고리 결정
 */
function mapCategoryFromLocationCode(locCode?: string): 'kids_cafe' | 'nature_park' | 'other' {
  if (!locCode) return PLACE_CATEGORIES.OTHER

  switch (locCode) {
    case PLAYGROUND_LOCATION_CODES.PLAY_BUSINESS:
      return PLACE_CATEGORIES.KIDS_CAFE

    case PLAYGROUND_LOCATION_CODES.CHILDREN_PARK:
    case PLAYGROUND_LOCATION_CODES.URBAN_PARK:
      return PLACE_CATEGORIES.NATURE_PARK

    case PLAYGROUND_LOCATION_CODES.LARGE_STORE:
    case PLAYGROUND_LOCATION_CODES.RESTAURANT:
      return PLACE_CATEGORIES.KIDS_CAFE

    default:
      return PLACE_CATEGORIES.OTHER
  }
}

/**
 * 놀이시설 아이템 정규화
 */
function normalizePlayground(
  item: PlaygroundApiItem,
  fetchedAt: string
): NormalizedPlace {
  const id = `playground-${item.pfctSn || Date.now()}`
  const address = item.ronaAddr || item.lotnoAddr || ''

  return {
    id,
    source: 'PLAYGROUND_API',
    sourceUrl: 'https://www.cpf.go.kr/',
    fetchedAt,

    name: item.pfctNm || '어린이놀이시설',
    category: mapCategoryFromLocationCode(item.locCd),
    address,
    addressDetail: item.emdNm,
    latitude: item.lat ? parseFloat(item.lat) : undefined,
    longitude: item.lot ? parseFloat(item.lot) : undefined,
    areaCode: item.sidoCd,
    sigunguCode: item.sigunguCd,
    tel: item.mngInstTelno,

    description: `${item.locNm || ''} 소재 어린이놀이시설`,

    // 어린이놀이시설은 주로 유아~아동 대상
    recommendedAges: ['toddler', 'child'],

    amenities: {
      // 놀이시설 기본 정보에서 추론 가능한 것들
    },

    rawData: item,
  }
}

// ============================================
// 메인 클라이언트 클래스
// ============================================

export class PlaygroundApiClient {
  private config: Required<Omit<KidsMapClientConfig, 'tourApiKey'>> & { playgroundApiKey: string }
  private cache: Map<string, { data: KidsMapSearchResult; timestamp: number }> = new Map()

  constructor(config?: Partial<KidsMapClientConfig>) {
    const apiKey = config?.playgroundApiKey || process.env.PLAYGROUND_API_KEY

    if (!apiKey) {
      throw new KidsMapApiError(
        '어린이놀이시설 API 인증키가 설정되지 않았습니다. PLAYGROUND_API_KEY 환경변수를 확인하세요.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    this.config = {
      playgroundApiKey: apiKey,
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<Omit<KidsMapClientConfig, 'tourApiKey'>> & { playgroundApiKey: string }
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 전국 어린이놀이시설 목록 조회
   */
  async search(options?: {
    sidoCode?: string
    sigunguCode?: string
    locationCode?: PlaygroundLocationCode
    page?: number
    pageSize?: number
  }): Promise<KidsMapSearchResult> {
    const cacheKey = this.getCacheKey('search', options || {})
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const params: PlaygroundApiParams = {
      serviceKey: this.config.playgroundApiKey,
      type: 'json',
      pageNo: options?.page || 1,
      numOfRows: options?.pageSize || this.config.defaultPageSize,
    }

    if (options?.sidoCode) params.sidoCode = options.sidoCode
    if (options?.sigunguCode) params.sigunguCode = options.sigunguCode
    if (options?.locationCode) params.locCode = options.locationCode

    const response = await this.fetchWithRetry('/getSafePlaygroundInfoList', params)

    const result = this.processResponse(response, options?.page || 1, options?.pageSize)
    this.setCache(cacheKey, result)
    return result
  }

  /**
   * 시도별 조회
   */
  async searchBySido(
    sidoName: string,
    options?: {
      locationCode?: PlaygroundLocationCode
      page?: number
      pageSize?: number
    }
  ): Promise<KidsMapSearchResult> {
    const sidoCode = SIDO_CODES[sidoName]
    if (!sidoCode) {
      throw new KidsMapApiError(
        `유효하지 않은 시도명입니다: ${sidoName}`,
        KIDSMAP_ERROR_CODES.UNKNOWN
      )
    }

    return this.search({
      sidoCode,
      ...options,
    })
  }

  /**
   * 키즈카페/실내놀이터 조회
   */
  async searchKidsCafes(options?: {
    sidoCode?: string
    page?: number
    pageSize?: number
  }): Promise<KidsMapSearchResult> {
    return this.search({
      ...options,
      locationCode: PLAYGROUND_LOCATION_CODES.PLAY_BUSINESS,
    })
  }

  /**
   * 어린이공원 조회
   */
  async searchChildrenParks(options?: {
    sidoCode?: string
    page?: number
    pageSize?: number
  }): Promise<KidsMapSearchResult> {
    return this.search({
      ...options,
      locationCode: PLAYGROUND_LOCATION_CODES.CHILDREN_PARK,
    })
  }

  /**
   * 대형마트/쇼핑몰 내 놀이시설 조회
   */
  async searchMallPlaygrounds(options?: {
    sidoCode?: string
    page?: number
    pageSize?: number
  }): Promise<KidsMapSearchResult> {
    return this.search({
      ...options,
      locationCode: PLAYGROUND_LOCATION_CODES.LARGE_STORE,
    })
  }

  /**
   * API 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.search({ pageSize: 1 })
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
    params: PlaygroundApiParams
  ): Promise<PlaygroundApiResponse> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        return await this.fetchApi(endpoint, params)
      } catch (error) {
        lastError = error as Error
        console.warn(`[PlaygroundAPI] Attempt ${attempt} failed:`, error)

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

  private async fetchApi(
    endpoint: string,
    params: PlaygroundApiParams
  ): Promise<PlaygroundApiResponse> {
    const url = new URL(`${PLAYGROUND_API_BASE_URL}${endpoint}`)
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
      if (data.response?.header?.resultCode !== '00') {
        throw new KidsMapApiError(
          data.response?.header?.resultMsg || 'API Error',
          data.response?.header?.resultCode || KIDSMAP_ERROR_CODES.UNKNOWN
        )
      }

      return data as PlaygroundApiResponse
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

  private extractItems(response: PlaygroundApiResponse): PlaygroundApiItem[] {
    const items = response.response?.body?.items?.item
    if (!items) return []
    return Array.isArray(items) ? items : [items]
  }

  private processResponse(
    response: PlaygroundApiResponse,
    page: number,
    pageSize?: number
  ): KidsMapSearchResult {
    const fetchedAt = new Date().toISOString()
    const items = this.extractItems(response)
    const places = items.map((item) => normalizePlayground(item, fetchedAt))
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

let _playgroundClient: PlaygroundApiClient | null = null

/**
 * 어린이놀이시설 API 클라이언트 싱글톤
 */
export function getPlaygroundApiClient(): PlaygroundApiClient {
  if (!_playgroundClient) {
    _playgroundClient = new PlaygroundApiClient()
  }
  return _playgroundClient
}

/**
 * 클라이언트 초기화 (테스트용)
 */
export function initPlaygroundApiClient(
  config: Partial<KidsMapClientConfig>
): PlaygroundApiClient {
  _playgroundClient = new PlaygroundApiClient(config)
  return _playgroundClient
}
