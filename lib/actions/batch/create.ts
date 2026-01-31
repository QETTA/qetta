'use server'

/**
 * Server Action: Create Batch Job
 *
 * Creates a Claude Batch API job for processing multiple items
 * Replaces: POST /api/batch
 *
 * Features:
 * - 50% cost reduction vs regular API
 * - 24h turnaround
 * - 100→1000 items/day capacity
 *
 * @see https://docs.anthropic.com/en/docs/build-with-claude/batch-processing
 */

import { ClaudeBatchClient, type AnnouncementForBatch } from '@/lib/claude/batch-client'
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

type BatchType = 'announcement_analysis' | 'rejection_classification'

interface CreateBatchParams {
  type: BatchType
  items: Record<string, unknown>[]
}

export async function createBatch(params: CreateBatchParams) {
  try {
    const { type, items } = params

    // Validate request
    if (!type || !items || !Array.isArray(items) || items.length === 0) {
      return {
        success: false,
        error: 'type and items array are required',
      }
    }

    // Validate batch size (Anthropic limit: max 10,000)
    if (items.length > 10000) {
      return {
        success: false,
        error: 'Maximum 10,000 items per batch',
      }
    }

    const client = getBatchClient()

    switch (type) {
      case 'announcement_analysis': {
        // Validate announcement items
        const announcements = items.map((raw) => {
          const item = raw as Partial<AnnouncementForBatch>
          return {
            id: item.id || crypto.randomUUID(),
            title: item.title || '',
            description: item.description || '',
            agency: item.agency,
            deadline: item.deadline,
            targetDescription: item.targetDescription,
          }
        })

        const batch = await client.createAnnouncementAnalysisBatch(announcements)
        revalidatePath('/apply')

        return {
          success: true,
          data: batch,
          message: `Batch ${batch.id} created with ${items.length} items`,
        }
      }

      case 'rejection_classification': {
        // Validate rejection items
        const rejections = items.map((raw) => {
          const item = raw as { id?: string; text: string; domain?: string }
          return {
            id: item.id || crypto.randomUUID(),
            text: item.text || '',
            domain: item.domain,
          }
        })

        const batch = await client.createRejectionClassificationBatch(rejections)
        revalidatePath('/apply')

        return {
          success: true,
          data: batch,
          message: `Batch ${batch.id} created with ${items.length} items`,
        }
      }

      default:
        return {
          success: false,
          error: `Unsupported batch type: ${type}. Supported: announcement_analysis, rejection_classification`,
        }
    }
  } catch (error) {
    logger.error('[Batch Create] Error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
