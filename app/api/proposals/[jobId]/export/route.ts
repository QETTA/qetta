/**
 * Proposal Export API
 *
 * POST /api/proposals/[jobId]/export - 완료된 제안서를 한컴독스로 내보내기
 *
 * 플로우:
 * 1. 작업 상태 확인 (completed만 내보내기 가능)
 * 2. 제안서 내용으로 DOCX 버퍼 생성
 * 3. 한컴독스 API로 업로드
 * 4. 뷰어 URL 생성 및 반환
 *
 * @see lib/hancomdocs/client.ts (uploadDocument, generateViewerUrl)
 * @see app/api/proposals/generate/route.ts (ProposalJob)
 */

import { NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/api/middleware'
import { getProposalJob } from '../../generate/route'
import { uploadDocument, checkConnection, generateLocalViewerUrl } from '@/lib/hancomdocs/client'
import type { HancomUploadRequest } from '@/lib/hancomdocs/types'

// ============================================
// Types
// ============================================

interface ExportOptions {
  /** 문서 형식 (기본: docx) */
  format?: 'docx' | 'hwpx'
  /** 뷰어 모드 (기본: view) */
  viewerMode?: 'view' | 'edit' | 'comment'
  /** 다운로드 허용 */
  allowDownload?: boolean
  /** 인쇄 허용 */
  allowPrint?: boolean
  /** 워터마크 */
  watermark?: string
}

// ============================================
// DOCX Generator (간단한 구현)
// ============================================

async function generateDocxFromContent(content: string, programName: string): Promise<Buffer> {
  // document-skills의 docx 생성 로직 또는 docx 라이브러리 사용
  // 여기서는 간단한 텍스트 → DOCX 변환
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')

    // 섹션별로 파싱 (## 헤더 기준)
    const sections = content.split(/^## /gm).filter(Boolean)

    const children = []

    // 제목
    children.push(
      new Paragraph({
        text: `${programName} 제안서`,
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      })
    )

    // 생성일
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `생성일: ${new Date().toLocaleDateString('ko-KR')}`,
            italics: true,
            color: '666666',
          }),
        ],
        spacing: { after: 400 },
      })
    )

    // 본문 섹션
    for (const section of sections) {
      const lines = section.split('\n')
      const title = lines[0]?.trim()
      const body = lines.slice(1).join('\n').trim()

      if (title) {
        children.push(
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        )
      }

      if (body) {
        // 문단 분리
        const paragraphs = body.split('\n\n')
        for (const para of paragraphs) {
          if (para.trim()) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: para.trim() })],
                spacing: { after: 200 },
              })
            )
          }
        }
      }
    }

    // 콘텐츠가 없으면 원본 텍스트 그대로
    if (sections.length === 0) {
      const paragraphs = content.split('\n\n')
      for (const para of paragraphs) {
        if (para.trim()) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: para.trim() })],
              spacing: { after: 200 },
            })
          )
        }
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    return Buffer.from(buffer)
  } catch (error) {
    // docx 라이브러리가 없으면 텍스트 파일로 폴백
    const { logger } = await import('@/lib/api/logger')
    logger.warn('[Export] docx library not available, falling back to text:', error)
    return Buffer.from(content, 'utf-8')
  }
}

// ============================================
// Route Handler
// ============================================

/**
 * POST /api/proposals/[jobId]/export
 * 완료된 제안서를 한컴독스로 내보내기
 */
