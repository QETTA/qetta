/**
 * QETTA Data Sources
 *
 * 정부지원사업 및 글로벌 입찰 데이터 수집 레이어
 *
 * 우선순위 (도메인 엔진 마스터 플랜 v1.0):
 * 1. 기업마당 (bizinfo.go.kr) - 통합 포털
 * 2. 소상공인24 (sbiz24.kr) - 소상공인 특화
 * 3. K-Startup (k-startup.go.kr) - 창업 특화
 *
 * 글로벌 입찰 (Global Tender - 63만+ DB):
 * 4. Goszakup (goszakup.gov.kz) - 카자흐스탄 정부 조달
 * 5. SAM.gov (api.sam.gov) - 미국 연방 정부 조달
 * 6. UNGM (www.ungm.org) - UN 산하 기관 조달
 *
 * @module data-sources
 */

// #1 기업마당 (BizInfo)
export * from './bizinfo'

// #2 소상공인24 (SBiz24)
export * from './sbiz24'

// #3 K-Startup (창업진흥원)
export * from './kstartup'

// #4 Goszakup (카자흐스탄)
export * from './goszakup'

// #5 SAM.gov (미국 연방)
export * from './samgov'

// #6 UNGM (UN 조달)
export * from './ungm'
