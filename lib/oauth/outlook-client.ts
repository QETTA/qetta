/**
 * QETTA Outlook OAuth Client
 *
 * Microsoft Graph API OAuth 2.0 인증 클라이언트
 *
 * 기능:
 * 1. Authorization URL 생성
 * 2. Authorization Code → Token 교환
 * 3. Token 자동 갱신
 * 4. Token 검증 및 폐기
 *
 * @see https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
 */

import type {
  OAuthTokens,
  TokenResponse,
  OAuthConfig,
  OAuthUserInfo,
  OAuthEventCallback,
  OAuthEvent,
} from './types'
import { OAuthError } from './types'
import { logger } from '@/lib/api/logger'

// ============================================
// Constants
// ============================================

const MICROSOFT_AUTH_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
const MICROSOFT_TOKEN_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const MICROSOFT_USERINFO_URL = 'https://graph.microsoft.com/v1.0/me'
const MICROSOFT_LOGOUT_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/logout'

/**
 * Microsoft Graph API에 필요한 최소 스코프
 * - Mail.Read: 이메일 읽기 (탈락 이메일 감지용)
 * - User.Read: 사용자 프로필 조회
 * - offline_access: Refresh Token 받기 위해 필수
 */
export const OUTLOOK_SCOPES = [
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/User.Read',
  'offline_access',
  'openid',
  'profile',
  'email',
]

// ============================================
// Outlook OAuth Client Class
// ============================================

export class OutlookOAuthClient {
  private config: OAuthConfig
  private eventCallbacks: OAuthEventCallback[] = []

