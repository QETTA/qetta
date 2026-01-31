/**
 * Data Fetching: Documents
 *
 * Cached database queries for DOCS page
 * Next.js 15 unstable_cache pattern
 */

import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

/**
 * Get recent documents (cached 60s)
 */
export const getRecentDocuments = unstable_cache(
  async () => {
    return db.document.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        domainEngine: true,
        documentType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },
  ['recent-documents'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['documents'],
  }
)

/**
 * Get document count by status (cached 60s)
 */
export const getDocumentStats = unstable_cache(
  async () => {
    const [total, draft, generated, verified, submitted, rejected] = await Promise.all([
      db.document.count(),
      db.document.count({ where: { status: 'DRAFT' } }),
      db.document.count({ where: { status: 'GENERATED' } }),
      db.document.count({ where: { status: 'VERIFIED' } }),
      db.document.count({ where: { status: 'SUBMITTED' } }),
      db.document.count({ where: { status: 'REJECTED' } }),
    ])

    return { total, draft, generated, verified, submitted, rejected }
  },
  ['document-stats'],
  {
    revalidate: 60,
    tags: ['documents', 'stats'],
  }
)
