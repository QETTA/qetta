/**
 * Document Generation Error Handler
 *
 * Centralized error handling for document generation API endpoints.
 * Converts DocumentGenerationError to appropriate HTTP responses.
 */

import { NextResponse } from 'next/server'
import { DocumentGenerationError, DOC_ERROR_CODES, DOCUMENT_CONFIGS } from './types'
import type { GenerateDocumentRequest, EnginePresetType } from './types'

/**
 * HTTP status code mapping for document generation errors
 */
const ERROR_STATUS_CODES: Record<string, number> = {
  [DOC_ERROR_CODES.INVALID_DOMAIN]: 400, // Bad Request - Invalid domain engine
  [DOC_ERROR_CODES.INVALID_TYPE]: 400, // Bad Request - Invalid document type
  [DOC_ERROR_CODES.GENERATION_FAILED]: 500, // Internal Server Error - Generation failed
  [DOC_ERROR_CODES.HASH_FAILED]: 500, // Internal Server Error - Hash chain failed
} as const

/**
 * Convert DocumentGenerationError to HTTP response
 *
 * @param error - The error to convert
 * @returns NextResponse with appropriate status code and error details
 */
export function getErrorResponse(error: unknown): NextResponse {
  // Handle DocumentGenerationError
  if (error instanceof DocumentGenerationError) {
    const statusCode = ERROR_STATUS_CODES[error.code] ?? 500

    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          enginePreset: error.enginePreset,
          documentType: error.documentType,
        },
      },
      { status: statusCode }
    )
  }

  // Handle generic Error
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message,
        },
      },
      { status: 500 }
    )
  }

  // Handle unknown error types
  return NextResponse.json(
    {
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  )
}

/**
 * Type guard to check if an error is a DocumentGenerationError
 *
 * @param error - The error to check
 * @returns True if error is a DocumentGenerationError
 */
export function isDocumentGenerationError(error: unknown): error is DocumentGenerationError {
  return error instanceof DocumentGenerationError
}

/**
 * Create a standardized error response body
 *
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional additional details
 * @returns Error response object
 */
export function createErrorBody(
  code: string,
  message: string,
  details?: Record<string, unknown>
) {
  return {
    error: {
      code,
      message,
      ...details,
    },
  }
}

// ============================================
// Error Response Types
// ============================================

/**
 * Standard error response structure
 */
export interface DocumentErrorResponse {
  error: {
    code: string
    message: string
    enginePreset?: EnginePresetType
    documentType?: string
  }
}

// ============================================
// Error Factory Functions
// ============================================

/**
 * Validate document generation request
 *
 * @param request - The request to validate
 * @throws {DocumentGenerationError} If validation fails
 */
export function validateGenerateRequest(request: GenerateDocumentRequest): void {
  const { enginePreset, documentType } = request

  // Check domain engine exists
  const domainConfigs = DOCUMENT_CONFIGS[enginePreset]
  if (!domainConfigs) {
    throw createInvalidDomainError(enginePreset)
  }

  // Check document type exists for this domain
  const docConfig = domainConfigs[documentType]
  if (!docConfig) {
    throw createInvalidTypeError(enginePreset, documentType)
  }
}

/**
 * Create an invalid domain error
 */
export function createInvalidDomainError(enginePreset: EnginePresetType): DocumentGenerationError {
  return new DocumentGenerationError(
    `Invalid domain engine: ${enginePreset}. Valid domains: ${Object.keys(DOCUMENT_CONFIGS).join(', ')}`,
    DOC_ERROR_CODES.INVALID_DOMAIN,
    enginePreset
  )
}

/**
 * Create an invalid document type error
 */
export function createInvalidTypeError(
  enginePreset: EnginePresetType,
  documentType: string
): DocumentGenerationError {
  const availableTypes = Object.keys(DOCUMENT_CONFIGS[enginePreset] || {}).join(', ')
  return new DocumentGenerationError(
    `Invalid document type: ${documentType} for domain ${enginePreset}. Available types: ${availableTypes}`,
    DOC_ERROR_CODES.INVALID_TYPE,
    enginePreset,
    documentType
  )
}

/**
 * Create a document generation error
 */
export function createGenerationError(
  message: string,
  enginePreset?: EnginePresetType,
  documentType?: string
): DocumentGenerationError {
  return new DocumentGenerationError(message, DOC_ERROR_CODES.GENERATION_FAILED, enginePreset, documentType)
}

/**
 * Create a hash chain error
 */
export function createHashError(
  message: string,
  enginePreset?: EnginePresetType,
  documentType?: string
): DocumentGenerationError {
  return new DocumentGenerationError(message, DOC_ERROR_CODES.HASH_FAILED, enginePreset, documentType)
}
