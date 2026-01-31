/**
 * QETTA OAuth Types
 *
 * OAuth 인증 관련 공통 타입 정의
 */

// ============================================
// Token Types
// ============================================

export interface OAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  scope: string[]
  tokenType: 'Bearer'
}

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope?: string
}

// ============================================
// Provider Types
// ============================================

export type OAuthProvider = 'gmail' | 'outlook'

export interface OAuthConfig {
  provider: OAuthProvider
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface AuthorizationUrlParams {
  clientId: string
  redirectUri: string
  scopes: string[]
  state: string
  accessType?: 'online' | 'offline'
  prompt?: 'none' | 'consent' | 'select_account'
}

// ============================================
// User Info Types
// ============================================

export interface OAuthUserInfo {
  id: string
  email: string
  name?: string
  picture?: string
  provider: OAuthProvider
}

// ============================================
// Storage Types
// ============================================

export interface StoredCredentials {
  userId: string
  provider: OAuthProvider
  tokens: OAuthTokens
  userInfo: OAuthUserInfo
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Error Types
// ============================================

export class OAuthError extends Error {
  constructor(
    message: string,
    public code: OAuthErrorCode,
    public provider: OAuthProvider
  ) {
    super(message)
    this.name = 'OAuthError'
  }
}

export type OAuthErrorCode =
  | 'INVALID_GRANT'
  | 'INVALID_CLIENT'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'REFRESH_FAILED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

// ============================================
// Event Types
// ============================================

export interface OAuthEvent {
  type: 'token_refreshed' | 'token_revoked' | 'authorization_complete'
  provider: OAuthProvider
  userId: string
  timestamp: Date
}

export type OAuthEventCallback = (event: OAuthEvent) => void
