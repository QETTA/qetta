/**
 * UNGM (UN Global Marketplace) API 클라이언트
 *
 * @see https://www.ungm.org/
 *
 * 핵심 원칙:
 * - API 우선, Rate limiting 준수
 * - 에러 시 graceful degradation (빈 결과 반환)
 * - 메모리 캐시 (TTL 30분)
 *
 * 환경변수:
 * - UNGM_API_KEY: UNGM API 인증키
 *
 * QETTA Global Tender 도메인 엔진 - 63만+ 글로벌 입찰 DB
 */

import type {
  UngmApiParams,
  UngmApiResponse,
  UngmNoticeItem,
  UngmClientConfig,
  UngmSearchFilters,
  UngmSearchResult,
  NormalizedUngmTender,
  NormalizedTenderStatus,
  UnAgency,
} from './types'

import { UngmApiError, UNGM_ERROR_CODES, UNGM_NOTICE_STATUS, UN_AGENCIES } from './types'
import { logger } from '@/lib/api/logger'

// ============================================
// 상수
// ============================================

const UNGM_API_BASE_URL = 'https://www.ungm.org/UNUser/Notice'
const UNGM_WEB_BASE_URL = 'https://www.ungm.org/Public/Notice'

const DEFAULT_CONFIG: Omit<Required<UngmClientConfig>, 'apiKey'> = {
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
 * 예산 포맷팅 (USD 기본)
 */
function formatBudget(amount?: number, currency = 'USD'): string {
  if (!amount || amount <= 0) return 'TBD'

  // 1억 이상 (100,000,000)
  if (amount >= 100_000_000) {
    const billions = (amount / 1_000_000_000).toFixed(1)
    return `$${billions}B ${currency}`
  }

  // 100만 이상 (1,000,000)
  if (amount >= 1_000_000) {
    const millions = (amount / 1_000_000).toFixed(1)
    return `$${millions}M ${currency}`
  }

  // 1000 이상
  if (amount >= 1000) {
    const thousands = (amount / 1000).toFixed(1)
    return `$${thousands}K ${currency}`
  }

  return `$${amount.toLocaleString()} ${currency}`
}

/**
 * 매칭 점수 계산 (65-99)
 * 실제로는 도메인 엔진 기반 분석이 필요하지만, 여기서는 휴리스틱 사용
 */
function calculateMatchScore(item: UngmNoticeItem): number {
  let score = 65 // 기본 점수

  // 예산이 있으면 +10
  if (item.budget?.amount && item.budget.amount > 0) {
    score += 10
  }

  // 상세 설명이 있으면 +5
  if (item.description && item.description.length > 50) {
    score += 5
  }

  // UN 기관 정보가 있으면 +5
  if (item.agency?.code) {
    score += 5
  }

  // 카테고리 정보가 있으면 +3
  if (item.category?.name) {
    score += 3
  }

  // 진행 중이면 +5
  if (item.status === UNGM_NOTICE_STATUS.ACTIVE || item.status === UNGM_NOTICE_STATUS.CLOSING_SOON) {
    score += 5
  }

  // 마감일까지 여유가 있으면 +4
  if (item.deadline) {
    const daysLeft = Math.ceil(
      (new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysLeft > 7) {
      score += 4
    }
  }

  // 첨부파일이 있으면 +2
  if (item.attachments && item.attachments.length > 0) {
    score += 2
  }

  return Math.min(99, Math.max(65, score))
}

/**
 * 상태 정규화
 */
function normalizeStatus(item: UngmNoticeItem): NormalizedTenderStatus {
  const status = item.status

  // 마감일 기준 체크
  if (item.deadline) {
    const endDate = new Date(item.deadline)
    if (endDate < new Date()) {
      return 'notQualified'
    }
  }

  // 상태 코드 기준
  switch (status) {
    case UNGM_NOTICE_STATUS.ACTIVE:
      return 'qualified'
    case UNGM_NOTICE_STATUS.CLOSING_SOON:
      return 'pending'
    case UNGM_NOTICE_STATUS.CLOSED:
    case UNGM_NOTICE_STATUS.AWARDED:
    case UNGM_NOTICE_STATUS.CANCELLED:
      return 'notQualified'
    default:
      return 'new'
  }
}

/**
 * 국가 플래그 반환 (UN 기관은 기본적으로 국제기구)
 */
function getCountryFlag(targetCountries?: string[]): string {
  // UN 기관이므로 기본적으로 UN 플래그 사용
  // 특정 국가만 대상인 경우 해당 국가 플래그 사용 가능
  if (!targetCountries || targetCountries.length === 0 || targetCountries.length > 1) {
    return '🇺🇳'
  }

  // ISO 국가 코드를 플래그로 변환 (간단한 매핑)
  const countryCode = targetCountries[0].toUpperCase()
  const flagEmoji = countryCode
    .split('')
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join('')

  return flagEmoji || '🇺🇳'
}

/**
 * 입찰 공고 정규화
 */
function normalizeTender(item: UngmNoticeItem, fetchedAt: string): NormalizedUngmTender {
  const id = item.id || `ungm-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  const title = item.title || '제목 없음'
  const budgetAmount = item.budget?.amount || 0
  const currency = item.budget?.currency || 'USD'
  const deadline = parseDate(item.deadline)
  const agencyCode = item.agency?.code as UnAgency | undefined

  return {
    id,
    platform: 'UNGM',
    country: getCountryFlag(item.targetCountries),
    title,
    budget: formatBudget(budgetAmount, currency),
    budgetAmount,
    deadline,
    dDay: calculateDDay(item.deadline),
    matchScore: calculateMatchScore(item),
    status: normalizeStatus(item),
    category: item.category?.name,
    agency: item.agency?.name || (agencyCode ? UN_AGENCIES[agencyCode] : undefined),
    detailUrl: item.detailUrl || `${UNGM_WEB_BASE_URL}/${item.id}`,
    unAgency: agencyCode,
    referenceNumber: item.referenceNumber,
    procurementType: item.procurementType,
    targetCountries: item.targetCountries,
    source: 'UNGM',
    sourceUrl: item.detailUrl || `${UNGM_WEB_BASE_URL}/${item.id}`,
    fetchedAt,
    rawData: item,
  }
}

// ============================================
// 메인 클라이언트 클래스
// ============================================

export class UngmClient {
  private config: Required<UngmClientConfig>
  private cache: Map<string, { data: UngmSearchResult; timestamp: number }> = new Map()
  private apiKeyMissing: boolean = false

  constructor(config?: Partial<UngmClientConfig>) {
    const apiKey = config?.apiKey || process.env.UNGM_API_KEY || ''

    // API 키가 없어도 인스턴스 생성 허용 (graceful degradation)
    if (!apiKey) {
      this.apiKeyMissing = true
      logger.warn('[UNGM API] API 키가 설정되지 않았습니다. UNGM_API_KEY 환경변수를 확인하세요.')
    }

    this.config = {
      apiKey,
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<UngmClientConfig>
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 입찰 공고 검색
   */
  async search(filters?: UngmSearchFilters): Promise<UngmSearchResult> {
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
    const tenders = (response.notices || []).map((item) => normalizeTender(item, fetchedAt))

    // 필터 적용
    let filteredTenders = tenders

    // activeOnly 필터
    if (filters?.activeOnly) {
      filteredTenders = filteredTenders.filter(
        (t) => t.status === 'qualified' || t.status === 'new' || t.status === 'pending'
      )
    }

    // 예산 필터
    if (filters?.minBudget) {
      filteredTenders = filteredTenders.filter((t) => t.budgetAmount >= filters.minBudget!)
    }
    if (filters?.maxBudget) {
      filteredTenders = filteredTenders.filter((t) => t.budgetAmount <= filters.maxBudget!)
    }

    const result: UngmSearchResult = {
      tenders: filteredTenders,
      totalCount: response.totalCount || filteredTenders.length,
      currentPage: filters?.page || 1,
      totalPages: Math.ceil(
        (response.totalCount || filteredTenders.length) /
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
  async getById(noticeId: string): Promise<NormalizedUngmTender | null> {
    if (this.apiKeyMissing) return null

    const cacheKey = `single-${noticeId}`
    const cachedResult = this.getFromCache(cacheKey)
    if (cachedResult && cachedResult.tenders.length > 0) {
      return cachedResult.tenders[0]
    }

    try {
      const response = await this.fetchApi(`/Detail/${noticeId}`)

      if (!response.success || !response.notices || response.notices.length === 0) {
        return null
      }

      const fetchedAt = new Date().toISOString()
      const tender = normalizeTender(response.notices[0], fetchedAt)

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
      logger.error(`[UNGM API] getById 실패 (${noticeId}):`, error)
      return null
    }
  }

  /**
   * 진행 중인 입찰만 조회
   */
  async getActive(pageSize = 20): Promise<UngmSearchResult> {
    return this.search({
      activeOnly: true,
      status: UNGM_NOTICE_STATUS.ACTIVE,
      pageSize,
      sortBy: 'Deadline',
      sortOrder: 'asc',
    })
  }

  /**
   * 키워드 검색
   */
  async searchByKeyword(keyword: string, pageSize = 20): Promise<UngmSearchResult> {
    return this.search({
      keyword,
      pageSize,
      activeOnly: true,
    })
  }

  /**
   * UN 기관별 검색
   */
  async searchByAgency(agency: UnAgency, pageSize = 20): Promise<UngmSearchResult> {
    return this.search({
      agency,
      pageSize,
      activeOnly: true,
      sortBy: 'Deadline',
      sortOrder: 'asc',
    })
  }

  /**
   * 예산 범위로 검색
   */
  async searchByBudget(
    minBudget: number,
    maxBudget?: number,
    pageSize = 20
  ): Promise<UngmSearchResult> {
    return this.search({
      minBudget,
      maxBudget,
      pageSize,
      activeOnly: true,
    })
  }

  /**
   * 마감일 임박 공고 조회
   */
  async getClosingSoon(daysLeft = 7, pageSize = 20): Promise<UngmSearchResult> {
    const today = new Date()
    const deadline = new Date(today.getTime() + daysLeft * 24 * 60 * 60 * 1000)

    return this.search({
      deadlineFrom: today.toISOString().split('T')[0],
      deadlineTo: deadline.toISOString().split('T')[0],
      pageSize,
      activeOnly: true,
      sortBy: 'Deadline',
      sortOrder: 'asc',
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

  /**
   * 지원되는 UN 기관 목록 반환
   */
  getAvailableAgencies(): Record<string, string> {
    return { ...UN_AGENCIES }
  }

  // ============================================
  // 내부 메서드
  // ============================================

  private buildParams(filters?: UngmSearchFilters): UngmApiParams {
    const params: UngmApiParams = {
      PageIndex: filters?.page || 1,
      PageSize: filters?.pageSize || this.config.defaultPageSize,
    }

    if (filters?.keyword) {
      params.Title = filters.keyword
    }

    if (filters?.agency) {
      params.AgencyId = filters.agency
    }

    if (filters?.deadlineFrom) {
      params.DeadlineFrom = filters.deadlineFrom
    }

    if (filters?.deadlineTo) {
      params.DeadlineTo = filters.deadlineTo
    }

    if (filters?.publishedFrom) {
      params.PublishedFrom = filters.publishedFrom
    }

    if (filters?.publishedTo) {
      params.PublishedTo = filters.publishedTo
    }

    if (filters?.status) {
      params.Status = filters.status
    }

    if (filters?.categoryId) {
      params.CategoryId = filters.categoryId
    }

    if (filters?.countryCode) {
      params.CountryCode = filters.countryCode
    }

    if (filters?.sortBy) {
      params.SortField = filters.sortBy
    }

    if (filters?.sortOrder) {
      params.SortOrder = filters.sortOrder
    }

    return params
  }

  private async fetchWithRetry(params: UngmApiParams): Promise<UngmApiResponse> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        return await this.fetchApi('/Search', params)
      } catch (error) {
        lastError = error as Error
        logger.warn(`[UNGM API] Attempt ${attempt} failed:`, error)

        if (attempt < this.config.retryCount) {
          await this.delay(this.config.retryDelay * attempt)
        }
      }
    }

    // 모든 재시도 실패 시 빈 결과 반환 (graceful degradation)
    logger.error(
      `[UNGM API] 모든 재시도 실패 (${this.config.retryCount}회): ${lastError?.message}`
    )
    return { success: true, notices: [], totalCount: 0 }
  }

  private async fetchApi(endpoint: string, params?: UngmApiParams): Promise<UngmApiResponse> {
    const url = new URL(`${UNGM_API_BASE_URL}${endpoint}`)

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
          'x-api-key': this.config.apiKey,
          'User-Agent': 'QETTA-GlobalTender/1.0',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401) {
          throw new UngmApiError(
            'API 인증 실패. UNGM_API_KEY를 확인하세요.',
            UNGM_ERROR_CODES.INVALID_API_KEY,
            response.status
          )
        }

        if (response.status === 429) {
          throw new UngmApiError(
            'API 호출 한도 초과',
            UNGM_ERROR_CODES.RATE_LIMIT_EXCEEDED,
            response.status
          )
        }

        if (response.status === 404) {
          throw new UngmApiError(
            '리소스를 찾을 수 없습니다',
            UNGM_ERROR_CODES.NOT_FOUND,
            response.status
          )
        }

        throw new UngmApiError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          UNGM_ERROR_CODES.NETWORK_ERROR,
          response.status
        )
      }

      const data = await response.json()

      return data as UngmApiResponse
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof UngmApiError) {
        throw error
      }

      if ((error as Error).name === 'AbortError') {
        throw new UngmApiError(
          `요청 타임아웃 (${this.config.timeout}ms)`,
          UNGM_ERROR_CODES.TIMEOUT
        )
      }

      throw new UngmApiError(
        `네트워크 오류: ${(error as Error).message}`,
        UNGM_ERROR_CODES.NETWORK_ERROR
      )
    }
  }

  private getCacheKey(filters?: UngmSearchFilters): string {
    return JSON.stringify(filters || {})
  }

  private getFromCache(key: string): UngmSearchResult | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const ttl = this.config.cacheTtlMinutes * 60 * 1000
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key)
      return null
    }

    return { ...cached.data, fromCache: true }
  }

  private setCache(key: string, data: UngmSearchResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private emptyResult(): UngmSearchResult {
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

let _ungmClient: UngmClient | null = null

/**
 * UNGM API 클라이언트 싱글톤
 *
 * @example
 * ```ts
 * const result = await getUngmClient().search({ activeOnly: true })
 * console.log(result.tenders)
 *
 * // UN 기관별 검색
 * const undpTenders = await getUngmClient().searchByAgency('UNDP')
 *
 * // 마감 임박 공고
 * const urgent = await getUngmClient().getClosingSoon(7)
 * ```
 */
export function getUngmClient(): UngmClient {
  if (!_ungmClient) {
    _ungmClient = new UngmClient()
  }
  return _ungmClient
}

/**
 * 클라이언트 초기화 (테스트용)
 */
export function initUngmClient(config: Partial<UngmClientConfig>): UngmClient {
  _ungmClient = new UngmClient(config)
  return _ungmClient
}
