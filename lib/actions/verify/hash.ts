'use server'

/**
 * Server Action: Verify File Hash
 *
 * Calculates SHA-256 hash of uploaded file for verification purposes.
 * Replaces: POST /api/verify/hash
 *
 * Usage:
 * const result = await verifyFileHash(formData)
 */

import { generateSHA256 } from '@/lib/document-generator/hash-verifier'
import { logger } from '@/lib/api/logger'

export async function verifyFileHash(formData: FormData) {
  try {
    const file = formData.get('file') as File | null

    if (!file) {
      return {
        success: false,
        error: {
          code: 'MISSING_FILE',
          message: 'No file provided in request',
        },
      }
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Calculate SHA-256 hash (synchronous)
    const hash = generateSHA256(buffer)

    return {
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      hash,
      algorithm: 'SHA-256' as const,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[Hash Calculation Error]', error)
    return {
      success: false,
      error: {
        code: 'HASH_CALCULATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to calculate file hash',
      },
    }
  }
}
