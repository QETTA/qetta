/**
 * Job Status API
 *
 * 백그라운드 작업 상태 조회/취소 API.
 *
 * GET /api/jobs/:jobId?queue=qetta:document
 * DELETE /api/jobs/:jobId?queue=qetta:document
 */

import { NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/api/middleware'
import { getJobStatus, cancelJob, QUEUE_NAMES, type JobStatus } from '@/lib/jobs'
import { z } from 'zod'

// ============================================
// Types
// ============================================

interface JobStatusResponse {
  id: string
  status: JobStatus
  progress: number
  result: unknown | null
  failedReason: string | null
  attemptsMade: number
  createdAt: string
}

// ============================================
// Validation
// ============================================

const queueNameSchema = z.enum([
  QUEUE_NAMES.DOCUMENT,
  QUEUE_NAMES.LEARNING,
  QUEUE_NAMES.ANALYSIS,
  QUEUE_NAMES.BATCH,
])

// ============================================
// GET /api/jobs/[jobId]
// ============================================

export const GET = withApiMiddleware(
  async (request: Request) => {
    const url = new URL(request.url)
    const jobId = url.pathname.split('/').pop()
    const queueName = url.searchParams.get('queue') || QUEUE_NAMES.DOCUMENT

    // Validate queue name
    const parseResult = queueNameSchema.safeParse(queueName)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_QUEUE',
            message: `잘못된 큐 이름입니다. 허용: ${Object.values(QUEUE_NAMES).join(', ')}`,
          },
        },
        { status: 400 }
      )
    }

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JOB_ID',
            message: 'Job ID가 필요합니다.',
          },
        },
        { status: 400 }
      )
    }

    const status = await getJobStatus(queueName, jobId)

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: `Job을 찾을 수 없습니다: ${jobId}`,
          },
        },
        { status: 404 }
      )
    }

    const response: JobStatusResponse = {
      id: status.id,
      status: status.status,
      progress: status.progress,
      result: status.result,
      failedReason: status.failedReason,
      attemptsMade: status.attemptsMade,
      createdAt: new Date(status.timestamp).toISOString(),
    }

    // 진행 중인 작업은 폴링 정보 제공
    const headers: Record<string, string> = {}
    if (status.status === 'waiting' || status.status === 'active') {
      headers['Retry-After'] = '3'
    }

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { headers }
    )
  },
  { endpoint: 'jobs' }
)

// ============================================
// DELETE /api/jobs/[jobId]
// ============================================

export const DELETE = withApiMiddleware(
  async (request: Request) => {
    const url = new URL(request.url)
    const jobId = url.pathname.split('/').pop()
    const queueName = url.searchParams.get('queue') || QUEUE_NAMES.DOCUMENT

    // Validate queue name
    const parseResult = queueNameSchema.safeParse(queueName)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_QUEUE',
            message: `잘못된 큐 이름입니다. 허용: ${Object.values(QUEUE_NAMES).join(', ')}`,
          },
        },
        { status: 400 }
      )
    }

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JOB_ID',
            message: 'Job ID가 필요합니다.',
          },
        },
        { status: 400 }
      )
    }

    const cancelled = await cancelJob(queueName, jobId)

    if (!cancelled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANCEL_FAILED',
            message: '작업을 취소할 수 없습니다. 이미 진행 중이거나 완료된 작업일 수 있습니다.',
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: jobId,
        cancelled: true,
      },
    })
  },
  { endpoint: 'jobs' }
)
