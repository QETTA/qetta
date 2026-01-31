/**
 * QettaTestResultBlock - QETTA 테스트 결과
 *
 * @theme Catalyst Dark
 */

'use client'

import { SparklesIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import type { QettaTestResult } from './types'

export function QettaTestResultBlock({ result }: { result: QettaTestResult }) {
  return (
    <div className="mt-3 space-y-3">
      {/* Company Info */}
      <div className="rounded-lg bg-zinc-800/50 p-4 ring-1 ring-white/10">
        <div className="mb-2 flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-zinc-400" />
          <span className="font-medium text-white">
            {result.companyProfile.name}
          </span>
        </div>
        <div className="flex gap-3 text-sm text-zinc-400">
          <span>{result.companyProfile.basic.region}</span>
          <span>•</span>
          <span>{result.companyProfile.basic.industry}</span>
          <span>•</span>
          <span>{result.companyProfile.basic.employees} employees</span>
        </div>
      </div>

      {/* Matched Programs */}
      <div className="rounded-lg bg-zinc-800/50 p-4 ring-1 ring-white/10">
        <div className="mb-3 text-sm font-medium text-zinc-400">
          Top 3 Matched Programs
        </div>
        <div className="space-y-2">
          {result.results.matchedPrograms.map((match) => (
            <div
              key={match.program}
              className="flex items-center justify-between rounded bg-zinc-900/50 px-3 py-2"
            >
              <span className="text-sm text-white">{match.program}</span>
              <span
                className={clsx(
                  'text-sm font-medium',
                  match.matchScore >= 80
                    ? 'text-emerald-400'
                    : match.matchScore >= 60
                      ? 'text-amber-400'
                      : 'text-red-400'
                )}
              >
                {match.matchScore}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Result Summary */}
      <div className="rounded-lg bg-zinc-800/50 p-4 ring-1 ring-white/10">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-400">Validation Score</span>
          <span
            className={clsx(
              'text-2xl font-bold',
              result.results.validation.score >= 80
                ? 'text-emerald-400'
                : result.results.validation.score >= 60
                  ? 'text-amber-400'
                  : 'text-red-400'
            )}
          >
            {result.results.validation.score}/100
          </span>
        </div>
        {result.results.validation.warnings.length > 0 && (
          <div className="text-xs text-amber-400">
            ⚠️ {result.results.validation.warnings.length} warnings
          </div>
        )}
      </div>

      {/* Business Plan Preview */}
      <div className="rounded-lg bg-zinc-800/50 p-4 ring-1 ring-white/10">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-400">
            Generated Business Plan
          </span>
          <span className="text-xs text-zinc-500">
            {result.results.businessPlan.wordCount.toLocaleString()} chars
          </span>
        </div>
        <p className="line-clamp-3 text-sm text-zinc-300">
          {result.results.businessPlan.preview}
        </p>
      </div>
    </div>
  )
}
