/**
 * K-Startup API Client
 *
 * 창업진흥원 K-Startup 공고 API 클라이언트
 * - 창업 지원사업 공고 검색
 * - 캐싱 및 에러 핸들링
 * - Mock 폴백 지원
 *
 * @module data-sources/kstartup
 */

import type {
  KStartupClientConfig,
  KStartupSearchParams,
  KStartupSearchResult,
  KStartupRawAnnouncement,
  NormalizedKStartupAnnouncement,
  NormalizedKStartupStatus,
} from './types'
import { logger } from '@/lib/api/logger'

// ============================================================
// 기본 설정
// ============================================================

const DEFAULT_CONFIG: Required<KStartupClientConfig> = {
  apiKey: process.env.K_STARTUP_API_KEY || '',
  baseUrl: 'https://www.k-startup.go.kr/api',
  timeout: 10000,
  cacheTtl: 5 * 60 * 1000, // 5분
  debug: process.env.NODE_ENV === 'development',
}

// ============================================================
// Mock 데이터 (API 키 없을 때 사용)
// ============================================================

const MOCK_ANNOUNCEMENTS: KStartupRawAnnouncement[] = [
  {
    pbancSn: 'KS-2026-001',
    pbancNm: '2026년 창업성장기술개발사업(디딤돌) 신규과제 공고',
    jrsdInsttNm: '중소벤처기업부',
    bizNm: '창업성장기술개발사업',
    pbancStts: '접수중',
    rcptBgngDt: '2026-01-15',
    rcptEndDt: '2026-02-28',
    pbancDt: '2026-01-10',
    sprtFld: 'RND',
    sprtScale: '최대 3억원 (2년)',
    sprtAmt: 300000000,
    techFld: 'AI',
    strtpYear: 'Y1_3',
    invstStage: 'SEED',
    region: '전국',
    dtlUrl: 'https://www.k-startup.go.kr/board/view/KS-2026-001',
  },
  {
    pbancSn: 'KS-2026-002',
    pbancNm: '2026년 글로벌 스타트업 육성 프로그램',
    jrsdInsttNm: '창업진흥원',
    bizNm: '글로벌 스타트업 육성',
    pbancStts: '접수중',
    rcptBgngDt: '2026-01-20',
    rcptEndDt: '2026-03-15',
    pbancDt: '2026-01-18',
    sprtFld: 'OVERSEAS',
    sprtScale: '해외 진출 지원금 5천만원 + 멘토링',
    sprtAmt: 50000000,
    techFld: 'PLATFORM',
    strtpYear: 'Y3_7',
    invstStage: 'SERIES_A',
    region: '전국',
    dtlUrl: 'https://www.k-startup.go.kr/board/view/KS-2026-002',
  },
  {
    pbancSn: 'KS-2026-003',
    pbancNm: '2026년 예비창업패키지 참여자 모집',
    jrsdInsttNm: '창업진흥원',
    bizNm: '예비창업패키지',
    pbancStts: '접수예정',
    rcptBgngDt: '2026-02-01',
    rcptEndDt: '2026-03-31',
    pbancDt: '2026-01-22',
    sprtFld: 'FUNDING',
    sprtScale: '최대 1억원',
    sprtAmt: 100000000,
    techFld: 'AI',
    strtpYear: 'PREP',
    region: '전국',
    dtlUrl: 'https://www.k-startup.go.kr/board/view/KS-2026-003',
  },
  {
    pbancSn: 'KS-2026-004',
    pbancNm: '2026년 TIPS 프로그램 연중 상시 접수',
    jrsdInsttNm: '중소벤처기업부',
    bizNm: 'TIPS',
    pbancStts: '접수중',
    rcptBgngDt: '2026-01-01',
    rcptEndDt: '2026-12-31',
    pbancDt: '2025-12-20',
    sprtFld: 'RND',
    sprtScale: 'R&D 5억 + 창업사업화 1억',
    sprtAmt: 600000000,
    techFld: 'AI',
    strtpYear: 'Y1_3',
    invstStage: 'SEED',
    region: '전국',
    dtlUrl: 'https://www.k-startup.go.kr/board/view/KS-2026-004',
  },
  {
    pbancSn: 'KS-2026-005',
    pbancNm: '2026년 스마트공장 구축 지원사업',
    jrsdInsttNm: '중소벤처기업진흥공단',
    bizNm: '스마트공장 구축',
    pbancStts: '접수중',
    rcptBgngDt: '2026-01-10',
    rcptEndDt: '2026-02-20',
    pbancDt: '2026-01-05',
    sprtFld: 'TECH_COMMERC',
    sprtScale: '최대 1.5억원 (50% 지원)',
    sprtAmt: 150000000,
    techFld: 'MANUFACTURING',
    strtpYear: 'Y3_7',
    region: '전국',
    dtlUrl: 'https://www.k-startup.go.kr/board/view/KS-2026-005',
  },
]

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 날짜 문자열 파싱
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? null : parsed
}

