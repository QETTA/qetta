'use client'

import { useState, useEffect } from 'react'
import {
  ArrowDownTrayIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useWizardStore } from '../store'
import type { GeneratedWidgetDocument } from '../types'

interface StepCompleteProps {
  document: GeneratedWidgetDocument
  onReset: () => void
}

export function StepComplete({ document, onReset }: StepCompleteProps) {
  const [copied, setCopied] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + document.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatTimeSaved = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`
    }
    return `${mins}분`
  }

  return (
    <div className="space-y-8 py-8 relative">
      {/* Confetti animation placeholder */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
            🎉
          </div>
        </div>
      )}

      {/* Success header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
          <CheckCircleIcon className="h-10 w-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          문서가 생성되었습니다! 🎊
        </h2>
        <p className="text-zinc-400">
          {document.title}이(가) 성공적으로 생성되었습니다
        </p>
      </div>

      {/* Document card */}
      <div className="max-w-md mx-auto p-6 rounded-xl bg-gradient-to-br from-zinc-500/10 to-fuchsia-500/10 border border-zinc-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-zinc-500/20">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{document.title}</h3>
            <p className="text-sm text-zinc-400 mt-1">
              {document.format} • {document.pageCount || '다중'} 페이지
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-3 rounded-lg bg-zinc-900/50">
            <p className="text-xs text-zinc-500">생성 시간</p>
            <p className="text-lg font-semibold text-white">
              {(document.processingTimeMs / 1000).toFixed(1)}초
            </p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-400">절감 시간</p>
            <p className="text-lg font-semibold text-emerald-400">
              {formatTimeSaved(document.timeSavedMinutes)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
        <a
          href={document.url}
          download
          className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-500 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          다운로드
        </a>

        {document.previewUrl && (
          <a
            href={document.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
          >
            <EyeIcon className="h-5 w-5" />
            미리보기
          </a>
        )}

        <button
          onClick={handleCopyLink}
          className={cn(
            'flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all',
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-800 hover:bg-zinc-700 text-white'
          )}
        >
          <DocumentDuplicateIcon className="h-5 w-5" />
          {copied ? '복사됨!' : '링크 복사'}
        </button>
      </div>

      {/* Create another */}
      <div className="text-center pt-6 border-t border-zinc-800">
        <button
          onClick={onReset}
          className="text-white hover:text-zinc-300 transition-colors"
        >
          + 다른 문서 생성하기
        </button>
      </div>

      {/* Feedback prompt */}
      <div className="mt-8 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-center">
        <p className="text-sm text-zinc-400">
          문서가 마음에 드셨나요?{' '}
          <button className="text-white hover:text-zinc-300 underline">
            피드백 남기기
          </button>
        </p>
      </div>
    </div>
  )
}
