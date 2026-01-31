/**
 * Data Fetching: Verify
 *
 * Cached database queries for VERIFY page
 * Next.js 15 unstable_cache pattern
 */

import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

/**
 * Get recent hash chain entries (cached 60s)
 */
export const getRecentVerifications = unstable_cache(
  async () => {
    return db.hashChainEntry.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20,
      select: {
        id: true,
        documentHash: true,
        previousHash: true,
        timestamp: true,
        document: {
          select: {
            title: true,
            domainEngine: true,
          },
        },
      },
    })
  },
  ['recent-verifications'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['verifications'],
  }
)

/**
 * Get verification stats (cached 60s)
 */
export const getVerificationStats = unstable_cache(
  async () => {
    const total = await db.hashChainEntry.count()
    const last24h = await db.hashChainEntry.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    })

    return { total, last24h }
  },
  ['verification-stats'],
  {
    revalidate: 60,
    tags: ['verifications', 'stats'],
  }
)
