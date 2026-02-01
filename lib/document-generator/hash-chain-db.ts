/**
 * Hash Chain DB Persistence (Server-Only)
 *
 * DB 영속화 함수들. 클라이언트 번들에 포함되지 않도록 분리.
 * API route에서만 import.
 *
 * @module document-generator/hash-chain-db
 */

import 'server-only'
import { db } from '@/lib/db'
import type { HashChainEntry } from './hash-verifier'
import { toPrismaJsonValue } from '@/lib/utils/type-guards'

/**
 * DB에 해시체인 엔트리 영속화
 * Document 레코드가 먼저 존재해야 함 (FK 제약)
 */
export async function persistHashChainEntry(
  entry: HashChainEntry,
  documentId: string
): Promise<void> {
  try {
    await db.hashChainEntry.create({
      data: {
        id: entry.id,
        documentId,
        documentHash: entry.documentHash,
        previousHash: entry.previousHash,
        signature: entry.signature,
        metadata: toPrismaJsonValue(entry.metadata) ?? {},
        timestamp: new Date(entry.timestamp),
      },
    })
  } catch {
    // DB 미연결 시 조용히 실패 (개발 환경 등)
  }
}

/**
 * DB에서 해시체인 엔트리 조회
 */
export async function getHashChainEntryFromDB(id: string): Promise<HashChainEntry | null> {
  try {
    const dbEntry = await db.hashChainEntry.findUnique({ where: { id } })
    if (!dbEntry) return null

    return {
      id: dbEntry.id,
      documentHash: dbEntry.documentHash,
      previousHash: dbEntry.previousHash,
      timestamp: dbEntry.timestamp.toISOString(),
      metadata: dbEntry.metadata as HashChainEntry['metadata'],
      signature: dbEntry.signature,
    }
  } catch {
    return null
  }
}

/**
 * DB에서 전체 해시체인 조회
 */
export async function getAllHashChainEntriesFromDB(): Promise<HashChainEntry[]> {
  try {
    const dbEntries = await db.hashChainEntry.findMany({
      orderBy: { timestamp: 'asc' },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma types unavailable without prisma generate
    return dbEntries.map((e: any) => ({
      id: e.id,
      documentHash: e.documentHash,
      previousHash: e.previousHash,
      timestamp: e.timestamp.toISOString(),
      metadata: e.metadata as HashChainEntry['metadata'],
      signature: e.signature,
    }))
  } catch {
    return []
  }
}
