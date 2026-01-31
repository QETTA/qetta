/**
 * 소상공인24 (SBiz24) API 모듈
 *
 * @module data-sources/sbiz24
 *
 * 마스터 플랜 우선순위: #2 (기업마당 다음)
 * 타겟: 소상공인 (연매출 10억 미만, 상시근로자 5인 미만)
 *
 * @example
 * ```ts
 * import { getSBiz24Client } from '@/lib/skill-engine/data-sources/sbiz24'
 *
 * // 접수 중인 공고 조회
 * const result = await getSBiz24Client().getActive()
 *
 * // 키워드 검색
 * const loans = await getSBiz24Client().searchByKeyword('정책자금')
 *
 * // 카테고리별 조회
 * const financing = await getSBiz24Client().getByCategory('financing')
 * ```
 */

// 클라이언트
export { SBiz24Client, getSBiz24Client, initSBiz24Client } from './client'

// 타입
export type {
  // API 관련
  SBiz24ApiResponse,
  SBiz24AnnouncementItem,
  SBiz24ClientConfig,

  // 검색 관련
  SBiz24SearchFilters,
  SBiz24SearchResult,

  // 정규화된 데이터
  NormalizedSBiz24Announcement,

  // 코드
  SBiz24CategoryCode,
  SBiz24RegionCode,
  SBiz24ErrorCode,
} from './types'

// 상수
export { SBIZ24_CATEGORY_CODES, SBIZ24_REGION_CODES, SBIZ24_ERROR_CODES, SBiz24ApiError } from './types'
