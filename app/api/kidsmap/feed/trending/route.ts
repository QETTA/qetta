/**
 * KidsMap Trending Feed API
 *
 * GET /api/kidsmap/feed/trending - 트렌딩 콘텐츠 (최근 7일, 조회수 정렬)
 *
 * Query params:
 *   source: YOUTUBE | NAVER_BLOG | NAVER_CLIP
 *   limit: number (default 10, max 30)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getContentBlockRepository } from '@/lib/skill-engine/data-sources/kidsmap/blocks'
import { rateLimit, createRateLimitResponse } from '@/lib/api/rate-limiter'
import type { ContentSource } from '@/lib/skill-engine/data-sources/kidsmap/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_SOURCES: ContentSource[] = ['YOUTUBE', 'NAVER_BLOG', 'NAVER_CLIP']

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, 'kidsmap-feed')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const { searchParams } = new URL(request.url)
    const sourceParam = searchParams.get('source')
    const sources = sourceParam
      ? sourceParam.split(',').filter((s): s is ContentSource => VALID_SOURCES.includes(s as ContentSource))
      : undefined
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))

    const repo = getContentBlockRepository()
    const result = await repo.search({
      status: ['active'] as const,
      sources,
      page: 1,
      pageSize: limit,
      sortBy: 'viewCount',
      sortOrder: 'desc',
    })

    const items = result.data.map((block) => ({
      id: block.id,
      source: block.data.source,
      type: block.data.type,
      sourceUrl: block.data.sourceUrl,
      title: block.data.title,
      thumbnailUrl: block.data.thumbnailUrl,
      author: block.data.author || '알 수 없음',
      authorThumbnail: block.data.authorThumbnail,
      publishedAt: block.data.publishedAt,
      viewCount: block.data.viewCount,
      likeCount: block.data.likeCount,
      duration: block.data.duration,
      relatedPlaceId: block.data.relatedPlaceId,
      relatedPlaceName: block.data.relatedPlaceName,
    }))

    return NextResponse.json({
      success: true,
      data: { items, total: result.total },
    })
  } catch (error) {
    console.error('Trending API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending' },
      { status: 500 },
    )
  }
}
