'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

interface LinearButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md'
  asChild?: boolean
}

/**
 * LinearButton - Linear style Titanium deep gray button
 *
 * Design philosophy:
 * - Background: Titanium Deep Gray (#1F2023)
 * - Border: 8% white -> 12% on hover
 * - Smooth transition effect (150ms)
 *
 * Memoized for performance in navigation and repeated renders.
 */
export const LinearButton = memo(function LinearButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: LinearButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'rounded-lg',
        // Primary variant: Titanium Deep Gray
        variant === 'primary' && [
          'bg-[#1F2023] border border-[rgba(255,255,255,0.08)]',
          'hover:bg-[#292B2F] hover:border-[rgba(255,255,255,0.12)]',
          'text-[var(--foreground)]',
        ],
        // Secondary variant: Transparent with border
        variant === 'secondary' && [
          'bg-transparent border border-[rgba(255,255,255,0.08)]',
          'hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.02)]',
          'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]',
        ],
        // Size variants
        size === 'sm' && 'h-8 px-4 text-[13px]',
        size === 'md' && 'h-10 px-5 text-[14px]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
