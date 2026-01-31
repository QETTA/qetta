/**
 * SAM.gov (미국 연방 조달) API 모듈
 *
 * @module data-sources/samgov
 *
 * QETTA Global Tender 도메인 엔진 - 63만+ 글로벌 입찰 DB
 * 미국 연방 정부 조달 시스템 (api.sam.gov)
 *
 * 연방 기관:
 * - DOD (Department of Defense)
 * - HHS (Department of Health and Human Services)
 * - DHS (Department of Homeland Security)
 * - DOE (Department of Energy)
 * - NASA (National Aeronautics and Space Administration)
 * - EPA (Environmental Protection Agency)
 * - GSA (General Services Administration)
 * - 그 외 20+ 기관
 *
 * 공고 유형:
 * - Combined Synopsis/Solicitation (통합 공고)
 * - Presolicitation (사전 공고)
 * - Sources Sought (공급원 탐색)
 * - Award Notice (낙찰 공고)
 * - Special Notice (특별 공고)
 *
 * Set-Aside 유형:
 * - Small Business (소기업)
 * - SDVOSBC (서비스 장애 재향군인 소유 소기업)
 * - WOSB (여성 소유 소기업)
 * - HUBZone (역사적 저활용 비즈니스 존)
 * - 8(a) Set-Aside
 *
 * @example
 * ```ts
 * import { getSamGovClient } from '@/lib/skill-engine/data-sources/samgov'
 *
 * // 진행 중인 입찰 조회
 * const result = await getSamGovClient().getActive()
 *
 * // 키워드 검색
 * const itTenders = await getSamGovClient().searchByKeyword('cloud computing')
 *
 * // 연방 기관별 검색
 * const dodTenders = await getSamGovClient().searchByAgency('DOD')
 *
 * // NAICS 코드별 검색 (IT 서비스)
 * const techTenders = await getSamGovClient().searchByNaics('541511')
 *
 * // Set-Aside 유형별 검색
 * const smallBizTenders = await getSamGovClient().searchBySetAside('SBA')
 *
 * // 마감 임박 공고 (14일 이내)
 * const urgent = await getSamGovClient().getClosingSoon(14)
 *
 * // API 상태 확인
 * const isHealthy = await getSamGovClient().healthCheck()
 *
 * // 지원 기관 목록
 * const agencies = getSamGovClient().getAvailableAgencies()
 *
 * // 공고 유형 목록
 * const noticeTypes = getSamGovClient().getNoticeTypes()
 *
 * // Set-Aside 유형 목록
 * const setAsideTypes = getSamGovClient().getSetAsideTypes()
 * ```
 */

// 클라이언트
export { SamGovClient, getSamGovClient, initSamGovClient } from './client'

// 타입
export type {
  // API 관련
  SamGovApiParams,
  SamGovApiResponse,
  SamGovOpportunityItem,
  SamGovClientConfig,

  // 검색 관련
  SamGovSearchFilters,
  SamGovSearchResult,

  // 정규화된 데이터
  NormalizedSamGovTender,
  // NormalizedTenderStatus는 goszakup에서 이미 export됨 (중복 방지)

  // 코드
  SamNoticeType,
  SamSetAsideType,
  SamFederalAgency,
  SamGovErrorCode,
} from './types'

// 상수
export {
  SAM_NOTICE_TYPES,
  SAM_SET_ASIDE_TYPES,
  SAM_FEDERAL_AGENCIES,
  SAM_GOV_ERROR_CODES,
  SamGovApiError,
} from './types'
