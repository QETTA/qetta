/**
 * KidsMap Feed API
 *
 * GET /api/kidsmap/feed - 콘텐츠 피드 조회
 *
 * Query params:
 *   source: YOUTUBE | NAVER_BLOG | NAVER_CLIP (comma-separated)
 *   sort: recent | popular | trending
 *   category: place category filter
 *   page: number (default 1)
 *   pageSize: number (default 20, max 50)
 *   keyword: search keyword
 */

import { NextRequest, NextResponse } from 'next/server'
import { getContentBlockRepository } from '@/lib/skill-engine/data-sources/kidsmap/blocks'
import { rateLimit, createRateLimitResponse } from '@/lib/api/rate-limiter'
import type { ContentSource } from '@/lib/skill-engine/data-sources/kidsmap/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_SOURCES: ContentSource[] = ['YOUTUBE', 'NAVER_BLOG', 'NAVER_CLIP']
const VALID_SORTS = ['recent', 'popular', 'trending'] as const

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, 'kidsmap-feed')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const { searchParams } = new URL(request.url)

    // Parse params
    const sourceParam = searchParams.get('source')
    const sources = sourceParam
      ? sourceParam.split(',').filter((s): s is ContentSource => VALID_SOURCES.includes(s as ContentSource))
      : undefined

    const sort = searchParams.get('sort') as (typeof VALID_SORTS)[number] | null
    const sortBy = sort && VALID_SORTS.includes(sort) ? sort : 'recent'

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))

    const keyword = searchParams.get('keyword')?.slice(0, 100)

    // Query content blocks
    const repo = getContentBlockRepository()
    const result = await repo.search({
      status: ['active'] as const,
      sources,
      page,
      pageSize,
      sortBy: sortBy === 'popular' ? 'viewCount' : sortBy === 'trending' ? 'viewCount' : 'publishedAt',
      sortOrder: 'desc',
    })

    // Map to feed items
    const items = result.data.map((block) => ({
      id: block.id,
      source: block.data.source,
      type: block.data.contentType || block.data.type,
      sourceUrl: block.data.sourceUrl,
      title: block.data.title,
      description: block.data.description,
      thumbnailUrl: block.data.thumbnailUrl,
      author: block.data.author || '알 수 없음',
      authorThumbnail: block.data.authorThumbnail,
      publishedAt: block.data.publishedAt,
      viewCount: block.data.viewCount,
      likeCount: block.data.likeCount,
      duration: block.data.duration,
      relatedPlaceId: block.data.relatedPlaceId,
      relatedPlaceName: block.data.relatedPlaceName,
      tags: block.data.tags,
      qualityGrade: block.qualityGrade,
    }))

    return NextResponse.json({
      success: true,
      data: {
        items,
        page,
        pageSize,
        total: result.total,
        hasMore: page * pageSize < result.total,
      },
    })
  } catch (error) {
    console.error('Feed API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feed' },
      { status: 500 },
    )
  }
}
