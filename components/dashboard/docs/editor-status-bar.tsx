'use client'

import { HANCOM_API_STATUS } from '@/lib/hancomdocs'
import { DOMAIN_OPTIONS, DOMAIN_COLORS, VIEW_MODE_STYLES } from '@/constants/domain-colors'
import type { EnginePresetType } from '@/types/inbox'
import type { ViewMode, HashCertificate } from './editor-types'
import {
  DocumentIcon,
  EyeIcon,
  PencilSquareIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

interface EditorStatusBarProps {
  viewMode: ViewMode
  selectedPreset: EnginePresetType
  generatedFilename: string | null
  isLocalMode: boolean
  hashCertificate: HashCertificate | null
  onDownloadCertificate: () => void
}

export function EditorStatusBar({
  viewMode,
  selectedPreset,
  generatedFilename,
  isLocalMode,
  hashCertificate,
  onDownloadCertificate,
}: EditorStatusBarProps) {
  return (
    <div className="h-7 px-3 flex items-center justify-between bg-zinc-900 border-t border-white/10 text-xs">
      <div className="flex items-center gap-4">
        {/* Current mode */}
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${VIEW_MODE_STYLES[viewMode]}`}>
          {viewMode === 'generate' && <><SparklesIcon className="h-3 w-3" /> Generate Mode</>}
          {viewMode === 'preview' && <><EyeIcon className="h-3 w-3" /> Web Preview</>}
          {viewMode === 'hancomdocs' && <><DocumentIcon className="h-3 w-3" /> HancomDocs</>}
          {viewMode === 'edit' && <><PencilSquareIcon className="h-3 w-3" /> Edit Mode</>}
          {viewMode === 'view' && <><EyeIcon className="h-3 w-3" /> View Mode</>}
        </span>

        {/* Domain engine */}
        <span className={`px-2 py-0.5 rounded text-xs ${DOMAIN_COLORS[selectedPreset]?.badge || 'bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20'}`}>
          {DOMAIN_OPTIONS.find(d => d.value === selectedPreset)?.label || selectedPreset}
        </span>

        {/* File format */}
        {generatedFilename && (
          <span className="text-zinc-500">
            {generatedFilename.split('.').pop()?.toUpperCase() || 'DOCX'}
          </span>
        )}

        {/* Hash certificate status */}
        {hashCertificate && (
          <button
            onClick={onDownloadCertificate}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded hover:bg-cyan-500/20 transition-colors cursor-pointer"
            title={`Click to download certificate\nHash: ${hashCertificate.hashChain}`}
          >
            <ShieldCheckIcon className="h-3 w-3" />
            <span>SHA-256: {hashCertificate.hashChain.slice(0, 8)}...</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 text-zinc-500">
        {/* Hancom connection status */}
        <span className="flex items-center gap-1.5">
          {isLocalMode ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Local Mode
            </>
          ) : HANCOM_API_STATUS.status === 'pending_review' ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              API Under Review
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              HancomDocs Connected
            </>
          )}
        </span>

        {/* QETTA brand */}
        <span className="text-zinc-600">
          QETTA DOCS Engine
        </span>
      </div>
    </div>
  )
}
