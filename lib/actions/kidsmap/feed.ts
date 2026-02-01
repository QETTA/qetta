'use server'

/**
 * Server Action: KidsMap Feed
 *
 * 콘텐츠 피드 Server Actions
 * Replaces: GET /api/kidsmap/feed
 *
 * Features:
 * - 피드 검색 (소스별, 정렬별)
 * - 트렌딩 콘텐츠
 * - 장소 연관 콘텐츠
 *
 * @module lib/actions/kidsmap/feed
 */

import { getContentBlockRepository } from '@/lib/skill-engine/data-sources/kidsmap/blocks'
import type { ContentSource } from '@/lib/skill-engine/data-sources/kidsmap/types'

// ============================================
// Types
// ============================================

export interface FeedItem {
  id: string
  source: ContentSource
  title: string
  description?: string
  thumbnailUrl?: string
  sourceUrl: string
  author: string
  authorThumbnail?: string
  viewCount?: number
  likeCount?: number
  duration?: number
  publishedAt?: string
  tags?: string[]
  relatedPlaceId?: string
  relatedPlaceName?: string
}

export interface FetchFeedParams {
  source?: ContentSource
  sort?: 'recent' | 'popular' | 'trending'
  keyword?: string
  placeId?: string
  page?: number
  pageSize?: number
}

export interface FetchFeedResult {
  success: boolean
  data?: {
    items: FeedItem[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }
  error?: string
}

// ============================================
// Server Action: Fetch Feed
// ============================================

export async function fetchFeed(params: FetchFeedParams = {}): Promise<FetchFeedResult> {
  try {
    const { source, sort = 'recent', keyword, placeId, page = 1, pageSize = 20 } = params

    const repo = getContentBlockRepository()

    // Build filter
    const filter: Record<string, unknown> = {
      status: 'active' as const,
      page,
      pageSize,
    }

    if (source) {
      filter.source = source
    }

    if (keyword) {
      filter.searchKeyword = keyword
    }

    if (placeId) {
      filter.relatedPlaceId = placeId
    }

    // Apply sort
    switch (sort) {
      case 'popular':
        filter.orderBy = 'viewCount'
        filter.orderDir = 'desc'
        break
      case 'trending':
        filter.orderBy = 'trendingScore'
        filter.orderDir = 'desc'
        break
      case 'recent':
      default:
        filter.orderBy = 'publishedAt'
        filter.orderDir = 'desc'
        break
    }

    const result = await repo.search(filter)

    const items: FeedItem[] = result.data.map((block) => ({
      id: block.id,
      source: block.data.source,
      title: block.data.title,
      description: block.data.description,
      thumbnailUrl: block.data.thumbnailUrl,
      sourceUrl: block.data.sourceUrl,
      author: block.data.author,
      authorThumbnail: block.data.authorThumbnail,
      viewCount: block.data.viewCount,
      likeCount: block.data.likeCount,
      duration: block.data.duration,
      publishedAt: block.data.publishedAt,
      tags: block.data.tags,
      relatedPlaceId: block.data.relatedPlaceId,
      relatedPlaceName: block.data.relatedPlaceName,
    }))

    return {
      success: true,
      data: {
        items,
        total: result.total,
        page,
        pageSize,
        hasMore: page * pageSize < result.total,
      },
    }
  } catch (error) {
    console.error('fetchFeed error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch feed',
    }
  }
}

// ============================================
// Server Action: Get Content Detail
// ============================================

export interface GetContentDetailResult {
  success: boolean
  data?: FeedItem
  error?: string
}

export async function getContentDetail(contentId: string): Promise<GetContentDetailResult> {
  try {
    const repo = getContentBlockRepository()
    const block = await repo.findById(contentId)

    if (!block) {
      return {
        success: false,
        error: 'Content not found',
      }
    }

    return {
      success: true,
      data: {
        id: block.id,
        source: block.data.source,
        title: block.data.title,
        description: block.data.description,
        thumbnailUrl: block.data.thumbnailUrl,
        sourceUrl: block.data.sourceUrl,
        author: block.data.author,
        authorThumbnail: block.data.authorThumbnail,
        viewCount: block.data.viewCount,
        likeCount: block.data.likeCount,
        duration: block.data.duration,
        publishedAt: block.data.publishedAt,
        tags: block.data.tags,
        relatedPlaceId: block.data.relatedPlaceId,
        relatedPlaceName: block.data.relatedPlaceName,
      },
    }
  } catch (error) {
    console.error('getContentDetail error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get content detail',
    }
  }
}

// ============================================
// Server Action: Fetch Trending
// ============================================

export async function fetchTrending(limit: number = 10): Promise<FetchFeedResult> {
  return fetchFeed({
    sort: 'trending',
    pageSize: limit,
  })
}
