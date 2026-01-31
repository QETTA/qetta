/**
 * ValidationResultBlock - 사전 검증 결과
 *
 * @theme Catalyst Dark
 */

'use client'

import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import type { ValidationResult } from './types'

export function ValidationResultBlock({
  result,
  programName,
}: {
  result: ValidationResult
  programName: string
}) {
  const scoreColor =
    result.score >= 80
      ? 'text-emerald-400'
      : result.score >= 60
        ? 'text-amber-400'
        : 'text-red-400'

  const scoreLabel =
    result.score >= 80
      ? 'Excellent'
      : result.score >= 60
        ? 'Good'
        : 'Needs Improvement'

  return (
    <div className="mt-3 rounded-lg bg-zinc-800/50 p-4 ring-1 ring-white/10">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-blue-400" />
          <span className="font-medium text-white">Pre-Validation Result</span>
        </div>
        <span className="text-xs text-zinc-500">{programName}</span>
      </div>

      {/* Score */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-baseline gap-1">
          <span className={clsx('text-3xl font-bold', scoreColor)}>
            {result.score}
          </span>
          <span className="text-sm text-zinc-500">/100</span>
        </div>
        <span
          className={clsx(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            result.score >= 80
              ? 'bg-emerald-500/10 text-emerald-400'
              : result.score >= 60
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-red-500/10 text-red-400'
          )}
        >
          {scoreLabel}
        </span>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="mb-3 rounded-md bg-amber-500/5 p-3 ring-1 ring-amber-500/20">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-400">
            <ExclamationTriangleIcon className="h-4 w-4" />
            Warnings ({result.warnings.length})
          </div>
          <ul className="space-y-1">
            {result.warnings.map((warning) => (
              <li key={warning} className="text-sm text-amber-300/80">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rejection Risks */}
      {result.rejectionRisks.length > 0 && (
        <div className="mb-3 rounded-md bg-red-500/5 p-3 ring-1 ring-red-500/20">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-red-400">
            <XCircleIcon className="h-4 w-4" />
            Rejection Risks ({result.rejectionRisks.length})
          </div>
          <ul className="space-y-1">
            {result.rejectionRisks.map((risk) => (
              <li key={risk} className="text-sm text-red-300/80">
                • {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="rounded-md bg-zinc-900/50 p-3">
          <div className="mb-2 text-sm font-medium text-zinc-400">
            Improvement Suggestions
          </div>
          <ul className="space-y-1">
            {result.suggestions.map((suggestion) => (
              <li key={suggestion} className="flex items-start gap-2 text-sm">
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-zinc-300">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
