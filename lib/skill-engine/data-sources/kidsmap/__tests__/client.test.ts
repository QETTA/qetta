/**
 * KidsMap 클라이언트 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  KidsMapClient,
  initKidsMapClient,
  PLACE_CATEGORIES,
  TOUR_API_AREA_CODES,
  KidsMapApiError,
  KIDSMAP_ERROR_CODES,
} from '../index'

import type { NormalizedPlace, KidsMapSearchResult } from '../types'

// ============================================
// 모킹
// ============================================

const mockTourApiResponse = {
  response: {
    header: {
      resultCode: '0000',
      resultMsg: 'OK',
    },
    body: {
      items: {
        item: [
          {
            contentid: '12345',
            contenttypeid: '12',
            title: '에버랜드',
            addr1: '경기도 용인시',
            areacode: '31',
            cat2: 'A0205',
            firstimage: 'https://example.com/image.jpg',
            mapx: '127.2',
            mapy: '37.3',
            tel: '031-123-4567',
          },
          {
            contentid: '67890',
            contenttypeid: '14',
            title: '서울대공원',
            addr1: '경기도 과천시',
            areacode: '31',
            cat2: 'A0104',
            firstimage: 'https://example.com/zoo.jpg',
            mapx: '127.0',
            mapy: '37.4',
          },
        ],
      },
      numOfRows: 10,
      pageNo: 1,
      totalCount: 2,
    },
  },
}

const mockPlaygroundApiResponse = {
  response: {
    header: {
      resultCode: '00',
      resultMsg: '정상',
    },
    body: {
      items: {
        item: [
          {
            pfctSn: 'P001',
            pfctNm: '플레이존 키즈카페',
            locCd: '08',
            locNm: '놀이제공영업소',
            sidoCd: '11',
            sidoNm: '서울특별시',
            ronaAddr: '서울시 강남구 역삼동 123',
            lat: '37.5',
            lot: '127.0',
          },
        ],
      },
      numOfRows: 10,
      pageNo: 1,
      totalCount: 1,
    },
  },
}

// ============================================
// 테스트
// ============================================

describe('KidsMapClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  describe('초기화', () => {
    it('API 키 없이 초기화 시 클라이언트가 null', () => {
      const client = new KidsMapClient()
      const sources = client.getAvailableSources()

      expect(sources.tourApi).toBe(false)
      expect(sources.playgroundApi).toBe(false)
    })

    it('TourAPI 키로 초기화', () => {
      const client = new KidsMapClient({ tourApiKey: 'test-key' })
      const sources = client.getAvailableSources()

      expect(sources.tourApi).toBe(true)
      expect(sources.playgroundApi).toBe(false)
    })

    it('PlaygroundAPI 키로 초기화', () => {
      const client = new KidsMapClient({ playgroundApiKey: 'test-key' })
      const sources = client.getAvailableSources()

      expect(sources.tourApi).toBe(false)
      expect(sources.playgroundApi).toBe(true)
    })

    it('양쪽 API 키로 초기화', () => {
      const client = new KidsMapClient({
        tourApiKey: 'tour-key',
        playgroundApiKey: 'playground-key',
      })
      const sources = client.getAvailableSources()

      expect(sources.tourApi).toBe(true)
      expect(sources.playgroundApi).toBe(true)
    })
  })

  describe('TourAPI 검색', () => {
    it('테마파크 검색', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTourApiResponse),
      })
      vi.stubGlobal('fetch', mockFetch)

      const client = initKidsMapClient({ tourApiKey: 'test-key' })
      const result = await client.searchThemeParks({ areaCode: TOUR_API_AREA_CODES.GYEONGGI })

      expect(result.places.length).toBeGreaterThan(0)
      expect(mockFetch).toHaveBeenCalled()
    })

    it('위치 기반 검색', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTourApiResponse),
      })
      vi.stubGlobal('fetch', mockFetch)

      const client = initKidsMapClient({ tourApiKey: 'test-key' })
      const result = await client.searchNearby(37.5665, 126.9780, 5000)

      expect(result.places).toBeDefined()
      expect(mockFetch).toHaveBeenCalled()

      // URL에 위치 정보가 포함되어 있는지 확인
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('mapX')
      expect(url).toContain('mapY')
      expect(url).toContain('radius')
    })

    it('키워드 검색', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTourApiResponse),
      })
      vi.stubGlobal('fetch', mockFetch)

      const client = initKidsMapClient({ tourApiKey: 'test-key' })
      const result = await client.searchByKeyword('에버랜드')

      expect(result.places).toBeDefined()
      expect(mockFetch).toHaveBeenCalled()
    })

    it('TourAPI 없이 테마파크 검색 시 에러', async () => {
      const client = new KidsMapClient({ playgroundApiKey: 'test-key' })

      await expect(client.searchThemeParks()).rejects.toThrow(KidsMapApiError)
    })
  })

  describe('PlaygroundAPI 검색', () => {
    it('키즈카페 검색', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPlaygroundApiResponse),
      })
      vi.stubGlobal('fetch', mockFetch)

      const client = initKidsMapClient({ playgroundApiKey: 'test-key' })
      const result = await client.searchKidsCafes({ sidoCode: '11' })

      expect(result.places.length).toBe(1)
      expect(result.places[0].category).toBe(PLACE_CATEGORIES.KIDS_CAFE)
    })

    it('어린이공원 검색', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPlaygroundApiResponse),
      })
      vi.stubGlobal('fetch', mockFetch)

      const client = initKidsMapClient({ playgroundApiKey: 'test-key' })
      const result = await client.searchChildrenParks()

      expect(result.places).toBeDefined()
    })

    it('PlaygroundAPI 없이 키즈카페 검색 시 에러', async () => {
      const client = new KidsMapClient({ tourApiKey: 'test-key' })

      await expect(client.searchKidsCafes()).rejects.toThrow(KidsMapApiError)
    })
  })

  describe('통합 검색', () => {
    it('여러 카테고리 동시 검색', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTourApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTourApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPlaygroundApiResponse),
        })
      vi.stubGlobal('fetch', mockFetch)

      const client = initKidsMapClient({
        tourApiKey: 'tour-key',
        playgroundApiKey: 'playground-key',
      })

      const result = await client.search({
        categories: [PLACE_CATEGORIES.AMUSEMENT_PARK, PLACE_CATEGORIES.KIDS_CAFE],
        areaCode: TOUR_API_AREA_CODES.SEOUL,
      })

      expect(result.places).toBeDefined()
      expect(result.totalCount).toBeGreaterThan(0)
    })
  })

  describe('헬스체크', () => {
    it('API 상태 확인', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTourApiResponse),
      })
      vi.stubGlobal('fetch', mockFetch)

      const client = initKidsMapClient({ tourApiKey: 'test-key' })
      const health = await client.healthCheck()

      expect(health.tourApi).toBe(true)
      expect(health.playgroundApi).toBe(false)
    })
  })

  describe('캐시', () => {
    it('캐시 클리어', () => {
      const client = new KidsMapClient({
        tourApiKey: 'tour-key',
        playgroundApiKey: 'playground-key',
      })

      // 에러 없이 실행되어야 함
      expect(() => client.clearCache()).not.toThrow()
    })
  })
})

describe('정규화된 장소 데이터', () => {
  it('NormalizedPlace 구조 검증', () => {
    const place: NormalizedPlace = {
      id: 'test-123',
      source: 'TOUR_API',
      sourceUrl: 'https://example.com',
      fetchedAt: new Date().toISOString(),
      name: '테스트 장소',
      category: PLACE_CATEGORIES.AMUSEMENT_PARK,
      address: '서울시 강남구',
      latitude: 37.5,
      longitude: 127.0,
      recommendedAges: ['toddler', 'child'],
      amenities: {
        strollerAccess: true,
        parking: true,
      },
      rawData: {},
    }

    expect(place.id).toBeDefined()
    expect(place.source).toBe('TOUR_API')
    expect(place.category).toBe('amusement_park')
    expect(place.recommendedAges).toContain('toddler')
    expect(place.amenities?.strollerAccess).toBe(true)
  })
})

describe('에러 처리', () => {
  it('KidsMapApiError 생성', () => {
    const error = new KidsMapApiError(
      '테스트 에러',
      KIDSMAP_ERROR_CODES.NETWORK_ERROR,
      500
    )

    expect(error.name).toBe('KidsMapApiError')
    expect(error.message).toBe('테스트 에러')
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.statusCode).toBe(500)
  })
})
