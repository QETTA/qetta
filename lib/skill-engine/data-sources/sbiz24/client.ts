/**
 * 소상공인24 (SBiz24) API 클라이언트
 *
 * @see https://www.sbiz24.kr
 * @see https://www.data.go.kr/data/15083277/openapi.do (소상공인시장진흥공단 정책자금)
 *
 * 핵심 원칙:
 * - API 우선, 크롤링은 fallback
 * - Rate limiting 준수 (초당 10회 이하)
 * - 에러 시 graceful degradation
 *
 * 환경변수:
 * - SBIZ24_API_KEY: 소상공인24 API 인증키 (공공데이터포털)
 */

import type {
  SBiz24ApiResponse,
  SBiz24AnnouncementItem,
  SBiz24ClientConfig,
  SBiz24SearchFilters,
  SBiz24SearchResult,
  NormalizedSBiz24Announcement,
  SBiz24CategoryCode,
} from './types'
import { logger } from '@/lib/api/logger'

import { SBiz24ApiError, SBIZ24_CATEGORY_CODES } from './types'

// ============================================
// 상수
// ============================================

// 소상공인시장진흥공단 공공데이터 API
const SBIZ24_API_BASE_URL =
  'https://apis.data.go.kr/B552006/SosangongOfficialAnnouncement/SmallBusinessOfficialAnnouncementView'

const DEFAULT_CONFIG: Omit<Required<SBiz24ClientConfig>, 'apiKey' | 'throwOnError'> = {
  defaultPageSize: 50,
  timeout: 10000,
  retryCount: 3,
  retryDelay: 1000,
  cacheTtlMinutes: 30,
}

// ============================================
// 로깅 유틸리티
// ============================================

/**
 * 경고 로그 (개발/프로덕션 모두 출력)
 */
function logWarning(context: string, message: string, details?: Record<string, unknown>): void {
  const detailsStr = details ? ` ${JSON.stringify(details)}` : ''
  logger.warn(`[SBiz24Client:${context}] ${message}${detailsStr}`)
}

/**
 * 에러 로그
 */
