'use client'

import { useState } from 'react'
import { useAIPanelStore } from '@/stores/ai-panel-store'
import { apiPost } from '@/lib/api/client'
import type { EnginePresetType } from '@/lib/skill-engine/types'

// 분석 결과 타입
interface RejectionAnalysisResult {
  patterns: Array<{
    id: string
    category: string
    pattern: { context: string; keywords: string[] }
    solution: { immediate: string; prevention: string }
    stats: { frequency: number; preventionRate: number }
    metadata: { confidence: number }
  }>
  extendedThinking: {
    enabled: boolean
    thinkingBudget: number
    reasoning: string
  }
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low'
    action: string
    expectedOutcome: string
  }>
}

interface RejectionAnalysisProps {
  rejectionText?: string
  onAnalysisComplete?: (result: RejectionAnalysisResult) => void
}

/**
 * RejectionAnalysis - Extended Thinking 기반 탈락 분석 컴포넌트
 *
 * 기능:
 * - 탈락 사유 입력
 * - Extended Thinking 분석 실행
 * - 근본 원인 및 개선 전략 표시
 */
export function RejectionAnalysis({
  rejectionText: initialText,
  onAnalysisComplete,
}: RejectionAnalysisProps) {
  const { selectedPreset } = useAIPanelStore()
  const [text, setText] = useState(initialText || '')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<RejectionAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!text.trim()) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const data = await apiPost<{ success: boolean; analysis: RejectionAnalysisResult; error?: string }>(
        '/api/analyze-rejection',
        {
          rejectionText: text,
          domain: selectedPreset as EnginePresetType,
          useExtendedThinking: true,
        },
      )

      if (!data.success) {
        throw new Error(data.error || '분석 실패')
      }

      setResult(data.analysis)
      onAnalysisComplete?.(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* 입력 영역 */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400">
          Enter Rejection Reason
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the rejection notification email or document content..."
          className="w-full h-24 px-3 py-2 text-sm bg-zinc-800/50 border border-white/10 rounded-lg
                     text-zinc-100 placeholder:text-zinc-500 resize-none
                     focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      {/* 분석 버튼 */}
      <button
        onClick={handleAnalyze}
        disabled={!text.trim() || isAnalyzing}
        className="flex items-center justify-center gap-2 px-4 py-2
                   bg-zinc-600 hover:bg-zinc-700 disabled:bg-zinc-700
                   text-white text-sm font-medium rounded-lg transition-colors"
      >
        {isAnalyzing ? (
          <>
            <LoadingSpinner />
            Extended Thinking analysis in progress...
          </>
        ) : (
          <>
            <BrainIcon className="w-4 h-4" />
            Deep Analyze Rejection Causes
          </>
        )}
      </button>

      {/* 에러 표시 */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* 결과 표시 */}
      {result && (
        <div className="space-y-4 mt-2">
          {/* Extended Thinking 뱃지 */}
          {result.extendedThinking.enabled && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-500/10 text-zinc-400 rounded-full ring-1 ring-zinc-500/20">
                Extended Thinking
              </span>
              <span className="text-[10px] text-zinc-500">
                {result.extendedThinking.thinkingBudget.toLocaleString()} tokens
              </span>
            </div>
          )}

          {/* 매칭된 패턴 */}
          {result.patterns.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-zinc-400">Matched Patterns</h4>
              {result.patterns.slice(0, 3).map((pattern) => (
                <div
                  key={pattern.id}
                  className="p-2 bg-zinc-800/50 rounded-lg ring-1 ring-white/5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-zinc-300">
                      {getCategoryName(pattern.category)}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Confidence {Math.round(pattern.metadata.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{pattern.pattern.context}</p>
                </div>
              ))}
            </div>
          )}

          {/* 추천 사항 */}
          {result.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-zinc-400">Improvement Strategies</h4>
              {result.recommendations.map((rec) => (
                <div
                  key={`${rec.priority}-${rec.action}`}
                  className={`p-2 rounded-lg ring-1 ${getPriorityStyles(rec.priority)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${getPriorityBadgeStyles(rec.priority)}`}
                    >
                      {getPriorityLabel(rec.priority)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">{rec.action}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Expected outcome: {rec.expectedOutcome}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Extended Thinking 추론 (접이식) */}
          {result.extendedThinking.reasoning && (
            <details className="group">
              <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-400">
                View detailed reasoning
              </summary>
              <div className="mt-2 p-3 bg-zinc-800/30 rounded-lg">
                <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap font-mono">
                  {result.extendedThinking.reasoning.slice(0, 1000)}
                  {result.extendedThinking.reasoning.length > 1000 && '...'}
                </pre>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

// Helper functions
function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    missing_document: 'Missing Document',
    format_error: 'Format Error',
    deadline_missed: 'Deadline Missed',
    qualification_fail: 'Qualification Failed',
    budget_mismatch: 'Budget Mismatch',
    technical_fail: 'Technical Score Failed',
    experience_lack: 'Lack of Experience',
    certification_missing: 'Missing Certification',
    reference_invalid: 'Invalid Reference',
    other: 'Other',
  }
  return names[category] || category
}

function getPriorityStyles(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-500/10 ring-red-500/20'
    case 'high':
      return 'bg-amber-500/10 ring-amber-500/20'
    case 'medium':
      return 'bg-blue-500/10 ring-blue-500/20'
    default:
      return 'bg-zinc-500/10 ring-white/10'
  }
}

function getPriorityBadgeStyles(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-500/20 text-red-400'
    case 'high':
      return 'bg-amber-500/20 text-amber-400'
    case 'medium':
      return 'bg-blue-500/20 text-blue-400'
    default:
      return 'bg-zinc-500/20 text-zinc-400'
  }
}

function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'Critical'
    case 'high':
      return 'High'
    case 'medium':
      return 'Medium'
    default:
      return 'Low'
  }
}

// Icon components
function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-2.362.404a2.251 2.251 0 00-1.774 1.482l-.554 1.607a2.25 2.25 0 01-3.89 0l-.554-1.607a2.251 2.251 0 00-1.774-1.482l-2.362-.404c-1.716-.293-2.299-2.379-1.067-3.61L5 14.5"
      />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
