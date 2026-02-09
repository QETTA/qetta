/**
 * Animated Number Counter
 * Smooth count-up animation with intersection observer
 * 
 * @see Plan: Part D1 - Premium Landing Page Components
 */

'use client'

import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'

interface AnimatedNumberProps {
  value: number
  suffix?: string
  prefix?: string
  duration?: number // Animation duration in ms
  decimals?: number // Number of decimal places
  className?: string
}

export function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  decimals = 0,
  className = ''
}: AnimatedNumberProps) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5
  })

  useEffect(() => {
    if (!inView) return

    let start = 0
    const end = value
    const increment = end / (duration / 16) // 60fps

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, 16)

    return () => clearInterval(timer)
  }, [inView, value, duration])

  const formattedNumber = decimals > 0
    ? count.toFixed(decimals)
    : Math.floor(count).toLocaleString()

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}{formattedNumber}{suffix}
    </span>
  )
}

/**
 * Animated Percentage
 * Specialized version for percentage values
 */
export function AnimatedPercentage({
  value,
  duration = 2000,
  className = ''
}: {
  value: number
  duration?: number
  className?: string
}) {
  return (
    <AnimatedNumber
      value={value}
      suffix="%"
      decimals={1}
      duration={duration}
      className={className}
    />
  )
}

/**
 * Animated Currency
 * Specialized version for currency values
 */
export function AnimatedCurrency({
  value,
  currency = '$',
  duration = 2000,
  className = ''
}: {
  value: number
  currency?: string
  duration?: number
  className?: string
}) {
  return (
    <AnimatedNumber
      value={value}
      prefix={currency}
      decimals={0}
      duration={duration}
      className={className}
    />
  )
}
