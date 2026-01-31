import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================
// Mock Anthropic SDK - inline to avoid hoisting issues
// ============================================

const mockCreate = vi.fn()
const mockRetrieve = vi.fn()
const mockResults = vi.fn()
const mockCancel = vi.fn()
const mockList = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        batches: {
          create: (...args: unknown[]) => mockCreate(...args),
          retrieve: (...args: unknown[]) => mockRetrieve(...args),
          results: (...args: unknown[]) => mockResults(...args),
          cancel: (...args: unknown[]) => mockCancel(...args),
          list: (...args: unknown[]) => mockList(...args),
        },
      }
    },
  }
})

// Import after mock
import {
  ClaudeBatchClient,
  type AnnouncementForBatch,
} from '../batch-client'

// ============================================
// Test Setup
// ============================================

describe('ClaudeBatchClient', () => {
  const mockApiKey = 'test-api-key'
  let originalEnv: string | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    originalEnv = process.env.ANTHROPIC_API_KEY
    process.env.ANTHROPIC_API_KEY = mockApiKey
  })

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalEnv
  })

  // ============================================
  // Constructor Tests
  // ============================================

  describe('constructor', () => {
    it('creates client with environment API key', () => {
      const client = new ClaudeBatchClient()
      expect(client).toBeInstanceOf(ClaudeBatchClient)
    })

    it('creates client with config API key', () => {
      delete process.env.ANTHROPIC_API_KEY
      const client = new ClaudeBatchClient({ apiKey: 'config-api-key' })
      expect(client).toBeInstanceOf(ClaudeBatchClient)
    })

    it('throws error when no API key available', () => {
      delete process.env.ANTHROPIC_API_KEY
      expect(() => new ClaudeBatchClient()).toThrow(
        'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.'
      )
    })

    it('uses default config values', () => {
      const client = new ClaudeBatchClient()
      expect(client).toBeDefined()
    })

    it('accepts custom config values', () => {
      const client = new ClaudeBatchClient({
        defaultModel: 'claude-haiku-4-20250514',
        defaultMaxTokens: 2048,
        pollIntervalMs: 30000,
        maxPollAttempts: 60,
      })
      expect(client).toBeDefined()
    })
  })

  // ============================================
  // Announcement Batch Tests
  // ============================================

  describe('createAnnouncementAnalysisBatch', () => {
    const mockAnnouncements: AnnouncementForBatch[] = [
      {
        id: 'ann-001',
        title: '2026년 스마트공장 구축 지원사업',
        description: '제조업 스마트화 지원',
        agency: '중소벤처기업부',
        deadline: '2026-03-31',
      },
      {
        id: 'ann-002',
        title: 'AI 바우처 지원사업',
        description: 'AI 솔루션 도입 지원',
        agency: 'NIPA',
      },
    ]

    it('creates batch with announcements', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'batch_abc123',
        type: 'message_batch',
        processing_status: 'in_progress',
        request_counts: {
          processing: 2,
          succeeded: 0,
          errored: 0,
          canceled: 0,
          expired: 0,
        },
        created_at: '2026-01-29T00:00:00Z',
      })

      const client = new ClaudeBatchClient()
      const result = await client.createAnnouncementAnalysisBatch(mockAnnouncements)

      expect(result.id).toBe('batch_abc123')
      expect(result.processing_status).toBe('in_progress')
      expect(mockCreate).toHaveBeenCalledTimes(1)

      // Verify request structure - custom_id has 'ann-' prefix
      const callArgs = mockCreate.mock.calls[0][0]
      expect(callArgs.requests).toHaveLength(2)
      expect(callArgs.requests[0].custom_id).toBe('ann-ann-001')
    })

    it('includes announcement details in request', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'batch_with_details',
        type: 'message_batch',
        processing_status: 'in_progress',
        request_counts: {
          processing: 1,
          succeeded: 0,
          errored: 0,
          canceled: 0,
          expired: 0,
        },
        created_at: '2026-01-29T00:00:00Z',
      })

      const client = new ClaudeBatchClient()
      await client.createAnnouncementAnalysisBatch([mockAnnouncements[0]])

      const callArgs = mockCreate.mock.calls[0][0]
      const messageContent = callArgs.requests[0].params.messages[0].content

      // Verify announcement details are included
      expect(messageContent).toContain('스마트공장')
      expect(messageContent).toContain('중소벤처기업부')
    })
  })

  // ============================================
  // Rejection Batch Tests
  // ============================================

  describe('createRejectionClassificationBatch', () => {
    const mockRejections = [
      {
        id: 'rej-001',
        text: '기술력 부족으로 탈락',
        domain: 'manufacturing',
      },
      {
        id: 'rej-002',
        text: '서류 미비',
      },
    ]

    it('creates batch with rejections', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'batch_rejections',
        type: 'message_batch',
        processing_status: 'in_progress',
        request_counts: {
          processing: 2,
          succeeded: 0,
          errored: 0,
          canceled: 0,
          expired: 0,
        },
        created_at: '2026-01-29T00:00:00Z',
      })

      const client = new ClaudeBatchClient()
      const result = await client.createRejectionClassificationBatch(mockRejections)

      expect(result.id).toBe('batch_rejections')
      expect(mockCreate).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================
  // Status & Results Tests
  // ============================================

  describe('getBatchStatus', () => {
    it('retrieves batch status', async () => {
      mockRetrieve.mockResolvedValueOnce({
        id: 'batch_status_test',
        type: 'message_batch',
        processing_status: 'ended',
        request_counts: {
          processing: 0,
          succeeded: 10,
          errored: 0,
          canceled: 0,
          expired: 0,
        },
        created_at: '2026-01-29T00:00:00Z',
        ended_at: '2026-01-29T01:00:00Z',
        results_url: 'https://api.anthropic.com/v1/batches/batch_status_test/results',
      })

      const client = new ClaudeBatchClient()
      const status = await client.getBatchStatus('batch_status_test')

      expect(status.processing_status).toBe('ended')
      expect(status.request_counts.succeeded).toBe(10)
      expect(mockRetrieve).toHaveBeenCalledWith('batch_status_test')
    })
  })

  describe('fetchBatchResults', () => {
    it('fetches and parses results', async () => {
      const mockResultsData = [
        {
          custom_id: 'ann-001',
          result: {
            type: 'succeeded',
            message: {
              content: [{ type: 'text', text: '{"analysis": "결과"}' }],
              usage: { input_tokens: 100, output_tokens: 50 },
            },
          },
        },
      ]

      mockResults.mockResolvedValueOnce({
        [Symbol.asyncIterator]: async function* () {
          for (const result of mockResultsData) {
            yield result
          }
        },
      })

      const client = new ClaudeBatchClient()
      const results = await client.fetchBatchResults('batch_results_test')

      expect(results).toHaveLength(1)
      expect(results[0].custom_id).toBe('ann-001')
      expect(results[0].result.type).toBe('succeeded')
    })

    it('handles empty results', async () => {
      mockResults.mockResolvedValueOnce({
        [Symbol.asyncIterator]: async function* () {
          // No results
        },
      })

      const client = new ClaudeBatchClient()
      const results = await client.fetchBatchResults('batch_empty')

      expect(results).toHaveLength(0)
    })
  })

  describe('pollBatchResults', () => {
    it('polls until batch completes', async () => {
      // First call: in_progress
      mockRetrieve.mockResolvedValueOnce({
        id: 'batch_polling',
        processing_status: 'in_progress',
        request_counts: { processing: 1, succeeded: 0, errored: 0, canceled: 0, expired: 0 },
        created_at: '2026-01-29T00:00:00Z',
      })

      // Second call: ended
      mockRetrieve.mockResolvedValueOnce({
        id: 'batch_polling',
        processing_status: 'ended',
        request_counts: { processing: 0, succeeded: 1, errored: 0, canceled: 0, expired: 0 },
        created_at: '2026-01-29T00:00:00Z',
        ended_at: '2026-01-29T01:00:00Z',
      })

      mockResults.mockResolvedValueOnce({
        [Symbol.asyncIterator]: async function* () {
          yield {
            custom_id: 'item-1',
            result: { type: 'succeeded', message: { content: [{ type: 'text', text: 'done' }] } },
          }
        },
      })

      const client = new ClaudeBatchClient({
        pollIntervalMs: 10, // Fast polling for test
        maxPollAttempts: 5,
      })

      const results = await client.pollBatchResults('batch_polling')

      expect(results).toHaveLength(1)
      expect(mockRetrieve).toHaveBeenCalledTimes(2)
    })

    it('throws on max poll attempts exceeded', async () => {
      mockRetrieve.mockResolvedValue({
        id: 'batch_timeout',
        processing_status: 'in_progress',
        request_counts: { processing: 1, succeeded: 0, errored: 0, canceled: 0, expired: 0 },
        created_at: '2026-01-29T00:00:00Z',
      })

      const client = new ClaudeBatchClient({
        pollIntervalMs: 1,
        maxPollAttempts: 3,
      })

      await expect(
        client.pollBatchResults('batch_timeout')
      ).rejects.toThrow('polling timeout')
    })

    it('throws on batch failure', async () => {
      mockRetrieve.mockResolvedValueOnce({
        id: 'batch_failed',
        processing_status: 'failed',
        request_counts: { processing: 0, succeeded: 0, errored: 1, canceled: 0, expired: 0 },
        created_at: '2026-01-29T00:00:00Z',
      })

      const client = new ClaudeBatchClient()

      await expect(
        client.pollBatchResults('batch_failed')
      ).rejects.toThrow('failed')
    })

    it('calls onProgress callback during polling', async () => {
      // First call: in_progress
      mockRetrieve.mockResolvedValueOnce({
        id: 'batch_progress',
        processing_status: 'in_progress',
        request_counts: { processing: 1, succeeded: 0, errored: 0, canceled: 0, expired: 0 },
        created_at: '2026-01-29T00:00:00Z',
      })

      // Second call: ended
      mockRetrieve.mockResolvedValueOnce({
        id: 'batch_progress',
        processing_status: 'ended',
        request_counts: { processing: 0, succeeded: 1, errored: 0, canceled: 0, expired: 0 },
        created_at: '2026-01-29T00:00:00Z',
        ended_at: '2026-01-29T01:00:00Z',
      })

      mockResults.mockResolvedValueOnce({
        [Symbol.asyncIterator]: async function* () {
          yield {
            custom_id: 'item-1',
            result: { type: 'succeeded', message: { content: [{ type: 'text', text: 'done' }] } },
          }
        },
      })

      const client = new ClaudeBatchClient({
        pollIntervalMs: 10,
        maxPollAttempts: 5,
      })

      const progressCalls: unknown[] = []
      const onProgress = vi.fn((status) => {
        progressCalls.push(status.processing_status)
      })

      await client.pollBatchResults('batch_progress', onProgress)

      expect(onProgress).toHaveBeenCalledTimes(2)
      expect(progressCalls).toContain('in_progress')
      expect(progressCalls).toContain('ended')
    })
  })

  // ============================================
  // Cancel & List Tests
  // ============================================

  describe('cancelBatch', () => {
    it('cancels batch successfully', async () => {
      mockCancel.mockResolvedValueOnce({
        id: 'batch_canceled',
        processing_status: 'canceling',
        request_counts: { processing: 0, succeeded: 5, errored: 0, canceled: 5, expired: 0 },
        created_at: '2026-01-29T00:00:00Z',
      })

      const client = new ClaudeBatchClient()
      const result = await client.cancelBatch('batch_canceled')

      expect(result.processing_status).toBe('canceling')
      expect(mockCancel).toHaveBeenCalledWith('batch_canceled')
    })
  })

  describe('listBatches', () => {
    it('lists batches with limit', async () => {
      mockList.mockResolvedValueOnce({
        data: [
          {
            id: 'batch_1',
            processing_status: 'ended',
            request_counts: { processing: 0, succeeded: 10, errored: 0, canceled: 0, expired: 0 },
            created_at: '2026-01-29T00:00:00Z',
          },
          {
            id: 'batch_2',
            processing_status: 'in_progress',
            request_counts: { processing: 5, succeeded: 0, errored: 0, canceled: 0, expired: 0 },
            created_at: '2026-01-29T02:00:00Z',
          },
        ],
      })

      const client = new ClaudeBatchClient()
      const batches = await client.listBatches(10)

      expect(batches).toHaveLength(2)
      expect(batches[0].id).toBe('batch_1')
      expect(mockList).toHaveBeenCalledWith({ limit: 10 })
    })

    it('uses default limit', async () => {
      mockList.mockResolvedValueOnce({ data: [] })

      const client = new ClaudeBatchClient()
      await client.listBatches()

      expect(mockList).toHaveBeenCalledWith({ limit: 20 })
    })
  })
})

