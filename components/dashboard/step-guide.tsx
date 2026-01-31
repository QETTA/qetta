'use client'

import { useMemo } from 'react'

/**
 * StepGuide - 단계별 가이드 컴포넌트
 *
 * 중장년 UX 원칙:
 * - "뭐가 뭔지 모르겠고, 그냥 포기했어"
 * - 단계 표시: "3단계 중 1단계" 프로그레스 바
 * - "다음" 버튼 하나로 끝나는 프로세스
 *
 * @see docs/plans/2026-01-22-domain-engine-master-plan.md 섹션 8.2
 */

export interface Step {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
}

interface StepGuideProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  /** Allow clicking completed steps */
  allowClickCompleted?: boolean
  /** Vertical layout */
  vertical?: boolean
}

export function StepGuide({
  steps,
  currentStep,
  onStepClick,
  allowClickCompleted = true,
  vertical = false,
}: StepGuideProps) {
  const progress = useMemo(() => {
    return ((currentStep + 1) / steps.length) * 100
  }, [currentStep, steps.length])

  const currentStepData = steps[currentStep]

  return (
    <div className="w-full">
      {/* Progress Header - 중장년 친화적 큰 표시 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-white">
            {steps.length}단계 중{' '}
            <span className="text-white">{currentStep + 1}단계</span>
          </span>
          <span className="text-sm text-zinc-500">
            {Math.round(progress)}% 완료
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-zinc-500 to-white rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Step Info - 큰 글씨로 현재 단계 표시 */}
      {currentStepData && (
        <div className="bg-zinc-500/10 rounded-xl p-5 mb-6 ring-1 ring-zinc-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-zinc-500/20 flex items-center justify-center text-white font-bold text-lg">
              {currentStep + 1}
            </div>
            <h3 className="text-xl font-semibold text-white">
              {currentStepData.title}
            </h3>
          </div>
          {currentStepData.description && (
            <p className="text-zinc-400 ml-[52px]">
              {currentStepData.description}
            </p>
          )}
        </div>
      )}

      {/* Step Indicators */}
      <div
        className={`
          ${vertical ? 'flex flex-col gap-3' : 'flex items-center gap-2'}
        `}
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          const canClick =
            onStepClick &&
            ((isCompleted && allowClickCompleted) || isCurrent)

          return (
            <div
              key={step.id}
              className={`flex items-center ${!vertical && index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              {/* Step Circle */}
              <button
                onClick={() => canClick && onStepClick?.(index)}
                disabled={!canClick}
                className={`
                  relative flex items-center justify-center
                  w-10 h-10 rounded-full font-semibold text-sm
                  transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                      : isCurrent
                        ? 'bg-zinc-500 text-white ring-2 ring-white/50 scale-110'
                        : 'bg-zinc-800 text-zinc-500 ring-1 ring-white/10'
                  }
                  ${canClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                `}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${step.title} ${isCompleted ? '완료' : isCurrent ? '진행 중' : '예정'}`}
              >
                {isCompleted ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>

              {/* Step Label (vertical only) */}
              {vertical && (
                <div className="ml-4 flex-1">
                  <p
                    className={`font-medium ${isCurrent ? 'text-white' : 'text-zinc-400'}`}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-sm text-zinc-600">{step.description}</p>
                  )}
                </div>
              )}

              {/* Connector Line (horizontal) */}
              {!vertical && index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2 rounded-full
                    ${isCompleted ? 'bg-emerald-500/50' : 'bg-zinc-800'}
                  `}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Labels (horizontal) */}
      {!vertical && (
        <div className="flex justify-between mt-3 px-1">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={`
                text-xs truncate max-w-[80px] text-center
                ${
                  index === currentStep
                    ? 'text-white font-medium'
                    : index < currentStep
                      ? 'text-emerald-400'
                      : 'text-zinc-600'
                }
              `}
            >
              {step.title}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * StepGuideActions - 이전/다음 버튼
 */
interface StepGuideActionsProps {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  onComplete?: () => void
  nextLabel?: string
  previousLabel?: string
  completeLabel?: string
  isNextDisabled?: boolean
  isLoading?: boolean
}

export function StepGuideActions({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onComplete,
  nextLabel = '다음 단계',
  previousLabel = '이전',
  completeLabel = '완료하기',
  isNextDisabled = false,
  isLoading = false,
}: StepGuideActionsProps) {
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="flex items-center gap-3 mt-6">
      {/* Previous Button */}
      <button
        onClick={onPrevious}
        disabled={isFirstStep}
        className={`
          px-6 py-3.5 rounded-xl font-medium text-base
          transition-all
          ${
            isFirstStep
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-white/10 text-white hover:bg-white/15'
          }
        `}
      >
        {previousLabel}
      </button>

      {/* Next/Complete Button - 큰 버튼 */}
      <button
        onClick={isLastStep ? onComplete : onNext}
        disabled={isNextDisabled || isLoading}
        className={`
          flex-1 px-8 py-4 rounded-xl font-semibold text-lg
          transition-all
          ${
            isLastStep
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
              : 'bg-zinc-500 hover:bg-white text-white'
          }
          ${isNextDisabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinner />
            처리 중...
          </span>
        ) : (
          <>
            {isLastStep ? completeLabel : nextLabel}
            {!isLastStep && <span className="ml-2">→</span>}
          </>
        )}
      </button>
    </div>
  )
}

// Icons
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg
      className="w-5 h-5 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
