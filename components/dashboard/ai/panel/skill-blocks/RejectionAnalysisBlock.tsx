/**
 * RejectionAnalysisBlock - 탈락 분석 결과
 *
 * @theme Catalyst Dark
 */

'use client'

import {
  CheckCircleIcon,
  SparklesIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import type { RejectionAnalysisResult } from './types'

export function RejectionAnalysisBlock({
  result,
}: {
  result: RejectionAnalysisResult
}) {
  const riskColors = {
    high: 'bg-red-500/10 text-red-400 ring-red-500/20',
    medium: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  }

  const riskLabels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }

  return (
    <div className="mt-3 rounded-lg bg-zinc-800/50 p-4 ring-1 ring-white/10">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-zinc-400" />
          <span className="font-medium text-white">Rejection Analysis</span>
        </div>
        <span
          className={clsx(
            'rounded-full px-2.5 py-0.5 text-xs font-medium ring-1',
            riskColors[result.overallRisk]
          )}
        >
          Risk: {riskLabels[result.overallRisk]}
        </span>
      </div>

      {/* Extended Thinking result (if available) */}
      {result.thinking && (
        <div className="mb-4 rounded-md bg-zinc-500/5 p-3 ring-1 ring-zinc-500/20">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-zinc-400">
            <AcademicCapIcon className="h-3.5 w-3.5" />
            AI Reasoning
          </div>
          <p className="text-sm text-zinc-300">{result.thinking}</p>
        </div>
      )}

      {/* Pattern List */}
      <div className="space-y-3">
        {result.patterns.map((pattern) => (
          <div
            key={pattern.category}
            className="rounded-md bg-zinc-900/50 p-3 ring-1 ring-white/5"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                {pattern.category}
              </span>
              <span
                className={clsx(
                  'rounded px-1.5 py-0.5 text-xs',
                  riskColors[pattern.frequency]
                )}
              >
                {pattern.frequency === 'high'
                  ? 'Frequent'
                  : pattern.frequency === 'medium'
                    ? 'Moderate'
                    : 'Rare'}
              </span>
            </div>
            <p className="mb-2 text-sm text-zinc-400">{pattern.description}</p>
            <div className="flex items-start gap-2 rounded bg-emerald-500/5 p-2">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span className="text-xs text-emerald-300">
                Prevention: {pattern.prevention}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <h4 className="mb-2 text-sm font-medium text-zinc-400">
            Improvement Suggestions
          </h4>
          <ul className="space-y-1.5">
            {result.suggestions.map((suggestion) => (
              <li key={suggestion} className="flex items-start gap-2 text-sm">
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-300">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
