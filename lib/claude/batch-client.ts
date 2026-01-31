/**
 * QETTA Claude Batch API Client
 *
 * 대량 공고문 분석을 위한 Batch API 클라이언트
 *
 * @see https://docs.anthropic.com/en/docs/build-with-claude/batch-processing
 *
 * 핵심 기능:
 * 1. 대량 공고문 비동기 처리 (100→1000건/일)
 * 2. 50% 비용 절감 (일반 API 대비)
 * 3. 24시간 내 결과 반환
 *
 * 사용 사례:
 * - 기업마당/소상공인24 공고문 일괄 분석
 * - 탈락 사유 대량 분류
 * - 기업-공고 매칭 일괄 처리
 *
 * @example
 * ```ts
 * import { batchClient } from '@/lib/claude/batch-client'
 *
 * // 배치 생성
 * const batch = await batchClient.createAnnouncementAnalysisBatch(announcements)
 *
 * // 결과 폴링
 * const results = await batchClient.pollBatchResults(batch.id)
 * ```
 */

import Anthropic from '@anthropic-ai/sdk'

// ============================================
// 타입 정의
// ============================================

export type BatchStatus = 'in_progress' | 'ended' | 'canceling' | 'failed'

export interface BatchRequest {
  custom_id: string
  params: {
    model: string
    max_tokens: number
    system?: string
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  }
}

export interface BatchResult {
  custom_id: string
  result: {
    type: 'succeeded' | 'errored' | 'canceled' | 'expired'
    message?: {
      content: Array<{ type: 'text'; text: string }>
      usage: { input_tokens: number; output_tokens: number }
    }
    error?: { type: string; message: string }
  }
}

export interface BatchJob {
  id: string
  type: string
  processing_status: BatchStatus
  request_counts: {
    processing: number
    succeeded: number
    errored: number
    canceled: number
    expired: number
  }
  created_at: string
  ended_at?: string
  results_url?: string
}

export interface AnnouncementForBatch {
  id: string
  title: string
  description: string
  agency?: string
  deadline?: string
  targetDescription?: string
}

export interface BatchClientConfig {
  apiKey?: string
  defaultModel?: string
  defaultMaxTokens?: number
  pollIntervalMs?: number
  maxPollAttempts?: number
}

// ============================================
// 상수
// ============================================

const DEFAULT_CONFIG: Required<Omit<BatchClientConfig, 'apiKey'>> = {
  defaultModel: 'claude-sonnet-4-20250514',
  defaultMaxTokens: 1024,
  pollIntervalMs: 60000, // 1분
  maxPollAttempts: 1440, // 24시간 (1분 * 1440)
}

const BATCH_SYSTEM_PROMPT = `당신은 QETTA 공고문 분석 전문가입니다.

## 분석 원칙
1. 핵심 정보만 추출 (불필요한 설명 금지)
2. 구조화된 JSON으로 응답
3. 용어는 QETTA 도메인 엔진 기준 (TMS/스마트공장/AI바우처/해외입찰)

## 출력 형식
{
  "domain": "TMS|SMART_FACTORY|AI_VOUCHER|GLOBAL_TENDER|GENERAL",
  "supportType": "funding|voucher|loan|tax|consulting|export|certification",
  "targetSize": "micro|small|medium|large|all",
  "estimatedAmount": "금액 범위 또는 null",
  "eligibilityKeywords": ["키워드1", "키워드2"],
  "deadlineUrgency": "urgent|normal|flexible",
  "matchingScore": 0.0-1.0 (해당 기업에 대한 적합도, 컨텍스트 없으면 0.5)
}`

// ============================================
// Batch Client 클래스
// ============================================

export class ClaudeBatchClient {
  private client: Anthropic
  private config: Required<Omit<BatchClientConfig, 'apiKey'>>

