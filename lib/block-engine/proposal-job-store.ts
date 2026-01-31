/**
 * Proposal Job Store
 *
 * P0-FIX-5: Job 영속성 개선
 *
 * 메모리 Map 대신 Prisma DB를 사용하여 Job 저장
 * - 서버 재시작 시에도 Job 상태 유지
 * - Serverless 환경에서 안정적인 폴링 패턴 지원
 */

import { prisma } from '@/lib/db/prisma'
import type { ProposalJob, ProposalJobStatus } from '@prisma/client'

// ============================================
// Types
// ============================================

export interface ProposalJobResult {
  content: string
  sections: string[]
  tokensUsed: number
  model: string
}

export interface ProposalJobError {
  code: string
  message: string
}

export interface ProposalJobCreateInput {
  userId: string
  companyBlockId: string
  programId: string
  programName: string
}

export interface ProposalJobData {
  id: string
  userId: string
  companyBlockId: string
  programId: string
  programName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  startedAt?: string
  completedAt?: string
  result?: ProposalJobResult
  error?: ProposalJobError
}

// ============================================
// DB → App Type Converter
// ============================================

function toJobData(job: ProposalJob): ProposalJobData {
  const result: ProposalJobData = {
    id: job.id,
    userId: job.userId,
    companyBlockId: job.companyBlockId,
    programId: job.programId,
    programName: job.programName,
    status: job.status.toLowerCase() as ProposalJobData['status'],
    createdAt: job.createdAt.toISOString(),
  }

  if (job.startedAt) {
    result.startedAt = job.startedAt.toISOString()
  }

  if (job.completedAt) {
    result.completedAt = job.completedAt.toISOString()
  }

  if (job.status === 'COMPLETED' && job.resultContent) {
    result.result = {
      content: job.resultContent,
      sections: (job.resultSections as string[]) || [],
      tokensUsed: job.tokensUsed || 0,
      model: job.modelUsed || 'unknown',
    }
  }

  if (job.status === 'FAILED' && job.errorCode) {
    result.error = {
      code: job.errorCode,
      message: job.errorMessage || 'Unknown error',
    }
  }

  return result
}

// ============================================
// Job CRUD Operations
// ============================================

/**
 * Job 생성
 */
export async function createProposalJob(
  input: ProposalJobCreateInput
): Promise<ProposalJobData> {
  const job = await prisma.proposalJob.create({
    data: {
      userId: input.userId,
      companyBlockId: input.companyBlockId,
      programId: input.programId,
      programName: input.programName,
      status: 'PENDING',
    },
  })

  return toJobData(job)
}

/**
 * Job 조회 (ID)
 */
export async function getProposalJobById(
  jobId: string
): Promise<ProposalJobData | null> {
  const job = await prisma.proposalJob.findUnique({
    where: { id: jobId },
  })

  return job ? toJobData(job) : null
}

/**
 * 사용자의 Job 목록 조회
 */
export async function getUserProposalJobs(
  userId: string,
  limit: number = 20
): Promise<ProposalJobData[]> {
  const jobs = await prisma.proposalJob.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return jobs.map(toJobData)
}

/**
 * Job 상태 업데이트 (processing 시작)
 */
export async function startProposalJob(jobId: string): Promise<void> {
  await prisma.proposalJob.update({
    where: { id: jobId },
    data: {
      status: 'PROCESSING',
      startedAt: new Date(),
    },
  })
}

/**
 * Job 완료 처리
 */
export async function completeProposalJob(
  jobId: string,
  result: ProposalJobResult
): Promise<void> {
  await prisma.proposalJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      resultContent: result.content,
      resultSections: result.sections,
      tokensUsed: result.tokensUsed,
      modelUsed: result.model,
    },
  })
}

/**
 * Job 실패 처리
 */
export async function failProposalJob(
  jobId: string,
  error: ProposalJobError
): Promise<void> {
  await prisma.proposalJob.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      completedAt: new Date(),
      errorCode: error.code,
      errorMessage: error.message,
    },
  })
}

/**
 * Job 취소 처리
 */
export async function cancelProposalJob(jobId: string): Promise<boolean> {
  const job = await prisma.proposalJob.findUnique({
    where: { id: jobId },
  })

  if (!job || job.status !== 'PENDING') {
    return false
  }

  await prisma.proposalJob.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      completedAt: new Date(),
      errorCode: 'CANCELLED',
      errorMessage: '사용자에 의해 취소됨',
    },
  })

  return true
}

// ============================================
// Cleanup Operations
// ============================================

/**
 * 오래된 Job 정리 (24시간 이상)
 */
export async function cleanupOldJobs(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const result = await prisma.proposalJob.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      status: { in: ['COMPLETED', 'FAILED'] },
    },
  })

  return result.count
}

/**
 * 고아 Job 처리 (processing 상태로 1시간 이상 방치)
 */
export async function recoverStuckJobs(): Promise<number> {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000)

  const result = await prisma.proposalJob.updateMany({
    where: {
      status: 'PROCESSING',
      startedAt: { lt: cutoff },
    },
    data: {
      status: 'FAILED',
      completedAt: new Date(),
      errorCode: 'TIMEOUT',
      errorMessage: '처리 시간 초과',
    },
  })

  return result.count
}