function logError(context: string, message: string, error?: unknown): void {
  const errorStr = error instanceof Error ? ` - ${error.message}` : ''
  logger.error(`[SBiz24Client:${context}] ${message}${errorStr}`)
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 날짜 문자열 파싱 (YYYYMMDD -> ISO)
 */
function parseDate(dateStr?: string): string | null {
  if (!dateStr) return null
  // YYYYMMDD 형식
  if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return `${year}-${month}-${day}`
  }
  // YYYY-MM-DD 형식
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }
  // YYYY.MM.DD 형식
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateStr)) {
    return dateStr.replace(/\./g, '-')
  }
  return null
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
  item: SBiz24AnnouncementItem,
  fetchedAt: string
): NormalizedSBiz24Announcement {
  const id = item.pblancId || `sbiz24-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  return {
    id,
    source: 'SBIZ24',
    sourceUrl: item.link || item.detailPageUrl || 'https://www.sbiz24.kr',

    // 기본 정보
    title: item.pblancNm || '제목 없음',
    organization: item.jrsdInsttNm || '소상공인시장진흥공단',
    summary: item.bsnsSumryCn || '',

    // 지원 내용
    target: item.trgetNm || '',
    supportContent: item.sprtCn || '',
    supportScale: item.sprtScale || '',

    // 기간
    applicationStart: parseDate(item.reqstBeginDe),
    applicationEnd: parseDate(item.reqstEndDe),
    applicationPeriod: item.rceptPrdCn || '',

    // 상태
    status: determineStatus(item.reqstBeginDe, item.reqstEndDe, item.pblancSttusNm),

    // 분류
    categoryMain: item.pldirSportRealmLclasCodeNm || '',
    categorySub: item.pldirSportRealmMlsfcCodeNm || '',
    region: item.areaClNm || '전국',

    // 메타데이터
    fetchedAt,
    normalizedAt: new Date().toISOString(),
  }
}

// ============================================
// 클라이언트 클래스
// ============================================

export class SBiz24Client {
  private config: Required<SBiz24ClientConfig>
  private cache: Map<string, { data: SBiz24SearchResult; timestamp: number }> = new Map()
  private apiKeyWarningLogged = false

  constructor(config: SBiz24ClientConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      apiKey: config.apiKey || process.env.SBIZ24_API_KEY || '',
      throwOnError: config.throwOnError ?? false,
    }

    // API 키 미설정 시 최초 1회 경고 로깅
    if (!this.config.apiKey && !this.apiKeyWarningLogged) {
      logWarning('constructor', 'API 키가 설정되지 않았습니다. 제한된 기능만 사용 가능합니다.', {
        envVar: 'SBIZ24_API_KEY',
        documentation: 'https://www.data.go.kr/data/15083277/openapi.do',
      })
      this.apiKeyWarningLogged = true
    }
  }

  /**
   * API 키 설정
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey
  }

  /**
   * 캐시 키 생성
   */
  private getCacheKey(filters: SBiz24SearchFilters): string {
    return JSON.stringify({
      ...filters,
      timestamp: Math.floor(Date.now() / (this.config.cacheTtlMinutes * 60 * 1000)),
    })
  }

  /**
   * 캐시에서 조회
   */
  private getFromCache(key: string): SBiz24SearchResult | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const age = Date.now() - cached.timestamp
    if (age > this.config.cacheTtlMinutes * 60 * 1000) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * 캐시에 저장
   */
  private setCache(key: string, data: SBiz24SearchResult): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  /**
   * API 호출 (재시도 포함)
   */
  private async fetchWithRetry(url: string, attempt = 1): Promise<Response> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401) {
          throw new SBiz24ApiError('API_KEY_INVALID')
        }
        if (response.status === 429) {
          throw new SBiz24ApiError('RATE_LIMIT')
        }
        throw new SBiz24ApiError('UNKNOWN', `HTTP ${response.status}`)
      }

      return response
    } catch (error) {
      if (error instanceof SBiz24ApiError) {
        if (!error.retry || attempt >= this.config.retryCount) {
          throw error
        }
      }

      if (attempt < this.config.retryCount) {
        await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay * attempt))
        return this.fetchWithRetry(url, attempt + 1)
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new SBiz24ApiError('NETWORK_ERROR', '요청 시간 초과')
      }

      throw new SBiz24ApiError('NETWORK_ERROR')
    }
  }

  /**
   * 공고 검색
   */
  async search(filters: SBiz24SearchFilters = {}): Promise<SBiz24SearchResult> {
    // API 키 확인
    if (!this.config.apiKey) {
      const errorMsg = '소상공인24 API 키가 설정되지 않았습니다. SBIZ24_API_KEY 환경변수를 확인하세요.'

      logWarning('search', 'API 키 미설정으로 검색 불가', {
        filters,
        suggestion: '공공데이터포털에서 API 키 발급 필요',
      })

      // throwOnError가 true면 예외 발생
      if (this.config.throwOnError) {
        throw new SBiz24ApiError('API_KEY_MISSING', errorMsg)
      }

      return {
        success: false,
        data: [],
        totalCount: 0,
        page: filters.page || 1,
        pageSize: filters.pageSize || this.config.defaultPageSize,
        hasMore: false,
        error: errorMsg,
      }
    }

    // 캐시 확인
    const cacheKey = this.getCacheKey(filters)
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return { ...cached, cachedAt: new Date().toISOString() }
    }

    try {
      const params = new URLSearchParams({
        serviceKey: this.config.apiKey,
        pageNo: String(filters.page || 1),
        numOfRows: String(filters.pageSize || this.config.defaultPageSize),
        type: 'json',
      })

      if (filters.keyword) {
        params.append('searchWrd', filters.keyword)
      }

      const url = `${SBIZ24_API_BASE_URL}?${params.toString()}`
      const response = await this.fetchWithRetry(url)
      const data = (await response.json()) as SBiz24ApiResponse

      // 응답 검증
      if (!data.body?.items?.item) {
        return {
          success: true,
          data: [],
          totalCount: 0,
          page: filters.page || 1,
          pageSize: filters.pageSize || this.config.defaultPageSize,
          hasMore: false,
        }
      }

      const fetchedAt = new Date().toISOString()
      const items = Array.isArray(data.body.items.item)
        ? data.body.items.item
        : [data.body.items.item]

      let normalized = items.map((item) => normalizeAnnouncement(item, fetchedAt))

      // 상태 필터링
      if (filters.status && filters.status !== 'all') {
        normalized = normalized.filter((item) => item.status === filters.status)
      }

      // 카테고리 필터링
      if (filters.category) {
        const categoryKeywords = SBIZ24_CATEGORY_CODES[filters.category].keywords
        normalized = normalized.filter((item) =>
          categoryKeywords.some(
            (keyword) =>
              item.title.includes(keyword) ||
              item.summary.includes(keyword) ||
              item.supportContent.includes(keyword)
          )
        )
      }

      const result: SBiz24SearchResult = {
        success: true,
        data: normalized,
        totalCount: data.body.totalCount || normalized.length,
        page: data.body.pageNo || filters.page || 1,
        pageSize: data.body.numOfRows || filters.pageSize || this.config.defaultPageSize,
        hasMore:
          (data.body.pageNo || 1) * (data.body.numOfRows || this.config.defaultPageSize) <
          (data.body.totalCount || 0),
      }

      // 캐시 저장
      this.setCache(cacheKey, result)

      return result
    } catch (error) {
      // 에러 로깅
      logError('search', 'API 호출 실패', error)

      if (error instanceof SBiz24ApiError) {
        // throwOnError가 true면 예외 다시 발생
        if (this.config.throwOnError) {
          throw error
        }

        return {
          success: false,
          data: [],
          totalCount: 0,
          page: filters.page || 1,
          pageSize: filters.pageSize || this.config.defaultPageSize,
          hasMore: false,
          error: error.message,
        }
      }

      const unknownError = new SBiz24ApiError('UNKNOWN', '알 수 없는 오류가 발생했습니다.')

      // throwOnError가 true면 예외 발생
      if (this.config.throwOnError) {
        throw unknownError
      }

      return {
        success: false,
        data: [],
        totalCount: 0,
        page: filters.page || 1,
        pageSize: filters.pageSize || this.config.defaultPageSize,
        hasMore: false,
        error: unknownError.message,
      }
    }
  }

  /**
   * 접수 중인 공고 조회
   */
  async getActive(pageSize?: number): Promise<SBiz24SearchResult> {
    return this.search({ status: 'open', pageSize })
  }

  /**
   * 키워드 검색
   */
  async searchByKeyword(keyword: string, pageSize?: number): Promise<SBiz24SearchResult> {
    return this.search({ keyword, pageSize })
  }

  /**
   * 카테고리별 조회
   */
  async getByCategory(category: SBiz24CategoryCode, pageSize?: number): Promise<SBiz24SearchResult> {
    return this.search({ category, pageSize })
  }

  /**
   * 건강 체크
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string; apiKeyConfigured: boolean }> {
    const apiKeyConfigured = !!this.config.apiKey

    if (!apiKeyConfigured) {
      return {
        healthy: false,
        message: '소상공인24 API 키가 설정되지 않았습니다. SBIZ24_API_KEY 환경변수를 확인하세요.',
        apiKeyConfigured,
      }
    }

    try {
      const result = await this.search({ pageSize: 1 })
      return {
        healthy: result.success,
        message: result.success ? 'API 연결 성공' : result.error || '연결 실패',
        apiKeyConfigured,
      }
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        apiKeyConfigured,
      }
    }
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

let sbiz24ClientInstance: SBiz24Client | null = null

export function getSBiz24Client(): SBiz24Client {
  if (!sbiz24ClientInstance) {
    sbiz24ClientInstance = new SBiz24Client()
  }
  return sbiz24ClientInstance
}

export function initSBiz24Client(config: SBiz24ClientConfig): SBiz24Client {
  sbiz24ClientInstance = new SBiz24Client(config)
  return sbiz24ClientInstance
}