  constructor(config?: BatchClientConfig) {
    const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.'
      )
    }

    this.client = new Anthropic({ apiKey })
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    }
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 공고문 분석 배치 생성
   *
   * @param announcements - 분석할 공고문 목록
   * @returns 배치 작업 정보
   */
  async createAnnouncementAnalysisBatch(
    announcements: AnnouncementForBatch[]
  ): Promise<BatchJob> {
    const requests = announcements.map((ann) =>
      this.createAnnouncementRequest(ann)
    )

    return this.createBatch(requests)
  }

  /**
   * 탈락 사유 분류 배치 생성
   *
   * @param rejections - 탈락 사유 목록
   * @returns 배치 작업 정보
   */
  async createRejectionClassificationBatch(
    rejections: Array<{ id: string; text: string; domain?: string }>
  ): Promise<BatchJob> {
    const requests = rejections.map((rej) =>
      this.createRejectionRequest(rej)
    )

    return this.createBatch(requests)
  }

  /**
   * 배치 상태 조회
   */
  async getBatchStatus(batchId: string): Promise<BatchJob> {
    const response = await this.client.messages.batches.retrieve(batchId)

    return {
      id: response.id,
      type: response.type,
      processing_status: response.processing_status as BatchStatus,
      request_counts: response.request_counts,
      created_at: response.created_at,
      ended_at: response.ended_at ?? undefined,
      results_url: response.results_url ?? undefined,
    }
  }

  /**
   * 배치 결과 폴링 (완료까지 대기)
   */
  async pollBatchResults(
    batchId: string,
    onProgress?: (status: BatchJob) => void
  ): Promise<BatchResult[]> {
    let attempts = 0

    while (attempts < this.config.maxPollAttempts) {
      const status = await this.getBatchStatus(batchId)

      if (onProgress) {
        onProgress(status)
      }

      if (status.processing_status === 'ended') {
        return this.fetchBatchResults(batchId)
      }

      if (status.processing_status === 'failed') {
        throw new Error(`Batch ${batchId} failed`)
      }

      attempts++
      await this.delay(this.config.pollIntervalMs)
    }

    throw new Error(
      `Batch ${batchId} polling timeout after ${this.config.maxPollAttempts} attempts`
    )
  }

  /**
   * 배치 결과 조회 (완료 후)
   */
  async fetchBatchResults(batchId: string): Promise<BatchResult[]> {
    const results: BatchResult[] = []

    const decoder = await this.client.messages.batches.results(batchId)
    for await (const result of decoder) {
      results.push(result as BatchResult)
    }

    return results
  }

  /**
   * 배치 취소
   */
  async cancelBatch(batchId: string): Promise<BatchJob> {
    const response = await this.client.messages.batches.cancel(batchId)

    return {
      id: response.id,
      type: response.type,
      processing_status: response.processing_status as BatchStatus,
      request_counts: response.request_counts,
      created_at: response.created_at,
      ended_at: response.ended_at ?? undefined,
      results_url: response.results_url ?? undefined,
    }
  }

  /**
   * 배치 목록 조회
   */
  async listBatches(limit = 20): Promise<BatchJob[]> {
    const response = await this.client.messages.batches.list({ limit })

    return response.data.map((batch) => ({
      id: batch.id,
      type: batch.type,
      processing_status: batch.processing_status as BatchStatus,
      request_counts: batch.request_counts,
      created_at: batch.created_at,
      ended_at: batch.ended_at ?? undefined,
      results_url: batch.results_url ?? undefined,
    }))
  }

  // ============================================
  // 내부 메서드
  // ============================================

  private async createBatch(requests: BatchRequest[]): Promise<BatchJob> {
    const response = await this.client.messages.batches.create({
      requests,
    })

    return {
      id: response.id,
      type: response.type,
      processing_status: response.processing_status as BatchStatus,
      request_counts: response.request_counts,
      created_at: response.created_at,
      ended_at: response.ended_at ?? undefined,
      results_url: response.results_url ?? undefined,
    }
  }

  private createAnnouncementRequest(
    announcement: AnnouncementForBatch
  ): BatchRequest {
    const userMessage = `다음 공고문을 분석해주세요:

제목: ${announcement.title}
기관: ${announcement.agency || '미상'}
마감: ${announcement.deadline || '미정'}
대상: ${announcement.targetDescription || '미상'}

내용:
${announcement.description}`

    return {
      custom_id: `ann-${announcement.id}`,
      params: {
        model: this.config.defaultModel,
        max_tokens: this.config.defaultMaxTokens,
        system: BATCH_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      },
    }
  }

  private createRejectionRequest(rejection: {
    id: string
    text: string
    domain?: string
  }): BatchRequest {
    const systemPrompt = `당신은 QETTA 탈락 분류 전문가입니다.

## 탈락 카테고리
- missing_document: 서류 누락
- format_error: 양식 오류
- deadline_missed: 기한 초과
- qualification_fail: 자격 미달
- budget_mismatch: 예산 부적합
- technical_fail: 기술 점수 미달
- experience_lack: 경험 부족
- certification_missing: 인증 누락
- reference_invalid: 레퍼런스 부적합
- other: 기타

## 출력 형식
{
  "category": "카테고리",
  "confidence": 0.0-1.0,
  "keywords": ["발견된 키워드"],
  "suggestion": "개선 제안 (한 문장)"
}`

    return {
      custom_id: `rej-${rejection.id}`,
      params: {
        model: 'claude-haiku-4-20250514', // 분류는 Haiku로 비용 절감
        max_tokens: 512,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `도메인: ${rejection.domain || 'general'}\n\n탈락 사유:\n${rejection.text}`,
          },
        ],
      },
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

let _batchClient: ClaudeBatchClient | null = null

export function getBatchClient(): ClaudeBatchClient {
  if (!_batchClient) {
    _batchClient = new ClaudeBatchClient()
  }
  return _batchClient
}

export function initBatchClient(config: BatchClientConfig): ClaudeBatchClient {
  _batchClient = new ClaudeBatchClient(config)
  return _batchClient
}

export const batchClient = {
  get instance() {
    return getBatchClient()
  },
  createAnnouncementAnalysisBatch: (announcements: AnnouncementForBatch[]) =>
    getBatchClient().createAnnouncementAnalysisBatch(announcements),
  createRejectionClassificationBatch: (
    rejections: Array<{ id: string; text: string; domain?: string }>
  ) => getBatchClient().createRejectionClassificationBatch(rejections),
  getBatchStatus: (batchId: string) => getBatchClient().getBatchStatus(batchId),
  pollBatchResults: (
    batchId: string,
    onProgress?: (status: BatchJob) => void
  ) => getBatchClient().pollBatchResults(batchId, onProgress),
  fetchBatchResults: (batchId: string) =>
    getBatchClient().fetchBatchResults(batchId),
  cancelBatch: (batchId: string) => getBatchClient().cancelBatch(batchId),
  listBatches: (limit?: number) => getBatchClient().listBatches(limit),
}
