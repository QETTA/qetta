/**
 * Data Fetching: Apply
 *
 * Cached database queries for APPLY page
 * Next.js 15 unstable_cache pattern
 */

import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

/**
 * Get recent applications (cached 60s)
 */
export const getRecentApplications = unstable_cache(
  async () => {
    return db.application.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        announcementId: true,
        status: true,
        submittedAt: true,
        createdAt: true,
      },
    })
  },
  ['recent-applications'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['applications'],
  }
)

/**
 * Get application stats (cached 60s)
 */
export const getApplicationStats = unstable_cache(
  async () => {
    const [total, queue, submitted, accepted, rejected] = await Promise.all([
      db.application.count(),
      db.application.count({ where: { status: 'QUEUE' } }),
      db.application.count({ where: { status: 'SUBMITTED' } }),
      db.application.count({ where: { status: 'ACCEPTED' } }),
      db.application.count({ where: { status: 'REJECTED' } }),
    ])

    return { total, queue, submitted, accepted, rejected }
  },
  ['application-stats'],
  {
    revalidate: 60,
    tags: ['applications', 'stats'],
  }
)
