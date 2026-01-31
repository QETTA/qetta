/**
 * KidsMap 통합 콘텐츠 클라이언트
 *
 * YouTube, 네이버 블로그, 네이버 클립을 통합 검색
 *
 * @example
 * ```ts
 * const client = getContentClient()
 *
 * // 통합 검색
 * const result = await client.search({
 *   keyword: '에버랜드 아이',
 *   sources: ['YOUTUBE', 'NAVER_BLOG'],
 *   safeSearch: true,
 * })
 *
 * // 장소 기반 콘텐츠 검색
 * const placeContent = await client.searchByPlace('롯데월드')
 *
 * // 카테고리별 검색
 * const kidsCafeContent = await client.searchKidsContent('KIDS_CAFE')
 * ```
 */

import { YouTubeClient, getYouTubeClient, initYouTubeClient } from './youtube-client'
import {
  NaverBlogClient,
  NaverClipClient,
  getNaverBlogClient,
  getNaverClipClient,
  initNaverBlogClient,
  initNaverClipClient,
  NAVER_KIDS_SEARCH_PRESETS,
} from './naver-client'
import { KIDS_SEARCH_PRESETS } from './youtube-client'

import type {
  ContentSource,
  ContentSearchFilters,
  ContentSearchResult,
  NormalizedContent,
  KidsMapFullClientConfig,
} from './types'

import { KidsMapApiError, KIDSMAP_ERROR_CODES } from './types'

// ============================================
// 통합 콘텐츠 클라이언트
// ============================================

export class ContentClient {
  private youtubeClient: YouTubeClient | null = null
  private naverBlogClient: NaverBlogClient | null = null
  private naverClipClient: NaverClipClient | null = null

