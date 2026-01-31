/**
 * UNGM (UN Global Marketplace) API 모듈
 *
 * @module data-sources/ungm
 *
 * QETTA Global Tender 도메인 엔진 - 63만+ 글로벌 입찰 DB
 * UN 산하 기관 조달 시스템 (www.ungm.org)
 *
 * UN 기관:
 * - UNDP (UN Development Programme)
 * - UNICEF (UN Children's Fund)
 * - WFP (World Food Programme)
 * - WHO (World Health Organization)
 * - UNHCR (UN High Commissioner for Refugees)
 * - FAO (Food and Agriculture Organization)
 * - UNEP (UN Environment Programme)
 * - 그 외 20+ 기관
 *
 * @example
 * ```ts
 * import { getUngmClient } from '@/lib/skill-engine/data-sources/ungm'
 *
 * // 진행 중인 입찰 조회
 * const result = await getUngmClient().getActive()
 *
 * // 키워드 검색
 * const itTenders = await getUngmClient().searchByKeyword('IT services')
 *
 * // UN 기관별 검색
 * const undpTenders = await getUngmClient().searchByAgency('UNDP')
 *
 * // 마감 임박 공고 (7일 이내)
 * const urgent = await getUngmClient().getClosingSoon(7)
 *
 * // API 상태 확인
 * const isHealthy = await getUngmClient().healthCheck()
 *
 * // 지원 기관 목록
 * const agencies = getUngmClient().getAvailableAgencies()
 * ```
 */

// 클라이언트
export { UngmClient, getUngmClient, initUngmClient } from './client'

// 타입
export type {
  // API 관련
  UngmApiParams,
  UngmApiResponse,
  UngmNoticeItem,
  UngmClientConfig,

  // 검색 관련
  UngmSearchFilters,
  UngmSearchResult,

  // 정규화된 데이터
  NormalizedUngmTender,
  // NormalizedTenderStatus는 goszakup에서 이미 export됨 (중복 방지)

  // 코드
  UngmNoticeStatus,
  UngmProcurementType,
  UngmErrorCode,
  UnAgency,
} from './types'

// 상수
export {
  UN_AGENCIES,
  UNGM_NOTICE_STATUS,
  UNGM_PROCUREMENT_TYPES,
  UNGM_ERROR_CODES,
  UngmApiError,
} from './types'
