'use client'

/**
 * Docs Preview Footer Component
 *
 * Sheet tabs, language selector, and verification status.
 *
 * @module components/dashboard/docs/docs-preview-footer
 */

import {
  DEFAULT_TAB_DATA,
  LANGUAGES,
  type TabData,
  type LanguageOption,
} from './docs-preview-constants.js'

// =============================================================================
// Types
// =============================================================================

export interface DocsPreviewFooterProps {
  tabData?: TabData[]
  languages?: LanguageOption[]
  verifiedCount: number
  totalCount: number
}

// =============================================================================
// Component
// =============================================================================

export function DocsPreviewFooter({
  tabData = DEFAULT_TAB_DATA,
  languages = LANGUAGES,
  verifiedCount,
  totalCount,
}: DocsPreviewFooterProps) {
  return (
    <div className="h-[36px] bg-zinc-800/50 border-t border-white/10 flex items-center px-1 sm:px-2 gap-0.5 sm:gap-1 overflow-x-auto">
      <button className="w-6.5 h-6.5 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-white/5 rounded flex-shrink-0">
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button className="hidden sm:flex w-7 h-7 items-center justify-center hover:bg-white/5 rounded flex-shrink-0">
        <svg
          className="w-4 h-4 text-zinc-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </button>

      <div className="w-[1px] h-[18px] sm:h-[20px] bg-white/10 mx-0.5 sm:mx-1 flex-shrink-0" />

      {/* Tabs with verification badges and counts */}
      {tabData.map((tab) => (
        <SheetTab key={tab.name} tab={tab} />
      ))}

      <div className="flex-1 min-w-[8px]" />

      {/* Multilingual tabs */}
      <div className="hidden lg:flex items-center gap-0.5 mr-2">
        {languages.map((lang) => (
          <LanguageButton key={lang.code} lang={lang} />
        ))}
      </div>

      {/* Verification status */}
      <VerificationBadge
        verifiedCount={verifiedCount}
        totalCount={totalCount}
      />
    </div>
  )
}

// =============================================================================
// SheetTab Component
// =============================================================================

interface SheetTabProps {
  tab: TabData
}

function SheetTab({ tab }: SheetTabProps) {
  return (
    <button
      className={`h-[24px] sm:h-[26px] px-2 sm:px-3 ${
        tab.active
          ? 'bg-zinc-700 ring-1 ring-white/10 rounded-t-md text-white font-medium'
          : 'hover:bg-white/5 rounded-t-md text-zinc-400 transition-all duration-200 hover:text-zinc-300'
      } text-[11px] sm:text-[12px] flex items-center gap-1 sm:gap-1.5 flex-shrink-0 whitespace-nowrap`}
    >
      <span className="hidden sm:inline">{tab.name}</span>
      <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
      {/* Tab verification badge */}
      <span
        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] ${
          tab.verified
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/20 text-amber-400'
        }`}
      >
        {tab.verified ? '✓' : '⏳'}
      </span>
      {/* Tab data count - hide on mobile */}
      <span className="hidden md:inline text-[10px] text-zinc-500">
        ({tab.count})
      </span>
      {tab.active && (
        <svg
          className="w-[10px] h-[10px] sm:w-3 sm:h-3 text-zinc-400"
          viewBox="0 0 10 10"
          fill="none"
        >
          <path
            d="M2.5 4L5 6.5L7.5 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  )
}

// =============================================================================
// LanguageButton Component
// =============================================================================

interface LanguageButtonProps {
  lang: LanguageOption
}

function LanguageButton({ lang }: LanguageButtonProps) {
  return (
    <button
      className={`h-[20px] px-1.5 text-[9px] font-medium rounded ${
        lang.active
          ? 'bg-zinc-700 text-white ring-1 ring-white/20'
          : 'hover:bg-white/5 text-zinc-500'
      } transition-colors`}
      title={lang.name}
    >
      {lang.code.toUpperCase()}
    </button>
  )
}

// =============================================================================
// VerificationBadge Component
// =============================================================================

interface VerificationBadgeProps {
  verifiedCount: number
  totalCount: number
}

function VerificationBadge({
  verifiedCount,
  totalCount,
}: VerificationBadgeProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-emerald-500/10 rounded-full flex-shrink-0">
      <svg
        className="w-3 h-3 sm:w-[14px] sm:h-[14px] text-emerald-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <span className="text-[10px] sm:text-[11px] text-emerald-400 font-medium">
        {verifiedCount}/{totalCount}
      </span>
      <span className="hidden sm:inline text-[10px] text-emerald-500/70">
        09:05
      </span>
    </div>
  )
}

export default DocsPreviewFooter
