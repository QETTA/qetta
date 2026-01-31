/**
 * Proposal Job Status API
 *
 * GET /api/proposals/[jobId] - 작업 상태 및 결과 조회
 * DELETE /api/proposals/[jobId] - 작업 취소/삭제
 *
 * P0-FIX-5: DB 기반 Job 조회로 변경
 *
 * 폴링 패턴:
 * 1. 클라이언트가 /api/proposals/generate로 작업 생성
 * 2. 주기적으로 이 엔드포인트 폴링 (2-5초 간격)
 * 3. status: 'completed' 시 결과 반환
 */

import { NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/api/middleware'
import {
  getProposalJobById,
  getUserProposalJobs,
  cancelProposalJob,
} from '@/lib/block-engine/proposal-job-store'

/**
 * GET /api/proposals/[jobId]
 * 작업 상태 조회
 *
 * P0-FIX-5: DB 기반 조회
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
    const jobId = pathParts[pathParts.length - 1]

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Job ID가 필요합니다' } },
        { status: 400 }
      )
    }

    // Special case: list all jobs for user
    if (jobId === 'list') {
      const jobs = await getUserProposalJobs(userId)
      return NextResponse.json({
        success: true,
        data: jobs.map((job) => ({
          id: job.id,
          status: job.status,
          programName: job.programName,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
        })),
        meta: { total: jobs.length },
      })
    }

    // P0-FIX-5: DB에서 Job 조회
    const job = await getProposalJobById(jobId)

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

    // Build response based on status
    const response: Record<string, unknown> = {
      success: true,
      data: {
        id: job.id,
        status: job.status,
        programName: job.programName,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    }

    if (job.status === 'completed' && job.result) {
      response.data = {
        ...(response.data as object),
        result: {
          content: job.result.content,
          sections: job.result.sections,
          tokensUsed: job.result.tokensUsed,
          model: job.result.model,
        },
      }
    }

    if (job.status === 'failed' && job.error) {
      response.data = {
        ...(response.data as object),
        error: job.error,
      }
    }

    // Add polling hint for pending/processing
    if (job.status === 'pending' || job.status === 'processing') {
      response.meta = {
        retryAfter: 3, // seconds
        message: job.status === 'pending' ? '작업이 대기 중입니다' : '제안서를 생성하고 있습니다...',
      }
    }

    return NextResponse.json(response)
  },
  { endpoint: 'default' }
)

/**
 * DELETE /api/proposals/[jobId]
 * 작업 취소 (pending 상태일 때만)
 *
 * P0-FIX-5: DB 기반 취소
 */
export const DELETE = withApiMiddleware(
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
    const jobId = pathParts[pathParts.length - 1]

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Job ID가 필요합니다' } },
        { status: 400 }
      )
    }

    // P0-FIX-5: DB에서 Job 조회
    const job = await getProposalJobById(jobId)

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

    // Can only cancel pending jobs
    if (job.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: `${job.status} 상태의 작업은 취소할 수 없습니다`,
          },
        },
        { status: 400 }
      )
    }

    // P0-FIX-5: DB에서 취소 처리
    const cancelled = await cancelProposalJob(jobId)

    if (!cancelled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANCEL_FAILED',
            message: '작업 취소에 실패했습니다',
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '작업이 취소되었습니다',
    })
  },
  { endpoint: 'default' }
)
