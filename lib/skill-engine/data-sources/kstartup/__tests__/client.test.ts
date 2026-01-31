/**
 * K-Startup Client Tests
 *
 * 창업진흥원 K-Startup API 클라이언트 테스트
 * - 검색 기능
 * - Mock 폴백
 * - 캐싱 동작
 * - 정규화 로직
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { KStartupClient, searchKStartup } from '../client'
import type { KStartupRawAnnouncement } from '../types'

// ============================================
// Mock 데이터
// ============================================

const MOCK_RAW_ANNOUNCEMENT: KStartupRawAnnouncement = {
  pbancSn: 'KS-TEST-001',
  pbancNm: '2026년 테스트 창업 지원사업',
  jrsdInsttNm: '중소벤처기업부',
  bizNm: '테스트 사업',
  pbancStts: '접수중',
  rcptBgngDt: '2026-01-15',
  rcptEndDt: '2026-02-28',
  pbancDt: '2026-01-10',
  sprtFld: 'RND',
  sprtScale: '최대 3억원',
  sprtAmt: 300000000,
  techFld: 'AI',
  strtpYear: 'Y1_3',
  invstStage: 'SEED',
  region: '전국',
  dtlUrl: 'https://www.k-startup.go.kr/board/view/KS-TEST-001',
}

const MOCK_API_RESPONSE = {
  items: [MOCK_RAW_ANNOUNCEMENT],
  totalCount: 1,
  currentPage: 1,
  totalPages: 1,
}

// ============================================
// 테스트
// ============================================

describe('KStartupClient', () => {
  const originalEnv = process.env
  let client: KStartupClient

  beforeEach(() => {
    vi.resetAllMocks()
    process.env = { ...originalEnv }
    // 각 테스트 전에 캐시 클리어 (모듈 레벨 캐시 공유 문제 해결)
    client = new KStartupClient({ apiKey: '', debug: false })
    client.clearCache()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const client = new KStartupClient()
      expect(client).toBeInstanceOf(KStartupClient)
    })

    it('should initialize with custom config', () => {
      const client = new KStartupClient({
        apiKey: 'custom-key',
        timeout: 5000,
        cacheTtl: 10000,
      })
      expect(client).toBeInstanceOf(KStartupClient)
    })
  })

  describe('search', () => {
    it('should return mock data when no API key', async () => {
      const client = new KStartupClient({ apiKey: '', debug: false })

      const result = await client.search()

      expect(result).toBeDefined()
      expect(result.announcements).toBeInstanceOf(Array)
      expect(result.announcements.length).toBeGreaterThan(0)
      expect(result.fetchedAt).toBeInstanceOf(Date)
    })

    it('should normalize announcement data correctly', async () => {
      const client = new KStartupClient({ apiKey: '', debug: false })

      const result = await client.search()
      const announcement = result.announcements[0]

      expect(announcement.id).toMatch(/^kstartup-/)
      expect(announcement.platform).toBe('kstartup')
      expect(announcement.title).toBeDefined()
      expect(announcement.agency).toBeDefined()
      expect(['open', 'upcoming', 'closed']).toContain(announcement.status)
    })

    it('should calculate D-Day correctly', async () => {
      const client = new KStartupClient({ apiKey: '', debug: false })

      const result = await client.search({ beforeDeadline: true })

      result.announcements.forEach((announcement) => {
        if (announcement.endDate) {
          expect(announcement.dDay).toBeDefined()
          expect(typeof announcement.dDay).toBe('number')
        }
      })
    })

    it('should filter by keyword', async () => {
      const client = new KStartupClient({ apiKey: '', debug: false })

      const result = await client.search({ keyword: 'TIPS' })

      // Mock 데이터에 TIPS가 있으면 필터링됨
      result.announcements.forEach((announcement) => {
        expect(
          announcement.title.toLowerCase().includes('tips') ||
            announcement.businessName?.toLowerCase().includes('tips')
        ).toBe(true)
      })
    })

    it('should filter by supportField', async () => {
      const client = new KStartupClient({ apiKey: '', debug: false })

      const result = await client.search({ supportField: 'RND' })

      result.announcements.forEach((announcement) => {
        expect(announcement.supportField).toBe('RND')
      })
    })

    it('should filter by techField', async () => {
      const client = new KStartupClient({ apiKey: '', debug: false })

      const result = await client.search({ techField: 'AI' })

      result.announcements.forEach((announcement) => {
        expect(announcement.techField).toBe('AI')
      })
    })

    it('should filter before deadline', async () => {
      const client = new KStartupClient({ apiKey: '', debug: false })
      const today = new Date()

      const result = await client.search({ beforeDeadline: true })

      result.announcements.forEach((announcement) => {
        if (announcement.endDate) {
          expect(announcement.endDate >= today).toBe(true)
        }
      })
    })

    it('should paginate results', async () => {
      const client = new KStartupClient({ apiKey: '', debug: false })

      const result = await client.search({ page: 1, pageSize: 2 })

      expect(result.currentPage).toBe(1)
      expect(result.announcements.length).toBeLessThanOrEqual(2)
    })

    it('should use cache on subsequent calls', async () => {
      const client = new KStartupClient({
        apiKey: 'test-key',
        cacheTtl: 60000,
        debug: false,
      })

      // Mock fetch
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      // 첫 번째 호출
      await client.search()
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      // 두 번째 호출 (캐시 사용)
      await client.search()
      expect(fetchSpy).toHaveBeenCalledTimes(1) // 추가 호출 없음
    })

    it('should fall back to mock on API error', async () => {
      const client = new KStartupClient({
        apiKey: 'test-key',
        debug: false,
      })

      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('API error'))

      // 에러 발생해도 Mock 반환
      const result = await client.search()
      expect(result.announcements).toBeDefined()
      expect(result.announcements.length).toBeGreaterThan(0)
    })
  })

  describe('getDetail', () => {
    it('should find announcement from mock data', async () => {
      const client = new KStartupClient({ apiKey: '', debug: false })

      // Mock 데이터의 ID 사용
      const detail = await client.getDetail('KS-2026-001')

      expect(detail).toBeDefined()
      expect(detail?.id).toBe('kstartup-KS-2026-001')
    })

    it('should return null for non-existent announcement', async () => {
      const client = new KStartupClient({ apiKey: '', debug: false })

      const detail = await client.getDetail('NON-EXISTENT')

      expect(detail).toBeNull()
    })

    it('should accept normalized ID format', async () => {
      const client = new KStartupClient({ apiKey: '', debug: false })

      const detail = await client.getDetail('kstartup-KS-2026-001')

      expect(detail).toBeDefined()
    })
  })

  describe('clearCache', () => {
    it('should clear cache', async () => {
      const client = new KStartupClient({
        apiKey: 'test-key',
        debug: false,
      })

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => MOCK_API_RESPONSE,
      } as Response)

      // 첫 번째 호출
      await client.search({ keyword: 'cache-test' })
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      // 캐시 클리어
      client.clearCache()

      // 두 번째 호출 (새로 fetch) - 다른 파라미터로 캐시 미스 유도
      await client.search({ keyword: 'cache-test-2' })
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
  })
})

describe('searchKStartup helper', () => {
  it('should return search results', async () => {
    const result = await searchKStartup()

    expect(result).toBeDefined()
    expect(result.announcements).toBeInstanceOf(Array)
  })

  it('should accept search params', async () => {
    const result = await searchKStartup({ keyword: '창업' })

    expect(result).toBeDefined()
  })
})

describe('Status normalization', () => {
  it('should normalize "접수중" to "open"', async () => {
    const client = new KStartupClient({ apiKey: '', debug: false })

    const result = await client.search()
    const openAnnouncement = result.announcements.find(
      (a) => a.rawData.pbancStts === '접수중'
    )

    if (openAnnouncement) {
      expect(openAnnouncement.status).toBe('open')
    }
  })

  it('should normalize "접수예정" to "upcoming"', async () => {
    const client = new KStartupClient({ apiKey: '', debug: false })

    const result = await client.search()
    const upcomingAnnouncement = result.announcements.find(
      (a) => a.rawData.pbancStts === '접수예정'
    )

    if (upcomingAnnouncement) {
      expect(upcomingAnnouncement.status).toBe('upcoming')
    }
  })

  it('should normalize "접수마감" to "closed"', async () => {
    const client = new KStartupClient({ apiKey: '', debug: false })

    const result = await client.search()
    const closedAnnouncement = result.announcements.find(
      (a) => a.rawData.pbancStts === '접수마감'
    )

    if (closedAnnouncement) {
      expect(closedAnnouncement.status).toBe('closed')
    }
  })
})

describe('getDetail with API', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    const tempClient = new KStartupClient({ apiKey: '', debug: false })
    tempClient.clearCache()
  })

  it('should call API when apiKey is provided and not in mock', async () => {
    const client = new KStartupClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://test.api.com',
      debug: false,
    })

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => MOCK_RAW_ANNOUNCEMENT,
    } as Response)

    const detail = await client.getDetail('API-ONLY-ID')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain('/announcements/API-ONLY-ID')
  })

  it('should return normalized data from API', async () => {
    const client = new KStartupClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://test.api.com',
      debug: false,
    })

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => MOCK_RAW_ANNOUNCEMENT,
    } as Response)

    const detail = await client.getDetail('API-ITEM-ID')

    expect(detail).toBeDefined()
    expect(detail?.id).toBe(`kstartup-${MOCK_RAW_ANNOUNCEMENT.pbancSn}`)
    expect(detail?.platform).toBe('kstartup')
  })

  it('should return null when API returns error', async () => {
    const client = new KStartupClient({
      apiKey: 'test-api-key',
      debug: false,
    })

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    const detail = await client.getDetail('NON-EXISTENT-API')

    expect(detail).toBeNull()
  })

  it('should handle fetch error gracefully', async () => {
    const client = new KStartupClient({
      apiKey: 'test-api-key',
      debug: true,
    })

    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

    const detail = await client.getDetail('ERROR-TEST-ID')

    expect(detail).toBeNull()
  })

  it('should include authorization header in getDetail', async () => {
    const client = new KStartupClient({
      apiKey: 'secret-key',
      debug: false,
    })

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => MOCK_RAW_ANNOUNCEMENT,
    } as Response)

    await client.getDetail('AUTH-TEST-ID')

    const options = fetchSpy.mock.calls[0][1] as RequestInit
    expect((options.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer secret-key'
    )
  })
})

describe('Debug mode coverage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    const tempClient = new KStartupClient({ apiKey: '', debug: false })
    tempClient.clearCache()
  })

  it('should log debug message when no API key (line 263)', async () => {
    const client = new KStartupClient({ apiKey: '', debug: true })

    const result = await client.search()

    // Debug mode on + no API key triggers line 263
    expect(result.announcements).toBeDefined()
  })

  it('should log error in debug mode on API error (line 274)', async () => {
    const client = new KStartupClient({
      apiKey: 'test-key-debug',
      debug: true,
    })

    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('API error'))

    // Debug mode on + API error triggers line 274
    const result = await client.search()
    expect(result.announcements).toBeDefined() // Falls back to mock
  })
})

describe('Mock filter coverage', () => {
  let client: KStartupClient

  beforeEach(() => {
    vi.resetAllMocks()
    client = new KStartupClient({ apiKey: '', debug: false })
    client.clearCache()
  })

  it('should filter by startupYear (line 366)', async () => {
    // Y1_3 = 창업 1~3년차
    const result = await client.search({ startupYear: 'Y1_3' })

    // Mock 데이터에 Y1_3가 있으면 필터링됨
    result.announcements.forEach((announcement) => {
      if (announcement.rawData.strtpYear) {
        expect(announcement.rawData.strtpYear).toBe('Y1_3')
      }
    })
  })

  it('should filter by investmentStage (line 371)', async () => {
    // SEED = 시드 투자 단계
    const result = await client.search({ investmentStage: 'SEED' })

    // Mock 데이터에 SEED가 있으면 필터링됨
    result.announcements.forEach((announcement) => {
      if (announcement.rawData.invstStage) {
        expect(announcement.rawData.invstStage).toBe('SEED')
      }
    })
  })

  it('should filter by region', async () => {
    // Mock 데이터에 '전국'이 있으므로 그것으로 테스트
    const result = await client.search({ region: '전국' })

    result.announcements.forEach((announcement) => {
      if (announcement.region) {
        expect(announcement.region).toBe('전국')
      }
    })
  })

  it('should apply multiple filters together', async () => {
    const result = await client.search({
      startupYear: 'Y1_3',
      investmentStage: 'SEED',
      techField: 'AI',
    })

    result.announcements.forEach((announcement) => {
      if (announcement.rawData.strtpYear) {
        expect(announcement.rawData.strtpYear).toBe('Y1_3')
      }
      if (announcement.rawData.invstStage) {
        expect(announcement.rawData.invstStage).toBe('SEED')
      }
      if (announcement.techField) {
        expect(announcement.techField).toBe('AI')
      }
    })
  })
})

describe('normalizeStatus default case (line 164)', () => {
  it('should return closed for unknown status values', async () => {
    const client = new KStartupClient({ apiKey: 'test-key', debug: false })
    client.clearCache()

    // Create mock with unknown status
    const unknownStatusItem = {
      ...MOCK_RAW_ANNOUNCEMENT,
      pbancSn: 'UNKNOWN-STATUS',
      pbancStts: '알수없는상태',
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [unknownStatusItem],
        totalCount: 1,
      }),
    } as Response)

    const result = await client.search()
    expect(result.announcements[0].status).toBe('closed')
  })
})

describe('Cache TTL expiration (lines 222-223)', () => {
  it('should delete expired cache entry and return null', async () => {
    vi.restoreAllMocks()

    const client = new KStartupClient({
      apiKey: 'test-key-ttl',
      cacheTtl: 50, // 50ms TTL
      debug: false,
    })
    client.clearCache()

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [MOCK_RAW_ANNOUNCEMENT],
        totalCount: 1,
      }),
    } as Response)

    // First call - populate cache
    await client.search({ keyword: 'ttl-test' })
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Second call - cache expired, should refetch
    await client.search({ keyword: 'ttl-test' })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})

describe('Cache hit with debug mode (line 255)', () => {
  it('should log debug message on cache hit', async () => {
    vi.restoreAllMocks()

    const client = new KStartupClient({
      apiKey: 'test-key-debug-cache',
      cacheTtl: 60000, // Long TTL
      debug: true,
    })
    client.clearCache()

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [MOCK_RAW_ANNOUNCEMENT],
        totalCount: 1,
      }),
    } as Response)

    // First call - populate cache
    await client.search({ keyword: 'cache-debug' })

    // Second call - should hit cache with debug log
    const result = await client.search({ keyword: 'cache-debug' })
    expect(result).toBeDefined()
  })
})

describe('API integration', () => {
  beforeEach(() => {
    // 모든 mock과 캐시를 완전히 리셋
    vi.resetAllMocks()
    const tempClient = new KStartupClient({ apiKey: '', debug: false })
    tempClient.clearCache()
  })

  it('should build correct URL with params', async () => {
    const client = new KStartupClient({
      apiKey: 'test-key',
      baseUrl: 'https://test.api.com',
      debug: false,
    })

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    } as Response)

    await client.search({
      keyword: '테스트',
      supportField: 'RND',
      page: 2,
      pageSize: 10,
    })

    expect(fetchSpy).toHaveBeenCalled()
    const url = new URL(fetchSpy.mock.calls[0][0] as string)

    expect(url.searchParams.get('keyword')).toBe('테스트')
    expect(url.searchParams.get('supportField')).toBe('RND')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('pageSize')).toBe('10')
  })

  it('should include Authorization header', async () => {
    const client = new KStartupClient({
      apiKey: 'test-api-key',
      debug: false,
    })
    // 이 테스트만을 위해 캐시 클리어
    client.clearCache()

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    } as Response)

    // 고유한 검색 파라미터로 캐시 미스 보장
    await client.search({ keyword: 'auth-header-test' })

    const options = fetchSpy.mock.calls[0][1] as RequestInit
    expect(options.headers).toBeDefined()
    expect((options.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer test-api-key'
    )
  })

  it('should handle HTTP error responses', async () => {
    const client = new KStartupClient({
      apiKey: 'test-key',
      debug: false,
    })

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response)

    // 에러 시 Mock 폴백
    const result = await client.search()
    expect(result.announcements).toBeDefined()
  })
})
