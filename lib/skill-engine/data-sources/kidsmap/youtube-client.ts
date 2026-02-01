/**
 * YouTube Data API v3 클라이언트
 *
 * @see https://developers.google.com/youtube/v3
 *
 * 어린이 놀이 공간 관련 영상 검색
 * - 키즈카페 후기, 놀이공원 브이로그, 박물관 체험 등
 *
 * 환경변수:
 * - YOUTUBE_API_KEY: YouTube Data API 키
 */

import type {
  YouTubeClientConfig,
  YouTubeSearchParams,
  YouTubeApiResponse,
  YouTubeVideoItem,
  YouTubeVideoDetails,
  NormalizedContent,
  ContentSearchResult,
} from './types'

import { CONTENT_TYPES, KidsMapApiError, KIDSMAP_ERROR_CODES } from './types'

// ============================================
// 상수
// ============================================

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'

const DEFAULT_CONFIG: Omit<Required<YouTubeClientConfig>, 'apiKey'> = {
  defaultPageSize: 25,
  timeout: 15000,
  retryCount: 3,
  cacheTtlMinutes: 30,
}

/** 어린이 관련 검색 키워드 프리셋 */
export const KIDS_SEARCH_PRESETS = {
  /** 키즈카페 */
  KIDS_CAFE: ['키즈카페', '실내놀이터', '아이랑 키즈카페'],
  /** 놀이공원 */
  AMUSEMENT_PARK: ['놀이공원 브이로그', '테마파크 아이', '에버랜드 아이'],
  /** 동물원 */
  ZOO: ['동물원 아이', '아쿠아리움 아이', '수족관 체험'],
  /** 박물관 */
  MUSEUM: ['어린이박물관', '체험박물관', '과학관 아이'],
  /** 자연/공원 */
  NATURE: ['숲체험 아이', '공원 피크닉', '캠핑 아이'],
} as const

// ============================================
// 헬퍼 함수
// ============================================

/**
 * ISO 8601 duration을 초로 변환
 * PT1H2M3S -> 3723
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * HTML 엔티티 디코딩
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/**
 * 영상 아이템 정규화
 */
function normalizeVideo(
  item: YouTubeVideoItem,
  fetchedAt: string,
  details?: YouTubeVideoDetails
): NormalizedContent {
  const videoId = item.id.videoId
  const snippet = item.snippet

  return {
    id: `youtube-${videoId}`,
    source: 'YOUTUBE',
    type: CONTENT_TYPES.VIDEO,
    sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
    fetchedAt,

    title: decodeHtmlEntities(snippet.title),
    description: decodeHtmlEntities(snippet.description),
    thumbnailUrl:
      snippet.thumbnails.high?.url ||
      snippet.thumbnails.medium?.url ||
      snippet.thumbnails.default?.url,

    author: snippet.channelTitle,
    authorUrl: `https://www.youtube.com/channel/${snippet.channelId}`,
    publishedAt: snippet.publishedAt,

    viewCount: details?.statistics?.viewCount
      ? parseInt(details.statistics.viewCount, 10)
      : undefined,
    likeCount: details?.statistics?.likeCount
      ? parseInt(details.statistics.likeCount, 10)
      : undefined,
    commentCount: details?.statistics?.commentCount
      ? parseInt(details.statistics.commentCount, 10)
      : undefined,
    duration: details?.contentDetails?.duration
      ? parseDuration(details.contentDetails.duration)
      : undefined,

    rawData: { item, details },
  }
}

// ============================================
// 메인 클라이언트 클래스
// ============================================

export class YouTubeClient {
  private config: Required<YouTubeClientConfig>
  private cache: Map<string, { data: ContentSearchResult; timestamp: number }> = new Map()

  constructor(config?: Partial<YouTubeClientConfig>) {
    const apiKey = config?.apiKey || process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      throw new KidsMapApiError(
        'YouTube API 키가 설정되지 않았습니다. YOUTUBE_API_KEY 환경변수를 확인하세요.',
        KIDSMAP_ERROR_CODES.INVALID_API_KEY
      )
    }

