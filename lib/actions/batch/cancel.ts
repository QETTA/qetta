'use server'

/**
 * Server Action: Cancel Batch Job
 *
 * Cancels a Claude Batch API job
 * Replaces: DELETE /api/batch/[id]
 *
 * Note: Cannot cancel completed or already-canceling batches
 */

import { ClaudeBatchClient } from '@/lib/claude/batch-client'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/api/logger'

// Batch client singleton
let batchClient: ClaudeBatchClient | null = null

function getBatchClient(): ClaudeBatchClient {
  if (!batchClient) {
    batchClient = new ClaudeBatchClient()
  }
  return batchClient
}

export async function cancelBatch(batchId: string) {
  try {
    if (!batchId) {
      return {
        success: false,
        error: 'Batch ID is required',
      }
    }

    const client = getBatchClient()

    // First check current status
    const currentStatus = await client.getBatchStatus(batchId)

    if (currentStatus.processing_status === 'ended') {
      return {
        success: false,
        error: 'Cannot cancel a completed batch',
        data: currentStatus,
      }
    }

    if (currentStatus.processing_status === 'canceling') {
      return {
        success: false,
        error: 'Batch is already being canceled',
        data: currentStatus,
      }
    }

    const canceledBatch = await client.cancelBatch(batchId)
    revalidatePath('/apply')

    return {
      success: true,
      data: canceledBatch,
      message: `Batch ${batchId} cancellation requested`,
    }
  } catch (error) {
    logger.error('[Batch Cancel] Error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Handle Anthropic API 404 errors
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return {
        success: false,
        error: 'Batch not found',
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
