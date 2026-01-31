/**
 * 기업마당 (BizInfo) API 클라이언트
 *
 * @see https://www.bizinfo.go.kr/web/lay1/program/S1T175C174/apiDetail.do?id=bizinfoApi
 *
 * 핵심 원칙:
 * - API 우선, 크롤링은 fallback
 * - Rate limiting 준수 (초당 10회 이하)
 * - 에러 시 graceful degradation
 *
 * 환경변수:
 * - BIZINFO_API_KEY: 기업마당 API 인증키
 */

import type {
  BizInfoApiParams,
  BizInfoApiResponse,
  BizInfoAnnouncementItem,
  BizInfoClientConfig,
  BizInfoSearchFilters,
  BizInfoSearchResult,
  NormalizedBizInfoAnnouncement,
  BizInfoFieldCode,
} from './types'

import { BizInfoApiError, BIZINFO_ERROR_CODES } from './types'
import { logger } from '@/lib/api/logger'

// ============================================
// 상수
// ============================================

const BIZINFO_API_BASE_URL = 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do'

const DEFAULT_CONFIG: Omit<Required<BizInfoClientConfig>, 'apiKey'> = {
  defaultPageSize: 50,
  timeout: 10000,
  retryCount: 3,
  retryDelay: 1000,
  cacheTtlMinutes: 30,
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 날짜 문자열 파싱 (YYYYMMDD -> ISO)
 */
function parseDate(dateStr?: string): string | null {
  if (!dateStr || dateStr.length !== 8) return null
  try {
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return `${year}-${month}-${day}`
  } catch {
    return null
  }
}

/**
 * 접수 상태 판단
 */
function determineStatus(
  startDate?: string,
  endDate?: string,
  statusName?: string
): 'upcoming' | 'open' | 'closed' | 'unknown' {
  if (statusName) {
    if (statusName.includes('접수중') || statusName.includes('진행')) return 'open'
    if (statusName.includes('마감') || statusName.includes('종료')) return 'closed'
    if (statusName.includes('예정')) return 'upcoming'
  }

  if (!startDate || !endDate) return 'unknown'

  const now = new Date()
  const start = new Date(parseDate(startDate) || '')
  const end = new Date(parseDate(endDate) || '')

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'unknown'

  if (now < start) return 'upcoming'
  if (now > end) return 'closed'
  return 'open'
}

/**
 * 공고 아이템 정규화
 */
function normalizeAnnouncement(
  item: BizInfoAnnouncementItem,
  fetchedAt: string
): NormalizedBizInfoAnnouncement {
  const id = item.pblancId || `bizinfo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  return {
    id,
    source: 'BIZINFO',
    sourceUrl: item.link || item.detailPageUrl || BIZINFO_API_BASE_URL,
    fetchedAt,

    title: item.title || '제목 없음',
    agency: item.jrsdInsttNm || '기관 미상',
    executor: item.excInsttNm,
    receiver: item.rcptInsttNm,

    field: item.hashtags?.split(',')[0]?.trim() as BizInfoFieldCode | undefined,
    region: item.areaNm as NormalizedBizInfoAnnouncement['region'],

    applicationPeriod: {
      start: parseDate(item.reqstBeginDe),
      end: parseDate(item.reqstEndDe),
    },

    registeredAt: parseDate(item.registDe),
    status: determineStatus(item.reqstBeginDe, item.reqstEndDe, item.pblancSttusNm),

    targetDescription: item.trgetNm,
    supportDescription: item.sporCn,
    applicationMethod: item.reqstMthNm,
    attachmentUrl: item.atchFileUrl,

    rawData: item,
  }
}

// ============================================
// 메인 클라이언트 클래스
// ============================================

export class BizInfoClient {
  private config: Required<BizInfoClientConfig>
  private cache: Map<string, { data: BizInfoSearchResult; timestamp: number }> = new Map()

  constructor(config?: Partial<BizInfoClientConfig>) {
    const apiKey = config?.apiKey || process.env.BIZINFO_API_KEY

    if (!apiKey) {
      throw new BizInfoApiError(
        '기업마당 API 키가 설정되지 않았습니다. BIZINFO_API_KEY 환경변수를 확인하세요.',
        BIZINFO_ERROR_CODES.INVALID_API_KEY
      )
    }

    this.config = {
      apiKey,
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<BizInfoClientConfig>
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 지원사업 공고 검색
   */
  async search(filters?: BizInfoSearchFilters): Promise<BizInfoSearchResult> {
    const cacheKey = this.getCacheKey(filters)
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const params = this.buildParams(filters)
    const response = await this.fetchWithRetry(params)

    const fetchedAt = new Date().toISOString()
    const announcements = (response.items || []).map((item) =>
      normalizeAnnouncement(item, fetchedAt)
    )

    // activeOnly 필터 적용
    const filteredAnnouncements = filters?.activeOnly
      ? announcements.filter((a) => a.status === 'open')
      : announcements

    const result: BizInfoSearchResult = {
      announcements: filteredAnnouncements,
      totalCount: response.totalCount || filteredAnnouncements.length,
      currentPage: filters?.page || 1,
      totalPages: Math.ceil(
        (response.totalCount || filteredAnnouncements.length) /
          (filters?.pageSize || this.config.defaultPageSize)
      ),
      searchedAt: fetchedAt,
      fromCache: false,
    }

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * 단일 공고 조회 (ID로)
   */
  async getById(pblancId: string): Promise<NormalizedBizInfoAnnouncement | null> {
    // API에서 단일 조회 미지원 → 전체 검색 후 필터
    // 실제로는 상세 페이지 URL로 직접 접근 필요
    const result = await this.search({ pageSize: 500 })
    return result.announcements.find((a) => a.id === pblancId) || null
  }

  /**
   * 분야별 공고 조회
   */
  async getByField(field: BizInfoFieldCode, activeOnly = true): Promise<BizInfoSearchResult> {
    return this.search({
      fields: [field],
      activeOnly,
      pageSize: 100,
    })
  }

  /**
   * 지역별 공고 조회
   */
  async getByRegion(region: string, activeOnly = true): Promise<BizInfoSearchResult> {
    return this.search({
      keyword: region,
      activeOnly,
      pageSize: 100,
    })
  }

  /**
   * 접수 중인 공고만 조회
   */
  async getActive(pageSize = 50): Promise<BizInfoSearchResult> {
    return this.search({
      activeOnly: true,
      pageSize,
    })
  }

  /**
   * 키워드 검색
   */
  async searchByKeyword(keyword: string, pageSize = 50): Promise<BizInfoSearchResult> {
    return this.search({
      keyword,
      pageSize,
    })
  }

  /**
   * API 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.search({ pageSize: 1 })
      return result.announcements.length >= 0
    } catch {
      return false
    }
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.cache.clear()
  }

  // ============================================
  // 내부 메서드
  // ============================================

  private buildParams(filters?: BizInfoSearchFilters): BizInfoApiParams {
    const params: BizInfoApiParams = {
      crtfcKey: this.config.apiKey,
      dataType: 'json',
      searchCnt: filters?.pageSize || this.config.defaultPageSize,
      pageIndex: filters?.page || 1,
    }

    // hashtags 구성 (분야,지역)
    const hashtags: string[] = []
    if (filters?.fields?.length) {
      hashtags.push(...filters.fields)
    }
    if (filters?.regions?.length) {
      hashtags.push(...filters.regions)
    }
    if (hashtags.length > 0) {
      params.hashtags = hashtags.join(',')
    }

    // 키워드
    if (filters?.keyword) {
      params.keyword = filters.keyword
    }

    return params
  }

  private async fetchWithRetry(params: BizInfoApiParams): Promise<BizInfoApiResponse> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        return await this.fetchApi(params)
      } catch (error) {
        lastError = error as Error
        logger.warn(`[BizInfo API] Attempt ${attempt} failed:`, error)

        if (attempt < this.config.retryCount) {
          await this.delay(this.config.retryDelay * attempt)
        }
      }
    }

    throw new BizInfoApiError(
      `API 호출 실패 (${this.config.retryCount}회 재시도 후): ${lastError?.message}`,
      BIZINFO_ERROR_CODES.NETWORK_ERROR
    )
  }

  private async fetchApi(params: BizInfoApiParams): Promise<BizInfoApiResponse> {
    const url = new URL(BIZINFO_API_BASE_URL)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'QETTA-EnginePreset/1.0',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new BizInfoApiError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          BIZINFO_ERROR_CODES.NETWORK_ERROR,
          response.status
        )
      }

      const data = await response.json()

      // 에러 응답 처리
      if (data.code && data.code !== '00' && data.code !== 'SUCCESS') {
        throw new BizInfoApiError(
          data.message || `API Error: ${data.code}`,
          data.code
        )
      }

      return data as BizInfoApiResponse
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof BizInfoApiError) {
        throw error
      }

      if ((error as Error).name === 'AbortError') {
        throw new BizInfoApiError(
          `요청 타임아웃 (${this.config.timeout}ms)`,
          BIZINFO_ERROR_CODES.TIMEOUT
        )
      }

      throw new BizInfoApiError(
        `네트워크 오류: ${(error as Error).message}`,
        BIZINFO_ERROR_CODES.NETWORK_ERROR
      )
    }
  }

  private getCacheKey(filters?: BizInfoSearchFilters): string {
    return JSON.stringify(filters || {})
  }

  private getFromCache(key: string): BizInfoSearchResult | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const ttl = this.config.cacheTtlMinutes * 60 * 1000
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key)
      return null
    }

    return { ...cached.data, fromCache: true }
  }

  private setCache(key: string, data: BizInfoSearchResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// ============================================
// 싱글톤 인스턴스 (환경변수 사용)
// ============================================

let _bizInfoClient: BizInfoClient | null = null

/**
 * 기업마당 API 클라이언트 싱글톤
 *
 * @example
 * ```ts
 * const result = await bizInfoClient.search({ activeOnly: true })
 * console.log(result.announcements)
 * ```
 */
export function getBizInfoClient(): BizInfoClient {
  if (!_bizInfoClient) {
    _bizInfoClient = new BizInfoClient()
  }
  return _bizInfoClient
}

/**
 * 클라이언트 초기화 (테스트용)
 */
export function initBizInfoClient(config: Partial<BizInfoClientConfig>): BizInfoClient {
  _bizInfoClient = new BizInfoClient(config)
  return _bizInfoClient
}
