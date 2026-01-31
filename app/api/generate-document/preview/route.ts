/**
 * Preview API Route
 *
 * BATCH 3 STEP 3.2: HTML 미리보기 생성/조회 API
 *
 * POST: 새 미리보기 생성
 * GET: 캐시된 미리보기 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateDocumentRequestSchema } from '@/lib/api/schemas'
import { createErrorResponse } from '@/lib/api/errors'
import { logger } from '@/lib/api/logger'
import {
  generateHtmlPreview,
  getCachedPreview,
  cachePreview,
} from '@/lib/document-generator'

// POST: 새 미리보기 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Zod validation
    const result = generateDocumentRequestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', result.error.issues[0].message),
        { status: 400 }
      )
    }

    const { documentType, enginePreset, data, metadata } = result.data

    // Accept both 'enginePreset' and 'domain' for flexibility
    const domain = enginePreset

    const preview = await generateHtmlPreview({
      documentType,
      domain,
      data: data || {},
      metadata,
    })

    // 캐시에 저장
    cachePreview(preview)

    return NextResponse.json({
      success: true,
      preview: {
        id: preview.id,
        html: preview.html,
        enginePreset: preview.enginePreset,
        documentType: preview.documentType,
        generatedAt: preview.generatedAt.toISOString(),
        expiresAt: preview.expiresAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Preview generation failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Preview generation failed',
      },
      { status: 500 }
    )
  }
}

// GET: 캐시된 미리보기 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'id parameter required' },
      { status: 400 }
    )
  }

  const preview = getCachedPreview(id)

  if (!preview) {
    return NextResponse.json(
      { success: false, error: 'Preview not found or expired' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    preview: {
      id: preview.id,
      html: preview.html,
      enginePreset: preview.enginePreset,
      documentType: preview.documentType,
    },
  })
}
