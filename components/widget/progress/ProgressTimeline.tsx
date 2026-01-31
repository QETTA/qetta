'use client'

import { cn } from '@/lib/utils'
import { useProgressStore } from '../store'
import type { ProgressPhase } from '../types'

const PHASES: { phase: ProgressPhase; label: string; icon: string }[] = [
  { phase: 'validating', label: '검증', icon: '🔍' },
  { phase: 'analyzing', label: 'AI 분석', icon: '🤖' },
  { phase: 'generating', label: '생성', icon: '📝' },
  { phase: 'rendering', label: '렌더링', icon: '🎨' },
  { phase: 'complete', label: '완료', icon: '✅' },
]

const PHASE_ORDER: Record<ProgressPhase, number> = {
  validating: 0,
  analyzing: 1,
  generating: 2,
  rendering: 3,
  complete: 4,
}

export function ProgressTimeline() {
  const { phase, progress, message } = useProgressStore()
  const currentIndex = PHASE_ORDER[phase]

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="relative">
        <div className="flex justify-between">
          {PHASES.map((p, index) => {
            const isComplete = index < currentIndex
            const isCurrent = index === currentIndex
            const isPending = index > currentIndex

            return (
              <div
                key={p.phase}
                className="flex flex-col items-center relative z-10"
              >
                {/* Icon circle */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-500',
                    isComplete && 'bg-zinc-500/20 ring-2 ring-zinc-500',
                    isCurrent && 'bg-zinc-500 ring-4 ring-zinc-500/30 animate-pulse',
                    isPending && 'bg-zinc-800 ring-2 ring-zinc-700'
                  )}
                >
                  {p.icon}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors duration-300',
                    isComplete && 'text-white',
                    isCurrent && 'text-white',
                    isPending && 'text-zinc-600'
                  )}
                >
                  {p.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Connector line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-zinc-800 -z-0">
          <div
            className="h-full bg-gradient-to-r from-zinc-500 to-fuchsia-500 transition-all duration-500 ease-out"
            style={{ width: `${(currentIndex / (PHASES.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-zinc-500 via-fuchsia-500 to-zinc-500 transition-all duration-300 ease-out animate-shimmer"
            style={{
              width: `${progress}%`,
              backgroundSize: '200% 100%',
            }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">{message}</span>
          <span className="text-white font-medium">{progress}%</span>
        </div>
      </div>
    </div>
  )
}
