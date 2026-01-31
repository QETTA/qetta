'use client'

import { ReactNode, memo, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface HeroAnimatedContentProps {
  children: ReactNode
  className?: string
}

/**
 * HeroAnimatedContent - CSS 기반 애니메이션 래퍼
 *
 * framer-motion 대체: CSS @keyframes + useEffect 마운트 감지
 * Hero 섹션은 페이지 로드 시 즉시 표시되므로 Intersection Observer 불필요
 */
export const HeroAnimatedContent = memo(function HeroAnimatedContent({
  children,
  className = '',
}: HeroAnimatedContentProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // 약간의 딜레이로 자연스러운 진입 애니메이션
    const timer = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <div
      className={cn(
        'animate-on-scroll',
        isMounted && 'visible',
        'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:transform-none',
        className
      )}
    >
      {children}
    </div>
  )
})

interface HeroProductAnimatedProps {
  children: ReactNode
  className?: string
}

/**
 * HeroProductAnimated - 오른쪽 프로덕트 섹션 애니메이션
 *
 * 왼쪽에서 슬라이드 인 (0.2s 딜레이)
 */
export const HeroProductAnimated = memo(function HeroProductAnimated({
  children,
  className = '',
}: HeroProductAnimatedProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <div
      className={cn(
        'animate-slide-right',
        isMounted && 'visible',
        'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:transform-none',
        className
      )}
      style={{ transitionDelay: '0.2s' }}
    >
      {children}
    </div>
  )
})
