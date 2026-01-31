/**
 * SAM.gov (미국 연방 조달) API 클라이언트
 *
 * @see https://api.sam.gov/opportunities/v2
 * @see https://open.gsa.gov/api/get-opportunities-public-api/
 *
 * 핵심 원칙:
 * - API 우선, Rate limiting 준수
 * - 에러 시 graceful degradation (빈 결과 반환)
 * - 메모리 캐시 (TTL 30분)
 *
 * 환경변수:
 * - SAM_GOV_API_KEY: SAM.gov API 인증키
 *
 * QETTA Global Tender 도메인 엔진 - 63만+ 글로벌 입찰 DB
 */

import type {
  SamGovApiParams,
  SamGovApiResponse,
  SamGovOpportunityItem,
  SamGovClientConfig,
  SamGovSearchFilters,
  SamGovSearchResult,
  NormalizedSamGovTender,
  NormalizedTenderStatus,
  SamNoticeType,
  SamSetAsideType,
  SamFederalAgency,
} from './types'

import {
  SamGovApiError,
  SAM_GOV_ERROR_CODES,
  SAM_NOTICE_TYPES,
  SAM_SET_ASIDE_TYPES,
  SAM_FEDERAL_AGENCIES,
} from './types'
import { logger } from '@/lib/api/logger'

// ============================================
// 상수
// ============================================

const SAM_GOV_API_BASE_URL = 'https://api.sam.gov/opportunities/v2'
const SAM_GOV_WEB_BASE_URL = 'https://sam.gov/opp'

const DEFAULT_CONFIG: Omit<Required<SamGovClientConfig>, 'apiKey'> = {
  defaultPageSize: 25,
  timeout: 20000,
  retryCount: 3,
  retryDelay: 1000,
  cacheTtlMinutes: 30,
}

