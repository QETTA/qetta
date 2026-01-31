'use client'

import { CheckIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  steps: { title: string; description: string }[]
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <li
              key={step.title}
              className={cn(
                'relative',
                stepNumber !== totalSteps && 'flex-1 pr-8 sm:pr-20'
              )}
            >
              {/* Connector line */}
              {stepNumber !== totalSteps && (
                <div
                  className="absolute top-4 left-8 -right-4 sm:-right-12 h-0.5"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-full transition-colors duration-300',
                      isComplete ? 'bg-zinc-500' : 'bg-zinc-700'
                    )}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 group">
                {/* Step circle */}
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-300',
                    isComplete && 'bg-zinc-500 text-white',
                    isCurrent && 'bg-zinc-500 text-white ring-4 ring-zinc-500/20',
                    !isComplete && !isCurrent && 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  )}
                >
                  {isComplete ? (
                    <CheckIcon className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    stepNumber
                  )}
                </span>

                {/* Step label */}
                <div className="hidden sm:block min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium transition-colors duration-300',
                      isCurrent ? 'text-white' : 'text-zinc-400'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{step.description}</p>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