  constructor(config?: Partial<OAuthConfig>) {
    this.config = {
      provider: 'outlook',
      clientId: config?.clientId || process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret:
        config?.clientSecret || process.env.MICROSOFT_CLIENT_SECRET || '',
      redirectUri:
        config?.redirectUri ||
        process.env.MICROSOFT_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/outlook`,
      scopes: config?.scopes || OUTLOOK_SCOPES,
    }
  }

  /**
   * 환경 변수 검증
   */
  validateConfig(): boolean {
    if (!this.config.clientId) {
      logger.error('[OutlookOAuth] Missing MICROSOFT_CLIENT_ID')
      return false
    }
    if (!this.config.clientSecret) {
      logger.error('[OutlookOAuth] Missing MICROSOFT_CLIENT_SECRET')
      return false
    }
    return true
  }

  /**
   * Authorization URL 생성
   *
   * 사용자를 Microsoft 로그인 페이지로 리다이렉트하기 위한 URL 생성
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      response_mode: 'query',
      state,
      prompt: 'consent', // 항상 동의 화면 표시
    })

    return `${MICROSOFT_AUTH_URL}?${params.toString()}`
  }

  /**
   * Authorization Code → Token 교환
   *
   * Microsoft OAuth 콜백에서 받은 code를 access_token으로 교환
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    if (!this.validateConfig()) {
      throw new OAuthError(
        'Invalid OAuth configuration',
        'INVALID_CLIENT',
        'outlook'
      )
    }

    try {
      const response = await fetch(MICROSOFT_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code',
          scope: this.config.scopes.join(' '),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new OAuthError(
          error.error_description || 'Token exchange failed',
          error.error === 'invalid_grant' ? 'INVALID_GRANT' : 'UNKNOWN_ERROR',
          'outlook'
        )
      }

      const data: TokenResponse = await response.json()

      return this.parseTokenResponse(data)
    } catch (error) {
      if (error instanceof OAuthError) throw error
      throw new OAuthError(
        `Network error during token exchange: ${error}`,
        'NETWORK_ERROR',
        'outlook'
      )
    }
  }

  /**
   * Token 갱신
   *
   * Access Token 만료 시 Refresh Token으로 새 토큰 발급
   */
  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    if (!this.validateConfig()) {
      throw new OAuthError(
        'Invalid OAuth configuration',
        'INVALID_CLIENT',
        'outlook'
      )
    }

    try {
      const response = await fetch(MICROSOFT_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
          scope: this.config.scopes.join(' '),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new OAuthError(
          error.error_description || 'Token refresh failed',
          'REFRESH_FAILED',
          'outlook'
        )
      }

      const data: TokenResponse = await response.json()

      const tokens = this.parseTokenResponse(data)
      // Microsoft는 항상 새 refresh token 반환
      if (!tokens.refreshToken) {
        tokens.refreshToken = refreshToken
      }

      // 이벤트 발생
      this.emitEvent({
        type: 'token_refreshed',
        provider: 'outlook',
        userId: '',
        timestamp: new Date(),
      })

      return tokens
    } catch (error) {
      if (error instanceof OAuthError) throw error
      throw new OAuthError(
        `Network error during token refresh: ${error}`,
        'NETWORK_ERROR',
        'outlook'
      )
    }
  }

  /**
   * Token 유효성 검증 (필요 시 자동 갱신)
   */
  async ensureValidTokens(tokens: OAuthTokens): Promise<OAuthTokens> {
    const now = new Date()
    const bufferMs = 5 * 60 * 1000 // 5분 여유

    if (tokens.expiresAt.getTime() - bufferMs > now.getTime()) {
      return tokens
    }

    if (!tokens.refreshToken) {
      throw new OAuthError(
        'Token expired and no refresh token available',
        'TOKEN_EXPIRED',
        'outlook'
      )
    }

    logger.debug('[OutlookOAuth] Token expired, refreshing...')
    return this.refreshTokens(tokens.refreshToken)
  }

  /**
   * 사용자 정보 조회 (Microsoft Graph API)
   */
  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      const response = await fetch(MICROSOFT_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new OAuthError(
          'Failed to fetch user info',
          'INVALID_TOKEN',
          'outlook'
        )
      }

      const data = await response.json()

      return {
        id: data.id,
        email: data.mail || data.userPrincipalName,
        name: data.displayName,
        picture: undefined, // Microsoft Graph는 별도 엔드포인트 필요
        provider: 'outlook',
      }
    } catch (error) {
      if (error instanceof OAuthError) throw error
      throw new OAuthError(
        `Network error fetching user info: ${error}`,
        'NETWORK_ERROR',
        'outlook'
      )
    }
  }

  /**
   * 로그아웃 URL 생성
   *
   * Microsoft는 token revoke 대신 logout URL로 리다이렉트
   */
  getLogoutUrl(postLogoutRedirectUri?: string): string {
    const params = new URLSearchParams()
    if (postLogoutRedirectUri) {
      params.set('post_logout_redirect_uri', postLogoutRedirectUri)
    }

    this.emitEvent({
      type: 'token_revoked',
      provider: 'outlook',
      userId: '',
      timestamp: new Date(),
    })

    return `${MICROSOFT_LOGOUT_URL}?${params.toString()}`
  }

  /**
   * Token 응답 파싱
   */
  private parseTokenResponse(data: TokenResponse): OAuthTokens {
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in)

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || '',
      expiresAt,
      scope: data.scope?.split(' ') || this.config.scopes,
      tokenType: 'Bearer',
    }
  }

  /**
   * 이벤트 콜백 등록
   */
  onEvent(callback: OAuthEventCallback): void {
    this.eventCallbacks.push(callback)
  }

  /**
   * 이벤트 발생
   */
  private emitEvent(event: OAuthEvent): void {
    for (const callback of this.eventCallbacks) {
      try {
        callback(event)
      } catch (error) {
        logger.error('[OutlookOAuth] Event callback error:', error)
      }
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let outlookClientInstance: OutlookOAuthClient | null = null

export function getOutlookOAuthClient(
  config?: Partial<OAuthConfig>
): OutlookOAuthClient {
  if (!outlookClientInstance) {
    outlookClientInstance = new OutlookOAuthClient(config)
  }
  return outlookClientInstance
}

export function initOutlookOAuthClient(
  config?: Partial<OAuthConfig>
): OutlookOAuthClient {
  outlookClientInstance = new OutlookOAuthClient(config)
  return outlookClientInstance
}

// 기본 export
export const outlookOAuth = getOutlookOAuthClient()
