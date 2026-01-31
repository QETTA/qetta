'use server'

/**
 * Server Action: Submit Hash Chain
 *
 * 해시체인 제출 (문서 무결성 검증)
 * Replaces: POST /api/verify/chain
 *
 * Features:
 * - SHA-256 해시체인 생성
 * - 이전 해시 연결
 * - 블록체인 없는 무결성 검증
 *
 * @see lib/document-generator/hash-verifier
 */

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { generateSHA256 } from '@/lib/document-generator/hash-verifier'
import { logger } from '@/lib/api/logger'

interface SubmitHashChainParams {
  documentId: string
  documentHash: string
}

export async function submitHashChain(params: SubmitHashChainParams) {
  try {
    const { documentId, documentHash } = params

    if (!documentId || !documentHash) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'documentId and documentHash are required',
        },
      }
    }

    // Get previous hash chain entry (if exists)
    const previousEntry = await db.hashChainEntry.findFirst({
      where: { documentId },
      orderBy: { timestamp: 'desc' },
    })

    // Generate new hash (chaining previous hash if exists)
    const dataToHash = previousEntry
      ? `${documentHash}${previousEntry.documentHash}`
      : documentHash

    const signature = generateSHA256(Buffer.from(dataToHash))

    // Create new hash chain entry
    const entry = await db.hashChainEntry.create({
      data: {
        documentId,
        documentHash,
        previousHash: previousEntry?.documentHash || null,
        signature,
        timestamp: new Date(),
      },
    })

    // Revalidate verify page
    revalidatePath('/verify')

    return {
      success: true,
      data: {
        id: entry.id,
        documentHash: entry.documentHash,
        previousHash: entry.previousHash,
        signature: entry.signature,
        timestamp: entry.timestamp.toISOString(),
      },
      message: '해시체인 제출 완료',
    }
  } catch (error) {
    logger.error('[Hash Chain Submission Error]', error)

    return {
      success: false,
      error: {
        code: 'SUBMISSION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}
