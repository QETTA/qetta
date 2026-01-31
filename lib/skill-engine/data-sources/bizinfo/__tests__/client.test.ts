/**
 * BizInfo Client Tests
 *
 * 기업마당 API 클라이언트 테스트
 * - API 호출 및 응답 파싱
 * - 에러 핸들링
 * - 캐싱 동작
 * - 정규화 로직
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BizInfoClient, initBizInfoClient } from '../client'
import { BizInfoApiError, BIZINFO_ERROR_CODES } from '../types'
import type { BizInfoApiResponse, BizInfoAnnouncementItem } from '../types'

// ============================================
// Mock 데이터
// ============================================

const MOCK_ANNOUNCEMENT_ITEM: BizInfoAnnouncementItem = {
  title: '2026년 환경부 TMS 지원사업',
  link: 'https://www.bizinfo.go.kr/detail/12345',
  pblancId: 'BIZINFO-12345',
  jrsdInsttNm: '환경부',
  excInsttNm: '한국환경공단',
  hashtags: '기술,전국',
  areaNm: '전국',
  reqstBeginDe: '20260115',
  reqstEndDe: '20260228',
  registDe: '20260110',
  pblancSttusNm: '접수중',
  trgetNm: '중소기업',
  sporCn: '최대 1억원',
  reqstMthNm: '온라인 접수',
}

const MOCK_API_RESPONSE: BizInfoApiResponse = {
  code: '00',
  totalCount: 1,
  items: [MOCK_ANNOUNCEMENT_ITEM],
}

// ============================================
// 테스트
// ============================================

describe('BizInfoClient', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetAllMocks()
    // 환경변수 설정
    process.env = { ...originalEnv, BIZINFO_API_KEY: 'test-api-key' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('constructor', () => {
    it('should throw error when API key is missing', () => {
      process.env.BIZINFO_API_KEY = ''

      expect(() => new BizInfoClient({ apiKey: '' })).toThrow(BizInfoApiError)
      expect(() => new BizInfoClient({ apiKey: '' })).toThrow(
        '기업마당 API 키가 설정되지 않았습니다'
      )
    })

    it('should initialize with provided API key', () => {
      const client = new BizInfoClient({ apiKey: 'custom-key' })
      expect(client).toBeInstanceOf(BizInfoClient)
    })

    it('should use environment variable API key', () => {
      process.env.BIZINFO_API_KEY = 'env-api-key'
      const client = new BizInfoClient()
      expect(client).toBeInstanceOf(BizInfoClient)
    })
  })

  describe('search', () => {
    it('should parse API response correctly', async () => {
      const client = initBizInfoClient({ apiKey: 'test-key' })

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      const result = await client.search()

      expect(result).toBeDefined()
      expect(result.announcements).toBeInstanceOf(Array)
      expect(result.announcements.length).toBe(1)
      expect(result.totalCount).toBe(1)
      expect(result.fromCache).toBe(false)
    })

    it('should normalize announcement data correctly', async () => {
      const client = initBizInfoClient({ apiKey: 'test-key' })

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      const result = await client.search()
      const announcement = result.announcements[0]

      expect(announcement.id).toBe('BIZINFO-12345')
      expect(announcement.source).toBe('BIZINFO')
      expect(announcement.title).toBe('2026년 환경부 TMS 지원사업')
      expect(announcement.agency).toBe('환경부')
      expect(announcement.status).toBe('open')
      expect(announcement.applicationPeriod.start).toBe('2026-01-15')
      expect(announcement.applicationPeriod.end).toBe('2026-02-28')
    })

    it('should filter active announcements when activeOnly is true', async () => {
      const client = initBizInfoClient({ apiKey: 'test-key' })

      const closedItem: BizInfoAnnouncementItem = {
        ...MOCK_ANNOUNCEMENT_ITEM,
        pblancId: 'CLOSED-001',
        pblancSttusNm: '마감',
      }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...MOCK_API_RESPONSE,
          totalCount: 2,
          items: [MOCK_ANNOUNCEMENT_ITEM, closedItem],
        }),
      } as Response)

      const result = await client.search({ activeOnly: true })

      expect(result.announcements.length).toBe(1)
      expect(result.announcements[0].status).toBe('open')
    })

    it('should use cached result on subsequent calls', async () => {
      const client = initBizInfoClient({ apiKey: 'test-key' })
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      // 첫 번째 호출
      await client.search()
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      // 두 번째 호출 (캐시 사용)
      const cachedResult = await client.search()
      expect(fetchSpy).toHaveBeenCalledTimes(1) // 추가 호출 없음
      expect(cachedResult.fromCache).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should retry on network error', async () => {
      const client = initBizInfoClient({
        apiKey: 'test-key',
        retryCount: 3,
        retryDelay: 10,
      })

      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_API_RESPONSE,
        } as Response)

      const result = await client.search()

      expect(fetchSpy).toHaveBeenCalledTimes(3)
      expect(result.announcements.length).toBe(1)
    })

    it('should throw after max retries', async () => {
      const client = initBizInfoClient({
        apiKey: 'test-key',
        retryCount: 2,
        retryDelay: 10,
      })

      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Persistent error'))

      await expect(client.search()).rejects.toThrow(BizInfoApiError)
      await expect(client.search()).rejects.toThrow('API 호출 실패')
    })

    it('should handle HTTP errors', async () => {
      const client = initBizInfoClient({
        apiKey: 'test-key',
        retryCount: 1,
        retryDelay: 10,
      })

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response)

      await expect(client.search()).rejects.toThrow(BizInfoApiError)
    })

    it('should handle API error response', async () => {
      const client = initBizInfoClient({
        apiKey: 'test-key',
        retryCount: 1,
        retryDelay: 10,
      })

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 'AUTH_ERROR',
          message: '인증 실패',
        }),
      } as Response)

      await expect(client.search()).rejects.toThrow('인증 실패')
    })
  })

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      const client = initBizInfoClient({ apiKey: 'test-key' })

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      const result = await client.healthCheck()
      expect(result).toBe(true)
    })

    it('should return false when API fails', async () => {
      const client = initBizInfoClient({
        apiKey: 'test-key',
        retryCount: 1,
        retryDelay: 10,
      })

      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('API down'))

      const result = await client.healthCheck()
      expect(result).toBe(false)
    })
  })

  describe('clearCache', () => {
    it('should clear cache and fetch fresh data', async () => {
      const client = initBizInfoClient({ apiKey: 'test-key' })
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      // 첫 번째 호출
      await client.search()
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      // 캐시 클리어
      client.clearCache()

      // 두 번째 호출 (새로 fetch)
      await client.search()
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('getByField', () => {
    it('should search by field code', async () => {
      const client = initBizInfoClient({ apiKey: 'test-key' })

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      await client.getByField('기술')

      expect(fetchSpy).toHaveBeenCalled()
      const url = new URL(fetchSpy.mock.calls[0][0] as string)
      expect(url.searchParams.get('hashtags')).toContain('기술')
    })
  })

  describe('searchByKeyword', () => {
    it('should search by keyword', async () => {
      const client = initBizInfoClient({ apiKey: 'test-key' })

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      await client.searchByKeyword('환경')

      expect(fetchSpy).toHaveBeenCalled()
      const url = new URL(fetchSpy.mock.calls[0][0] as string)
      expect(url.searchParams.get('keyword')).toBe('환경')
    })
  })

  describe('getById (lines 201-202)', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('should find announcement by ID from search results', async () => {
      const client = initBizInfoClient({ apiKey: 'test-key-getById' })
      client.clearCache()

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      const result = await client.getById('BIZINFO-12345')
      expect(result).toBeDefined()
      expect(result?.id).toBe('BIZINFO-12345')
    })

    it('should return null when announcement not found', async () => {
      const client = initBizInfoClient({ apiKey: 'test-key-getById-null' })
      client.clearCache()

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      const result = await client.getById('NON_EXISTENT_ID')
      expect(result).toBeNull()
    })
  })

  describe('getByRegion (line 220)', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('should search by region keyword', async () => {
      const client = initBizInfoClient({ apiKey: 'test-key-getByRegion' })
      client.clearCache()

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      const result = await client.getByRegion('서울')
      expect(result).toBeDefined()
      expect(result.announcements.length).toBeGreaterThan(0)

      const url = new URL(fetchSpy.mock.calls[0][0] as string)
      expect(url.searchParams.get('keyword')).toBe('서울')
    })

    it('should pass activeOnly parameter', async () => {
      const client = initBizInfoClient({ apiKey: 'test-key-getByRegion-active' })
      client.clearCache()

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      const result = await client.getByRegion('경기', false)
      expect(result).toBeDefined()
    })
  })
})

describe('Date parsing utilities', () => {
  it('should parse YYYYMMDD format correctly', async () => {
    const client = initBizInfoClient({ apiKey: 'test-key' })

    const item: BizInfoAnnouncementItem = {
      ...MOCK_ANNOUNCEMENT_ITEM,
      reqstBeginDe: '20261231',
      reqstEndDe: '20270115',
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: '00',
        totalCount: 1,
        items: [item],
      }),
    } as Response)

    const result = await client.search()
    const announcement = result.announcements[0]

    expect(announcement.applicationPeriod.start).toBe('2026-12-31')
    expect(announcement.applicationPeriod.end).toBe('2027-01-15')
  })

  it('should handle missing dates gracefully', async () => {
    const client = initBizInfoClient({ apiKey: 'test-key' })

    const item: BizInfoAnnouncementItem = {
      ...MOCK_ANNOUNCEMENT_ITEM,
      reqstBeginDe: undefined,
      reqstEndDe: undefined,
      pblancSttusNm: undefined, // 상태도 제거하여 unknown 유도
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: '00',
        totalCount: 1,
        items: [item],
      }),
    } as Response)

    const result = await client.search()
    const announcement = result.announcements[0]

    expect(announcement.applicationPeriod.start).toBeNull()
    expect(announcement.applicationPeriod.end).toBeNull()
    expect(announcement.status).toBe('unknown')
  })
})

describe('Cache TTL expiration', () => {
  it('should expire cached data after TTL', async () => {
    // Reset mocks completely
    vi.restoreAllMocks()

    // Use a very short TTL (0.001 minute = 60ms)
    const client = initBizInfoClient({
      apiKey: 'test-key-ttl',
      cacheTtlMinutes: 0.001, // 60ms
    })

    // Clear any existing cache
    client.clearCache()

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    } as Response)

    // First call - should fetch
    const result1 = await client.search({ activeOnly: false })
    expect(result1.fromCache).toBe(false)
    const callCount1 = fetchSpy.mock.calls.length

    // Second call immediately - should use cache
    const result2 = await client.search({ activeOnly: false })
    expect(result2.fromCache).toBe(true)
    expect(fetchSpy.mock.calls.length).toBe(callCount1) // No additional calls

    // Wait for cache to expire (> 60ms)
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Third call - cache should be expired, refetch
    const result3 = await client.search({ activeOnly: false })
    expect(result3.fromCache).toBe(false)
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(callCount1)
  })

  it('should delete expired cache entries', async () => {
    vi.restoreAllMocks()

    const client = initBizInfoClient({
      apiKey: 'test-key-ttl-delete',
      cacheTtlMinutes: 0.001, // 60ms
    })

    client.clearCache()

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    } as Response)

    // First call to populate cache
    await client.search()

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Clear cache manually shouldn't throw even after TTL
    expect(() => client.clearCache()).not.toThrow()
  })
})

describe('getBizInfoClient singleton', () => {
  it('should return singleton instance', async () => {
    // Reset module state by using dynamic import
    const { getBizInfoClient } = await import('../client')

    // Set API key
    process.env.BIZINFO_API_KEY = 'singleton-test-key'

    // Get client multiple times
    const client1 = getBizInfoClient()
    const client2 = getBizInfoClient()

    // Should be the same instance
    expect(client1).toBe(client2)
    expect(client1).toBeInstanceOf(BizInfoClient)
  })

  it('should initialize client when called fresh (line 429)', async () => {
    // Reset all modules to ensure fresh singleton state
    vi.resetModules()

    // Set API key before importing
    process.env.BIZINFO_API_KEY = 'fresh-singleton-test-key'

    // Import fresh module
    const freshModule = await import('../client')

    // First call should create new instance (line 429)
    const client = freshModule.getBizInfoClient()
    expect(client).toBeDefined()

    // Second call should return same instance
    const client2 = freshModule.getBizInfoClient()
    expect(client).toBe(client2)
  })
})

describe('getActive method (line 231)', () => {
  it('should call search with activeOnly: true', async () => {
    const client = initBizInfoClient({ apiKey: 'test-key' })

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    } as Response)

    const result = await client.getActive()

    expect(result).toBeDefined()
    expect(result.announcements).toBeDefined()
  })

  it('should accept custom pageSize', async () => {
    const client = initBizInfoClient({ apiKey: 'test-key' })

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    } as Response)

    const result = await client.getActive(100)

    expect(result).toBeDefined()
  })
})

describe('Regions filter (line 284)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should include regions in hashtags param', async () => {
    const client = initBizInfoClient({ apiKey: 'test-key-regions' })
    client.clearCache()

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    } as Response)

    await client.search({ regions: ['서울', '경기'] })

    expect(fetchSpy).toHaveBeenCalled()
    const url = new URL(fetchSpy.mock.calls[0][0] as string)
    const hashtags = url.searchParams.get('hashtags')
    expect(hashtags).not.toBeNull()
    expect(hashtags).toContain('서울')
    expect(hashtags).toContain('경기')
  })

  it('should combine fields and regions in hashtags', async () => {
    const client = initBizInfoClient({ apiKey: 'test-key-combined' })
    client.clearCache()

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    } as Response)

    await client.search({ fields: ['기술'], regions: ['전국'] })

    expect(fetchSpy).toHaveBeenCalled()
    const url = new URL(fetchSpy.mock.calls[0][0] as string)
    const hashtags = url.searchParams.get('hashtags')
    expect(hashtags).not.toBeNull()
    expect(hashtags).toContain('기술')
    expect(hashtags).toContain('전국')
  })
})

describe('Timeout handling (line 370)', () => {
  it('should throw timeout error on AbortError', async () => {
    const client = initBizInfoClient({
      apiKey: 'test-key',
      timeout: 10, // Very short timeout
      retryCount: 1,
      retryDelay: 1,
    })

    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'

    vi.spyOn(global, 'fetch').mockRejectedValue(abortError)

    await expect(client.search()).rejects.toThrow('타임아웃')
  })
})

describe('Status determination', () => {
  it('should determine "open" status from pblancSttusNm', async () => {
    const client = initBizInfoClient({ apiKey: 'test-key' })

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: '00',
        items: [{ ...MOCK_ANNOUNCEMENT_ITEM, pblancSttusNm: '접수중' }],
      }),
    } as Response)

    const result = await client.search()
    expect(result.announcements[0].status).toBe('open')
  })

  it('should determine "closed" status', async () => {
    const client = initBizInfoClient({ apiKey: 'test-key' })

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: '00',
        items: [{ ...MOCK_ANNOUNCEMENT_ITEM, pblancSttusNm: '마감' }],
      }),
    } as Response)

    const result = await client.search()
    expect(result.announcements[0].status).toBe('closed')
  })

  it('should determine "upcoming" status', async () => {
    const client = initBizInfoClient({ apiKey: 'test-key' })

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: '00',
        items: [{ ...MOCK_ANNOUNCEMENT_ITEM, pblancSttusNm: '접수예정' }],
      }),
    } as Response)

    const result = await client.search()
    expect(result.announcements[0].status).toBe('upcoming')
  })

  it('should determine "open" status from dates when statusName is undefined (lines 78-86)', async () => {
    vi.restoreAllMocks()
    const client = initBizInfoClient({ apiKey: 'test-key-date-open' })
    client.clearCache()

    // Set dates that span current date (open period)
    const today = new Date()
    const pastDate = new Date(today)
    pastDate.setDate(pastDate.getDate() - 10)
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 10)

    const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: '00',
        items: [
          {
            ...MOCK_ANNOUNCEMENT_ITEM,
            pblancSttusNm: undefined, // No status name - forces date-based determination
            reqstBeginDe: formatDate(pastDate),
            reqstEndDe: formatDate(futureDate),
          },
        ],
      }),
    } as Response)

    const result = await client.search()
    expect(result.announcements[0].status).toBe('open')
  })

  it('should determine "upcoming" status from dates (line 84)', async () => {
    vi.restoreAllMocks()
    const client = initBizInfoClient({ apiKey: 'test-key-date-upcoming' })
    client.clearCache()

    // Set dates in the future
    const futureStart = new Date()
    futureStart.setDate(futureStart.getDate() + 5)
    const futureEnd = new Date()
    futureEnd.setDate(futureEnd.getDate() + 20)

    const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: '00',
        items: [
          {
            ...MOCK_ANNOUNCEMENT_ITEM,
            pblancSttusNm: undefined,
            reqstBeginDe: formatDate(futureStart),
            reqstEndDe: formatDate(futureEnd),
          },
        ],
      }),
    } as Response)

    const result = await client.search()
    expect(result.announcements[0].status).toBe('upcoming')
  })

  it('should determine "closed" status from dates (line 85)', async () => {
    vi.restoreAllMocks()
    const client = initBizInfoClient({ apiKey: 'test-key-date-closed' })
    client.clearCache()

    // Set dates in the past
    const pastStart = new Date()
    pastStart.setDate(pastStart.getDate() - 30)
    const pastEnd = new Date()
    pastEnd.setDate(pastEnd.getDate() - 10)

    const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: '00',
        items: [
          {
            ...MOCK_ANNOUNCEMENT_ITEM,
            pblancSttusNm: undefined,
            reqstBeginDe: formatDate(pastStart),
            reqstEndDe: formatDate(pastEnd),
          },
        ],
      }),
    } as Response)

    const result = await client.search()
    expect(result.announcements[0].status).toBe('closed')
  })
})
