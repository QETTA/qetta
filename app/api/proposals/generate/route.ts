/**
 * Proposal Generation API
 *
 * POST /api/proposals/generate - 제안서 생성 요청 (jobId 반환)
 *
 * 비동기 처리 패턴:
 * 1. jobId 즉시 반환 (30초 이상 소요 시 타임아웃 방지)
 * 2. DB에 Job 저장 (P0-FIX-5)
 * 3. /api/proposals/[jobId] 폴링으로 상태/결과 조회
 *
 * P0-FIX-3: 사용량 추적 연동
 * P0-FIX-5: Job 영속성 (메모리 → DB)
 * P2-2: streaming 옵션 지원 (streamUrl 반환)
 *
 * @see lib/block-engine/prompt-generator.ts (프롬프트 생성)
 * @see lib/block-engine/assembler.ts (컨텍스트 조립)
 * @see lib/block-engine/proposal-job-store.ts (Job Store)
 * @see app/api/proposals/stream/route.ts (SSE 스트리밍)
 */

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { withApiMiddleware } from '@/lib/api/middleware'
import { generateProposalRequestSchema } from '@/lib/api/schemas'
import {
  getCompanyBlockById,
  isCompanyBlockOwner,
  toInternalCompanyBlock,
} from '@/lib/block-engine/company-block-db'
import { PromptGenerator } from '@/lib/block-engine/prompt-generator'
import {
  createProposalJob,
  getProposalJobById,
  getUserProposalJobs as getUserJobs,
  startProposalJob,
  completeProposalJob,
  failProposalJob,
  cleanupOldJobs,
  type ProposalJobData,
} from '@/lib/block-engine/proposal-job-store'
import { getModelForTask, MODEL_STRATEGY } from '@/lib/claude'
import { checkAndRecordUsage } from '@/lib/payment/usage'
import { logger } from '@/lib/api/logger'
import type { EnginePresetType } from '@/lib/super-model'

// ================== Export for status endpoint ==================
// P0-FIX-5: DB 기반 조회로 변경

export async function getProposalJob(jobId: string): Promise<ProposalJobData | null> {
  return getProposalJobById(jobId)
}

export async function getUserProposalJobs(userId: string): Promise<ProposalJobData[]> {
  return getUserJobs(userId)
}

// ================== Background Processing ==================

