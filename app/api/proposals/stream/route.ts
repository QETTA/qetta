/**
 * Proposal Generation SSE Streaming API
 *
 * P2-2: 실시간 제안서 생성 진행 상황 스트리밍
 *
 * GET /api/proposals/stream?jobId=xxx - 기존 Job 상태 스트리밍
 * POST /api/proposals/stream - 새 제안서 생성 + 스트리밍
 *
 * Event Types:
 * - progress: 생성 진행률 (0-100)
 * - section: 섹션 완료
 * - cache-hit: Semantic 캐시 히트
 * - complete: 생성 완료
 * - error: 에러 발생
 *
 * @module proposals/stream
 */

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { rateLimit, createRateLimitResponse } from '@/lib/api/rate-limiter'
import { generateProposalRequestSchema } from '@/lib/api/schemas'
import { isCompanyBlockOwner } from '@/lib/block-engine/company-block-db'
import { getProposalJobById } from '@/lib/block-engine/proposal-job-store'
import { checkAndRecordUsage } from '@/lib/payment/usage'
import { logger } from '@/lib/api/logger'
import {
  createSSEController,
  createSSEResponse,
  pollJobStatus,
  checkInitialJobStatus,
  generateProposalWithStreaming,
} from '@/lib/proposals/stream'

// Node.js runtime for SSE
export const runtime = 'nodejs'
export const maxDuration = 120 // 2분 타임아웃

// ============================================
// GET /api/proposals/stream?jobId=xxx
// ============================================

/**
 * 기존 Job 상태 스트리밍 (폴링 대체)
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request, 'proposals')
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

  // Authentication
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Validate jobId parameter
  const jobId = request.nextUrl.searchParams.get('jobId')
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'jobId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get job and verify ownership
  const job = await getProposalJobById(jobId)
  if (!job) {
    return new Response(JSON.stringify({ error: 'Job not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (job.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Create SSE stream
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sse = createSSEController(controller, encoder)

      try {
        // Check if job is already terminal
        const isTerminal = await checkInitialJobStatus(jobId, sse)
        if (isTerminal) {
          return
        }

        // Poll for updates
        await pollJobStatus(jobId, sse)
      } catch (error) {
        logger.error('[Proposal Stream] Error:', error)
        sse.sendError(
          'STREAM_ERROR',
          error instanceof Error ? error.message : 'Unknown error'
        )
        sse.close()
      }
    },
  })

  return createSSEResponse(stream)
}

// ============================================
// POST /api/proposals/stream
// ============================================

/**
 * 새 제안서 생성 + 실시간 스트리밍
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request, 'proposals')
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

  // Authentication
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userId = session.user.id

  // Parse request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Validate request
  const validation = generateProposalRequestSchema.safeParse(body)
  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: validation.error.issues }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { companyBlockId, programId, programName, cacheStrategy } = validation.data

  // Check usage quota
  const usageResult = await checkAndRecordUsage(userId, 'PROPOSAL_GENERATION', 1, {
    source: 'api/proposals/stream',
  })

  if (!usageResult.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Usage limit exceeded',
        quota: usageResult.quota,
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Verify ownership
  const isOwner = await isCompanyBlockOwner(companyBlockId, userId)
  if (!isOwner) {
    return new Response(JSON.stringify({ error: 'CompanyBlock not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Create SSE stream for generation
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sse = createSSEController(controller, encoder)

      await generateProposalWithStreaming(
        {
          userId,
          companyBlockId,
          programId,
          programName,
          cacheStrategy,
        },
        sse
      )
    },
  })

  return createSSEResponse(stream)
}
