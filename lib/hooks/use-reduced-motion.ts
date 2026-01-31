'use client'

import { useEffect, useState } from 'react'

/**
 * useReducedMotion
 *
 * 사용자의 OS 레벨 reduced motion 설정 감지
 * WCAG 접근성 가이드라인 준수
 *
 * CSS의 `motion-reduce:` 프리픽스와 함께 사용하여
 * 전정기관 장애가 있는 사용자를 위한 접근성 지원
 *
 * @returns boolean - reduced motion이 활성화된 경우 true
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handleChange = () => setReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return reducedMotion
}

/**
 * Animation configuration hook for accessibility
 *
 * Returns animation config that respects prefers-reduced-motion.
 * Can be spread into inline styles.
 *
 * @example
 * const animationConfig = useAnimationConfig()
 * <div style={{ transition: animationConfig.reducedMotion ? 'none' : 'all 0.3s' }} />
 */
export function useAnimationConfig() {
  const shouldReduce = useReducedMotion()

  return {
    reducedMotion: shouldReduce,
    duration: shouldReduce ? 0 : 0.3,
    delay: shouldReduce ? 0 : 0,
    ease: 'ease-out',
  }
}

/**
 * Returns accessible animation CSS classes
 *
 * @example
 * const classes = useAccessibleAnimationClasses()
 * <div className={classes.fadeIn} />
 */
export function useAccessibleAnimationClasses() {
  const shouldReduce = useReducedMotion()

  return {
    fadeIn: shouldReduce ? 'opacity-100' : 'animate-fade-in',
    slideUp: shouldReduce ? 'translate-y-0' : 'animate-slide-up',
    scaleIn: shouldReduce ? 'scale-100' : 'animate-scale-in',
  }
}
