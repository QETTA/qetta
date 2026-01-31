'use client'

import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useWizardStore, useProgressStore } from '../store'
import { ProgressTimeline } from '../progress/ProgressTimeline'
import { TimeSavedCounter } from '../progress/TimeSavedCounter'
import { WIDGET_TEMPLATES, type GeneratedWidgetDocument } from '../types'

interface StepGenerationProps {
  onComplete: (doc: GeneratedWidgetDocument) => void
  onError: (error: string) => void
}

export function StepGeneration({ onComplete, onError }: StepGenerationProps) {
  const { documentType, enginePreset, inputData } = useWizardStore()
  const { startProgress, setPhase, complete, reset: resetProgress } = useProgressStore()
  const [isGenerating, setIsGenerating] = useState(false)

  const template = WIDGET_TEMPLATES.find((t) => t.documentType === documentType)
  const timeSavedMinutes = template?.timeSavedMinutes || 480

  const generateDocument = useCallback(async () => {
    if (isGenerating || !documentType || !enginePreset) return

    setIsGenerating(true)
    startProgress()

    try {
      // Phase 1: Validating
      setPhase('validating', '데이터 검증 중...')
      await new Promise((r) => setTimeout(r, 800))

      // Phase 2: Analyzing
      setPhase('analyzing', 'AI 분석 중...')
      await new Promise((r) => setTimeout(r, 1500))

      // Phase 3: Generating
      setPhase('generating', '문서 생성 중...')

      // Call the actual API
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enginePreset,
          documentType,
          data: inputData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '문서 생성에 실패했습니다')
      }

      const result = await response.json()

      // Phase 4: Rendering
      setPhase('rendering', '최종 렌더링 중...')
      await new Promise((r) => setTimeout(r, 500))

      // Phase 5: Complete
      complete()

      const generatedDoc: GeneratedWidgetDocument = {
        id: result.id || crypto.randomUUID(),
        title: result.title || template?.name || '생성된 문서',
        format: result.format || 'DOCX',
        url: result.downloadUrl || `/api/generate-document/download/${result.id}`,
        previewUrl: result.previewUrl,
        createdAt: new Date(),
        processingTimeMs: result.processingTimeMs || 3000,
        timeSavedMinutes,
        pageCount: result.pageCount,
      }

      // Small delay for visual feedback
      await new Promise((r) => setTimeout(r, 500))
      onComplete(generatedDoc)
    } catch (error) {
      console.error('Document generation error:', error)
      resetProgress()
      onError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
  }, [
    isGenerating,
    documentType,
    enginePreset,
    inputData,
    timeSavedMinutes,
    startProgress,
    setPhase,
    complete,
    resetProgress,
    onComplete,
    onError,
    template,
  ])

  useEffect(() => {
    generateDocument()
  }, [generateDocument])

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {template?.icon} {template?.name} 생성 중...
        </h2>
        <p className="text-zinc-400">
          AI가 문서를 작성하고 있습니다
        </p>
      </div>

      {/* Progress Timeline */}
      <ProgressTimeline />

      {/* Time Saved Counter */}
      <div className="flex justify-center">
        <TimeSavedCounter targetMinutes={timeSavedMinutes} />
      </div>

      {/* Fun facts while waiting */}
      <div className="mt-8 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <p className="text-sm text-zinc-400 text-center">
          💡 <span className="text-zinc-300">알고 계셨나요?</span>{' '}
          수동으로 이 문서를 작성하면 평균 {Math.round(timeSavedMinutes / 60)}시간이 소요됩니다.
          QETTA는 이 시간을 93.8% 단축합니다.
        </p>
      </div>
    </div>
  )
}
