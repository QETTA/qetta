/**
 * Standardized API Error Handling
 *
 * Provides consistent error responses across all API routes.
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/api/logger'
import { API_ERROR_MESSAGES, ERROR_MESSAGES } from '@/constants/messages'

// ============================================
// Error Codes
// ============================================

export type APIErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'PAYMENT_FAILED'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_TOKEN'

/**
 * HTTP Status codes for each error type
 */
const ERROR_STATUS_CODES: Record<APIErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  RATE_LIMITED: 429,
  PAYMENT_FAILED: 402,
  QUOTA_EXCEEDED: 402,
  INVALID_TOKEN: 401,
}

/**
 * Default Korean messages for each error code
 */
const DEFAULT_ERROR_MESSAGES: Record<APIErrorCode, string> = {
  VALIDATION_ERROR: '입력값이 올바르지 않습니다.',
  NOT_FOUND: ERROR_MESSAGES.NOT_FOUND,
  UNAUTHORIZED: ERROR_MESSAGES.UNAUTHORIZED,
  FORBIDDEN: ERROR_MESSAGES.FORBIDDEN,
  INTERNAL_ERROR: ERROR_MESSAGES.GENERIC,
  SERVICE_UNAVAILABLE: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
  RATE_LIMITED: ERROR_MESSAGES.RATE_LIMITED,
  PAYMENT_FAILED: ERROR_MESSAGES.PAYMENT.FAILED,
  QUOTA_EXCEEDED: ERROR_MESSAGES.DOCUMENT.QUOTA_EXCEEDED,
  INVALID_TOKEN: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
}

// ============================================
// APIError Class
// ============================================

export class APIError extends Error {
  constructor(
    public code: APIErrorCode,
    message?: string,
    public status?: number,
  ) {
    super(message || DEFAULT_ERROR_MESSAGES[code])
    this.name = 'APIError'
    this.status = status || ERROR_STATUS_CODES[code]
  }

  /**
   * Create a localized error with Korean message
   */
  static localized(code: APIErrorCode, customMessage?: string): APIError {
    return new APIError(code, customMessage)
  }

  /**
   * Common error factory methods
   */
  static unauthorized(message?: string) {
    return new APIError('UNAUTHORIZED', message)
  }

  static notFound(message?: string) {
    return new APIError('NOT_FOUND', message)
  }

  static validation(message?: string) {
    return new APIError('VALIDATION_ERROR', message)
  }

  static forbidden(message?: string) {
    return new APIError('FORBIDDEN', message)
  }

  static internal(message?: string) {
    return new APIError('INTERNAL_ERROR', message)
  }

  static rateLimited(message?: string) {
    return new APIError('RATE_LIMITED', message)
  }

  static paymentFailed(message?: string) {
    return new APIError('PAYMENT_FAILED', message)
  }

  static quotaExceeded(message?: string) {
    return new APIError('QUOTA_EXCEEDED', message)
  }
}

// ============================================
// Error Response Helper
// ============================================

export function createErrorResponse(
  code: APIErrorCode,
  message?: string,
) {
  return {
    success: false,
    error: {
      code,
      message: message || DEFAULT_ERROR_MESSAGES[code] || ERROR_MESSAGES.GENERIC,
    },
  } as const
}

// ============================================
// API Error Handler (try-catch wrapper)
// ============================================

export function handleAPIError(
  error: unknown,
  context: string = 'API',
): NextResponse {
  logger.error(`[API] ${context} error:`, error)

  if (error instanceof APIError) {
    return NextResponse.json(
      createErrorResponse(error.code, error.message),
      { status: error.status },
    )
  }

  // Log full error for debugging
  if (error instanceof Error) {
    logger.error(`[API] ${context} stack:`, error.stack)
  }

  return NextResponse.json(
    createErrorResponse('INTERNAL_ERROR', ERROR_MESSAGES.GENERIC),
    { status: 500 },
  )
}
