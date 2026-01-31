import { NextResponse } from 'next/server'
import { getDocumentFromCache } from '@/lib/document-generator/cache'
import { logger } from '@/lib/api/logger'

/**
 * Document Download API Route
 *
 * 생성된 문서를 다운로드하는 API
 *
 * GET /api/generate-document/download/{id}
 */

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    // ID 형식 검증 (alphanumeric + hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid document ID format' },
        { status: 400 }
      )
    }

    // 캐시에서 문서 조회
    const cached = getDocumentFromCache(id)

    if (!cached) {
      return NextResponse.json(
        {
          error: 'Document not found',
          message: '문서를 찾을 수 없습니다. 만료되었거나 존재하지 않는 문서입니다.',
        },
        { status: 404 }
      )
    }

    // Buffer를 Uint8Array로 변환하여 응답 생성
    const uint8Array = new Uint8Array(cached.buffer)

    const response = new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': cached.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(cached.filename)}"`,
        'Content-Length': cached.buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
        'X-QETTA-Document-Id': id,
      },
    })

    logger.debug(`[Document Download] ${cached.filename} (${(cached.buffer.length / 1024).toFixed(1)} KB)`)

    return response
  } catch (error) {
    logger.error('[Document Download Error]', error)
    return NextResponse.json(
      {
        error: 'Download failed',
      },
      { status: 500 }
    )
  }
}
