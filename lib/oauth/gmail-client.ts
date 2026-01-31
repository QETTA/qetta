/**
 * QETTA Gmail OAuth Client
 *
 * Gmail API OAuth 2.0 인증 클라이언트
 *
 * 기능:
 * 1. Authorization URL 생성
 * 2. Authorization Code → Token 교환
 * 3. Token 자동 갱신
 * 4. Token 검증 및 폐기
 *
 * @see https://developers.google.com/identity/protocols/oauth2/web-server
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

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke'

/**
 * Gmail API에 필요한 최소 스코프
 * - gmail.readonly: 이메일 읽기 (탈락 이메일 감지용)
 * - userinfo.email: 사용자 이메일 조회
 */
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

// ============================================
// Gmail OAuth Client Class
// ============================================

export class GmailOAuthClient {
  private config: OAuthConfig
  private eventCallbacks: OAuthEventCallback[] = []

  constructor(config?: Partial<OAuthConfig>) {
    this.config = {
      provider: 'gmail',
      clientId: config?.clientId || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: config?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri:
        config?.redirectUri ||
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/gmail`,
      scopes: config?.scopes || GMAIL_SCOPES,
    }
  }

  /**
   * 환경 변수 검증
   */
  validateConfig(): boolean {
    if (!this.config.clientId) {
      logger.error('[GmailOAuth] Missing GOOGLE_CLIENT_ID')
      return false
    }
    if (!this.config.clientSecret) {
      logger.error('[GmailOAuth] Missing GOOGLE_CLIENT_SECRET')
      return false
    }
    return true
  }

  /**
   * Authorization URL 생성
   *
   * 사용자를 Google 로그인 페이지로 리다이렉트하기 위한 URL 생성
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline', // Refresh Token 받기 위해 필수
      prompt: 'consent', // 항상 동의 화면 표시 (refresh token 보장)
      state,
    })

    return `${GOOGLE_AUTH_URL}?${params.toString()}`
  }

  /**
   * Authorization Code → Token 교환
   *
   * Google OAuth 콜백에서 받은 code를 access_token으로 교환
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    if (!this.validateConfig()) {
      throw new OAuthError(
        'Invalid OAuth configuration',
        'INVALID_CLIENT',
        'gmail'
      )
    }

    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
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
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new OAuthError(
          error.error_description || 'Token exchange failed',
          error.error === 'invalid_grant' ? 'INVALID_GRANT' : 'UNKNOWN_ERROR',
          'gmail'
        )
      }

      const data: TokenResponse = await response.json()

      return this.parseTokenResponse(data)
    } catch (error) {
      if (error instanceof OAuthError) throw error
      throw new OAuthError(
        `Network error during token exchange: ${error}`,
        'NETWORK_ERROR',
        'gmail'
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
        'gmail'
      )
    }

    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new OAuthError(
          error.error_description || 'Token refresh failed',
          'REFRESH_FAILED',
          'gmail'
        )
      }

      const data: TokenResponse = await response.json()

      // Refresh token은 갱신 응답에 포함되지 않을 수 있음
      const tokens = this.parseTokenResponse(data)
      if (!tokens.refreshToken) {
        tokens.refreshToken = refreshToken
      }

      // 이벤트 발생
      this.emitEvent({
        type: 'token_refreshed',
        provider: 'gmail',
        userId: '', // 호출자가 설정
        timestamp: new Date(),
      })

      return tokens
    } catch (error) {
      if (error instanceof OAuthError) throw error
      throw new OAuthError(
        `Network error during token refresh: ${error}`,
        'NETWORK_ERROR',
        'gmail'
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
      // 아직 유효함
      return tokens
    }

    // 만료 임박 또는 만료됨 - 갱신 필요
    if (!tokens.refreshToken) {
      throw new OAuthError(
        'Token expired and no refresh token available',
        'TOKEN_EXPIRED',
        'gmail'
      )
    }

    logger.debug('[GmailOAuth] Token expired, refreshing...')
    return this.refreshTokens(tokens.refreshToken)
  }

  /**
   * 사용자 정보 조회
   */
  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      const response = await fetch(GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new OAuthError(
          'Failed to fetch user info',
          'INVALID_TOKEN',
          'gmail'
        )
      }

      const data = await response.json()

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
        provider: 'gmail',
      }
    } catch (error) {
      if (error instanceof OAuthError) throw error
      throw new OAuthError(
        `Network error fetching user info: ${error}`,
        'NETWORK_ERROR',
        'gmail'
      )
    }
  }

  /**
   * Token 폐기 (로그아웃)
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const response = await fetch(`${GOOGLE_REVOKE_URL}?token=${token}`, {
        method: 'POST',
      })

      if (!response.ok && response.status !== 200) {
        logger.warn('[GmailOAuth] Token revocation may have failed')
      }

      this.emitEvent({
        type: 'token_revoked',
        provider: 'gmail',
        userId: '',
        timestamp: new Date(),
      })
    } catch (error) {
      logger.error('[GmailOAuth] Token revocation error:', error)
    }
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
        logger.error('[GmailOAuth] Event callback error:', error)
      }
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let gmailClientInstance: GmailOAuthClient | null = null

export function getGmailOAuthClient(
  config?: Partial<OAuthConfig>
): GmailOAuthClient {
  if (!gmailClientInstance) {
    gmailClientInstance = new GmailOAuthClient(config)
  }
  return gmailClientInstance
}

export function initGmailOAuthClient(
  config?: Partial<OAuthConfig>
): GmailOAuthClient {
  gmailClientInstance = new GmailOAuthClient(config)
  return gmailClientInstance
}

// 기본 export
export const gmailOAuth = getGmailOAuthClient()
