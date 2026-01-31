/**
 * useScrollProgress Hook
 *
 * Tracks scroll progress relative to an element for parallax and scroll-driven effects.
 * Returns a progress value (0-1) representing how far the element has scrolled.
 *
 * Usage:
 * ```tsx
 * const parallax = useScrollProgress(ref, { start: 0, end: 500 })
 * <div style={{ transform: `translateY(${parallax * 50}px)` }} />
 * ```
 */

import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { useReducedMotion } from './use-reduced-motion'

interface ScrollProgressOptions {
  /**
   * Scroll position to start tracking (px from top)
   * Default: 0
   */
  start?: number

  /**
   * Scroll position to end tracking (px from top)
   * Default: 1000
   */
  end?: number

  /**
   * Enable smooth interpolation
   * Default: true
   */
  smooth?: boolean
}

export function useScrollProgress(
  _ref: RefObject<HTMLElement> | null,
  options: ScrollProgressOptions = {}
): number {
  const { start = 0, end = 1000, smooth = true } = options
  const [progress, setProgress] = useState(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    // Disable scroll effects if user prefers reduced motion
    if (reducedMotion) {
      setProgress(0)
      return
    }

    const handleScroll = () => {
      const scrollY = window.scrollY
      const scrollRange = end - start

      if (scrollY < start) {
        setProgress(0)
      } else if (scrollY > end) {
        setProgress(1)
      } else {
        const rawProgress = (scrollY - start) / scrollRange
        // Apply easing if smooth is enabled
        const easedProgress = smooth
          ? 1 - Math.pow(1 - rawProgress, 3) // easeOutCubic
          : rawProgress
        setProgress(easedProgress)
      }
    }

    // Initial calculation
    handleScroll()

    // Throttled scroll listener for performance
    let rafId: number | null = null
    const throttledScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          handleScroll()
          rafId = null
        })
      }
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [start, end, smooth, reducedMotion])

  return progress
}

/**
 * useParallax Hook
 *
 * Simplified parallax effect hook
 * Returns transform value for CSS
 *
 * Usage:
 * ```tsx
 * const parallax = useParallax({ speed: 0.5 })
 * <div style={{ transform: `translateY(${parallax}px)` }} />
 * ```
 */
export function useParallax(options: { speed?: number } = {}) {
  const { speed = 0.5 } = options
  const [offset, setOffset] = useState(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) {
      setOffset(0)
      return
    }

    const handleScroll = () => {
      const scrollY = window.scrollY
      setOffset(scrollY * speed)
    }

    // Throttled with RAF
    let rafId: number | null = null
    const throttledScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          handleScroll()
          rafId = null
        })
      }
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [speed, reducedMotion])

  return offset
}
