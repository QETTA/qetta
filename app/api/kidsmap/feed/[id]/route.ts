import { NextRequest, NextResponse } from 'next/server'
import { getContentBlockRepository } from '@/lib/skill-engine/data-sources/kidsmap/blocks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    if (!id || typeof id !== 'string' || id.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid content ID' },
        { status: 400 },
      )
    }

    const repo = getContentBlockRepository()
    const block = await repo.findById(id)

    if (!block) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: block.id,
        source: block.data.source,
        type: block.data.type,
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
      },
    })
  } catch (error) {
    console.error('Feed detail API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 },
    )
  }
}