export const POST = withApiMiddleware(
  async (request, session) => {
    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
      )
    }

    // Extract jobId from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const exportIndex = pathParts.indexOf('export')
    const jobId = exportIndex > 0 ? pathParts[exportIndex - 1] : null

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Job ID가 필요합니다' } },
        { status: 400 }
      )
    }

    // Get job (P0-FIX-5: 비동기 DB 조회)
    const job = await getProposalJob(jobId)

    if (!job) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '작업을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // Verify ownership
    if (job.userId !== userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } },
        { status: 403 }
      )
    }

    // Check job status
    if (job.status !== 'completed' || !job.result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: '완료된 작업만 내보낼 수 있습니다',
            details: { currentStatus: job.status },
          },
        },
        { status: 400 }
      )
    }

    // Parse options with safe JSON parsing
    let options: Partial<ExportOptions> = {}
    try {
      const body = await request.json()
      // Validate expected fields to avoid type pollution
      if (typeof body === 'object' && body !== null) {
        if (body.format === 'docx' || body.format === 'hwpx') {
          options.format = body.format
        }
        if (body.viewerMode === 'view' || body.viewerMode === 'edit' || body.viewerMode === 'comment') {
          options.viewerMode = body.viewerMode
        }
        if (typeof body.allowDownload === 'boolean') {
          options.allowDownload = body.allowDownload
        }
        if (typeof body.allowPrint === 'boolean') {
          options.allowPrint = body.allowPrint
        }
        if (typeof body.watermark === 'string') {
          options.watermark = body.watermark
        }
      }
    } catch {
      // JSON 파싱 실패 시 기본 옵션 사용
    }

    const format = options.format || 'docx'
    const filename = `${job.programName.replace(/[^a-zA-Z0-9가-힣]/g, '_')}-제안서.${format}`

    // Generate DOCX buffer
    const docxBuffer = await generateDocxFromContent(job.result.content, job.programName)

    // Check Hancom API connection
    const connectionStatus = await checkConnection()

    if (!connectionStatus.authenticated) {
      // API 인증 실패 시 로컬 폴백
      // 로컬에 파일 저장 후 한컴독스 웹 업로드 URL 제공
      const localPath = `/tmp/qetta-proposals/${jobId}/${filename}`

      // 실제 파일 저장은 생략 (로컬 개발 환경에서만)
      const fallback = generateLocalViewerUrl(filename, localPath)

      return NextResponse.json({
        success: true,
        data: {
          mode: 'local_fallback',
          message: '한컴독스 API 인증 대기 중입니다. 수동으로 업로드해주세요.',
          webUploadUrl: fallback.webUploadUrl,
          filename,
          content: job.result.content, // 텍스트 내용 제공
        },
        meta: {
          reason: connectionStatus.error || 'API authentication pending',
        },
      })
    }

    // Upload to Hancom Docs
    const uploadRequest: HancomUploadRequest = {
      file: docxBuffer,
      filename,
      format: format as 'docx',
      description: `QETTA 제안서 - ${job.programName}`,
    }

    const uploadResult = await uploadDocument(uploadRequest)

    if (!uploadResult.success || !uploadResult.document) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: uploadResult.error || '한컴독스 업로드에 실패했습니다',
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        mode: 'hancomdocs',
        documentId: uploadResult.document.id,
        viewerUrl: uploadResult.viewerUrl,
        editUrl: uploadResult.editUrl,
        downloadUrl: uploadResult.document.downloadUrl,
        filename,
        format,
        uploadedAt: new Date().toISOString(),
      },
      meta: {
        jobId,
        programName: job.programName,
        tokensUsed: job.result.tokensUsed,
      },
    })
  },
  { endpoint: 'proposals' }
)

/**
 * GET /api/proposals/[jobId]/export
 * 내보내기 상태 조회 (향후 비동기 처리 시)
 */
export const GET = withApiMiddleware(
  async (request, session) => {
    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
      )
    }

    // Extract jobId from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const exportIndex = pathParts.indexOf('export')
    const jobId = exportIndex > 0 ? pathParts[exportIndex - 1] : null

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Job ID가 필요합니다' } },
        { status: 400 }
      )
    }

    // P0-FIX-5: 비동기 DB 조회
    const job = await getProposalJob(jobId)

    if (!job) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '작업을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    if (job.userId !== userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        status: job.status,
        canExport: job.status === 'completed' && !!job.result,
        programName: job.programName,
        completedAt: job.completedAt,
      },
    })
  },
  { endpoint: 'proposals' }
)
