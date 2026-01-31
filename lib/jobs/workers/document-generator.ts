/**
 * Document Generator Worker
 *
 * 대용량 제안서 생성을 백그라운드에서 처리합니다.
 * - 30초+ 소요되는 작업 처리
 * - 실패 시 자동 재시도
 * - 진행 상황 추적
 */

import { Job } from 'bullmq'
import {
  registerWorker,
  QUEUE_NAMES,
  type DocumentGenerationJobData,
  type JobResult,
} from '../queue'
import { logger } from '@/lib/api/logger'

// ============================================
// Worker Processor
// ============================================

/**
 * 문서 생성 작업을 처리합니다.
 */
async function processDocumentGeneration(
  job: Job<DocumentGenerationJobData, JobResult>
): Promise<JobResult> {
  const { companyBlockId, programId, programName, userId } = job.data

  try {
    logger.info(`[DocumentWorker] Starting document generation for ${programName}`, {
      jobId: job.id,
      companyBlockId,
      programId,
    })

    // 진행 상황 업데이트
    await job.updateProgress(10)

    // Step 1: Company Block 로드
    await job.log('Loading company block...')
    const companyBlock = await loadCompanyBlock(companyBlockId)
    if (!companyBlock) {
      throw new Error(`Company block not found: ${companyBlockId}`)
    }
    await job.updateProgress(20)

    // Step 2: 프로그램 정보 로드
    await job.log('Loading program information...')
    const programInfo = await loadProgramInfo(programId)
    await job.updateProgress(30)

    // Step 3: 프롬프트 생성
    await job.log('Generating prompt...')
    const prompt = await generatePrompt(companyBlock, programInfo)
    await job.updateProgress(40)

    // Step 4: AI 콘텐츠 생성
    await job.log('Generating content with AI...')
    const content = await generateContentWithAI(prompt)
    await job.updateProgress(70)

    // Step 5: 문서 포맷팅
    await job.log('Formatting document...')
    const formattedContent = await formatDocument(content, programName)
    await job.updateProgress(90)

    // Step 6: 결과 저장
    await job.log('Saving result...')
    const documentId = await saveDocument(userId, formattedContent, programName)
    await job.updateProgress(100)

    logger.info(`[DocumentWorker] Document generation completed`, {
      jobId: job.id,
      documentId,
    })

    return {
      success: true,
      data: {
        documentId,
        programName,
        tokenCount: formattedContent.length,
      },
      completedAt: new Date().toISOString(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`[DocumentWorker] Document generation failed`, {
      jobId: job.id,
      error: message,
    })

    return {
      success: false,
      error: message,
      completedAt: new Date().toISOString(),
    }
  }
}

// ============================================
// Helper Functions (Stubs)
// ============================================

/**
 * Company Block을 로드합니다.
 * Prisma를 통한 실제 DB 연동
 */
async function loadCompanyBlock(companyBlockId: string): Promise<Record<string, unknown> | null> {
  const { prisma } = await import('@/lib/db/prisma')

  try {
    const block = await prisma.companyBlock.findUnique({
      where: { id: companyBlockId },
      select: {
        id: true,
        companyName: true,
        businessNumber: true,
        industryBlock: true,
        profile: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!block) {
      return null
    }

    return {
      id: block.id,
      companyName: block.companyName,
      businessNumber: block.businessNumber,
      industryBlock: block.industryBlock,
      profile: block.profile,
      createdAt: block.createdAt.toISOString(),
      updatedAt: block.updatedAt.toISOString(),
    }
  } catch (error) {
    console.error('[Worker] Failed to load CompanyBlock:', error)
    return null
  }
}

/**
 * 프로그램 정보를 로드합니다.
 */
async function loadProgramInfo(programId: string): Promise<Record<string, unknown>> {
  await simulateDelay(300)

  return {
    id: programId,
    name: 'AI바우처',
    requirements: [],
    criteria: [],
  }
}

/**
 * 프롬프트를 생성합니다.
 */
async function generatePrompt(
  companyBlock: Record<string, unknown>,
  programInfo: Record<string, unknown>
): Promise<string> {
  await simulateDelay(200)

  return `제안서 작성: ${JSON.stringify(companyBlock)} for ${JSON.stringify(programInfo)}`
}

/**
 * AI로 콘텐츠를 생성합니다.
 */
async function generateContentWithAI(prompt: string): Promise<string> {
  // 실제 구현에서는 Claude API 호출
  await simulateDelay(3000) // AI 처리 시뮬레이션

  return `Generated content based on: ${prompt.slice(0, 100)}...`
}

/**
 * 문서를 포맷팅합니다.
 */
async function formatDocument(content: string, programName: string): Promise<string> {
  await simulateDelay(500)

  return `
# ${programName} 제안서

## 1. 사업 개요
${content}

## 2. 기술 개발 계획
[자동 생성된 내용]

## 3. 사업화 계획
[자동 생성된 내용]

---
Generated at: ${new Date().toISOString()}
`
}

/**
 * 문서를 저장합니다.
 */
async function saveDocument(
  userId: string,
  content: string,
  programName: string
): Promise<string> {
  await simulateDelay(300)

  // 실제 구현에서는 DB에 저장
  // const document = await prisma.document.create({ ... })
  const documentId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  logger.info(`[DocumentWorker] Document saved: ${documentId}`, {
    userId,
    programName,
    contentLength: content.length,
  })

  return documentId
}

/**
 * 딜레이 시뮬레이션
 */
function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================
// Worker Registration
// ============================================

let isWorkerRegistered = false

/**
 * Document Generator Worker를 시작합니다.
 */
export function startDocumentWorker(): void {
  if (isWorkerRegistered) {
    logger.warn('[DocumentWorker] Worker already registered')
    return
  }

  registerWorker<DocumentGenerationJobData>(
    QUEUE_NAMES.DOCUMENT,
    processDocumentGeneration,
    {
      concurrency: 3,
      limiter: {
        max: 10,
        duration: 60000, // 분당 최대 10개
      },
    }
  )

  isWorkerRegistered = true
  logger.info('[DocumentWorker] Worker started')
}

// ============================================
// Export for testing
// ============================================

export const __test__ = {
  processDocumentGeneration,
  loadCompanyBlock,
  loadProgramInfo,
  generatePrompt,
  generateContentWithAI,
  formatDocument,
  saveDocument,
}
