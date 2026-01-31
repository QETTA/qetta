'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook to detect scroll position for navbar transparency effect
 * Uses requestAnimationFrame throttling for optimal performance
 *
 * @param threshold - Scroll position (in pixels) to trigger the change (default: 50)
 * @returns boolean indicating if page has scrolled past threshold
 */
export function useScrollNavbar(threshold = 50): boolean {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > threshold)
          ticking = false
        })
        ticking = true
      }
    }

    // Set initial state
    setIsScrolled(window.scrollY > threshold)

    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return isScrolled
}