/**
 * D-Day 계산
 */
function calculateDDay(endDate: Date | null): number | null {
  if (!endDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = endDate.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * 상태 정규화
 */
function normalizeStatus(status: string): NormalizedKStartupStatus {
  switch (status) {
    case '접수중':
      return 'open'
    case '접수예정':
      return 'upcoming'
    case '접수마감':
    default:
      return 'closed'
  }
}

/**
 * 원본 데이터를 정규화된 형식으로 변환
 */
function normalizeAnnouncement(
  raw: KStartupRawAnnouncement
): NormalizedKStartupAnnouncement {
  const endDate = parseDate(raw.rcptEndDt)

  return {
    id: `kstartup-${raw.pbancSn}`,
    platform: 'kstartup',
    title: raw.pbancNm,
    agency: raw.jrsdInsttNm,
    businessName: raw.bizNm,
    status: normalizeStatus(raw.pbancStts),
    startDate: parseDate(raw.rcptBgngDt),
    endDate,
    announcementDate: parseDate(raw.pbancDt),
    dDay: calculateDDay(endDate),
    supportField: raw.sprtFld,
    supportScale: raw.sprtScale,
    supportAmount: raw.sprtAmt,
    techField: raw.techFld,
    startupYear: raw.strtpYear,
    investmentStage: raw.invstStage,
    region: raw.region,
    detailUrl: raw.dtlUrl,
    attachmentUrl: raw.atchFileUrl,
    rawData: raw,
  }
}

// ============================================================
// 캐시
// ============================================================

interface CacheEntry {
  data: KStartupSearchResult
  timestamp: number
}

const cache = new Map<string, CacheEntry>()

function getCacheKey(params: KStartupSearchParams): string {
  return JSON.stringify(params)
}

function getFromCache(
  key: string,
  ttl: number
): KStartupSearchResult | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key: string, data: KStartupSearchResult): void {
  cache.set(key, { data, timestamp: Date.now() })
}

// ============================================================
// K-Startup 클라이언트 클래스
// ============================================================

export class KStartupClient {
  private config: Required<KStartupClientConfig>

  constructor(config: KStartupClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 공고 검색
   */
  async search(
    params: KStartupSearchParams = {}
  ): Promise<KStartupSearchResult> {
    const cacheKey = getCacheKey(params)

    // 캐시 확인
    const cached = getFromCache(cacheKey, this.config.cacheTtl)
    if (cached) {
      if (this.config.debug) {
        logger.debug('[KStartup] Cache hit:', cacheKey)
      }
      return cached
    }

    // API 키가 없으면 Mock 데이터 반환
    if (!this.config.apiKey) {
      if (this.config.debug) {
        logger.debug('[KStartup] No API key, using mock data')
      }
      return this.getMockResult(params)
    }

    try {
      const result = await this.fetchFromApi(params)
      setCache(cacheKey, result)
      return result
    } catch (error) {
      if (this.config.debug) {
        logger.error('[KStartup] API error, falling back to mock:', error)
      }
      // 에러 시 Mock 폴백
      return this.getMockResult(params)
    }
  }

  /**
   * API에서 데이터 조회
   */
  private async fetchFromApi(
    params: KStartupSearchParams
  ): Promise<KStartupSearchResult> {
    const url = new URL(`${this.config.baseUrl}/announcements`)

    // 쿼리 파라미터 설정
    if (params.keyword) url.searchParams.set('keyword', params.keyword)
    if (params.page) url.searchParams.set('page', params.page.toString())
    if (params.pageSize) url.searchParams.set('pageSize', params.pageSize.toString())
    if (params.supportField) url.searchParams.set('supportField', params.supportField)
    if (params.startupYear) url.searchParams.set('startupYear', params.startupYear)
    if (params.investmentStage) url.searchParams.set('investmentStage', params.investmentStage)
    if (params.techField) url.searchParams.set('techField', params.techField)
    if (params.region) url.searchParams.set('region', params.region)
    if (params.beforeDeadline) url.searchParams.set('beforeDeadline', 'true')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`K-Startup API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // 응답 정규화
      const announcements = (data.items || []).map(normalizeAnnouncement)

      return {
        announcements,
        totalCount: data.totalCount || announcements.length,
        currentPage: data.currentPage || params.page || 1,
        totalPages: data.totalPages || 1,
        fetchedAt: new Date(),
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Mock 결과 반환
   */
  private getMockResult(params: KStartupSearchParams): KStartupSearchResult {
    let filtered = [...MOCK_ANNOUNCEMENTS]

    // 키워드 필터
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.pbancNm.toLowerCase().includes(keyword) ||
          a.bizNm?.toLowerCase().includes(keyword) ||
          a.jrsdInsttNm.toLowerCase().includes(keyword)
      )
    }

    // 지원분야 필터
    if (params.supportField) {
      filtered = filtered.filter((a) => a.sprtFld === params.supportField)
    }

    // 기술분야 필터
    if (params.techField) {
      filtered = filtered.filter((a) => a.techFld === params.techField)
    }

    // 창업연차 필터
    if (params.startupYear) {
      filtered = filtered.filter((a) => a.strtpYear === params.startupYear)
    }

    // 투자단계 필터
    if (params.investmentStage) {
      filtered = filtered.filter((a) => a.invstStage === params.investmentStage)
    }

    // 마감 전 필터
    if (params.beforeDeadline) {
      const today = new Date()
      filtered = filtered.filter((a) => {
        const endDate = parseDate(a.rcptEndDt)
        return endDate && endDate >= today
      })
    }

    // 페이지네이션
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const start = (page - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)

    return {
      announcements: paged.map(normalizeAnnouncement),
      totalCount: filtered.length,
      currentPage: page,
      totalPages: Math.ceil(filtered.length / pageSize),
      fetchedAt: new Date(),
    }
  }

  /**
   * 특정 공고 상세 조회
   */
  async getDetail(announcementId: string): Promise<NormalizedKStartupAnnouncement | null> {
    // Mock에서 먼저 찾기
    const mockItem = MOCK_ANNOUNCEMENTS.find(
      (a) => a.pbancSn === announcementId || `kstartup-${a.pbancSn}` === announcementId
    )

    if (mockItem) {
      return normalizeAnnouncement(mockItem)
    }

    // API 키 있으면 API 호출
    if (this.config.apiKey) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        const response = await fetch(
          `${this.config.baseUrl}/announcements/${announcementId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          }
        )

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          return normalizeAnnouncement(data)
        }
      } catch (error) {
        if (this.config.debug) {
          logger.error('[KStartup] Detail fetch error:', error)
        }
      }
    }

    return null
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    cache.clear()
  }
}

// ============================================================
// 기본 인스턴스 내보내기
// ============================================================

export const kstartupClient = new KStartupClient()

// 기본 검색 함수 (편의용)
export async function searchKStartup(
  params?: KStartupSearchParams
): Promise<KStartupSearchResult> {
  return kstartupClient.search(params)
}