    this.config = {
      apiKey,
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<YouTubeClientConfig>
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 영상 검색
   */
  async search(params: YouTubeSearchParams): Promise<ContentSearchResult> {
    const cacheKey = this.getCacheKey('search', params)
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const searchParams = new URLSearchParams({
      key: this.config.apiKey,
      part: 'snippet',
      type: 'video',
      q: params.query,
      maxResults: String(params.maxResults || this.config.defaultPageSize),
      order: params.order || 'relevance',
      regionCode: params.regionCode || 'KR',
      safeSearch: params.safeSearch || 'moderate',
      relevanceLanguage: 'ko',
    })

    if (params.pageToken) {
      searchParams.set('pageToken', params.pageToken)
    }
    if (params.videoDuration) {
      searchParams.set('videoDuration', params.videoDuration)
    }
    if (params.publishedAfter) {
      searchParams.set('publishedAfter', params.publishedAfter)
    }

    const response = await this.fetchWithRetry<YouTubeApiResponse>(
      '/search',
      searchParams
    )

    // 상세 정보 조회 (조회수, 좋아요 등)
    const videoIds = response.items.map((item) => item.id.videoId).join(',')
    let detailsMap: Record<string, YouTubeVideoDetails> = {}

    if (videoIds) {
      try {
        const detailsResponse = await this.getVideoDetails(videoIds)
        detailsMap = detailsResponse.reduce(
          (acc, detail) => {
            acc[detail.id] = detail
            return acc
          },
          {} as Record<string, YouTubeVideoDetails>
        )
      } catch {
        // 상세 정보 조회 실패해도 기본 검색 결과는 반환
        console.warn('[YouTube] 상세 정보 조회 실패')
      }
    }

    const fetchedAt = new Date().toISOString()
    const contents = response.items.map((item) =>
      normalizeVideo(item, fetchedAt, detailsMap[item.id.videoId])
    )

    const result: ContentSearchResult = {
      contents,
      totalCount: response.pageInfo.totalResults,
      currentPage: 1,
      nextPageToken: response.nextPageToken,
      searchedAt: fetchedAt,
      fromCache: false,
    }

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * 어린이 관련 영상 검색 (프리셋 키워드 사용)
   */
  async searchKidsContent(
    category: keyof typeof KIDS_SEARCH_PRESETS,
    placeName?: string,
    options?: {
      maxResults?: number
      order?: YouTubeSearchParams['order']
      publishedAfter?: string
    }
  ): Promise<ContentSearchResult> {
    const keywords = KIDS_SEARCH_PRESETS[category]
    const query = placeName
      ? `${placeName} ${keywords[0]}`
      : keywords.join(' OR ')

    return this.search({
      query,
      maxResults: options?.maxResults,
      order: options?.order || 'relevance',
      publishedAfter: options?.publishedAfter,
      safeSearch: 'strict', // 어린이용은 엄격한 안전 검색
    })
  }

  /**
   * 특정 장소 관련 영상 검색
   */
  async searchByPlace(
    placeName: string,
    options?: {
      maxResults?: number
      order?: YouTubeSearchParams['order']
    }
  ): Promise<ContentSearchResult> {
    return this.search({
      query: `${placeName} 후기 브이로그`,
      maxResults: options?.maxResults,
      order: options?.order || 'relevance',
      safeSearch: 'moderate',
    })
  }

  /**
   * 영상 상세 정보 조회
   */
  async getVideoDetails(videoIds: string): Promise<YouTubeVideoDetails[]> {
    const params = new URLSearchParams({
      key: this.config.apiKey,
      part: 'snippet,contentDetails,statistics',
      id: videoIds,
    })

    const response = await this.fetchWithRetry<{ items: YouTubeVideoDetails[] }>(
      '/videos',
      params
    )

    return response.items || []
  }

  /**
   * API 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.search({ query: '테스트', maxResults: 1 })
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
        console.warn(`[YouTube API] Attempt ${attempt} failed:`, error)

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
    const url = `${YOUTUBE_API_BASE_URL}${endpoint}?${params.toString()}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new KidsMapApiError(
          errorData.error?.message || `HTTP Error: ${response.status}`,
          errorData.error?.code || KIDSMAP_ERROR_CODES.NETWORK_ERROR,
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
// 싱글톤 인스턴스
// ============================================

let _youtubeClient: YouTubeClient | null = null

/**
 * YouTube 클라이언트 싱글톤
 */
export function getYouTubeClient(): YouTubeClient {
  if (!_youtubeClient) {
    _youtubeClient = new YouTubeClient()
  }
  return _youtubeClient
}

/**
 * 클라이언트 초기화 (테스트용)
 */
export function initYouTubeClient(config: Partial<YouTubeClientConfig>): YouTubeClient {
  _youtubeClient = new YouTubeClient(config)
  return _youtubeClient
}
