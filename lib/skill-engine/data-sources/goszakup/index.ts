/**
 * Goszakup (카자흐스탄 전자조달) API 모듈
 *
 * @module data-sources/goszakup
 *
 * QETTA Global Tender 도메인 엔진 - 63만+ 글로벌 입찰 DB
 * 카자흐스탄 정부 조달 시스템 (goszakup.gov.kz)
 *
 * @example
 * ```ts
 * import { getGoszakupClient } from '@/lib/skill-engine/data-sources/goszakup'
 *
 * // 진행 중인 입찰 조회
 * const result = await getGoszakupClient().getActive()
 *
 * // 키워드 검색
 * const itTenders = await getGoszakupClient().searchByKeyword('IT services')
 *
 * // 예산 범위 검색 (100M KZT 이상)
 * const largeTenders = await getGoszakupClient().searchByBudget(100_000_000)
 *
 * // API 상태 확인
 * const isHealthy = await getGoszakupClient().healthCheck()
 * ```
 */

// 클라이언트
export { GoszakupClient, getGoszakupClient, initGoszakupClient } from './client'

// 타입
export type {
  // API 관련
  GoszakupApiParams,
  GoszakupApiResponse,
  GoszakupTenderItem,
  GoszakupLotItem,
  GoszakupClientConfig,

  // 검색 관련
  GoszakupSearchFilters,
  GoszakupSearchResult,

  // 정규화된 데이터
  NormalizedGoszakupTender,
  NormalizedTenderStatus,

  // 코드
  GoszakupTenderStatus,
  GoszakupProcurementType,
  GoszakupErrorCode,
} from './types'

// 상수
export {
  GOSZAKUP_TENDER_STATUS,
  GOSZAKUP_PROCUREMENT_TYPES,
  GOSZAKUP_ERROR_CODES,
  GoszakupApiError,
} from './types'
