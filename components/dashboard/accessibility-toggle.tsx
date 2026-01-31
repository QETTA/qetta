'use client'

import { useEffect } from 'react'
import {
  useAccessibilityStore,
  applyFontSizeVars,
  type FontSizeMode,
} from '@/stores/accessibility-store'

/**
 * AccessibilityToggle - 중장년 UX 최적화를 위한 접근성 설정 토글
 *
 * 페르소나: 김제조 대표 (58세)
 * - "글씨가 너무 작아서 안 보여요"
 * - "버튼이 어디 있는지 모르겠어요"
 *
 * @see docs/plans/2026-01-22-domain-engine-master-plan.md 섹션 8
 */

const FONT_SIZE_OPTIONS: { value: FontSizeMode; label: string; icon: string }[] =
  [
    { value: 'normal', label: '기본', icon: 'A' },
    { value: 'large', label: '크게', icon: 'A+' },
    { value: 'extra-large', label: '아주 크게', icon: 'A++' },
  ]

interface AccessibilityToggleProps {
  /** Compact mode for sidebar */
  compact?: boolean
}

export function AccessibilityToggle({ compact = false }: AccessibilityToggleProps) {
  const { fontSizeMode, setFontSizeMode, highContrast, toggleHighContrast } =
    useAccessibilityStore()

  // Apply font size on mount (for SSR hydration)
  useEffect(() => {
    applyFontSizeVars(fontSizeMode)
  }, [fontSizeMode])

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {FONT_SIZE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setFontSizeMode(option.value)}
            className={`
              w-8 h-8 rounded-md text-xs font-bold transition-colors
              ${
                fontSizeMode === option.value
                  ? 'bg-zinc-500/20 text-white ring-1 ring-zinc-500/30'
                  : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-400'
              }
            `}
            title={option.label}
            aria-pressed={fontSizeMode === option.value}
          >
            {option.icon}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 bg-zinc-800/50 rounded-lg ring-1 ring-white/10">
      <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <EyeIcon className="w-4 h-4 text-zinc-400" />
        화면 설정
      </h3>

      {/* Font Size Selector */}
      <div className="mb-4">
        <label className="text-xs text-zinc-500 mb-2 block">글자 크기</label>
        <div className="flex gap-2">
          {FONT_SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFontSizeMode(option.value)}
              className={`
                flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${
                  fontSizeMode === option.value
                    ? 'bg-zinc-500/20 text-white ring-1 ring-zinc-500/30'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }
              `}
              aria-pressed={fontSizeMode === option.value}
            >
              <span className="text-lg font-bold block">{option.icon}</span>
              <span className="text-[10px] mt-0.5 block opacity-70">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* High Contrast Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-zinc-400">고대비 모드</label>
        <button
          onClick={toggleHighContrast}
          className={`
            relative w-11 h-6 rounded-full transition-colors
            ${highContrast ? 'bg-zinc-500' : 'bg-zinc-700'}
          `}
          role="switch"
          aria-checked={highContrast}
        >
          <span
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md
              transition-transform duration-200
              ${highContrast ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {/* Current Mode Indicator */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <p className="text-[11px] text-zinc-600">
          현재: <span className="text-zinc-400">{getFontModeLabel(fontSizeMode)}</span>
          {highContrast && <span className="text-zinc-400"> + 고대비</span>}
        </p>
      </div>
    </div>
  )
}

function getFontModeLabel(mode: FontSizeMode): string {
  switch (mode) {
    case 'normal':
      return '기본 글자 크기'
    case 'large':
      return '큰 글자 (18px+)'
    case 'extra-large':
      return '아주 큰 글자 (22px+)'
  }
}

// Simple eye icon
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

/**
 * AccessibilityProvider - 앱 루트에 배치하여 설정 초기화
 */
export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { fontSizeMode, highContrast, reduceMotion } = useAccessibilityStore()

  useEffect(() => {
    applyFontSizeVars(fontSizeMode)
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.highContrast = String(highContrast)
      document.documentElement.dataset.reduceMotion = String(reduceMotion)
    }
  }, [fontSizeMode, highContrast, reduceMotion])

  return <>{children}</>
}
