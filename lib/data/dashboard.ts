/**
 * Data Fetching: Dashboard
 *
 * Parallel data fetching for dashboard overview
 * Next.js 15 unstable_cache + Promise.all pattern
 */

import { unstable_cache } from 'next/cache'
import { getDocumentStats } from './documents'
import { getVerificationStats } from './verify'
import { getApplicationStats } from './apply'
import { getEquipmentStats } from './monitor'

/**
 * Get all dashboard metrics in parallel (cached 60s)
 */
export const getDashboardMetrics = unstable_cache(
  async () => {
    // Parallel fetch all stats
    const [documents, verifications, applications, equipment] = await Promise.all([
      getDocumentStats(),
      getVerificationStats(),
      getApplicationStats(),
      getEquipmentStats(),
    ])

    return {
      documents,
      verifications,
      applications,
      equipment,
    }
  },
  ['dashboard-metrics'],
  {
    revalidate: 60,
    tags: ['dashboard', 'stats'],
  }
)

/**
 * Get recent activity feed (cached 60s)
 */
export const getRecentActivity = unstable_cache(
  async () => {
    const { db } = await import('@/lib/db')

    // Fetch recent items from all sections in parallel
    const [documents, verifications, applications] = await Promise.all([
      db.document.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),
      db.hashChainEntry.findMany({
        orderBy: { timestamp: 'desc' },
        take: 5,
        select: {
          id: true,
          documentHash: true,
          timestamp: true,
          document: {
            select: {
              title: true,
            },
          },
        },
      }),
      db.application.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),
    ])

    // Combine and sort by timestamp
    const activities = [
      ...documents.map((d: (typeof documents)[number]) => ({
        type: 'document' as const,
        data: d,
        timestamp: d.createdAt,
      })),
      ...verifications.map((v: (typeof verifications)[number]) => ({
        type: 'verification' as const,
        data: v,
        timestamp: v.timestamp,
      })),
      ...applications.map((a: (typeof applications)[number]) => ({
        type: 'application' as const,
        data: a,
        timestamp: a.createdAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    return activities
  },
  ['recent-activity'],
  {
    revalidate: 60,
    tags: ['dashboard', 'activity'],
  }
)