async function processProposalJob(jobId: string): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    await failProposalJob(jobId, {
      code: 'CONFIG_ERROR',
      message: 'ANTHROPIC_API_KEY not configured',
    })
    return
  }

  try {
    // P0-FIX-5: DB에서 Job 상태 업데이트
    await startProposalJob(jobId)

    const job = await getProposalJobById(jobId)
    if (!job) {
      throw new Error('Job not found')
    }

    // 1. CompanyBlock 로드
    const block = await getCompanyBlockById(job.companyBlockId)
    if (!block) {
      throw new Error('CompanyBlock not found')
    }

    const internalBlock = toInternalCompanyBlock(block)

    // 2. 프롬프트 생성
    const promptGenerator = new PromptGenerator()

    // Mock domain/session context for standalone proposal generation
    const mockContext = {
      domain: {
        presetId: 'AI_VOUCHER' as EnginePresetType,
        loadedBlocks: [],
        terminology: [],
        templates: [],
        rules: [],
        tokenBudget: { current: 0, max: 2000, level: 'metadata' as const },
      },
      company: internalBlock,
      session: {
        sessionId: `proposal-${job.id}`,
        intent: {
          type: 'document_generation' as const,
          confidence: 1.0,
          entities: { programId: job.programId },
          detectedAt: new Date().toISOString(),
        },
        messages: [],
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      },
      assembly: {
        totalTokens: 0,
        tokenBreakdown: { domain: 0, company: 0, session: 0 },
        assembledAt: new Date().toISOString(),
        withinBudget: true,
      },
    }

    const prompt = promptGenerator.generateProposalPrompt(mockContext, {
      programId: job.programId,
      programName: job.programName,
      userRequest: '표준 제안서 작성',
      sections: ['사업 개요', '기술 역량', '추진 계획', '기대 효과'],
    })

    // 3. Claude API 호출
    const anthropic = new Anthropic({ apiKey })
    const model = getModelForTask('document_generation')

    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    })

    // 4. 결과 추출
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // P0-FIX-5: DB에 결과 저장
    await completeProposalJob(jobId, {
      content: textContent.text,
      sections: ['사업 개요', '기술 역량', '추진 계획', '기대 효과'],
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model,
    })
  } catch (error) {
    // P0-FIX-5: DB에 에러 저장
    await failProposalJob(jobId, {
      code: 'GENERATION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// ================== Route Handler ==================

/**
 * POST /api/proposals/generate
 * 제안서 생성 요청 → jobId 즉시 반환
 *
 * P0-FIX-3: 사용량 추적 연동
 * P0-FIX-5: DB 기반 Job 저장
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

    // P0-FIX-3: 사용량 확인 및 기록 (작업 시작 전)
    const usageResult = await checkAndRecordUsage(userId, 'PROPOSAL_GENERATION', 1, {
      source: 'api/proposals/generate',
    })

    if (!usageResult.allowed) {
      const errorMessages: Record<string, string> = {
        LIMIT_EXCEEDED: '이번 달 제안서 생성 한도를 초과했습니다. 플랜을 업그레이드해주세요.',
        SUBSCRIPTION_EXPIRED: '구독이 만료되었습니다. 결제를 진행해주세요.',
        SUBSCRIPTION_CANCELED: '구독이 취소되었습니다.',
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USAGE_LIMIT_EXCEEDED',
            message: errorMessages[usageResult.reason!] || '사용량 제한을 초과했습니다',
            quota: {
              plan: usageResult.quota.plan,
              used: usageResult.quota.used,
              limit: usageResult.quota.documentLimit,
              remaining: usageResult.quota.remaining,
            },
          },
        },
        { status: 403 }
      )
    }

    // P0-FIX-5: 오래된 작업 정리 (백그라운드)
    cleanupOldJobs().catch((err) => {
      // Fire-and-forget이지만 에러 로깅은 필수
      logger.error('[Generate] Job cleanup failed:', err)
    })

    // Parse and validate request
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: '유효하지 않은 JSON입니다' } },
        { status: 400 }
      )
    }

    const validation = generateProposalRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '요청 데이터가 유효하지 않습니다',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { companyBlockId, programId, programName, streaming, cacheStrategy } = validation.data

    // Verify ownership
    const isOwner = await isCompanyBlockOwner(companyBlockId, userId)
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'CompanyBlock을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // P0-FIX-5: DB에 Job 생성
    const job = await createProposalJob({
      userId,
      companyBlockId,
      programId,
      programName,
    })

    // Start processing in background (non-blocking)
    // Note: In serverless, this may timeout. P2-3에서 BullMQ로 전환
    processProposalJob(job.id).catch((error) => {
      console.error(`Proposal job ${job.id} failed:`, error)
      failProposalJob(job.id, {
        code: 'UNEXPECTED_ERROR',
        message: 'Background processing failed',
      }).catch(console.error)
    })

    // P2-2: streaming 옵션에 따라 응답 분기
    const baseResponse = {
      jobId: job.id,
      status: 'pending',
      message: '제안서 생성이 시작되었습니다',
      pollUrl: `/api/proposals/${job.id}`,
      quota: {
        used: usageResult.quota.used,
        remaining: usageResult.quota.remaining,
      },
    }

    if (streaming) {
      // SSE 스트리밍을 위한 URL 제공
      const streamParams = new URLSearchParams({
        jobId: job.id,
        ...(cacheStrategy && cacheStrategy !== 'prefer' ? { cacheStrategy } : {}),
      })

      return NextResponse.json(
        {
          success: true,
          data: {
            ...baseResponse,
            streaming: true,
            streamUrl: `/api/proposals/stream?${streamParams.toString()}`,
            message: '제안서 생성이 시작되었습니다. streamUrl로 실시간 진행 상황을 확인하세요.',
          },
        },
        { status: 202 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: baseResponse,
      },
      { status: 202 } // Accepted
    )
  },
  { endpoint: 'proposals', requireActiveSubscription: true }
)
