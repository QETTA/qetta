/**
 * Data Fetching: Monitor
 *
 * Cached database queries for MONITOR page
 * Next.js 15 unstable_cache pattern
 */

import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

/**
 * Get recent equipment status (cached 30s - more frequent for real-time)
 */
export const getRecentEquipment = unstable_cache(
  async () => {
    return db.equipment.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        location: true,
        operator: true,
        operatorInitial: true,
        lastChecked: true,
        updatedAt: true,
      },
    })
  },
  ['recent-equipment'],
  {
    revalidate: 30, // Cache for 30 seconds (real-time data)
    tags: ['equipment'],
  }
)

/**
 * Get equipment stats (cached 30s)
 */
export const getEquipmentStats = unstable_cache(
  async () => {
    const [total, normal, warning, critical, maintenance] = await Promise.all([
      db.equipment.count(),
      db.equipment.count({ where: { status: 'NORMAL' } }),
      db.equipment.count({ where: { status: 'WARNING' } }),
      db.equipment.count({ where: { status: 'CRITICAL' } }),
      db.equipment.count({ where: { status: 'MAINTENANCE' } }),
    ])

    return { total, normal, warning, critical, maintenance }
  },
  ['equipment-stats'],
  {
    revalidate: 30,
    tags: ['equipment', 'stats'],
  }
)

/**
 * Get recent sensor readings (cached 30s)
 */
export const getRecentSensorReadings = unstable_cache(
  async () => {
    return db.sensorReading.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100, // Last 100 readings for charts
      select: {
        id: true,
        equipmentId: true,
        type: true,
        value: true,
        unit: true,
        status: true,
        timestamp: true,
      },
    })
  },
  ['recent-sensor-readings'],
  {
    revalidate: 30,
    tags: ['sensors'],
  }
)