// ============================================
// Singleton Tests
// ============================================

describe('Singleton functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
    vi.resetModules()
  })

  it('getBatchClient returns singleton instance', async () => {
    const { getBatchClient } = await import('../batch-client')

    const client1 = getBatchClient()
    const client2 = getBatchClient()

    expect(client1).toBe(client2)
  })

  it('initBatchClient creates instance with config', async () => {
    const { initBatchClient, ClaudeBatchClient } = await import('../batch-client')

    const client = initBatchClient({
      defaultModel: 'claude-haiku-4-20250514',
    })

    expect(client).toBeInstanceOf(ClaudeBatchClient)
  })
})

// ============================================
// batchClient Convenience Object Tests
// ============================================

describe('batchClient convenience object', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
    vi.resetModules()
  })

  it('instance getter returns singleton', async () => {
    const { batchClient, ClaudeBatchClient } = await import('../batch-client')

    const instance = batchClient.instance
    expect(instance).toBeInstanceOf(ClaudeBatchClient)
  })

  it('createAnnouncementAnalysisBatch delegates to singleton', async () => {
    mockCreate.mockResolvedValueOnce({
      id: 'batch_convenience',
      type: 'message_batch',
      processing_status: 'in_progress',
      request_counts: { processing: 1, succeeded: 0, errored: 0, canceled: 0, expired: 0 },
      created_at: '2026-01-29T00:00:00Z',
    })

    const { batchClient } = await import('../batch-client')

    const result = await batchClient.createAnnouncementAnalysisBatch([
      { id: 'ann-1', title: 'Test', description: 'Test', agency: 'Test' },
    ])

    expect(result.id).toBe('batch_convenience')
    expect(mockCreate).toHaveBeenCalled()
  })

  it('createRejectionClassificationBatch delegates to singleton', async () => {
    mockCreate.mockResolvedValueOnce({
      id: 'batch_rejection',
      type: 'message_batch',
      processing_status: 'in_progress',
      request_counts: { processing: 1, succeeded: 0, errored: 0, canceled: 0, expired: 0 },
      created_at: '2026-01-29T00:00:00Z',
    })

    const { batchClient } = await import('../batch-client')

    const result = await batchClient.createRejectionClassificationBatch([
      { id: 'rej-1', text: 'Test rejection' },
    ])

    expect(result.id).toBe('batch_rejection')
    expect(mockCreate).toHaveBeenCalled()
  })

  it('getBatchStatus delegates to singleton', async () => {
    mockRetrieve.mockResolvedValueOnce({
      id: 'batch_status',
      processing_status: 'ended',
      request_counts: { processing: 0, succeeded: 1, errored: 0, canceled: 0, expired: 0 },
      created_at: '2026-01-29T00:00:00Z',
    })

    const { batchClient } = await import('../batch-client')

    const status = await batchClient.getBatchStatus('batch_status')

    expect(status.id).toBe('batch_status')
    expect(mockRetrieve).toHaveBeenCalledWith('batch_status')
  })

  it('pollBatchResults delegates to singleton', async () => {
    mockRetrieve.mockResolvedValueOnce({
      id: 'batch_poll',
      processing_status: 'ended',
      request_counts: { processing: 0, succeeded: 1, errored: 0, canceled: 0, expired: 0 },
      created_at: '2026-01-29T00:00:00Z',
      ended_at: '2026-01-29T01:00:00Z',
    })
    mockResults.mockResolvedValueOnce({
      [Symbol.asyncIterator]: async function* () {
        yield { custom_id: 'item-1', result: { type: 'succeeded', message: { content: [{ type: 'text', text: 'done' }] } } }
      },
    })

    const { batchClient } = await import('../batch-client')

    const results = await batchClient.pollBatchResults('batch_poll')

    expect(results).toHaveLength(1)
  })

  it('fetchBatchResults delegates to singleton', async () => {
    mockResults.mockResolvedValueOnce({
      [Symbol.asyncIterator]: async function* () {
        yield { custom_id: 'item-1', result: { type: 'succeeded', message: { content: [{ type: 'text', text: 'data' }] } } }
      },
    })

    const { batchClient } = await import('../batch-client')

    const results = await batchClient.fetchBatchResults('batch_fetch')

    expect(results).toHaveLength(1)
  })

  it('cancelBatch delegates to singleton', async () => {
    mockCancel.mockResolvedValueOnce({
      id: 'batch_cancel',
      processing_status: 'canceling',
      request_counts: { processing: 0, succeeded: 0, errored: 0, canceled: 1, expired: 0 },
      created_at: '2026-01-29T00:00:00Z',
    })

    const { batchClient } = await import('../batch-client')

    const result = await batchClient.cancelBatch('batch_cancel')

    expect(result.processing_status).toBe('canceling')
    expect(mockCancel).toHaveBeenCalledWith('batch_cancel')
  })

  it('listBatches delegates to singleton', async () => {
    mockList.mockResolvedValueOnce({
      data: [{ id: 'batch_1', processing_status: 'ended' }],
    })

    const { batchClient } = await import('../batch-client')

    const batches = await batchClient.listBatches(5)

    expect(batches).toHaveLength(1)
    expect(mockList).toHaveBeenCalledWith({ limit: 5 })
  })
})
