'use client'

import { HANCOM_API_STATUS } from '@/lib/hancomdocs'
import type { DocumentFormat } from '@/lib/document-generator/types'
import type { ViewMode, EditorStatus, HashCertificate } from './editor-types'
import { Badge } from '@/components/catalyst/badge'
import {
  DocumentIcon,
  ArrowPathIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  EyeIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

export interface EditorToolbarProps {
  documentId: string | null
  generatedFilename: string | null
  status: EditorStatus
  viewMode: ViewMode
  selectedFormat: DocumentFormat | 'auto'
  hashCertificate: HashCertificate | null
  onViewModeChange: (mode: ViewMode) => void
  onGeneratePreview: () => void
  onDownload: () => void
  onDownloadCertificate: () => void
  onSave: () => void
  onClose: () => void
  onFormatChange: (format: DocumentFormat | 'auto') => void
}

export function EditorToolbar({
  documentId,
  generatedFilename,
  status,
  viewMode,
  selectedFormat,
  hashCertificate,
  onViewModeChange,
  onGeneratePreview,
  onDownload,
  onDownloadCertificate,
  onSave,
  onClose,
  onFormatChange,
}: EditorToolbarProps) {
  return (
    <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 bg-zinc-900">
      <div className="flex items-center gap-3">
        {/* Document icon */}
        <div className="flex items-center gap-2">
          <DocumentIcon className="h-5 w-5 text-zinc-400" />
          <span className="text-sm text-white font-medium truncate max-w-xs">
            {generatedFilename || documentId ? `${generatedFilename || documentId}` : 'QETTA DOCS'}
          </span>
        </div>

        {/* Status badge */}
        {status === 'loading' && (
          <Badge color="blue">
            <ArrowPathIcon className="h-3 w-3 animate-spin" />
            Loading
          </Badge>
        )}
        {status === 'generating' && (
          <Badge color="zinc">
            <SparklesIcon className="h-3 w-3 animate-pulse" />
            Generating...
          </Badge>
        )}
        {status === 'saving' && (
          <Badge color="amber">
            Saving...
          </Badge>
        )}
        {status === 'ready' && (
          <Badge color="emerald">
            <CheckCircleIcon className="h-3 w-3" />
            Ready
          </Badge>
        )}
        {status === 'error' && (
          <Badge color="red">
            <ExclamationCircleIcon className="h-3 w-3" />
            Error
          </Badge>
        )}

        {/* API status badge */}
        {HANCOM_API_STATUS.status === 'pending_review' && (
          <Badge color="amber">API Under Review</Badge>
        )}
      </div>

      {/* Right action buttons */}
      <div className="flex items-center gap-2">
        {/* View mode toggle */}
        <div className="flex items-center bg-zinc-800 rounded-lg overflow-hidden ring-1 ring-white/10">
          <button
            onClick={() => onViewModeChange('generate')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'generate'
                ? 'bg-white text-zinc-900'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            aria-pressed={viewMode === 'generate'}
            title="Generate Document"
          >
            <SparklesIcon className="h-4 w-4" />
            Generate
          </button>
          <button
            onClick={() => onViewModeChange('view')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'view'
                ? 'bg-white text-zinc-900'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            aria-pressed={viewMode === 'view'}
            title="View Document"
          >
            <EyeIcon className="h-4 w-4" />
            View
          </button>
          <button
            onClick={() => onViewModeChange('edit')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'edit'
                ? 'bg-white text-zinc-900'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            aria-pressed={viewMode === 'edit'}
            title="Edit Document"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={onGeneratePreview}
            className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'preview'
                ? 'bg-white text-zinc-900'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            aria-pressed={viewMode === 'preview'}
            title="Web Preview (No HancomDocs API required)"
          >
            <EyeIcon className="h-4 w-4" />
            Preview
          </button>
        </div>

        {/* Download area */}
        <div className="flex items-center gap-1">
          {/* Format selection dropdown */}
          <select
            value={selectedFormat}
            onChange={(e) => onFormatChange(e.target.value as DocumentFormat | 'auto')}
            className="px-2 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-l-lg border-r border-zinc-700 outline-none focus:ring-1 focus:ring-white/30 cursor-pointer"
            title="Select download format"
          >
            <option value="auto">Auto</option>
            <option value="DOCX">DOCX</option>
            <option value="XLSX">XLSX</option>
            <option value="PDF">PDF</option>
          </select>
          {/* Download button */}
          <button
            onClick={onDownload}
            disabled={status === 'generating' || status === 'loading'}
            className="px-3 py-1.5 text-xs font-medium bg-white text-zinc-900 rounded-r-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            aria-label="Download document"
            title="Download in selected format"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download
          </button>
        </div>

        {/* Hash certificate button */}
        {hashCertificate && (
          <button
            onClick={onDownloadCertificate}
            className="px-3 py-1.5 text-xs font-medium bg-cyan-600/80 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-1.5"
            aria-label="Download integrity certificate"
            title={`SHA-256: ${hashCertificate.hashChain.slice(0, 16)}...`}
          >
            <ShieldCheckIcon className="h-4 w-4" />
            Certificate
          </button>
        )}

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={status !== 'ready'}
          className="px-3 py-1.5 text-xs font-medium bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          aria-label="Save (Ctrl+S)"
        >
          <CloudArrowUpIcon className="h-4 w-4" />
          Save
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Close (Esc)"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
