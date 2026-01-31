/**
 * 네이버 검색 API 클라이언트 (블로그 + 클립)
 *
 * @see https://developers.naver.com/docs/search/blog/
 * @see https://developers.naver.com/docs/search/video/
 *
 * 어린이 놀이 공간 관련 블로그 후기 및 클립 영상 검색
 *
 * 환경변수:
 * - NAVER_CLIENT_ID: 네이버 개발자 Client ID
 * - NAVER_CLIENT_SECRET: 네이버 개발자 Client Secret
 */

import type {
  NaverClientConfig,
  NaverSearchParams,
  NaverBlogApiResponse,
  NaverBlogItem,
  NaverClipItem,
  NormalizedContent,
  ContentSearchResult,
} from './types'

import { CONTENT_TYPES, KidsMapApiError, KIDSMAP_ERROR_CODES } from './types'

// ============================================
// 상수
// ============================================

const NAVER_API_BASE_URL = 'https://openapi.naver.com/v1/search'

const DEFAULT_CONFIG: Omit<Required<NaverClientConfig>, 'clientId' | 'clientSecret'> = {
  defaultPageSize: 20,
  timeout: 10000,
  retryCount: 3,
  cacheTtlMinutes: 30,
}

/** 어린이 관련 검색 키워드 프리셋 */
export const NAVER_KIDS_SEARCH_PRESETS = {
  /** 키즈카페 */
  KIDS_CAFE: '키즈카페 후기',
  /** 놀이공원 */
  AMUSEMENT_PARK: '놀이공원 아이 후기',
  /** 동물원 */
  ZOO: '동물원 아이랑',
  /** 박물관 */
  MUSEUM: '어린이박물관 후기',
  /** 자연/공원 */
  NATURE: '아이랑 공원 나들이',
} as const

// ============================================
// 헬퍼 함수
// ============================================

/**
 * HTML 태그 제거 및 엔티티 디코딩
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/**
 * 날짜 포맷 변환 (YYYYMMDD -> ISO)
 */
function parseNaverDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return new Date().toISOString()

  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)

  return new Date(`${year}-${month}-${day}`).toISOString()
}

/**
 * 블로그 아이템 정규화
 */
function normalizeBlogPost(
  item: NaverBlogItem,
  fetchedAt: string
): NormalizedContent {
  return {
    id: `naver-blog-${Buffer.from(item.link).toString('base64').substring(0, 20)}`,
    source: 'NAVER_BLOG',
    type: CONTENT_TYPES.BLOG_POST,
    sourceUrl: item.link,
    fetchedAt,

    title: cleanHtml(item.title),
    description: cleanHtml(item.description),

    author: item.bloggername,
    authorUrl: item.bloggerlink,
    publishedAt: parseNaverDate(item.postdate),

    rawData: item,
  }
}

/**
 * 클립 아이템 정규화
 */
function normalizeClip(
  item: NaverClipItem,
  fetchedAt: string
): NormalizedContent {
  return {
    id: `naver-clip-${item.clipId}`,
    source: 'NAVER_CLIP',
    type: CONTENT_TYPES.SHORT_VIDEO,
    sourceUrl: item.url,
    fetchedAt,

    title: item.title,
    thumbnailUrl: item.thumbnailUrl,

    author: item.author,
    authorUrl: item.authorUrl,
    publishedAt: item.publishedAt || fetchedAt,

    viewCount: item.viewCount,
    likeCount: item.likeCount,
    duration: item.duration,

    rawData: item,
  }
}

// ============================================
// 네이버 블로그 클라이언트
// ============================================

export class NaverBlogClient {
  private config: Required<NaverClientConfig>
  private cache: Map<string, { data: ContentSearchResult; timestamp: number }> = new Map()

