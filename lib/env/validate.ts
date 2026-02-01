/**
 * Environment Variable Validation Utility
 *
 * Centralized environment variable validation with type-safe access
 * and meaningful error messages.
 */

import { logger } from '@/lib/api/logger'

export class EnvValidationError extends Error {
  constructor(
    public readonly variableName: string,
    public readonly context?: string
  ) {
    const contextMsg = context ? ` (${context})` : ''
    super(
      `Missing required environment variable: ${variableName}${contextMsg}\n` +
        `Please set ${variableName} in your .env.local file or environment.`
    )
    this.name = 'EnvValidationError'
  }
}

/**
 * Require an environment variable to be set.
 * Throws EnvValidationError if not found or empty.
 *
 * @param name - Environment variable name
 * @param context - Optional context description for better error messages
 * @returns The environment variable value
 * @throws {EnvValidationError} If variable is missing or empty
 */
export function requireEnv(name: string, context?: string): string {
  const value = process.env[name]

  if (!value || value.trim() === '') {
    throw new EnvValidationError(name, context)
  }

  return value
}

/**
 * Get an environment variable with a default fallback.
 *
 * @param name - Environment variable name
 * @param defaultValue - Default value if not found or empty
 * @returns The environment variable value or default
 */
export function getEnvOrDefault(name: string, defaultValue: string): string {
  const value = process.env[name]
  return value && value.trim() !== '' ? value : defaultValue
}

/**
 * Type-safe environment variable access.
 *
 * Use this object to access environment variables throughout the application.
 * Getters ensure variables are validated at access time with clear error messages.
 */
