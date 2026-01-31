/**
 * Standardized API Error Handling
 *
 * Provides consistent error responses across all API routes.
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/api/logger'

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

// ============================================
// APIError Class
// ============================================

export class APIError extends Error {
  constructor(
    public code: APIErrorCode,
    message: string,
    public status: number = 500,
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// ============================================
// Error Response Helper
// ============================================

export function createErrorResponse(
  code: APIErrorCode,
  message: string,
) {
  return {
    success: false,
    error: { code, message },
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

  const message =
    error instanceof Error ? error.message : 'Internal server error'

  return NextResponse.json(
    createErrorResponse('INTERNAL_ERROR', message),
    { status: 500 },
  )
}
