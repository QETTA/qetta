'use client'

import { useState, useCallback } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useWizardStore, useProgressStore, useThemeStore } from '../store'
import { StepIndicator } from './StepIndicator'
import { StepDataSource } from './StepDataSource'
import { StepValidation } from './StepValidation'
import { StepGeneration } from './StepGeneration'
import { StepComplete } from './StepComplete'
import type { GeneratedWidgetDocument, EmbedConfig } from '../types'

const WIZARD_STEPS = [
  { title: '문서 선택', description: '유형 선택' },
  { title: '정보 입력', description: '필수 정보' },
  { title: '생성 중', description: 'AI 작업' },
  { title: '완료', description: '다운로드' },
]

interface WizardContainerProps {
  config?: EmbedConfig
  onClose?: () => void
  className?: string
}

export function WizardContainer({
  config,
  onClose,
  className,
}: WizardContainerProps) {
  const {
    currentStep,
    nextStep,
    prevStep,
    setDocument,
    setError,
    reset: resetWizard,
  } = useWizardStore()

  const { reset: resetProgress } = useProgressStore()
  const { colors } = useThemeStore()

  const [generatedDoc, setGeneratedDoc] = useState<GeneratedWidgetDocument | null>(null)

  const handleComplete = useCallback(
    (doc: GeneratedWidgetDocument) => {
      setGeneratedDoc(doc)
      setDocument(doc)
      config?.onComplete?.(doc)
    },
    [setDocument, config]
  )

  const handleError = useCallback(
    (error: string) => {
      setError(error)
      prevStep() // Go back to validation step
      config?.onError?.(new Error(error))
    },
    [setError, prevStep, config]
  )

  const handleReset = useCallback(() => {
    resetWizard()
    resetProgress()
    setGeneratedDoc(null)
  }, [resetWizard, resetProgress])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepDataSource onNext={nextStep} />
      case 2:
        return <StepValidation onNext={nextStep} onPrev={prevStep} />
      case 3:
        return (
          <StepGeneration
            onComplete={handleComplete}
            onError={handleError}
          />
        )
      case 4:
        return generatedDoc ? (
          <StepComplete document={generatedDoc} onReset={handleReset} />
        ) : null
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'w-full max-w-4xl mx-auto',
        'bg-zinc-950 rounded-2xl',
        'border border-zinc-800',
        'shadow-2xl shadow-black/50',
        'overflow-hidden',
        className
      )}
      style={{
        '--widget-primary': colors.primary,
        '--widget-secondary': colors.secondary,
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-500 to-fuchsia-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">Q</span>
          </div>
          <span className="font-semibold text-white">QETTA Docs</span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="px-6 pt-6">
        <StepIndicator
          currentStep={currentStep}
          totalSteps={WIZARD_STEPS.length}
          steps={WIZARD_STEPS}
        />
      </div>

      {/* Step content */}
      <div className="px-6 pb-8">
        {renderStep()}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
        <p className="text-xs text-zinc-500 text-center">
          Powered by{' '}
          <a
            href="https://qetta.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-zinc-300"
          >
            QETTA AI
          </a>
          {' '}• 문서 작성 시간 93.8% 단축
        </p>
      </div>
    </div>
  )
}

/**
 * 모달 형태의 위자드
 */
interface WizardModalProps extends WizardContainerProps {
  isOpen: boolean
}

export function WizardModal({ isOpen, onClose, ...props }: WizardModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl animate-in fade-in zoom-in-95 duration-200">
        <WizardContainer {...props} onClose={onClose} />
      </div>
    </div>
  )
}
