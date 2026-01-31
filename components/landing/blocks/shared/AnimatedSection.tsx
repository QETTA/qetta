'use client'

import { ReactNode, memo } from 'react'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { cn } from '@/lib/utils'

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  /** 애니메이션 방향: 'left' (-x), 'right' (+x), 'up' (기본, -y) */
  direction?: 'left' | 'right' | 'up' | 'down'
  /** 애니메이션 지연 (초) */
  delay?: number
  /** 스크롤 트리거 사용 여부 (기본: true) */
  viewport?: boolean
}

/**
 * AnimatedSection - CSS 기반 애니메이션 래퍼
 *
 * framer-motion 대체: Intersection Observer + CSS transitions
 * 번들 사이즈 ~60KB 절감
 */
export const AnimatedSection = memo(function AnimatedSection({
  children,
  className = '',
  direction = 'down',
  delay = 0,
  viewport = true,
}: AnimatedSectionProps) {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  })

  // 방향별 CSS 클래스 매핑
  const directionClass = {
    left: 'animate-slide-left',
    right: 'animate-slide-right',
    up: 'animate-on-scroll',
    down: 'animate-on-scroll',
  }[direction]

  // viewport가 false인 경우 즉시 표시 (스크롤 트리거 없음)
  const shouldAnimate = viewport ? isVisible : true

  return (
    <div
      ref={viewport ? ref : undefined}
      className={cn(
        directionClass,
        shouldAnimate && 'visible',
        'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:transform-none',
        className
      )}
      style={{ transitionDelay: delay ? `${delay}s` : undefined }}
    >
      {children}
    </div>
  )
})

interface AnimatedFeatureCardProps {
  children: ReactNode
  className?: string
  /** 스태거 애니메이션용 인덱스 (0부터 시작) */
  index?: number
}

/**
 * AnimatedFeatureCard - 피처 그리드 아이템용 애니메이션
 *
 * CSS stagger 애니메이션 사용 (index * 0.05s 딜레이)
 */
export const AnimatedFeatureCard = memo(function AnimatedFeatureCard({
  children,
  className = '',
  index = 0,
}: AnimatedFeatureCardProps) {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <div
      ref={ref}
      className={cn(
        'animate-scale-up',
        isVisible && 'visible',
        'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:transform-none',
        className
      )}
      style={{ transitionDelay: `${index * 0.05}s` }}
    >
      {children}
    </div>
  )
})
