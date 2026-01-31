'use client'

import { useState, useEffect, memo } from 'react'
import { cn } from '@/lib/utils'

/**
 * HeroStoryAnimation - 3-step document generation story
 *
 * Outcome-first approach: Shows customer journey, not technical details
 * 1. Upload company info
 * 2. AI processes & matches
 * 3. Document generated in 45s
 */

const STORY_STEPS = [
  {
    id: 'input',
    label: 'Upload',
    duration: 2500,
    content: 'Company profile uploaded...',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    id: 'analyze',
    label: 'Match',
    duration: 2000,
    content: 'Matching 630K+ tenders...',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'generate',
    label: 'Done',
    duration: 2500,
    content: 'Business Plan (12p) - 45 seconds',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
] as const

export const HeroStoryAnimation = memo(function HeroStoryAnimation() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    if (!isAnimating) return

    const step = STORY_STEPS[currentStep]
    const timer = setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % STORY_STEPS.length)
    }, step.duration)

    return () => clearTimeout(timer)
  }, [currentStep, isAnimating])

  const step = STORY_STEPS[currentStep]

  return (
    <div
      className="rounded-xl bg-zinc-900/50 border border-white/10 overflow-hidden"
      onMouseEnter={() => setIsAnimating(false)}
      onMouseLeave={() => setIsAnimating(true)}
    >
      {/* Step Progress Indicators */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-zinc-900/30">
        {STORY_STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                currentStep >= i
                  ? currentStep === i
                    ? 'bg-white scale-125'
                    : 'bg-emerald-500'
                  : 'bg-zinc-700'
              )}
            />
            <span
              className={cn(
                'text-xs font-medium transition-colors duration-300',
                currentStep === i ? 'text-white' : 'text-zinc-500'
              )}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-5 min-h-[120px] flex items-center">
        <div key={step.id} className="flex items-center gap-3 animate-story-enter">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              currentStep === 2
                ? 'bg-emerald-500/20 text-emerald-400'
                : currentStep === 1
                  ? 'bg-amber-500/20 text-amber-400 animate-processing'
                  : 'bg-zinc-700/50 text-zinc-400'
            )}
          >
            {step.icon}
          </div>
          <div>
            <p
              className={cn(
                'text-sm font-mono',
                currentStep === 2 ? 'text-emerald-400' : currentStep === 1 ? 'text-amber-400' : 'text-white'
              )}
            >
              {currentStep === 2 && '✓ '}
              {step.content}
              {currentStep < 2 && <span className="animate-typing-cursor">|</span>}
            </p>
            {currentStep === 2 && (
              <p className="text-xs text-zinc-500 mt-1">8 hours → 45 seconds</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-zinc-900/30">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-zinc-500">Real-time</span>
        </div>
        <span className="text-[10px] text-zinc-500">
          93.8% time saved
        </span>
      </div>
    </div>
  )
})
