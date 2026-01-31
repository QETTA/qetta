'use client'

import { useState, useEffect, useRef } from 'react'
import { ClockIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface TimeSavedCounterProps {
  targetMinutes: number
  className?: string
}

/**
 * TimeSavedCounter - 핵심 차별화 요소
 *
 * 문서 생성 중 실시간으로 절감되는 시간을 표시
 * 사용자에게 가치를 시각적으로 전달
 */
export function TimeSavedCounter({ targetMinutes, className }: TimeSavedCounterProps) {
  const [displayMinutes, setDisplayMinutes] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    setIsAnimating(true)

    // Animate counter from 0 to target
    const duration = 3000 // 3 seconds
    const startTime = Date.now()
    const startValue = 0

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out-expo)
      const easeOutExpo = 1 - Math.pow(2, -10 * progress)

      const currentValue = Math.floor(startValue + (targetMinutes - startValue) * easeOutExpo)
      setDisplayMinutes(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [targetMinutes])

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return (
        <>
          <span className="text-4xl sm:text-5xl font-bold">{hours}</span>
          <span className="text-lg sm:text-xl text-zinc-400 ml-1">시간</span>
          {mins > 0 && (
            <>
              <span className="text-4xl sm:text-5xl font-bold ml-2">{mins}</span>
              <span className="text-lg sm:text-xl text-zinc-400 ml-1">분</span>
            </>
          )}
        </>
      )
    }
    return (
      <>
        <span className="text-4xl sm:text-5xl font-bold">{mins}</span>
        <span className="text-lg sm:text-xl text-zinc-400 ml-1">분</span>
      </>
    )
  }

  return (
    <div
      className={cn(
        'relative p-6 sm:p-8 rounded-2xl',
        'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent',
        'border border-emerald-500/20',
        className
      )}
    >
      {/* Sparkle decoration */}
      <SparklesIcon
        className={cn(
          'absolute top-4 right-4 h-6 w-6 text-emerald-400/50',
          isAnimating && 'animate-spin'
        )}
      />

      {/* Label */}
      <div className="flex items-center gap-2 mb-4">
        <ClockIcon className="h-5 w-5 text-emerald-400" />
        <span className="text-sm font-medium text-emerald-400">
          절감되는 시간
        </span>
      </div>

      {/* Counter */}
      <div className="flex items-baseline text-emerald-300">
        {formatTime(displayMinutes)}
      </div>

      {/* Subtitle */}
      <p className="mt-3 text-sm text-zinc-500">
        수동 작업 대비 <span className="text-emerald-400 font-medium">93.8%</span> 시간 절감
      </p>

      {/* Visual indicator */}
      <div className="mt-4 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000',
            isAnimating && 'animate-pulse'
          )}
          style={{ width: `${(displayMinutes / targetMinutes) * 100}%` }}
        />
      </div>
    </div>
  )
}

/**
 * 시간 비교 표시 컴포넌트
 */
interface TimeComparisonProps {
  manualMinutes: number
  automatedMinutes: number
  className?: string
}

export function TimeComparison({
  manualMinutes,
  automatedMinutes,
  className,
}: TimeComparisonProps) {
  const formatHours = (minutes: number) => {
    const hours = minutes / 60
    return hours >= 1 ? `${hours.toFixed(1)}시간` : `${minutes}분`
  }

  const savingsPercent = ((manualMinutes - automatedMinutes) / manualMinutes) * 100

  return (
    <div className={cn('flex items-center gap-6', className)}>
      {/* Manual time */}
      <div className="text-center">
        <p className="text-xs text-zinc-500 mb-1">수동 작업</p>
        <p className="text-2xl font-bold text-zinc-400 line-through">
          {formatHours(manualMinutes)}
        </p>
      </div>

      {/* Arrow */}
      <div className="flex flex-col items-center">
        <span className="text-2xl">→</span>
        <span className="text-xs text-emerald-400 font-medium">
          -{savingsPercent.toFixed(0)}%
        </span>
      </div>

      {/* Automated time */}
      <div className="text-center">
        <p className="text-xs text-emerald-400 mb-1">QETTA</p>
        <p className="text-2xl font-bold text-emerald-400">
          {formatHours(automatedMinutes)}
        </p>
      </div>
    </div>
  )
}
