/**
 * ProgramMatchBlock - 매칭 프로그램 카드
 *
 * @theme Catalyst Dark
 */

'use client'

import { ChartBarIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import type { ProgramMatch } from './types'

export function ProgramMatchBlock({ matches }: { matches: ProgramMatch[] }) {
  return (
    <div className="mt-3 rounded-lg bg-zinc-800/50 p-4 ring-1 ring-white/10">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <ChartBarIcon className="h-5 w-5 text-amber-400" />
        <span className="font-medium text-white">
          Matched Programs ({matches.length})
        </span>
      </div>

      {/* Program Card List */}
      <div className="space-y-3">
        {matches.map((match) => (
          <div
            key={match.program.id}
            className="rounded-md bg-zinc-900/50 p-3 ring-1 ring-white/5 transition-all hover:ring-white/10"
          >
            {/* Program Header */}
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h4 className="font-medium text-white">{match.program.name}</h4>
                <p className="text-xs text-zinc-500">{match.program.nameEn}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={clsx(
                    'h-2 w-2 rounded-full',
                    match.matchScore >= 80
                      ? 'bg-emerald-400'
                      : match.matchScore >= 60
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                  )}
                />
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
            </div>

            {/* Support Info */}
            <div className="mb-2 flex gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Max Support </span>
                <span className="text-white">
                  ${(match.program.support.maxAmount / 10000).toFixed(0)}M
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Duration </span>
                <span className="text-white">
                  {match.program.support.duration} months
                </span>
              </div>
            </div>

            {/* Category/Stage Badges */}
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded bg-zinc-500/10 px-1.5 py-0.5 text-xs text-zinc-400 ring-1 ring-zinc-500/20">
                {match.program.category}
              </span>
              {match.program.stage.map((stage) => (
                <span
                  key={stage}
                  className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-xs text-zinc-400"
                >
                  {stage}
                </span>
              ))}
            </div>

            {/* Eligibility Issues */}
            {match.eligibilityIssues.length > 0 && (
              <div className="mt-2 border-t border-white/5 pt-2">
                <div className="text-xs text-amber-400">
                  ⚠️ {match.eligibilityIssues.join(', ')}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
