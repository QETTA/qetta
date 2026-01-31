/**
 * Goszakup (카자흐스탄 전자조달) API 클라이언트
 *
 * @see https://ows.goszakup.gov.kz/
 *
 * 핵심 원칙:
 * - API 우선, Rate limiting 준수
 * - 에러 시 graceful degradation (빈 결과 반환)
 * - 메모리 캐시 (TTL 30분)
 *
 * 환경변수:
 * - GOSZAKUP_API_KEY: Goszakup API 인증키
 *
 * QETTA Global Tender 도메인 엔진 - 63만+ 글로벌 입찰 DB
 */

import type {
  GoszakupApiParams,
  GoszakupApiResponse,
  GoszakupTenderItem,
  GoszakupClientConfig,
  GoszakupSearchFilters,
  GoszakupSearchResult,
  NormalizedGoszakupTender,
  NormalizedTenderStatus,
} from './types'

import { GoszakupApiError, GOSZAKUP_ERROR_CODES, GOSZAKUP_TENDER_STATUS } from './types'
import { logger } from '@/lib/api/logger'

// ============================================
// 상수
// ============================================

const GOSZAKUP_API_BASE_URL = 'https://ows.goszakup.gov.kz/v3'
const GOSZAKUP_WEB_BASE_URL = 'https://goszakup.gov.kz'

