'use client'

/**
 * Generation Progress - Document generation progress display
 *
 * CSS-based animation (replaces framer-motion)
 * Provides meaningful feedback during 45-second wait time
 *
 * @module dashboard/docs/generation-progress
 */

import { useEffect, useState } from 'react'
import {
  CpuChipIcon,
  DocumentMagnifyingGlassIcon,
  PencilSquareIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

// Step-by-step progress messages + sub-messages + icons
const DOCUMENT_PROGRESS_STEPS = [
  {
    progress: 10,
    message: 'Initializing domain engine...',
    subMessage: 'Loading industry-specific terminology',
    icon: CpuChipIcon,
    color: 'zinc',
  },
  {
    progress: 25,
    message: 'Analyzing announcement requirements...',
    subMessage: 'Generating required items checklist',
    icon: DocumentMagnifyingGlassIcon,
    color: 'blue',
  },
  {
    progress: 45,
    message: 'Writing content sections...',
    subMessage: 'Technology innovation, marketability, commercialization strategy',
    icon: PencilSquareIcon,
    color: 'emerald',
  },
  {
    progress: 65,
    message: 'Inserting quantitative metrics...',
    subMessage: '93.8% time reduction, 99.2% terminology accuracy',
    icon: ChartBarIcon,
    color: 'amber',
  },
  {
    progress: 80,
    message: 'Generating hash chain verification...',
    subMessage: 'Creating SHA-256 integrity signature',
    icon: ShieldCheckIcon,
    color: 'rose',
  },
  {
    progress: 95,
    message: 'Converting to HancomDocs...',
    subMessage: 'Generating web viewer URL',
    icon: DocumentArrowUpIcon,
    color: 'zinc',
  },
] as const

// Color variants for Tailwind (safelist required in tailwind.config)
const COLOR_VARIANTS = {
  zinc: {
    bg: 'bg-zinc-500/20',
    text: 'text-zinc-400',
    step: 'bg-zinc-500',
  },
  blue: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    step: 'bg-blue-500',
  },
  emerald: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    step: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    step: 'bg-amber-500',
  },
  rose: {
    bg: 'bg-rose-500/20',
    text: 'text-rose-400',
    step: 'bg-rose-500',
  },
} as const

interface GenerationProgressProps {
  /** Whether generation is in progress */
  isGenerating: boolean
  /** Progress (0-100) */
  progress?: number
  /**
   * @deprecated Use progress instead
   * Current step (0-based) - backward compatibility
   */
  currentStep?: number
  /** Domain engine preset (e.g., DIGITAL, BIOTECH) */
  enginePreset?: string
  /** Document type (e.g., performance_report, proposal) */
  documentType?: string
  /** Error message */
  error?: string | null
  className?: string
}

// Legacy 4-step to 6-step progress mapping (backward compatibility)
const LEGACY_STEP_TO_PROGRESS = [10, 40, 70, 95] as const

export function GenerationProgress({
  isGenerating,
  progress: progressProp,
  currentStep: currentStepProp,
  enginePreset,
  documentType,
  error,
  className = '',
}: GenerationProgressProps) {
  const [currentStepState, setCurrentStepState] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Backward compatibility: currentStep (0-3) → progress (0-100)
  const progress =
    progressProp ??
    (currentStepProp !== undefined
      ? LEGACY_STEP_TO_PROGRESS[Math.min(currentStepProp, 3)] ?? 0
      : 0)

  // 진행률에 따른 단계 업데이트
  useEffect(() => {
    if (!isGenerating) {
      setCurrentStepState(0)
      setElapsedTime(0)
      return
    }

    const stepIndex = DOCUMENT_PROGRESS_STEPS.findIndex((step, idx, arr) => {
      const nextStep = arr[idx + 1]
      return progress >= step.progress && (!nextStep || progress < nextStep.progress)
    })

    if (stepIndex !== -1 && stepIndex !== currentStepState) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStepState(stepIndex)
        setIsTransitioning(false)
      }, 150)
    }
  }, [progress, isGenerating, currentStepState])

  // 경과 시간 타이머
  useEffect(() => {
    if (!isGenerating) return

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isGenerating])

  if (!isGenerating && !error) return null

  const step = DOCUMENT_PROGRESS_STEPS[currentStepState]
  const Icon = step.icon
  const colorVariant = COLOR_VARIANTS[step.color]

  return (
    <div
      className={clsx(
        'rounded-xl bg-zinc-900/50 p-6 ring-1 ring-white/10',
        className
      )}
    >
      {/* Header: Document type display */}
      {(enginePreset || documentType) && (
        <div className="mb-4 flex items-center justify-between text-sm text-zinc-400">
          <span>
            {enginePreset && documentType
              ? `${enginePreset} / ${documentType}`
              : enginePreset || documentType}
          </span>
          <span>{elapsedTime}s elapsed</span>
        </div>
      )}

      {/* Progress bar - CSS transition */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={clsx(
            'h-full transition-all duration-500 ease-out',
            error
              ? 'bg-red-500'
              : 'bg-gradient-to-r from-zinc-500 to-white'
          )}
          style={{ width: error ? '100%' : `${progress}%` }}
        />
      </div>

      {/* Current step message - CSS fade transition */}
      <div
        className={clsx(
          'transition-opacity duration-150',
          isTransitioning ? 'opacity-0' : 'opacity-100'
        )}
      >
        {error ? (
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-red-500/20 p-3">
              <ShieldCheckIcon className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-medium text-red-400">Generation Failed</p>
              <p className="mt-1 text-sm text-red-400/70">{error}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            {/* Icon - CSS pulse animation */}
            <div
              className={clsx(
                'rounded-lg p-3 animate-pulse',
                colorVariant.bg
              )}
            >
              <Icon className={clsx('h-6 w-6', colorVariant.text)} />
            </div>

            {/* Message */}
            <div className="flex-1">
              <p className="text-lg font-medium text-white">{step.message}</p>
              <p className="mt-1 text-sm text-zinc-400">{step.subMessage}</p>
            </div>

            {/* Progress */}
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Step indicator - 6-step bar */}
      <div className="mt-6 flex justify-between gap-1">
        {DOCUMENT_PROGRESS_STEPS.map((s, idx) => (
          <div
            key={idx}
            className={clsx(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              idx <= currentStepState
                ? error
                  ? 'bg-red-500'
                  : COLOR_VARIANTS[s.color].step
                : 'bg-zinc-700'
            )}
            style={{
              transform: `scaleX(${idx <= currentStepState ? 1 : 0.8})`,
              transitionDelay: `${idx * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Step labels (hidden on small screens) */}
      <div className="mt-2 hidden justify-between text-[10px] text-zinc-600 sm:flex">
        <span>Init</span>
        <span>Analyze</span>
        <span>Write</span>
        <span>Metrics</span>
        <span>Verify</span>
        <span>Convert</span>
      </div>
    </div>
  )
}

// Named export for backwards compatibility
export default GenerationProgress