// Notice Type 표시명 매핑
const NOTICE_TYPE_LABELS: Record<SamNoticeType, string> = {
  [SAM_NOTICE_TYPES.PRESOLICITATION]: 'Presolicitation',
  [SAM_NOTICE_TYPES.COMBINED]: 'Combined Synopsis/Solicitation',
  [SAM_NOTICE_TYPES.AWARD]: 'Award Notice',
  [SAM_NOTICE_TYPES.JUSTIFICATION]: 'Justification',
  [SAM_NOTICE_TYPES.INTENT_BUNDLE]: 'Intent to Bundle',
  [SAM_NOTICE_TYPES.SOURCES_SOUGHT]: 'Sources Sought',
  [SAM_NOTICE_TYPES.SPECIAL_NOTICE]: 'Special Notice',
  [SAM_NOTICE_TYPES.SALE_OF_SURPLUS]: 'Sale of Surplus',
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 날짜 문자열 파싱 (다양한 형식 지원 -> YYYY-MM-DD)
 * SAM.gov 날짜 형식: 2026-01-23T23:59:59-05:00 (EST)
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
 * YYYY-MM-DD -> MM/DD/YYYY (SAM.gov API 형식)
 */
function formatDateForApi(dateStr?: string): string | undefined {
  if (!dateStr) return undefined
  try {
    const [year, month, day] = dateStr.split('-')
    if (!year || !month || !day) return undefined
    return `${month}/${day}/${year}`
  } catch {
    return undefined
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

    if (diffDays < 0) return 'Closed'
    if (diffDays === 0) return 'D-Day'
    return `D-${diffDays}`
  } catch {
    return 'N/A'
  }
}

/**
 * 예산 포맷팅 (USD)
 */
function formatBudget(amount?: number): string {
  if (!amount || amount <= 0) return 'TBD'

  // 1억 이상 (100,000,000)
  if (amount >= 100_000_000) {
    const billions = (amount / 1_000_000_000).toFixed(1)
    return `$${billions}B`
  }

  // 100만 이상 (1,000,000)
  if (amount >= 1_000_000) {
    const millions = (amount / 1_000_000).toFixed(1)
    return `$${millions}M`
  }

  // 1000 이상
  if (amount >= 1000) {
    const thousands = (amount / 1000).toFixed(1)
    return `$${thousands}K`
  }

  return `$${amount.toLocaleString()}`
}

/**
 * Award amount에서 숫자 추출
 */
function parseAwardAmount(amountStr?: string): number {
  if (!amountStr) return 0
  // "$1,234,567.89" 형식에서 숫자만 추출
  const cleaned = amountStr.replace(/[^0-9.]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * 매칭 점수 계산 (65-99)
 */
function calculateMatchScore(item: SamGovOpportunityItem): number {
  let score = 65 // 기본 점수

  // Award 금액이 있으면 +10
  if (item.award?.amount) {
    score += 10
  }

  // 상세 설명이 있으면 +5
  if (item.description && item.description.length > 100) {
    score += 5
  }

  // NAICS 코드가 있으면 +3
  if (item.naicsCode || (item.naicsCodes && item.naicsCodes.length > 0)) {
    score += 3
  }

  // 연락처 정보가 있으면 +5
  if (item.pointOfContact && item.pointOfContact.length > 0) {
    score += 5
  }

  // 활성 상태면 +5
  if (item.active === 'Yes') {
    score += 5
  }

  // 마감일까지 여유가 있으면 +4
  if (item.responseDeadLine) {
    const daysLeft = Math.ceil(
      (new Date(item.responseDeadLine).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysLeft > 14) {
      score += 4
    } else if (daysLeft > 7) {
      score += 2
    }
  }

  // Set-Aside가 있으면 +2
  if (item.typeOfSetAside) {
    score += 2
  }

  return Math.min(99, Math.max(65, score))
}

/**
 * 상태 정규화
 */
function normalizeStatus(item: SamGovOpportunityItem): NormalizedTenderStatus {
  // 마감일 기준 체크
  if (item.responseDeadLine) {
    const endDate = new Date(item.responseDeadLine)
    if (endDate < new Date()) {
      return 'notQualified'
    }
  }

  // 활성 상태 체크
  if (item.active === 'No') {
    return 'notQualified'
  }

  // 공고 유형 체크
  const type = item.type?.toLowerCase()
  if (type === 'award notice' || type === 'a') {
    return 'notQualified'
  }

  // 마감 임박 (7일 이내)
  if (item.responseDeadLine) {
    const daysLeft = Math.ceil(
      (new Date(item.responseDeadLine).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysLeft <= 7 && daysLeft > 0) {
      return 'pending'
    }
  }

  // 활성 상태
  if (item.active === 'Yes') {
    return 'qualified'
  }

  return 'new'
}

/**
 * 수행 장소 문자열 생성
 */
function formatPlaceOfPerformance(pop?: SamGovOpportunityItem['placeOfPerformance']): string | undefined {
  if (!pop) return undefined

  const parts: string[] = []
  if (pop.city?.name) parts.push(pop.city.name)
  if (pop.state?.code) parts.push(pop.state.code)
  if (pop.country?.code && pop.country.code !== 'USA') parts.push(pop.country.code)

  return parts.length > 0 ? parts.join(', ') : undefined
}

/**
 * 입찰 공고 정규화
 */
function normalizeTender(item: SamGovOpportunityItem, fetchedAt: string): NormalizedSamGovTender {
  const id = item.noticeId || `samgov-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  const title = item.title || 'Untitled Opportunity'
  const budgetAmount = parseAwardAmount(item.award?.amount)
  const deadline = parseDate(item.responseDeadLine)

  // NAICS 카테고리 추출
  let category: string | undefined
  if (item.naicsCodes && item.naicsCodes.length > 0) {
    const primaryNaics = item.naicsCodes[0]
    category = primaryNaics.description || primaryNaics.code
  } else if (item.naicsCode) {
    category = item.naicsCode
  }

  // 공고 유형 라벨
  const noticeTypeCode = item.type as SamNoticeType | undefined
  const noticeType = noticeTypeCode ? NOTICE_TYPE_LABELS[noticeTypeCode] || item.type : item.type

  return {
    id,
    platform: 'SAM',
    country: '🇺🇸',
    title,
    budget: formatBudget(budgetAmount),
    budgetAmount,
    deadline,
    dDay: calculateDDay(item.responseDeadLine),
    matchScore: calculateMatchScore(item),
    status: normalizeStatus(item),
    category,
    agency: item.department,
    detailUrl: item.uiLink || `${SAM_GOV_WEB_BASE_URL}/${item.noticeId}`,
    noticeType,
    solicitationNumber: item.solicitationNumber,
    naicsCode: item.naicsCode || item.naicsCodes?.[0]?.code,
    setAside: item.typeOfSetAsideDescription || item.typeOfSetAside,
    subtier: item.subtier,
    office: item.office,
    placeOfPerformance: formatPlaceOfPerformance(item.placeOfPerformance),
    source: 'SAM_GOV',
    sourceUrl: item.uiLink || `${SAM_GOV_WEB_BASE_URL}/${item.noticeId}`,
    fetchedAt,
    rawData: item,
  }
}

// ============================================
// 메인 클라이언트 클래스
// ============================================

export class SamGovClient {
  private config: Required<SamGovClientConfig>
  private cache: Map<string, { data: SamGovSearchResult; timestamp: number }> = new Map()
  private apiKeyMissing: boolean = false

  constructor(config?: Partial<SamGovClientConfig>) {
    const apiKey = config?.apiKey || process.env.SAM_GOV_API_KEY || ''

    // API 키가 없어도 인스턴스 생성 허용 (graceful degradation)
    if (!apiKey) {
      this.apiKeyMissing = true
      logger.warn('[SAM.gov API] API 키가 설정되지 않았습니다. SAM_GOV_API_KEY 환경변수를 확인하세요.')
    }

    this.config = {
      apiKey,
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<SamGovClientConfig>
  }

  // ============================================
  // 공개 API
  // ============================================

  /**
   * 입찰 공고 검색
   */
  async search(filters?: SamGovSearchFilters): Promise<SamGovSearchResult> {
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
    const tenders = (response.opportunitiesData || []).map((item) => normalizeTender(item, fetchedAt))

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

    const result: SamGovSearchResult = {
      tenders: filteredTenders,
      totalCount: response.totalRecords || filteredTenders.length,
      currentPage: filters?.page || 1,
      totalPages: Math.ceil(
        (response.totalRecords || filteredTenders.length) /
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
  async getById(noticeId: string): Promise<NormalizedSamGovTender | null> {
    if (this.apiKeyMissing) return null

    const cacheKey = `single-${noticeId}`
    const cachedResult = this.getFromCache(cacheKey)
    if (cachedResult && cachedResult.tenders.length > 0) {
      return cachedResult.tenders[0]
    }

    try {
      const response = await this.fetchApi('/search', { noticeId, api_key: this.config.apiKey })

      if (!response.opportunitiesData || response.opportunitiesData.length === 0) {
        return null
      }

      const fetchedAt = new Date().toISOString()
      const tender = normalizeTender(response.opportunitiesData[0], fetchedAt)

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
      logger.error(`[SAM.gov API] getById 실패 (${noticeId}):`, error)
      return null
    }
  }

  /**
   * 진행 중인 입찰만 조회
   */
  async getActive(pageSize = 25): Promise<SamGovSearchResult> {
    return this.search({
      activeOnly: true,
      pageSize,
      sortBy: 'responseDeadLine',
      sortOrder: 'asc',
    })
  }

  /**
   * 키워드 검색
   */
  async searchByKeyword(keyword: string, pageSize = 25): Promise<SamGovSearchResult> {
    return this.search({
      keyword,
      pageSize,
      activeOnly: true,
    })
  }

  /**
   * 연방 기관별 검색
   */
  async searchByAgency(agency: SamFederalAgency, pageSize = 25): Promise<SamGovSearchResult> {
    return this.search({
      agency,
      pageSize,
      activeOnly: true,
      sortBy: 'responseDeadLine',
      sortOrder: 'asc',
    })
  }

  /**
   * NAICS 코드별 검색
   */
  async searchByNaics(naicsCode: string, pageSize = 25): Promise<SamGovSearchResult> {
    return this.search({
      naicsCode,
      pageSize,
      activeOnly: true,
      sortBy: 'responseDeadLine',
      sortOrder: 'asc',
    })
  }

  /**
   * Set-Aside 유형별 검색
   */
  async searchBySetAside(setAside: SamSetAsideType, pageSize = 25): Promise<SamGovSearchResult> {
    return this.search({
      setAside,
      pageSize,
      activeOnly: true,
      sortBy: 'responseDeadLine',
      sortOrder: 'asc',
    })
  }

  /**
   * 예산 범위로 검색
   */
  async searchByBudget(
    minBudget: number,
    maxBudget?: number,
    pageSize = 25
  ): Promise<SamGovSearchResult> {
    return this.search({
      minBudget,
      maxBudget,
      pageSize,
      activeOnly: true,
    })
  }

  /**
   * 공고 유형별 검색
   */
  async searchByNoticeType(noticeType: SamNoticeType, pageSize = 25): Promise<SamGovSearchResult> {
    return this.search({
      noticeType,
      pageSize,
      activeOnly: true,
      sortBy: 'postedDate',
      sortOrder: 'desc',
    })
  }

  /**
   * 마감 임박 공고 조회
   */
  async getClosingSoon(daysLeft = 14, pageSize = 25): Promise<SamGovSearchResult> {
    const today = new Date()
    const deadline = new Date(today.getTime() + daysLeft * 24 * 60 * 60 * 1000)

    return this.search({
      deadlineFrom: today.toISOString().split('T')[0],
      deadlineTo: deadline.toISOString().split('T')[0],
      pageSize,
      activeOnly: true,
      sortBy: 'responseDeadLine',
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
   * 지원되는 연방 기관 목록 반환
   */
  getAvailableAgencies(): Record<string, string> {
    return { ...SAM_FEDERAL_AGENCIES }
  }

  /**
   * 지원되는 공고 유형 목록 반환
   */
  getNoticeTypes(): Record<string, string> {
    return { ...NOTICE_TYPE_LABELS }
  }

  /**
   * 지원되는 Set-Aside 유형 목록 반환
   */
  getSetAsideTypes(): Record<string, string> {
    return { ...SAM_SET_ASIDE_TYPES }
  }

  // ============================================
  // 내부 메서드
  // ============================================

  private buildParams(filters?: SamGovSearchFilters): SamGovApiParams {
    const params: SamGovApiParams = {
      api_key: this.config.apiKey,
      start: ((filters?.page || 1) - 1) * (filters?.pageSize || this.config.defaultPageSize),
      rows: filters?.pageSize || this.config.defaultPageSize,
    }

    if (filters?.keyword) {
      params.keyword = filters.keyword
    }

    if (filters?.noticeType) {
      params.ptype = filters.noticeType
    }

    if (filters?.postedFrom) {
      params.postedFrom = formatDateForApi(filters.postedFrom)
    }

    if (filters?.postedTo) {
      params.postedTo = formatDateForApi(filters.postedTo)
    }

    if (filters?.deadlineFrom) {
      params.rdlfrom = formatDateForApi(filters.deadlineFrom)
    }

    if (filters?.deadlineTo) {
      params.rdlto = formatDateForApi(filters.deadlineTo)
    }

    if (filters?.naicsCode) {
      params.naics = filters.naicsCode
    }

    if (filters?.setAside) {
      params.typeOfSetAside = filters.setAside
    }

    if (filters?.agency) {
      params.deptname = SAM_FEDERAL_AGENCIES[filters.agency]
    }

    if (filters?.activeOnly) {
      params.status = 'active'
    }

    if (filters?.sortBy) {
      params.sortBy = filters.sortBy
    }

    if (filters?.sortOrder) {
      params.orderBy = filters.sortOrder
    }

    return params
  }

  private async fetchWithRetry(params: SamGovApiParams): Promise<SamGovApiResponse> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        return await this.fetchApi('/search', params)
      } catch (error) {
        lastError = error as Error
        logger.warn(`[SAM.gov API] Attempt ${attempt} failed:`, error)

        if (attempt < this.config.retryCount) {
          await this.delay(this.config.retryDelay * attempt)
        }
      }
    }

    // 모든 재시도 실패 시 빈 결과 반환 (graceful degradation)
    logger.error(
      `[SAM.gov API] 모든 재시도 실패 (${this.config.retryCount}회): ${lastError?.message}`
    )
    return { totalRecords: 0, opportunitiesData: [] }
  }

  private async fetchApi(endpoint: string, params?: SamGovApiParams): Promise<SamGovApiResponse> {
    const url = new URL(`${SAM_GOV_API_BASE_URL}${endpoint}`)

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
          'User-Agent': 'QETTA-GlobalTender/1.0',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new SamGovApiError(
            'API 인증 실패. SAM_GOV_API_KEY를 확인하세요.',
            SAM_GOV_ERROR_CODES.INVALID_API_KEY,
            response.status
          )
        }

        if (response.status === 429) {
          throw new SamGovApiError(
            'API 호출 한도 초과',
            SAM_GOV_ERROR_CODES.RATE_LIMIT_EXCEEDED,
            response.status
          )
        }

        if (response.status === 404) {
          throw new SamGovApiError(
            '리소스를 찾을 수 없습니다',
            SAM_GOV_ERROR_CODES.NOT_FOUND,
            response.status
          )
        }

        throw new SamGovApiError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          SAM_GOV_ERROR_CODES.NETWORK_ERROR,
          response.status
        )
      }

      const data = await response.json()

      // 에러 응답 체크
      if (data.error) {
        throw new SamGovApiError(
          data.error.message || 'Unknown API error',
          data.error.code || SAM_GOV_ERROR_CODES.UNKNOWN
        )
      }

      return data as SamGovApiResponse
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof SamGovApiError) {
        throw error
      }

      if ((error as Error).name === 'AbortError') {
        throw new SamGovApiError(
          `요청 타임아웃 (${this.config.timeout}ms)`,
          SAM_GOV_ERROR_CODES.TIMEOUT
        )
      }

      throw new SamGovApiError(
        `네트워크 오류: ${(error as Error).message}`,
        SAM_GOV_ERROR_CODES.NETWORK_ERROR
      )
    }
  }

  private getCacheKey(filters?: SamGovSearchFilters): string {
    return JSON.stringify(filters || {})
  }

  private getFromCache(key: string): SamGovSearchResult | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const ttl = this.config.cacheTtlMinutes * 60 * 1000
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key)
      return null
    }

    return { ...cached.data, fromCache: true }
  }

  private setCache(key: string, data: SamGovSearchResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private emptyResult(): SamGovSearchResult {
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

let _samGovClient: SamGovClient | null = null

/**
 * SAM.gov API 클라이언트 싱글톤
 *
 * @example
 * ```ts
 * import { getSamGovClient } from '@/lib/skill-engine/data-sources/samgov'
 *
 * // 진행 중인 입찰 조회
 * const result = await getSamGovClient().getActive()
 * console.log(result.tenders)
 *
 * // 연방 기관별 검색
 * const dodTenders = await getSamGovClient().searchByAgency('DOD')
 *
 * // NAICS 코드별 검색
 * const itTenders = await getSamGovClient().searchByNaics('541511')
 *
 * // Set-Aside 유형별 검색
 * const smallBizTenders = await getSamGovClient().searchBySetAside('SBA')
 *
 * // 마감 임박 공고 (14일 이내)
 * const urgent = await getSamGovClient().getClosingSoon(14)
 * ```
 */
export function getSamGovClient(): SamGovClient {
  if (!_samGovClient) {
    _samGovClient = new SamGovClient()
  }
  return _samGovClient
}

/**
 * 클라이언트 초기화 (테스트용)
 */
export function initSamGovClient(config: Partial<SamGovClientConfig>): SamGovClient {
  _samGovClient = new SamGovClient(config)
  return _samGovClient
}
