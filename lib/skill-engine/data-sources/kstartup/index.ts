/**
 * K-Startup Data Source
 *
 * 창업진흥원 K-Startup API 모듈 진입점
 *
 * @module data-sources/kstartup
 */

// Types
export type {
  KStartupSearchParams,
  KStartupSearchResult,
  KStartupRawAnnouncement,
  NormalizedKStartupAnnouncement,
  NormalizedKStartupStatus,
  KStartupClientConfig,
  KStartupSupportField,
  KStartupYear,
  KStartupInvestmentStage,
  KStartupTechField,
} from './types'

// Client
export { KStartupClient, kstartupClient, searchKStartup } from './client'