  constructor(config?: Partial<NaverClientConfig>) {
    const clientId = config?.clientId || process.env.NAVER_CLIENT_ID
    const clientSecret = config?.clientSecret || process.env.NAVER_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new KidsMapApiError(
        '네이버 API 인증 정보가 설정되지 않았습니다. NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수를 확인하세요.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    this.config = {
      clientId,
      clientSecret,
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<NaverClientConfig>
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 블로그 검색
   */
  async search(params: NaverSearchParams): Promise<ContentSearchResult> {
    const cacheKey = this.getCacheKey('blog', params)
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const searchParams = new URLSearchParams({
      query: params.query,
      display: String(params.display || this.config.defaultPageSize),
      start: String(params.start || 1),
      sort: params.sort || 'sim',
    })

    const response = await this.fetchWithRetry<NaverBlogApiResponse>(
      '/blog.json',
      searchParams
    )

    const fetchedAt = new Date().toISOString()
    const contents = response.items.map((item) => normalizeBlogPost(item, fetchedAt))

    const currentPage = Math.ceil((params.start || 1) / (params.display || this.config.defaultPageSize))

    const result: ContentSearchResult = {
      contents,
      totalCount: response.total,
      currentPage,
      searchedAt: fetchedAt,
      fromCache: false,
    }

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * 어린이 관련 블로그 검색
   */
  async searchKidsContent(
    category: keyof typeof NAVER_KIDS_SEARCH_PRESETS,
    placeName?: string,
    options?: {
      display?: number
      sort?: 'sim' | 'date'
    }
  ): Promise<ContentSearchResult> {
    const baseKeyword = NAVER_KIDS_SEARCH_PRESETS[category]
    const query = placeName ? `${placeName} ${baseKeyword}` : baseKeyword

    return this.search({
      query,
      display: options?.display,
      sort: options?.sort || 'sim',
    })
  }

  /**
   * 특정 장소 관련 블로그 검색
   */
  async searchByPlace(
    placeName: string,
    options?: {
      display?: number
      sort?: 'sim' | 'date'
    }
  ): Promise<ContentSearchResult> {
    return this.search({
      query: `${placeName} 후기 아이`,
      display: options?.display,
      sort: options?.sort || 'sim',
    })
  }

  /**
   * API 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.search({ query: '테스트', display: 1 })
      return result.contents.length >= 0
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
    params: URLSearchParams
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        return await this.fetchApi<T>(endpoint, params)
      } catch (error) {
        lastError = error as Error
        console.warn(`[Naver API] Attempt ${attempt} failed:`, error)

        if (attempt < this.config.retryCount) {
          await this.delay(1000 * attempt)
        }
      }
    }

    throw new KidsMapApiError(
      `API 호출 실패 (${this.config.retryCount}회 재시도 후): ${lastError?.message}`,
      KIDSMAP_ERROR_CODES.NETWORK_ERROR
    )
  }

  private async fetchApi<T>(endpoint: string, params: URLSearchParams): Promise<T> {
    const url = `${NAVER_API_BASE_URL}${endpoint}?${params.toString()}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Naver-Client-Id': this.config.clientId,
          'X-Naver-Client-Secret': this.config.clientSecret,
          Accept: 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new KidsMapApiError(
          errorData.errorMessage || `HTTP Error: ${response.status}`,
          errorData.errorCode || KIDSMAP_ERROR_CODES.NETWORK_ERROR,
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

  private getCacheKey(type: string, params: unknown): string {
    return `${type}:${JSON.stringify(params)}`
  }

  private getFromCache(key: string): ContentSearchResult | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const ttl = this.config.cacheTtlMinutes * 60 * 1000
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key)
      return null
    }

    return { ...cached.data, fromCache: true }
  }

  private setCache(key: string, data: ContentSearchResult): void {
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
// 네이버 클립 클라이언트 (비디오 검색 API 활용)
// ============================================

export class NaverClipClient {
  private config: Required<NaverClientConfig>
  private cache: Map<string, { data: ContentSearchResult; timestamp: number }> = new Map()

  constructor(config?: Partial<NaverClientConfig>) {
    const clientId = config?.clientId || process.env.NAVER_CLIENT_ID
    const clientSecret = config?.clientSecret || process.env.NAVER_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new KidsMapApiError(
        '네이버 API 인증 정보가 설정되지 않았습니다.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    this.config = {
      clientId,
      clientSecret,
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<NaverClientConfig>
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 비디오/클립 검색 (네이버 비디오 검색 API)
   */
  async search(params: NaverSearchParams): Promise<ContentSearchResult> {
    const cacheKey = this.getCacheKey('clip', params)
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const searchParams = new URLSearchParams({
      query: params.query,
      display: String(params.display || this.config.defaultPageSize),
      start: String(params.start || 1),
      sort: params.sort || 'sim',
    })

    // 네이버 비디오 검색 API 사용
    const response = await this.fetchWithRetry<NaverVideoApiResponse>(
      '/video.json',
      searchParams
    )

    const fetchedAt = new Date().toISOString()
    const contents = response.items.map((item) =>
      this.normalizeVideoToClip(item, fetchedAt)
    )

    const currentPage = Math.ceil(
      (params.start || 1) / (params.display || this.config.defaultPageSize)
    )

    const result: ContentSearchResult = {
      contents,
      totalCount: response.total,
      currentPage,
      searchedAt: fetchedAt,
      fromCache: false,
    }

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * 어린이 관련 클립 검색
   */
  async searchKidsContent(
    category: keyof typeof NAVER_KIDS_SEARCH_PRESETS,
    placeName?: string,
    options?: {
      display?: number
    }
  ): Promise<ContentSearchResult> {
    const baseKeyword = NAVER_KIDS_SEARCH_PRESETS[category]
    const query = placeName ? `${placeName} ${baseKeyword}` : baseKeyword

    return this.search({
      query,
      display: options?.display,
    })
  }

  /**
   * 특정 장소 관련 클립 검색
   */
  async searchByPlace(
    placeName: string,
    options?: {
      display?: number
    }
  ): Promise<ContentSearchResult> {
    return this.search({
      query: `${placeName} 브이로그`,
      display: options?.display,
    })
  }

  /**
   * API 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.search({ query: '테스트', display: 1 })
      return result.contents.length >= 0
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

  private normalizeVideoToClip(
    item: NaverVideoItem,
    fetchedAt: string
  ): NormalizedContent {
    return {
      id: `naver-clip-${Buffer.from(item.link).toString('base64').substring(0, 20)}`,
      source: 'NAVER_CLIP',
      type: CONTENT_TYPES.SHORT_VIDEO,
      sourceUrl: item.link,
      fetchedAt,

      title: cleanHtml(item.title),
      description: cleanHtml(item.description),
      thumbnailUrl: item.thumbnail,

      author: item.publisher || 'Unknown',
      publishedAt: fetchedAt,

      duration: item.playtime,

      rawData: item,
    }
  }

  private async fetchWithRetry<T>(
    endpoint: string,
    params: URLSearchParams
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        return await this.fetchApi<T>(endpoint, params)
      } catch (error) {
        lastError = error as Error

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

  private async fetchApi<T>(endpoint: string, params: URLSearchParams): Promise<T> {
    const url = `${NAVER_API_BASE_URL}${endpoint}?${params.toString()}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Naver-Client-Id': this.config.clientId,
          'X-Naver-Client-Secret': this.config.clientSecret,
          Accept: 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new KidsMapApiError(
          `HTTP Error: ${response.status}`,
          KIDSMAP_ERROR_CODES.NETWORK_ERROR,
          response.status
        )
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof KidsMapApiError) {
        throw error
      }

      throw new KidsMapApiError(
        `네트워크 오류: ${(error as Error).message}`,
        KIDSMAP_ERROR_CODES.NETWORK_ERROR
      )
    }
  }

  private getCacheKey(type: string, params: unknown): string {
    return `${type}:${JSON.stringify(params)}`
  }

  private getFromCache(key: string): ContentSearchResult | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const ttl = this.config.cacheTtlMinutes * 60 * 1000
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key)
      return null
    }

    return { ...cached.data, fromCache: true }
  }

  private setCache(key: string, data: ContentSearchResult): void {
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
// 네이버 비디오 API 응답 타입 (내부용)
// ============================================

interface NaverVideoApiResponse {
  lastBuildDate: string
  total: number
  start: number
  display: number
  items: NaverVideoItem[]
}

interface NaverVideoItem {
  title: string
  link: string
  description: string
  thumbnail: string
  playtime: number
  publisher?: string
}

// ============================================
// 싱글톤 인스턴스
// ============================================

let _naverBlogClient: NaverBlogClient | null = null
let _naverClipClient: NaverClipClient | null = null

/**
 * 네이버 블로그 클라이언트 싱글톤
 */
export function getNaverBlogClient(): NaverBlogClient {
  if (!_naverBlogClient) {
    _naverBlogClient = new NaverBlogClient()
  }
  return _naverBlogClient
}

/**
 * 네이버 클립 클라이언트 싱글톤
 */
export function getNaverClipClient(): NaverClipClient {
  if (!_naverClipClient) {
    _naverClipClient = new NaverClipClient()
  }
  return _naverClipClient
}

/**
 * 블로그 클라이언트 초기화 (테스트용)
 */
export function initNaverBlogClient(config: Partial<NaverClientConfig>): NaverBlogClient {
  _naverBlogClient = new NaverBlogClient(config)
  return _naverBlogClient
}

/**
 * 클립 클라이언트 초기화 (테스트용)
 */
export function initNaverClipClient(config: Partial<NaverClientConfig>): NaverClipClient {
  _naverClipClient = new NaverClipClient(config)
  return _naverClipClient
}
