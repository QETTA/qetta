'use client'

/**
 * Progressive Disclosure Components
 *
 * 점진적 공개 시스템:
 * - FeatureReveal: 첫 인터랙션 시 기능 설명 표시
 * - CollapsibleAdvanced: 고급 기능 토글
 * - FirstTimeTooltip: 첫 방문 시 툴팁
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useOnboarding } from './onboarding-provider'
import type { HintId } from '@/lib/onboarding-storage'

// ============================================
// FeatureReveal - 첫 인터랙션 시 기능 설명
// ============================================

interface FeatureRevealProps {
  featureId: HintId
  title: string
  description: string
  children: ReactNode
  className?: string
}

export function FeatureReveal({
  featureId,
  title,
  description,
  children,
  className,
}: FeatureRevealProps) {
  const { shouldShowHint, dismissHint } = useOnboarding()
  const [showReveal, setShowReveal] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const handleFirstInteraction = useCallback(() => {
    if (!hasInteracted && shouldShowHint(featureId)) {
      setShowReveal(true)
      setHasInteracted(true)
    }
  }, [hasInteracted, shouldShowHint, featureId])

  const handleDismiss = () => {
    dismissHint(featureId)
    setShowReveal(false)
  }

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={handleFirstInteraction}
      onFocus={handleFirstInteraction}
    >
      {children}

      {/* Feature reveal overlay */}
      {showReveal && (
        <div
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50',
            'animate-tour-tooltip-enter'
          )}
        >
          <div
            className={cn(
              'bg-zinc-900 border border-white/10 rounded-lg p-4',
              'shadow-lg shadow-black/20'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-medium text-white mb-1">{title}</h4>
                <p className="text-xs text-zinc-400">{description}</p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-zinc-500 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className={cn(
                'mt-3 w-full px-3 py-1.5 rounded-md',
                'text-xs font-medium text-white',
                'bg-zinc-800 hover:bg-zinc-700',
                'transition-colors'
              )}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// CollapsibleAdvanced - 고급 기능 토글
// ============================================

interface CollapsibleAdvancedProps {
  title?: string
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export function CollapsibleAdvanced({
  title = 'Advanced options',
  defaultOpen = false,
  children,
  className,
}: CollapsibleAdvancedProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn('border-t border-white/5 pt-4', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between w-full',
          'text-sm text-zinc-400 hover:text-white',
          'transition-colors'
        )}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <svg
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {title}
        </span>
        {!isOpen && (
          <span className="text-xs text-zinc-500">Click to expand</span>
        )}
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          isOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  )
}

// ============================================
// FirstTimeTooltip - 첫 방문 시 툴팁
// ============================================

interface FirstTimeTooltipProps {
  hintId: HintId
  content: string
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function FirstTimeTooltip({
  hintId,
  content,
  children,
  placement = 'top',
  className,
}: FirstTimeTooltipProps) {
  const { shouldShowHint, dismissHint } = useOnboarding()
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null)
  const [targetRef, setTargetRef] = useState<HTMLElement | null>(null)

  const showTooltip = shouldShowHint(hintId)

  // Calculate tooltip position
  useEffect(() => {
    if (!showTooltip || !targetRef) return

    const updatePosition = () => {
      const rect = targetRef.getBoundingClientRect()
      let top = 0
      let left = 0

      switch (placement) {
        case 'top':
          top = rect.top - 8
          left = rect.left + rect.width / 2
          break
        case 'bottom':
          top = rect.bottom + 8
          left = rect.left + rect.width / 2
          break
        case 'left':
          top = rect.top + rect.height / 2
          left = rect.left - 8
          break
        case 'right':
          top = rect.top + rect.height / 2
          left = rect.right + 8
          break
      }

      setTooltipPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [showTooltip, targetRef, placement])

  const handleDismiss = () => {
    dismissHint(hintId)
  }

  const placementStyles: Record<string, string> = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  }

  return (
    <>
      <div ref={setTargetRef} className={cn('relative', className)}>
        {children}

        {/* Beacon indicator */}
        {showTooltip && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        )}
      </div>

      {/* Tooltip portal */}
      {showTooltip && tooltipPosition && typeof document !== 'undefined' &&
        createPortal(
          <div
            className={cn(
              'fixed z-[100] pointer-events-auto',
              placementStyles[placement],
              'animate-tour-tooltip-enter'
            )}
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
          >
            <div
              className={cn(
                'bg-zinc-900 border border-white/10 rounded-lg p-3',
                'shadow-lg shadow-black/20',
                'max-w-xs'
              )}
            >
              <p className="text-xs text-zinc-300 mb-2">{content}</p>
              <button
                onClick={handleDismiss}
                className={cn(
                  'w-full px-2 py-1 rounded',
                  'text-xs text-white',
                  'bg-zinc-800 hover:bg-zinc-700',
                  'transition-colors'
                )}
              >
                Got it
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

// ============================================
// StepByStepGuide - 단계별 가이드 (기존 StepGuide 연동)
// ============================================

interface Step {
  title: string
  description: string
  isComplete?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface StepByStepGuideProps {
  steps: Step[]
  currentStep?: number
  onStepChange?: (step: number) => void
  className?: string
}

export function StepByStepGuide({
  steps,
  currentStep = 0,
  onStepChange,
  className,
}: StepByStepGuideProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress bar */}
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isComplete = step.isComplete || index < currentStep

          return (
            <button
              key={step.title}
              onClick={() => onStepChange?.(index)}
              disabled={index > currentStep && !isComplete}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-lg text-left',
                'transition-all duration-200',
                isActive
                  ? 'bg-zinc-800/50 border border-white/10'
                  : 'hover:bg-zinc-800/30',
                index > currentStep && !isComplete && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Step indicator */}
              <div
                className={cn(
                  'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                  'text-xs font-medium',
                  isComplete
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-white text-zinc-950'
                    : 'bg-zinc-700 text-zinc-400'
                )}
              >
                {isComplete ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-white' : 'text-zinc-400'
                  )}
                >
                  {step.title}
                </p>
                {isActive && (
                  <p className="text-xs text-zinc-500 mt-0.5">{step.description}</p>
                )}
                {isActive && step.action && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      step.action?.onClick()
                    }}
                    className={cn(
                      'mt-2 px-3 py-1 rounded-md',
                      'text-xs font-medium text-white',
                      'bg-zinc-700 hover:bg-zinc-600',
                      'transition-colors'
                    )}
                  >
                    {step.action.label}
                  </button>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