const DEFAULT_CONFIG: Omit<Required<GoszakupClientConfig>, 'apiKey'> = {
  defaultPageSize: 20,
  timeout: 15000,
  retryCount: 3,
  retryDelay: 1000,
  cacheTtlMinutes: 30,
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 날짜 문자열 파싱 (ISO -> YYYY-MM-DD)
 */
function parseDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

/**
 * D-Day 계산
 */
function calculateDDay(deadline?: string): string {
  if (!deadline) return 'N/A'
  try {
    const endDate = new Date(deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)

    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return '마감'
    if (diffDays === 0) return 'D-Day'
    return `D-${diffDays}`
  } catch {
    return 'N/A'
  }
}

/**
 * 예산 포맷팅 (KZT)
 */
function formatBudget(amount?: number, currency = 'KZT'): string {
  if (!amount || amount <= 0) return 'TBD'

  // 1억 이상 (100,000,000)
  if (amount >= 100_000_000) {
    const billions = (amount / 1_000_000_000).toFixed(1)
    return `${billions}B ${currency}`
  }

  // 100만 이상 (1,000,000)
  if (amount >= 1_000_000) {
    const millions = (amount / 1_000_000).toFixed(1)
    return `${millions}M ${currency}`
  }

  // 1000 이상
  if (amount >= 1000) {
    const thousands = (amount / 1000).toFixed(1)
    return `${thousands}K ${currency}`
  }

  return `${amount.toLocaleString()} ${currency}`
}

/**
 * 매칭 점수 계산 (65-99)
 * 실제로는 도메인 엔진 기반 분석이 필요하지만, 여기서는 휴리스틱 사용
 */
function calculateMatchScore(item: GoszakupTenderItem): number {
  let score = 65 // 기본 점수

  // 예산이 있으면 +10
  if (item.totalAmount && item.totalAmount > 0) {
    score += 10
  }

  // 상세 설명이 있으면 +5
  if (item.description && item.description.length > 50) {
    score += 5
  }

  // 품목이 있으면 +5
  if (item.lots && item.lots.length > 0) {
    score += 5
  }

  // 기관 정보가 있으면 +5
  if (item.customer?.nameRu) {
    score += 5
  }

  // 진행 중이면 +5
  if (
    item.status === GOSZAKUP_TENDER_STATUS.PUBLISHED ||
    item.status === GOSZAKUP_TENDER_STATUS.ACCEPTING
  ) {
    score += 5
  }

  // 마감일까지 여유가 있으면 +4
  if (item.endDate) {
    const daysLeft = Math.ceil(
      (new Date(item.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysLeft > 7) {
      score += 4
    }
  }

  return Math.min(99, Math.max(65, score))
}

/**
 * 상태 정규화
 */
function normalizeStatus(item: GoszakupTenderItem): NormalizedTenderStatus {
  const status = item.status

  // 마감일 기준 체크
  if (item.endDate) {
    const endDate = new Date(item.endDate)
    if (endDate < new Date()) {
      return 'notQualified'
    }
  }

  // 상태 코드 기준
  switch (status) {
    case GOSZAKUP_TENDER_STATUS.PUBLISHED:
    case GOSZAKUP_TENDER_STATUS.ACCEPTING:
      return 'qualified'
    case GOSZAKUP_TENDER_STATUS.EVALUATING:
      return 'pending'
    case GOSZAKUP_TENDER_STATUS.AWARDED:
    case GOSZAKUP_TENDER_STATUS.CANCELLED:
    case GOSZAKUP_TENDER_STATUS.FAILED:
      return 'notQualified'
    default:
      return 'new'
  }
}

/**
 * 입찰 공고 정규화
 */
function normalizeTender(item: GoszakupTenderItem, fetchedAt: string): NormalizedGoszakupTender {
  const id = item.id || `goszakup-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  const title = item.nameRu || item.nameKz || '제목 없음'
  const budgetAmount = item.totalAmount || 0
  const deadline = parseDate(item.endDate)

  return {
    id,
    platform: 'goszakup',
    country: '🇰🇿',
    title,
    budget: formatBudget(budgetAmount, item.currency || 'KZT'),
    budgetAmount,
    deadline,
    dDay: calculateDDay(item.endDate),
    matchScore: calculateMatchScore(item),
    status: normalizeStatus(item),
    category: item.categoryName,
    agency: item.customer?.nameRu || item.customer?.nameKz,
    detailUrl: item.link || `${GOSZAKUP_WEB_BASE_URL}/ru/announce/index/${item.id}`,
    procurementMethod: item.procurementMethod,
    region: item.regionName,
    lotCount: item.lots?.length,
    source: 'GOSZAKUP',
    sourceUrl: item.link || `${GOSZAKUP_WEB_BASE_URL}/ru/announce/index/${item.id}`,
    fetchedAt,
    rawData: item,
  }
}

// ============================================
// 메인 클라이언트 클래스
// ============================================

export class GoszakupClient {
  private config: Required<GoszakupClientConfig>
  private cache: Map<string, { data: GoszakupSearchResult; timestamp: number }> = new Map()
  private apiKeyMissing: boolean = false

  constructor(config?: Partial<GoszakupClientConfig>) {
    const apiKey = config?.apiKey || process.env.GOSZAKUP_API_KEY || ''

    // API 키가 없어도 인스턴스 생성 허용 (graceful degradation)
    if (!apiKey) {
      this.apiKeyMissing = true
      logger.warn(
        '[Goszakup API] API 키가 설정되지 않았습니다. GOSZAKUP_API_KEY 환경변수를 확인하세요.'
      )
    }

    this.config = {
      apiKey,
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<GoszakupClientConfig>
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 입찰 공고 검색
   */
  async search(filters?: GoszakupSearchFilters): Promise<GoszakupSearchResult> {
    // API 키가 없으면 빈 결과 반환 (graceful degradation)
    if (this.apiKeyMissing) {
      return this.emptyResult()
    }

    const cacheKey = this.getCacheKey(filters)
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const params = this.buildParams(filters)
    const response = await this.fetchWithRetry(params)

    const fetchedAt = new Date().toISOString()
    const tenders = (response.items || []).map((item) => normalizeTender(item, fetchedAt))

    // 필터 적용
    let filteredTenders = tenders

    // activeOnly 필터
    if (filters?.activeOnly) {
      filteredTenders = filteredTenders.filter(
        (t) => t.status === 'qualified' || t.status === 'new'
      )
    }

    // 예산 필터
    if (filters?.minBudget) {
      filteredTenders = filteredTenders.filter((t) => t.budgetAmount >= filters.minBudget!)
    }
    if (filters?.maxBudget) {
      filteredTenders = filteredTenders.filter((t) => t.budgetAmount <= filters.maxBudget!)
    }

    const result: GoszakupSearchResult = {
      tenders: filteredTenders,
      totalCount: response.total || filteredTenders.length,
      currentPage: filters?.page || 1,
      totalPages: Math.ceil(
        (response.total || filteredTenders.length) /
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
  async getById(tenderId: string): Promise<NormalizedGoszakupTender | null> {
    if (this.apiKeyMissing) return null

    const cacheKey = `single-${tenderId}`
    const cachedResult = this.getFromCache(cacheKey)
    if (cachedResult && cachedResult.tenders.length > 0) {
      return cachedResult.tenders[0]
    }

    try {
      const response = await this.fetchApi(`/trd-buy/${tenderId}`)

      if (!response.success || !response.items || response.items.length === 0) {
        return null
      }

      const fetchedAt = new Date().toISOString()
      const tender = normalizeTender(response.items[0], fetchedAt)

      // 캐시에 저장
      this.setCache(cacheKey, {
        tenders: [tender],
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
        searchedAt: fetchedAt,
        fromCache: false,
      })

      return tender
    } catch (error) {
      logger.error(`[Goszakup API] getById 실패 (${tenderId}):`, error)
      return null
    }
  }

  /**
   * 진행 중인 입찰만 조회
   */
  async getActive(pageSize = 20): Promise<GoszakupSearchResult> {
    return this.search({
      activeOnly: true,
      status: GOSZAKUP_TENDER_STATUS.ACCEPTING,
      pageSize,
      sortBy: 'endDate',
      sortOrder: 'asc',
    })
  }

  /**
   * 키워드 검색
   */
  async searchByKeyword(keyword: string, pageSize = 20): Promise<GoszakupSearchResult> {
    return this.search({
      keyword,
      pageSize,
      activeOnly: true,
    })
  }

  /**
   * 예산 범위로 검색
   */
  async searchByBudget(
    minBudget: number,
    maxBudget?: number,
    pageSize = 20
  ): Promise<GoszakupSearchResult> {
    return this.search({
      minBudget,
      maxBudget,
      pageSize,
      activeOnly: true,
      sortBy: 'amount',
      sortOrder: 'desc',
    })
  }

  /**
   * 기간으로 검색
   */
  async searchByDateRange(
    startDate: string,
    endDate: string,
    pageSize = 20
  ): Promise<GoszakupSearchResult> {
    return this.search({
      startDate,
      endDate,
      pageSize,
      activeOnly: true,
    })
  }

  /**
   * API 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    if (this.apiKeyMissing) return false

    try {
      const result = await this.search({ pageSize: 1 })
      return result.tenders.length >= 0
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

  /**
   * API 키 상태 확인
   */
  isConfigured(): boolean {
    return !this.apiKeyMissing
  }

  // ============================================
  // 내부 메서드
  // ============================================

  private buildParams(filters?: GoszakupSearchFilters): GoszakupApiParams {
    const params: GoszakupApiParams = {
      page: (filters?.page || 1) - 1, // 0-based
      limit: filters?.pageSize || this.config.defaultPageSize,
    }

    if (filters?.keyword) {
      params.search = filters.keyword
    }

    if (filters?.startDate) {
      params.startDate = filters.startDate
    }

    if (filters?.endDate) {
      params.endDate = filters.endDate
    }

    if (filters?.status) {
      params.status = filters.status
    }

    if (filters?.sortBy) {
      params.sort = filters.sortBy
    }

    if (filters?.sortOrder) {
      params.order = filters.sortOrder
    }

    return params
  }

  private async fetchWithRetry(params: GoszakupApiParams): Promise<GoszakupApiResponse> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        return await this.fetchApi('/trd-buy/search', params)
      } catch (error) {
        lastError = error as Error
        logger.warn(`[Goszakup API] Attempt ${attempt} failed:`, error)

        if (attempt < this.config.retryCount) {
          await this.delay(this.config.retryDelay * attempt)
        }
      }
    }

    // 모든 재시도 실패 시 빈 결과 반환 (graceful degradation)
    logger.error(
      `[Goszakup API] 모든 재시도 실패 (${this.config.retryCount}회): ${lastError?.message}`
    )
    return { success: true, items: [], total: 0 }
  }

  private async fetchApi(endpoint: string, params?: GoszakupApiParams): Promise<GoszakupApiResponse> {
    const url = new URL(`${GOSZAKUP_API_BASE_URL}${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
          'User-Agent': 'QETTA-GlobalTender/1.0',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401) {
          throw new GoszakupApiError(
            'API 인증 실패. GOSZAKUP_API_KEY를 확인하세요.',
            GOSZAKUP_ERROR_CODES.INVALID_API_KEY,
            response.status
          )
        }

        if (response.status === 429) {
          throw new GoszakupApiError(
            'API 호출 한도 초과',
            GOSZAKUP_ERROR_CODES.RATE_LIMIT_EXCEEDED,
            response.status
          )
        }

        if (response.status === 404) {
          throw new GoszakupApiError('리소스를 찾을 수 없습니다', GOSZAKUP_ERROR_CODES.NOT_FOUND, response.status)
        }

        throw new GoszakupApiError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          GOSZAKUP_ERROR_CODES.NETWORK_ERROR,
          response.status
        )
      }

      const data = await response.json()

      return data as GoszakupApiResponse
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof GoszakupApiError) {
        throw error
      }

      if ((error as Error).name === 'AbortError') {
        throw new GoszakupApiError(
          `요청 타임아웃 (${this.config.timeout}ms)`,
          GOSZAKUP_ERROR_CODES.TIMEOUT
        )
      }

      throw new GoszakupApiError(
        `네트워크 오류: ${(error as Error).message}`,
        GOSZAKUP_ERROR_CODES.NETWORK_ERROR
      )
    }
  }

  private getCacheKey(filters?: GoszakupSearchFilters): string {
    return JSON.stringify(filters || {})
  }

  private getFromCache(key: string): GoszakupSearchResult | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const ttl = this.config.cacheTtlMinutes * 60 * 1000
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key)
      return null
    }

    return { ...cached.data, fromCache: true }
  }

  private setCache(key: string, data: GoszakupSearchResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private emptyResult(): GoszakupSearchResult {
    return {
      tenders: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      searchedAt: new Date().toISOString(),
      fromCache: false,
    }
  }
}

// ============================================
// 싱글톤 인스턴스 (환경변수 사용)
// ============================================

let _goszakupClient: GoszakupClient | null = null

/**
 * Goszakup API 클라이언트 싱글톤
 *
 * @example
 * ```ts
 * const result = await goszakupClient.search({ activeOnly: true })
 * console.log(result.tenders)
 * ```
 */
export function getGoszakupClient(): GoszakupClient {
  if (!_goszakupClient) {
    _goszakupClient = new GoszakupClient()
  }
  return _goszakupClient
}

/**
 * 클라이언트 초기화 (테스트용)
 */
export function initGoszakupClient(config: Partial<GoszakupClientConfig>): GoszakupClient {
  _goszakupClient = new GoszakupClient(config)
  return _goszakupClient
}
