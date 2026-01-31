'use client'

import { useState } from 'react'
import type { ArtifactReference } from '@/stores/ai-panel-store'

interface ArtifactPreviewProps {
  artifact: ArtifactReference
  onDownload?: () => void
  onEditInHancom?: () => void
}

/**
 * ArtifactPreview - Document Artifact Card
 *
 * Displays generated documents with:
 * - Preview thumbnail or iframe
 * - Download button
 * - Edit in Hancom Docs button
 * - Hash chain verification status
 */
export function ArtifactPreview({
  artifact,
  onDownload,
  onEditInHancom,
}: ArtifactPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatIcons: Record<string, string> = {
    DOCX: '📄',
    XLSX: '📊',
    PDF: '📕',
    HWP: '📝',
  }

  const formatColors: Record<string, string> = {
    DOCX: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
    XLSX: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
    PDF: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
    HWP: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-zinc-700/50">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${formatColors[artifact.format]}`}
          >
            {formatIcons[artifact.format]}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate">
              {artifact.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${formatColors[artifact.format]}`}
              >
                {artifact.format}
              </span>
              <span className="text-[10px] text-zinc-500">
                {formatTime(artifact.createdAt)}
              </span>
            </div>
          </div>

          {/* Expand button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-zinc-500 hover:text-zinc-400 hover:bg-white/5 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview area (expandable) */}
      {isExpanded && artifact.previewUrl && (
        <div className="border-b border-zinc-700/50">
          <iframe
            src={artifact.previewUrl}
            className="w-full h-48 bg-white"
            title={`${artifact.title} preview`}
          />
        </div>
      )}

      {/* Actions */}
      <div className="p-3 flex items-center gap-2">
        {/* Preview button */}
        {artifact.previewUrl && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
            Preview
          </button>
        )}

        {/* Edit in Hancom button */}
        {onEditInHancom && (
          <button
            onClick={onEditInHancom}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-500/10 hover:bg-zinc-500/20 ring-1 ring-zinc-500/20 rounded-lg transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
            Hancom Docs
          </button>
        )}

        {/* Download button */}
        {onDownload && (
          <button
            onClick={onDownload}
            className="flex items-center justify-center p-1.5 text-zinc-400 hover:text-zinc-300 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-colors"
            aria-label="Download"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Hash chain verification */}
      {artifact.hashChain && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-zinc-500">Hash:</span>
            <code className="text-zinc-400 font-mono">
              {artifact.hashChain.slice(0, 12)}...
            </code>
            {artifact.verified ? (
              <span className="flex items-center gap-0.5 text-emerald-400">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Verified
              </span>
            ) : (
              <span className="text-amber-400">Pending</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ArtifactList - List of multiple artifacts
 */
export function ArtifactList({
  artifacts,
  onDownload,
  onEditInHancom,
}: {
  artifacts: ArtifactReference[]
  onDownload?: (artifact: ArtifactReference) => void
  onEditInHancom?: (artifact: ArtifactReference) => void
}) {
  if (artifacts.length === 0) return null

  return (
    <div className="space-y-2">
      {artifacts.map((artifact) => (
        <ArtifactPreview
          key={artifact.id}
          artifact={artifact}
          onDownload={onDownload ? () => onDownload(artifact) : undefined}
          onEditInHancom={onEditInHancom ? () => onEditInHancom(artifact) : undefined}
        />
      ))}
    </div>
  )
}
