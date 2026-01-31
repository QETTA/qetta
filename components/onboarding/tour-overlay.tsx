'use client'

/**
 * TourOverlay
 *
 * 투어 오버레이 컴포넌트
 * - Spotlight 하이라이트
 * - 툴팁 표시
 * - 네비게이션 컨트롤
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useOnboarding } from './onboarding-provider'
import type { TourStep } from '@/constants/onboarding/tours'

export function TourOverlay() {
  const router = useRouter()
  const {
    isTourActive,
    currentTourConfig,
    currentStepConfig,
    currentStep,
    totalSteps,
    progress,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useOnboarding()

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Find target element and get its position
  useEffect(() => {
    if (!currentStepConfig) {
      setTargetRect(null)
      setIsVisible(false)
      return
    }

    if (currentStepConfig.target === 'center') {
      setTargetRect(null)
      setIsVisible(true)
      return
    }

    const findTarget = () => {
      const element = document.querySelector(currentStepConfig.target)
      if (element) {
        const rect = element.getBoundingClientRect()
        setTargetRect(rect)
        setIsVisible(true)
      }
    }

    // Initial find
    findTarget()

    // Re-find on resize/scroll
    const handleResize = () => findTarget()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [currentStepConfig])

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          skipTour()
          break
        case 'ArrowRight':
        case 'Enter':
          if (currentStep === totalSteps - 1) {
            handleComplete()
          } else {
            nextStep()
          }
          break
        case 'ArrowLeft':
          prevStep()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTourActive, currentStep, totalSteps, nextStep, prevStep, skipTour])

  const handleComplete = useCallback(() => {
    if (currentStepConfig?.action?.href) {
      router.push(currentStepConfig.action.href)
    }
    completeTour()
  }, [completeTour, currentStepConfig, router])

  if (!isTourActive || !currentTourConfig || !currentStepConfig) {
    return null
  }

  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0
  const isCenterModal = currentStepConfig.target === 'center'

  return createPortal(
    <div
      ref={overlayRef}
      className={cn(
        'fixed inset-0 z-[9999] transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      role="dialog"
      aria-modal="true"
      aria-label={currentTourConfig.name}
    >
      {/* Backdrop with spotlight cutout */}
      {!isCenterModal && targetRect && (
        <SpotlightMask
          targetRect={targetRect}
          padding={currentStepConfig.spotlight?.padding ?? 8}
          borderRadius={currentStepConfig.spotlight?.borderRadius ?? 8}
        />
      )}

      {/* Dark backdrop for center modal */}
      {isCenterModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      )}

      {/* Tooltip or Center Modal */}
      {isCenterModal ? (
        <CenterModal
          step={currentStepConfig}
          currentStep={currentStep}
          totalSteps={totalSteps}
          progress={progress}
          onNext={isLastStep ? handleComplete : nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
        />
      ) : (
        targetRect && (
          <Tooltip
            step={currentStepConfig}
            targetRect={targetRect}
            currentStep={currentStep}
            totalSteps={totalSteps}
            progress={progress}
            onNext={isLastStep ? handleComplete : nextStep}
            onPrev={prevStep}
            onSkip={skipTour}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
          />
        )
      )}
    </div>,
    document.body
  )
}

/**
 * Spotlight Mask - 타겟 요소 하이라이트
 */
function SpotlightMask({
  targetRect,
  padding,
  borderRadius,
}: {
  targetRect: DOMRect
  padding: number
  borderRadius: number
}) {
  const x = targetRect.left - padding
  const y = targetRect.top - padding
  const width = targetRect.width + padding * 2
  const height = targetRect.height + padding * 2

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <mask id="spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={borderRadius}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.7)"
        mask="url(#spotlight-mask)"
      />
      {/* Spotlight ring */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={borderRadius}
        fill="none"
        stroke="white"
        strokeWidth="2"
        className="animate-pulse"
        style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }}
      />
    </svg>
  )
}

/**
 * Center Modal - 중앙 모달 (환영/완료 화면)
 */
function CenterModal({
  step,
  currentStep,
  totalSteps,
  progress,
  onNext,
  onPrev,
  onSkip,
  isFirstStep,
  isLastStep,
}: {
  step: TourStep
  currentStep: number
  totalSteps: number
  progress: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  isFirstStep: boolean
  isLastStep: boolean
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Progress bar */}
        <div className="h-1 bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-zinc-500 to-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h2 className="text-2xl font-semibold text-white mb-3">{step.title}</h2>
          <p className="text-zinc-400 mb-6 leading-relaxed">{step.content}</p>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <button
                onClick={onPrev}
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors"
              >
                이전
              </button>
            )}
            <button
              onClick={onNext}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl font-medium transition-colors',
                isLastStep
                  ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                  : 'bg-zinc-600 text-white hover:bg-zinc-500'
              )}
            >
              {isLastStep ? (step.action?.label ?? '완료') : '다음'}
            </button>
          </div>

          {/* Skip */}
          <button
            onClick={onSkip}
            className="mt-4 text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            건너뛰기
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pb-4 flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                i === currentStep ? 'bg-white' : i < currentStep ? 'bg-zinc-500' : 'bg-zinc-700'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Tooltip - 타겟 옆에 표시되는 툴팁
 */
function Tooltip({
  step,
  targetRect,
  currentStep,
  totalSteps,
  progress,
  onNext,
  onPrev,
  onSkip,
  isFirstStep,
  isLastStep,
}: {
  step: TourStep
  targetRect: DOMRect
  currentStep: number
  totalSteps: number
  progress: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  isFirstStep: boolean
  isLastStep: boolean
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tooltipRef.current) return

    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const padding = 16
    let x = 0
    let y = 0

    switch (step.placement) {
      case 'bottom':
        x = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
        y = targetRect.bottom + padding
        break
      case 'top':
        x = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
        y = targetRect.top - tooltipRect.height - padding
        break
      case 'left':
        x = targetRect.left - tooltipRect.width - padding
        y = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
        break
      case 'right':
        x = targetRect.right + padding
        y = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
        break
    }

    // Keep within viewport
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding))
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding))

    setPosition({ x, y })
  }, [targetRect, step.placement])

  return (
    <div
      ref={tooltipRef}
      className="fixed bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-80 animate-fade-in-up"
      style={{ left: position.x, top: position.y }}
    >
      {/* Progress bar */}
      <div className="h-1 bg-zinc-800 rounded-t-xl overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-zinc-500 to-white transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-semibold text-white">{step.title}</h3>
          <span className="text-xs text-zinc-500">
            {currentStep + 1}/{totalSteps}
          </span>
        </div>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{step.content}</p>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <button
              onClick={onPrev}
              className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              이전
            </button>
          )}
          <button
            onClick={onNext}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isLastStep
                ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                : 'bg-zinc-600 text-white hover:bg-zinc-500'
            )}
          >
            {isLastStep ? '완료' : '다음'}
          </button>
          <button
            onClick={onSkip}
            className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  )
}