  constructor(config?: Partial<KidsMapFullClientConfig>) {
    // YouTube 클라이언트 초기화
    try {
      if (config?.youtubeApiKey || process.env.YOUTUBE_API_KEY) {
        this.youtubeClient = config?.youtubeApiKey
          ? initYouTubeClient({ apiKey: config.youtubeApiKey })
          : getYouTubeClient()
      }
    } catch {
      console.warn('[ContentClient] YouTube 클라이언트 초기화 실패')
    }

    // 네이버 블로그 클라이언트 초기화
    try {
      if (
        (config?.naverClientId && config?.naverClientSecret) ||
        (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET)
      ) {
        this.naverBlogClient =
          config?.naverClientId && config?.naverClientSecret
            ? initNaverBlogClient({
                clientId: config.naverClientId,
                clientSecret: config.naverClientSecret,
              })
            : getNaverBlogClient()
      }
    } catch {
      console.warn('[ContentClient] 네이버 블로그 클라이언트 초기화 실패')
    }

    // 네이버 클립 클라이언트 초기화
    try {
      if (
        (config?.naverClientId && config?.naverClientSecret) ||
        (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET)
      ) {
        this.naverClipClient =
          config?.naverClientId && config?.naverClientSecret
            ? initNaverClipClient({
                clientId: config.naverClientId,
                clientSecret: config.naverClientSecret,
              })
            : getNaverClipClient()
      }
    } catch {
      console.warn('[ContentClient] 네이버 클립 클라이언트 초기화 실패')
    }
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 통합 콘텐츠 검색
   */
  async search(filters: ContentSearchFilters): Promise<ContentSearchResult> {
    const sources = filters.sources || (['YOUTUBE', 'NAVER_BLOG', 'NAVER_CLIP'] as ContentSource[])
    const results: NormalizedContent[] = []
    let totalCount = 0
    const errors: string[] = []

    const pageSize = filters.pageSize || 20
    const perSourceSize = Math.ceil(pageSize / sources.length)

    // 병렬 검색
    const searchPromises: Promise<void>[] = []

    // YouTube 검색
    if (sources.includes('YOUTUBE') && this.youtubeClient) {
      searchPromises.push(
        this.youtubeClient
          .search({
            query: filters.keyword,
            maxResults: perSourceSize,
            order: this.mapSortToYouTube(filters.sortBy),
            publishedAfter: filters.publishedAfter,
            safeSearch: filters.safeSearch ? 'strict' : 'moderate',
          })
          .then((result) => {
            results.push(...result.contents)
            totalCount += result.totalCount
          })
          .catch((error) => {
            errors.push(`YouTube: ${(error as Error).message}`)
          })
      )
    }

    // 네이버 블로그 검색
    if (sources.includes('NAVER_BLOG') && this.naverBlogClient) {
      searchPromises.push(
        this.naverBlogClient
          .search({
            query: filters.keyword,
            display: perSourceSize,
            sort: this.mapSortToNaver(filters.sortBy),
          })
          .then((result) => {
            results.push(...result.contents)
            totalCount += result.totalCount
          })
          .catch((error) => {
            errors.push(`네이버 블로그: ${(error as Error).message}`)
          })
      )
    }

    // 네이버 클립 검색
    if (sources.includes('NAVER_CLIP') && this.naverClipClient) {
      searchPromises.push(
        this.naverClipClient
          .search({
            query: filters.keyword,
            display: perSourceSize,
          })
          .then((result) => {
            results.push(...result.contents)
            totalCount += result.totalCount
          })
          .catch((error) => {
            errors.push(`네이버 클립: ${(error as Error).message}`)
          })
      )
    }

    await Promise.all(searchPromises)

    // 결과 정렬
    const sortedResults = this.sortContents(results, filters.sortBy)

    if (sortedResults.length === 0 && errors.length > 0) {
      console.warn('[ContentClient] 검색 오류:', errors)
    }

    return {
      contents: sortedResults,
      totalCount,
      currentPage: filters.page || 1,
      searchedAt: new Date().toISOString(),
      fromCache: false,
    }
  }

  /**
   * 장소 기반 콘텐츠 검색
   */
  async searchByPlace(
    placeName: string,
    sources?: ContentSource[],
    options?: {
      pageSize?: number
      safeSearch?: boolean
    }
  ): Promise<ContentSearchResult> {
    return this.search({
      keyword: `${placeName} 후기`,
      sources,
      pageSize: options?.pageSize,
      safeSearch: options?.safeSearch ?? true,
    })
  }

  /**
   * 어린이 관련 콘텐츠 검색 (카테고리별)
   */
  async searchKidsContent(
    category: keyof typeof KIDS_SEARCH_PRESETS,
    placeName?: string,
    sources?: ContentSource[],
    options?: {
      pageSize?: number
    }
  ): Promise<ContentSearchResult> {
    const results: NormalizedContent[] = []
    let totalCount = 0
    const activeSources = sources || (['YOUTUBE', 'NAVER_BLOG', 'NAVER_CLIP'] as ContentSource[])
    const perSourceSize = Math.ceil((options?.pageSize || 20) / activeSources.length)

    const searchPromises: Promise<void>[] = []

    // YouTube
    if (activeSources.includes('YOUTUBE') && this.youtubeClient) {
      searchPromises.push(
        this.youtubeClient
          .searchKidsContent(category, placeName, { maxResults: perSourceSize })
          .then((result) => {
            results.push(...result.contents)
            totalCount += result.totalCount
          })
          .catch(() => {})
      )
    }

    // 네이버 블로그
    const naverCategory = this.mapCategoryToNaver(category)
    if (activeSources.includes('NAVER_BLOG') && this.naverBlogClient && naverCategory) {
      searchPromises.push(
        this.naverBlogClient
          .searchKidsContent(naverCategory, placeName, { display: perSourceSize })
          .then((result) => {
            results.push(...result.contents)
            totalCount += result.totalCount
          })
          .catch(() => {})
      )
    }

    // 네이버 클립
    if (activeSources.includes('NAVER_CLIP') && this.naverClipClient && naverCategory) {
      searchPromises.push(
        this.naverClipClient
          .searchKidsContent(naverCategory, placeName, { display: perSourceSize })
          .then((result) => {
            results.push(...result.contents)
            totalCount += result.totalCount
          })
          .catch(() => {})
      )
    }

    await Promise.all(searchPromises)

    return {
      contents: results,
      totalCount,
      currentPage: 1,
      searchedAt: new Date().toISOString(),
      fromCache: false,
    }
  }

  /**
   * API 상태 확인
   */
  async healthCheck(): Promise<{
    youtube: boolean
    naverBlog: boolean
    naverClip: boolean
  }> {
    const [youtube, naverBlog, naverClip] = await Promise.all([
      this.youtubeClient?.healthCheck().catch(() => false) ?? false,
      this.naverBlogClient?.healthCheck().catch(() => false) ?? false,
      this.naverClipClient?.healthCheck().catch(() => false) ?? false,
    ])

    return { youtube, naverBlog, naverClip }
  }

  /**
   * 사용 가능한 소스 확인
   */
  getAvailableSources(): {
    youtube: boolean
    naverBlog: boolean
    naverClip: boolean
  } {
    return {
      youtube: this.youtubeClient !== null,
      naverBlog: this.naverBlogClient !== null,
      naverClip: this.naverClipClient !== null,
    }
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.youtubeClient?.clearCache()
    this.naverBlogClient?.clearCache()
    this.naverClipClient?.clearCache()
  }

  // ============================================
  // 내부 메서드
  // ============================================

  private mapSortToYouTube(
    sort?: 'date' | 'relevance' | 'viewCount'
  ): 'date' | 'relevance' | 'viewCount' {
    switch (sort) {
      case 'date':
        return 'date'
      case 'viewCount':
        return 'viewCount'
      default:
        return 'relevance'
    }
  }

  private mapSortToNaver(sort?: 'date' | 'relevance' | 'viewCount'): 'sim' | 'date' {
    return sort === 'date' ? 'date' : 'sim'
  }

  private mapCategoryToNaver(
    category: keyof typeof KIDS_SEARCH_PRESETS
  ): keyof typeof NAVER_KIDS_SEARCH_PRESETS | null {
    const mapping: Record<
      keyof typeof KIDS_SEARCH_PRESETS,
      keyof typeof NAVER_KIDS_SEARCH_PRESETS | null
    > = {
      KIDS_CAFE: 'KIDS_CAFE',
      AMUSEMENT_PARK: 'AMUSEMENT_PARK',
      ZOO: 'ZOO',
      MUSEUM: 'MUSEUM',
      NATURE: 'NATURE',
    }
    return mapping[category] || null
  }

  private sortContents(
    contents: NormalizedContent[],
    sortBy?: 'date' | 'relevance' | 'viewCount'
  ): NormalizedContent[] {
    switch (sortBy) {
      case 'date':
        return [...contents].sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        )
      case 'viewCount':
        return [...contents].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      default:
        // relevance: 소스별로 번갈아 배치
        return this.interleaveSources(contents)
    }
  }