export const ENV = {
  /**
   * Anthropic API key for Claude AI integration.
   * Required in all environments.
   */
  get ANTHROPIC_API_KEY(): string {
    return requireEnv('ANTHROPIC_API_KEY', 'Claude AI integration')
  },

  /**
   * NextAuth.js secret for session encryption.
   * Required in production, uses default in development.
   */
  get NEXTAUTH_SECRET(): string {
    if (process.env.NODE_ENV === 'production') {
      return requireEnv('NEXTAUTH_SECRET', 'NextAuth session encryption')
    }
    return getEnvOrDefault('NEXTAUTH_SECRET', 'development-secret-key')
  },

  /**
   * NextAuth.js URL for OAuth callbacks.
   * Auto-detects from VERCEL_URL or defaults to localhost.
   */
  get NEXTAUTH_URL(): string {
    return getEnvOrDefault(
      'NEXTAUTH_URL',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    )
  },

  /**
   * Database connection string.
   * Optional - returns undefined if not set.
   */
  get DATABASE_URL(): string | undefined {
    const value = process.env.DATABASE_URL
    return value && value.trim() !== '' ? value : undefined
  },

  /**
   * Node environment (development, production, test).
   * Defaults to 'development'.
   */
  get NODE_ENV(): string {
    return getEnvOrDefault('NODE_ENV', 'development')
  },

  /**
   * Hancom Docs OAuth client ID.
   * Optional - used for document conversion integration.
   */
  get HANCOM_CLIENT_ID(): string | undefined {
    const value = process.env.HANCOM_CLIENT_ID
    return value && value.trim() !== '' ? value : undefined
  },

  /**
   * Hancom Docs OAuth client secret.
   * Optional - used for document conversion integration.
   */
  get HANCOM_CLIENT_SECRET(): string | undefined {
    const value = process.env.HANCOM_CLIENT_SECRET
    return value && value.trim() !== '' ? value : undefined
  },

  /**
   * Check if database is configured.
   * Returns true if DATABASE_URL is set and non-empty.
   */
  get HAS_DATABASE(): boolean {
    return !!this.DATABASE_URL
  },

  /**
   * Application URL for generating links (e.g., email verification).
   * Auto-detects from VERCEL_URL or defaults to localhost.
   */
  get NEXT_PUBLIC_APP_URL(): string {
    return getEnvOrDefault(
      'NEXT_PUBLIC_APP_URL',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    )
  },

  /**
   * Google OAuth Client ID.
   * Optional - used for Google login integration.
   */
  get GOOGLE_CLIENT_ID(): string | undefined {
    const value = process.env.GOOGLE_CLIENT_ID
    return value && value.trim() !== '' ? value : undefined
  },

  /**
   * Google OAuth Client Secret.
   * Optional - used for Google login integration.
   */
  get GOOGLE_CLIENT_SECRET(): string | undefined {
    const value = process.env.GOOGLE_CLIENT_SECRET
    return value && value.trim() !== '' ? value : undefined
  },

  /**
   * GitHub OAuth Client ID.
   * Optional - used for GitHub login integration.
   */
  get GITHUB_CLIENT_ID(): string | undefined {
    const value = process.env.GITHUB_CLIENT_ID
    return value && value.trim() !== '' ? value : undefined
  },

  /**
   * GitHub OAuth Client Secret.
   * Optional - used for GitHub login integration.
   */
  get GITHUB_CLIENT_SECRET(): string | undefined {
    const value = process.env.GITHUB_CLIENT_SECRET
    return value && value.trim() !== '' ? value : undefined
  },

  /**
   * Resend API Key for email sending.
   * Optional - used for sending verification and password reset emails.
   */
  get RESEND_API_KEY(): string | undefined {
    const value = process.env.RESEND_API_KEY
    return value && value.trim() !== '' ? value : undefined
  },

  /**
   * Email sender address (e.g., "QETTA <noreply@qetta.io>").
   */
  get EMAIL_FROM(): string {
    return getEnvOrDefault('EMAIL_FROM', 'QETTA <noreply@qetta.io>')
  },

  // ── Payment (Toss) ──────────────────────────────

  get TOSS_CLIENT_KEY(): string | undefined {
    const value = process.env.TOSS_CLIENT_KEY || process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    return value && value.trim() !== '' ? value : undefined
  },

  get TOSS_SECRET_KEY(): string | undefined {
    const value = process.env.TOSS_SECRET_KEY
    return value && value.trim() !== '' ? value : undefined
  },

  get TOSS_WEBHOOK_SECRET(): string | undefined {
    const value = process.env.TOSS_WEBHOOK_SECRET
    return value && value.trim() !== '' ? value : undefined
  },

  get HAS_PAYMENT(): boolean {
    return !!this.TOSS_CLIENT_KEY && !!this.TOSS_SECRET_KEY
  },

  // ── Redis ────────────────────────────────────────

  get REDIS_URL(): string | undefined {
    const value = process.env.REDIS_URL
    return value && value.trim() !== '' ? value : undefined
  },

  get HAS_REDIS(): boolean {
    return !!this.REDIS_URL
  },

  // ── Supabase ─────────────────────────────────────

  get SUPABASE_URL(): string | undefined {
    const value = process.env.SUPABASE_URL
    return value && value.trim() !== '' ? value : undefined
  },

  get SUPABASE_SERVICE_ROLE_KEY(): string | undefined {
    const value = process.env.SUPABASE_SERVICE_ROLE_KEY
    return value && value.trim() !== '' ? value : undefined
  },

  get HAS_SUPABASE(): boolean {
    return !!this.SUPABASE_URL && !!this.SUPABASE_SERVICE_ROLE_KEY
  },

  // ── Sentry ───────────────────────────────────────

  get SENTRY_DSN(): string | undefined {
    const value = process.env.SENTRY_DSN
    return value && value.trim() !== '' ? value : undefined
  },

  // ── Kakao Map ────────────────────────────────────

  get KAKAO_REST_API_KEY(): string | undefined {
    const value = process.env.KAKAO_REST_API_KEY
    return value && value.trim() !== '' ? value : undefined
  },

  get NEXT_PUBLIC_KAKAO_MAP_KEY(): string | undefined {
    const value = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
    return value && value.trim() !== '' ? value : undefined
  },
} as const

/**
 * Validate all required environment variables on application startup.
 * Call this in your application entry point to fail fast if config is missing.
 *
 * @throws {EnvValidationError} If any required variable is missing
 */
export function validateRequiredEnv(): void {
  // Accessing these getters will throw if required variables are missing
  const required = [ENV.ANTHROPIC_API_KEY, ENV.NEXTAUTH_SECRET]

  logger.debug(`[Env] Required: ${required.length} variables OK`)

  // Log optional service availability
  const services = {
    Database: ENV.HAS_DATABASE,
    Payment: ENV.HAS_PAYMENT,
    Redis: ENV.HAS_REDIS,
    Supabase: ENV.HAS_SUPABASE,
    Email: !!ENV.RESEND_API_KEY,
    Sentry: !!ENV.SENTRY_DSN,
    KakaoMap: !!ENV.KAKAO_REST_API_KEY,
    Google: !!ENV.GOOGLE_CLIENT_ID,
    GitHub: !!ENV.GITHUB_CLIENT_ID,
  }

  const active = Object.entries(services)
    .filter(([, v]) => v)
    .map(([k]) => k)
  const inactive = Object.entries(services)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (active.length > 0) {
    logger.debug(`[Env] Active services: ${active.join(', ')}`)
  }
  if (inactive.length > 0) {
    logger.debug(`[Env] Inactive services: ${inactive.join(', ')}`)
  }
}
