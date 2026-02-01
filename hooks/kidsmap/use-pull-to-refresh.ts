'use client'

/**
 * Pull-to-Refresh Hook
 *
 * 2026 모바일 UX 표준:
 * - Haptic feedback at threshold
 * - Smooth pull resistance
 * - Visual feedback sync
 *
 * @module hooks/kidsmap/use-pull-to-refresh
 */

import { useRef, useCallback, useState } from 'react'
import { haptic } from '@/lib/kidsmap/haptic'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  /** Haptic feedback 활성화 (기본: true) */
  enableHaptic?: boolean
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enableHaptic = true,
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const pulling = useRef(false)
  const thresholdReached = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
      pulling.current = true
      thresholdReached.current = false
    }
  }, [])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || isRefreshing) return
      const diff = e.touches[0].clientY - startY.current
      if (diff > 0) {
        const newDistance = Math.min(diff * 0.5, threshold * 1.5)
        setPullDistance(newDistance)

        // Haptic feedback when threshold is reached
        if (enableHaptic && newDistance >= threshold && !thresholdReached.current) {
          thresholdReached.current = true
          haptic.impact()
        } else if (newDistance < threshold) {
          thresholdReached.current = false
        }
      }
    },
    [isRefreshing, threshold, enableHaptic],
  )

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false

    if (pullDistance >= threshold && !isRefreshing) {
      if (enableHaptic) haptic.medium()
      setIsRefreshing(true)
      setPullDistance(threshold * 0.6)
      try {
        await onRefresh()
        if (enableHaptic) haptic.success()
      } catch {
        if (enableHaptic) haptic.error()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh, enableHaptic])

  return { isRefreshing, pullDistance, onTouchStart, onTouchMove, onTouchEnd }
}
