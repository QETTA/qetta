/**
 * 기업마당 (BizInfo) API 모듈
 *
 * @module data-sources/bizinfo
 *
 * @example
 * ```ts
 * import { bizInfoClient, getBizInfoClient } from '@/lib/skill-engine/data-sources/bizinfo'
 *
 * // 접수 중인 공고 조회
 * const result = await getBizInfoClient().getActive()
 *
 * // 키워드 검색
 * const smartFactory = await getBizInfoClient().searchByKeyword('스마트공장')
 *
 * // 분야별 조회
 * const finance = await getBizInfoClient().getByField('금융')
 * ```
 */

// 클라이언트
export { BizInfoClient, getBizInfoClient, initBizInfoClient } from './client'

// 타입
export type {
  // API 관련
  BizInfoApiParams,
  BizInfoApiResponse,
  BizInfoAnnouncementItem,
  BizInfoClientConfig,

  // 검색 관련
  BizInfoSearchFilters,
  BizInfoSearchResult,

  // 정규화된 데이터
  NormalizedBizInfoAnnouncement,

  // 코드
  BizInfoFieldCode,
  BizInfoRegionCode,
  BizInfoErrorCode,
} from './types'

// 상수
export { BIZINFO_FIELD_CODES, BIZINFO_REGION_CODES, BIZINFO_ERROR_CODES, BizInfoApiError } from './types'
