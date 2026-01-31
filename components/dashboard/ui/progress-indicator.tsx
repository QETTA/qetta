import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3
  className?: string
}

const STEPS = [
  { id: 1, label: '문서 생성', shortLabel: 'DOCS' },
  { id: 2, label: '검증', shortLabel: 'VERIFY' },
  { id: 3, label: '제출', shortLabel: 'APPLY' },
] as const

/**
 * ProgressIndicator - DOCS-VERIFY-APPLY 진행도 표시기
 *
 * 문서의 현재 워크플로우 단계를 시각화합니다.
 *
 * @example
 * <ProgressIndicator currentStep={2} />
 */
export function ProgressIndicator({ currentStep, className }: ProgressIndicatorProps) {
  const totalSteps = STEPS.length
  const currentStepLabel = STEPS[currentStep - 1]?.label ?? ''

  return (
    <div
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`문서 처리 진행도: ${currentStep}/${totalSteps} 단계 (${currentStepLabel})`}
      className={cn('flex items-center gap-2 text-xs', className)}
    >
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id
        const isCurrent = currentStep === step.id
        const isLast = index === STEPS.length - 1

        return (
          <div key={step.id} className="flex items-center">
            {/* Step indicator */}
            <span
              className={cn(
                'flex items-center gap-1',
                isCompleted && 'text-emerald-400',
                isCurrent && 'text-white font-medium',
                !isCompleted && !isCurrent && 'text-zinc-500'
              )}
            >
              {isCompleted ? '✓' : step.id}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.shortLabel}</span>
            </span>

            {/* Arrow between steps */}
            {!isLast && (
              <span
                className={cn(
                  'mx-2',
                  isCompleted ? 'text-emerald-400' : 'text-zinc-600'
                )}
              >
                →
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface StepIndicatorProps {
  steps: string[]
  currentIndex: number
  className?: string
}

/**
 * StepIndicator - 범용 단계 표시기
 *
 * @example
 * <StepIndicator
 *   steps={['Upload', 'Process', 'Review', 'Submit']}
 *   currentIndex={1}
 * />
 */
export function StepIndicator({ steps, currentIndex, className }: StepIndicatorProps) {
  const totalSteps = steps.length

  return (
    <div
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`진행도: ${currentIndex + 1}/${totalSteps} 단계 (${steps[currentIndex] ?? ''})`}
      className={cn('flex items-center gap-2', className)}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isLast = index === steps.length - 1

        return (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                isCompleted && 'bg-emerald-500/20 text-emerald-400',
                isCurrent && 'bg-zinc-500/20 text-white ring-2 ring-zinc-500/50',
                !isCompleted && !isCurrent && 'bg-zinc-800 text-zinc-500'
              )}
            >
              {isCompleted ? '✓' : index + 1}
            </div>
            {!isLast && (
              <div
                className={cn(
                  'w-8 h-0.5 mx-1',
                  isCompleted ? 'bg-emerald-500/50' : 'bg-zinc-700'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