  private interleaveSources(contents: NormalizedContent[]): NormalizedContent[] {
    const bySource: Record<ContentSource, NormalizedContent[]> = {
      YOUTUBE: [],
      NAVER_BLOG: [],
      NAVER_CLIP: [],
    }

    contents.forEach((content) => {
      bySource[content.source].push(content)
    })

    const result: NormalizedContent[] = []
    let maxLength = Math.max(
      bySource.YOUTUBE.length,
      bySource.NAVER_BLOG.length,
      bySource.NAVER_CLIP.length
    )

    for (let i = 0; i < maxLength; i++) {
      if (bySource.YOUTUBE[i]) result.push(bySource.YOUTUBE[i])
      if (bySource.NAVER_BLOG[i]) result.push(bySource.NAVER_BLOG[i])
      if (bySource.NAVER_CLIP[i]) result.push(bySource.NAVER_CLIP[i])
    }

    return result
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

let _contentClient: ContentClient | null = null

/**
 * 통합 콘텐츠 클라이언트 싱글톤
 */
export function getContentClient(): ContentClient {
  if (!_contentClient) {
    _contentClient = new ContentClient()
  }
  return _contentClient
}

/**
 * 클라이언트 초기화 (테스트용)
 */
export function initContentClient(config: Partial<KidsMapFullClientConfig>): ContentClient {
  _contentClient = new ContentClient(config)
  return _contentClient
}
