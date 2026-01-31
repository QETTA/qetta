/**
 * QETTA OAuth Module
 *
 * Gmail/Outlook OAuth 2.0 통합 모듈
 *
 * @example
 * ```ts
 * import { gmailOAuth, outlookOAuth, OAuthError } from '@/lib/oauth'
 *
 * // Gmail OAuth
 * const authUrl = gmailOAuth.getAuthorizationUrl(state)
 * const tokens = await gmailOAuth.exchangeCodeForTokens(code)
 *
 * // Outlook OAuth
 * const authUrl = outlookOAuth.getAuthorizationUrl(state)
 * const tokens = await outlookOAuth.exchangeCodeForTokens(code)
 * ```
 */

// Gmail OAuth
export {
  GmailOAuthClient,
  getGmailOAuthClient,
  initGmailOAuthClient,
  gmailOAuth,
  GMAIL_SCOPES,
} from './gmail-client'

// Outlook OAuth
export {
  OutlookOAuthClient,
  getOutlookOAuthClient,
  initOutlookOAuthClient,
  outlookOAuth,
  OUTLOOK_SCOPES,
} from './outlook-client'

// Types (re-export)
export { OAuthError } from './types'

export type {
  OAuthTokens,
  TokenResponse,
  OAuthConfig,
  OAuthUserInfo,
  StoredCredentials,
  OAuthProvider,
  OAuthErrorCode,
  OAuthEvent,
  OAuthEventCallback,
} from './types'

// ============================================
// Utility Functions
// ============================================

import { gmailOAuth } from './gmail-client'
import { outlookOAuth } from './outlook-client'
import type { OAuthProvider } from './types'

/**
 * 프로바이더별 OAuth 클라이언트 반환
 */
export function getOAuthClient(provider: OAuthProvider) {
  switch (provider) {
    case 'gmail':
      return gmailOAuth
    case 'outlook':
      return outlookOAuth
    default:
      throw new Error(`Unknown OAuth provider: ${provider}`)
  }
}

/**
 * OAuth 연동 상태 확인
 */
export function isOAuthConfigured(provider: OAuthProvider): boolean {
  const client = getOAuthClient(provider)
  return client.validateConfig()
}

/**
 * 모든 OAuth 프로바이더 설정 상태 조회
 */
export function getOAuthStatus(): Record<OAuthProvider, boolean> {
  return {
    gmail: gmailOAuth.validateConfig(),
    outlook: outlookOAuth.validateConfig(),
  }
}
