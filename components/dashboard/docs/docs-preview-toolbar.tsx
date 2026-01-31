'use client'

/**
 * Docs Preview Toolbar Components
 *
 * Menu bar, toolbar, and formula bar for the docs preview.
 *
 * @module components/dashboard/docs/docs-preview-toolbar
 */

import { DOWNLOAD_FORMATS, type DownloadFormat } from './docs-preview-constants.js'

// =============================================================================
// MenuBar Component
// =============================================================================

export function DocsPreviewMenuBar() {
  return (
    <div className="h-10 bg-zinc-800 border-b border-white/10 flex items-center px-2 sm:px-3 gap-1">
      {/* Qetta DOCS Icon */}
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        <svg className="w-5.5 h-5.5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            className="text-zinc-400"
            d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
          />
          <path
            fill="currentColor"
            className="text-zinc-500/50"
            d="M14 2v6h6L14 2z"
          />
          <path
            fill="white"
            d="M7 12h10v1.5H7V12zm0 3h10v1.5H7V15zm0 3h7v1.5H7V18z"
          />
        </svg>
      </div>

      <div className="flex flex-col ml-1 min-w-0">
        <span className="text-sm font-medium text-white leading-tight truncate">
          TMS Daily Report
        </span>
        <div className="hidden sm:flex items-center gap-2 lg:gap-3 text-xs text-zinc-400">
          <span className="hover:bg-white/5 px-1 lg:px-1.5 py-0.5 rounded cursor-pointer">
            File
          </span>
          <span className="hover:bg-white/5 px-1 lg:px-1.5 py-0.5 rounded cursor-pointer">
            Edit
          </span>
          <span className="hover:bg-white/5 px-1 lg:px-1.5 py-0.5 rounded cursor-pointer hidden md:block">
            View
          </span>
          <span className="hover:bg-white/5 px-1 lg:px-1.5 py-0.5 rounded cursor-pointer hidden md:block">
            Insert
          </span>
          <span className="hover:bg-white/5 px-1 lg:px-1.5 py-0.5 rounded cursor-pointer hidden lg:block">
            Format
          </span>
          <span className="hover:bg-white/5 px-1 lg:px-1.5 py-0.5 rounded cursor-pointer hidden lg:block">
            Tools
          </span>
          <span className="hover:bg-white/5 px-1 lg:px-1.5 py-0.5 rounded cursor-pointer">
            Verify
          </span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Right side buttons with download formats */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Download format buttons */}
        <div className="hidden md:flex items-center gap-1">
          {DOWNLOAD_FORMATS.map((item: DownloadFormat) => (
            <button
              key={item.format}
              className={`h-[24px] px-2 text-[10px] font-medium rounded ${item.color} transition-colors`}
              title={`Download ${item.format}`}
            >
              {item.format}
            </button>
          ))}
        </div>
        <button className="h-7 sm:h-8 px-2 sm:px-4 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-xs font-medium rounded-full flex items-center gap-1 sm:gap-2 transition-colors">
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="hidden sm:inline">Submit</span>
        </button>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-600 flex items-center justify-center cursor-pointer flex-shrink-0">
          <span className="text-white text-xs font-medium">Q</span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Toolbar Component
// =============================================================================

export function DocsPreviewToolbar() {
  return (
    <div className="h-9 sm:h-10 bg-zinc-800/50 border-b border-white/10 flex items-center px-1 sm:px-2 gap-0.5 sm:gap-1 overflow-x-auto">
      {/* Undo/Redo */}
      <ToolbarButton>
        <svg
          className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </ToolbarButton>
      <ToolbarButton>
        <svg
          className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Zoom - hide on mobile */}
      <button className="hidden sm:flex h-[28px] px-2 items-center gap-1 hover:bg-white/5 rounded text-[13px] text-zinc-400 flex-shrink-0 transition-colors">
        100%
        <svg className="w-3 h-3" viewBox="0 0 10 10" fill="none">
          <path
            d="M2.5 4L5 6.5L7.5 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <ToolbarDivider className="hidden sm:block" />

      {/* Format buttons */}
      <ToolbarButton className="text-[12px] sm:text-[13px] text-zinc-400 font-medium">
        °C
      </ToolbarButton>
      <ToolbarButton className="text-[12px] sm:text-[13px] text-zinc-400 font-medium">
        pH
      </ToolbarButton>

      <ToolbarDivider />

      {/* Font - hide on small screens */}
      <button className="hidden md:flex h-[28px] px-2 items-center gap-1 hover:bg-white/5 rounded text-[13px] text-zinc-400 flex-shrink-0 transition-colors">
        Sans Serif
        <svg className="w-3 h-3" viewBox="0 0 10 10" fill="none">
          <path
            d="M2.5 4L5 6.5L7.5 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <button className="hidden md:flex h-[28px] w-[50px] items-center justify-center gap-1 hover:bg-white/5 rounded text-[13px] text-zinc-400 flex-shrink-0 transition-colors">
        10
        <svg className="w-3 h-3" viewBox="0 0 10 10" fill="none">
          <path
            d="M2.5 4L5 6.5L7.5 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <ToolbarDivider className="hidden md:block" />

      {/* Bold, Italic, Strikethrough */}
      <ToolbarButton className="text-[12px] sm:text-[13px] text-zinc-400 font-bold">
        B
      </ToolbarButton>
      <ToolbarButton className="text-[12px] sm:text-[13px] text-zinc-400 italic">
        I
      </ToolbarButton>
      <ToolbarButton className="hidden sm:flex text-[13px] text-zinc-400 line-through">
        S
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text color - hide on mobile */}
      <button className="hidden sm:flex w-7 h-7 flex-col items-center justify-center hover:bg-white/5 rounded flex-shrink-0 transition-colors">
        <span className="text-[13px] text-zinc-400 font-medium leading-none">
          A
        </span>
        <div className="w-[14px] h-[3px] bg-white mt-0.5" />
      </button>

      {/* Fill color - hide on mobile */}
      <button className="hidden sm:flex w-7 h-7 items-center justify-center hover:bg-white/5 rounded flex-shrink-0 transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path
            d="M13 11l-2.5 3L8 11"
            stroke="currentColor"
            className="text-zinc-400"
            strokeWidth="1.5"
          />
          <rect
            x="2"
            y="2"
            width="10"
            height="8"
            fill="currentColor"
            className="text-emerald-500/30"
            stroke="currentColor"
          />
        </svg>
      </button>

      <ToolbarDivider className="hidden sm:block" />

      {/* Hash verification */}
      <button
        className="w-6.5 h-6.5 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 focus:ring-offset-zinc-900 rounded flex-shrink-0 transition-colors"
        title="SHA-256 Verify"
        aria-label="SHA-256 hash chain verification"
      >
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </button>

      {/* Merge - hide on mobile */}
      <button className="hidden sm:flex w-7 h-7 items-center justify-center hover:bg-white/5 rounded flex-shrink-0 transition-colors">
        <svg
          className="w-4 h-4 text-zinc-400"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="2" y="2" width="12" height="12" />
          <line x1="8" y1="2" x2="8" y2="14" />
        </svg>
      </button>

      <ToolbarDivider className="hidden lg:block" />

      {/* Refresh button */}
      <button
        className="w-6.5 h-6.5 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 focus:ring-offset-zinc-900 rounded flex-shrink-0 transition-colors"
        title="Refresh sensor data"
        aria-label="Refresh sensor data"
      >
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.36-3.36L23 10M1 14l5.64 5.64A9 9 0 0020.49 15" />
        </svg>
      </button>

      {/* Alarm settings button - hide on mobile */}
      <button
        className="hidden md:flex w-7 h-7 items-center justify-center hover:bg-white/5 rounded flex-shrink-0 transition-colors"
        title="Alarm Settings"
      >
        <svg
          className="w-4 h-4 text-zinc-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      </button>

      {/* Export button */}
      <button
        className="w-6.5 h-6.5 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-white/5 rounded flex-shrink-0 transition-colors"
        title="Export to CSV/Excel"
      >
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
      </button>

      {/* Filter button - hide on mobile */}
      <button
        className="hidden sm:flex w-7 h-7 items-center justify-center hover:bg-white/5 rounded flex-shrink-0 transition-colors"
        title="Status Filter"
      >
        <svg
          className="w-4 h-4 text-zinc-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>
    </div>
  )
}

// =============================================================================
// FormulaBar Component
// =============================================================================

export function DocsPreviewFormulaBar() {
  return (
    <div className="h-[28px] bg-zinc-900 border-b border-white/10 flex items-center">
      <div className="w-[60px] sm:w-[100px] h-full border-r border-white/10 flex items-center justify-center text-[11px] sm:text-[12px] text-zinc-400 bg-zinc-800/50 flex-shrink-0">
        E9
      </div>
      <div className="flex-1 flex items-center px-2 min-w-0 overflow-hidden">
        <span className="text-[11px] sm:text-[13px] text-zinc-400 truncate">
          =VERIFY_HASH(A2:H7, &quot;SHA-256&quot;)
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// Helper Components
// =============================================================================

interface ToolbarButtonProps {
  children: React.ReactNode
  className?: string
}

function ToolbarButton({ children, className = '' }: ToolbarButtonProps) {
  return (
    <button
      className={`w-6.5 h-6.5 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-white/5 rounded flex-shrink-0 transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-[1px] h-[18px] sm:h-[20px] bg-white/10 mx-0.5 sm:mx-1 flex-shrink-0 ${className}`}
    />
  )
}

export default DocsPreviewToolbar
