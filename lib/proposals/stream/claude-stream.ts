/**
 * Claude API Streaming
 *
 * Claude API를 사용한 제안서 생성 스트리밍 로직
 *
 * @module lib/proposals/stream/claude-stream
 */

import Anthropic from '@anthropic-ai/sdk'
import { getModelForTask } from '@/lib/claude'
import { PromptGenerator } from '@/lib/block-engine/prompt-generator'
import { getHybridCache } from '@/lib/document-generator/hybrid-cache'
import { createContentHash } from '@/lib/document-generator/cache'
import {
  createProposalJob,
  startProposalJob,
  completeProposalJob,
} from '@/lib/block-engine/proposal-job-store'
import {
  getCompanyBlockById,
  toInternalCompanyBlock,
} from '@/lib/block-engine/company-block-db'
import { logger } from '@/lib/api/logger'
import type { SSEController } from './types'
import type { EnginePresetType } from '@/lib/super-model'

// =============================================================================
// Types
// =============================================================================

export interface GenerationParams {
  userId: string
  companyBlockId: string
  programId: string
  programName: string
  cacheStrategy?: 'prefer' | 'bypass' | 'only'
}

export interface GenerationResult {
  jobId: string
  content: string
  sections: string[]
  tokensUsed: number
  generationTimeMs: number
  fromCache: boolean
}

// =============================================================================
// Default Sections
// =============================================================================

const DEFAULT_SECTIONS = ['사업 개요', '기술 역량', '추진 계획', '기대 효과']

// =============================================================================
// Cache Operations
// =============================================================================

/**
 * 캐시에서 기존 결과 확인
 */
export async function checkCache(
  programId: string,
  companyBlockId: string,
  programName: string,
  startTime: number,
  sse: SSEController
): Promise<GenerationResult | null> {
  const contentHash = createContentHash('proposal', programId, {
    companyBlockId,
    programName,
  })

  const cache = getHybridCache()
  const cachedResult = await cache.get(contentHash)

  if (
    cachedResult.hitType !== 'miss' &&
    cachedResult.data &&
    cachedResult.source !== 'none'
  ) {
    const savedTime = Date.now() - startTime

    sse.sendCacheHit(contentHash, cachedResult.source, savedTime)
    sse.sendProgress(100, 'caching', '캐시에서 불러왔습니다')

    return {
      jobId: `cached-${contentHash.slice(0, 8)}`,
      content: cachedResult.data.buffer.toString('utf-8'),
      sections: DEFAULT_SECTIONS,
      tokensUsed: 0,
      generationTimeMs: savedTime,
      fromCache: true,
    }
  }

  return null
}

/**
 * 결과를 캐시에 저장
 */
async function saveToCache(
  programId: string,
  companyBlockId: string,
  programName: string,
  content: string,
  generationTimeMs: number
): Promise<void> {
  const contentHash = createContentHash('proposal', programId, {
    companyBlockId,
    programName,
  })

  const cache = getHybridCache()
  await cache.set(
    contentHash,
    Buffer.from(content, 'utf-8'),
    'text/plain',
    `${programName}-proposal.txt`,
    {
      enginePreset: 'proposal',
      documentType: programId,
      programId,
      generationTimeMs,
    }
  )
}

// =============================================================================
// Prompt Generation
// =============================================================================

function createMockContext(
  internalBlock: ReturnType<typeof toInternalCompanyBlock>,
  jobId: string,
  programId: string
) {
  return {
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
      sessionId: `proposal-${jobId}`,
      intent: {
        type: 'document_generation' as const,
        confidence: 1.0,
        entities: { programId },
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
}

// =============================================================================
// Main Generation Logic
// =============================================================================

/**
 * Claude API를 사용한 제안서 생성 (스트리밍)
 */
export async function generateProposalWithStreaming(
  params: GenerationParams,
  sse: SSEController
): Promise<void> {
  const { userId, companyBlockId, programId, programName, cacheStrategy } = params
  const startTime = Date.now()

  try {
    // Phase 1: Initializing (10%)
    sse.sendProgress(10, 'initializing', '제안서 생성 준비 중...')

    // Check cache first (if not bypassing)
    if (cacheStrategy !== 'bypass') {
      const cached = await checkCache(
        programId,
        companyBlockId,
        programName,
        startTime,
        sse
      )

      if (cached) {
        sse.sendComplete(cached)
        sse.close()
        return
      }
    }

    // Create job for tracking
    const job = await createProposalJob({
      userId,
      companyBlockId,
      programId,
      programName,
    })

    await startProposalJob(job.id)

    // Phase 2: Loading CompanyBlock (25%)
    sse.sendProgress(25, 'loading', 'CompanyBlock 로딩 중...')

    const block = await getCompanyBlockById(companyBlockId)
    if (!block) {
      throw new Error('CompanyBlock not found')
    }

    const internalBlock = toInternalCompanyBlock(block)

    // Phase 3: Generating (45%)
    sse.sendProgress(45, 'generating', '제안서 본문 생성 중...')

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const promptGenerator = new PromptGenerator()
    const mockContext = createMockContext(internalBlock, job.id, programId)
    const sections = DEFAULT_SECTIONS

    const prompt = promptGenerator.generateProposalPrompt(mockContext, {
      programId,
      programName,
      userRequest: '표준 제안서 작성',
      sections,
    })

    const anthropic = new Anthropic({ apiKey })
    const model = getModelForTask('document_generation')

    // Stream from Claude API
    let fullContent = ''
    let currentSection = 0

    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      stream: true,
    })

    for await (const event of response) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        fullContent += event.delta.text

        // 섹션 감지 (##로 시작하는 라인)
        const sectionMatches = fullContent.match(/## [^#\n]+/g)
        if (sectionMatches && sectionMatches.length > currentSection) {
          const sectionTitle = sectionMatches[currentSection].replace('## ', '')
          sse.sendSection(currentSection, sectionTitle, '')
          currentSection = sectionMatches.length

          // 진행률 업데이트
          const progress = 45 + Math.min(35, (currentSection / sections.length) * 35)
          sse.sendProgress(
            Math.round(progress),
            'generating',
            `섹션 생성 중: ${sectionTitle}`
          )
        }
      }
    }

    // Phase 4: Formatting (80%)
    sse.sendProgress(80, 'formatting', '문서 포맷팅 중...')

    const tokensUsed = Math.round(fullContent.length / 4) // 대략적인 토큰 추정

    // Phase 5: Caching (95%)
    sse.sendProgress(95, 'caching', '캐시 저장 중...')

    // Save to cache
    if (cacheStrategy !== 'bypass') {
      await saveToCache(
        programId,
        companyBlockId,
        programName,
        fullContent,
        Date.now() - startTime
      )
    }

    // Complete the job
    await completeProposalJob(job.id, {
      content: fullContent,
      sections,
      tokensUsed,
      model,
    })

    const generationTimeMs = Date.now() - startTime

    // Send complete event
    sse.sendProgress(100, 'caching', '완료!')
    sse.sendComplete({
      jobId: job.id,
      content: fullContent,
      sections,
      tokensUsed,
      generationTimeMs,
      fromCache: false,
    })

    sse.close()
  } catch (error) {
    logger.error('[Claude Stream] Generation error:', error)

    sse.sendError(
      'GENERATION_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    )
    sse.close()
  }
}
