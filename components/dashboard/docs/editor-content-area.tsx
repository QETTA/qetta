'use client'

import { HancomdocsViewer } from '../hancomdocs-viewer'
import type { PreviewDocument } from '@/lib/document-generator/types'
import type { ViewMode, EditorStatus } from './editor-types'
import {
  DocumentIcon,
  EyeIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

interface EditorContentAreaProps {
  viewMode: ViewMode
  status: EditorStatus
  error: string | null
  webWordUrl: string | null
  hancomdocsUrl: string | null
  generatedFilename: string | null
  isLocalMode: boolean
  previewDocument: PreviewDocument | null
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  onViewModeChange: (mode: ViewMode) => void
  onStatusChange: (status: EditorStatus) => void
  onError: (error: string | null) => void
  onGeneratePreview: () => void
  onResetError: () => void
}

export function EditorContentArea({
  viewMode,
  status,
  error,
  webWordUrl,
  hancomdocsUrl,
  generatedFilename,
  isLocalMode,
  previewDocument,
  iframeRef,
  onViewModeChange,
  onStatusChange,
  onError,
  onGeneratePreview,
  onResetError,
}: EditorContentAreaProps) {
  // Skip rendering content area for 'generate' mode - handled by EditorGenerateView
  if (viewMode === 'generate') {
    return null
  }

  return (
    <>
      {/* HancomDocs viewer mode */}
      {viewMode === 'hancomdocs' && (
        <HancomdocsViewer
          url={hancomdocsUrl || undefined}
          mode={isLocalMode ? 'view' : 'edit'}
          title={generatedFilename || 'Document'}
          height="100%"
          showToolbar={false}
          localMode={isLocalMode}
          localFilePath={generatedFilename || undefined}
          onClose={() => onViewModeChange('generate')}
          onLoad={() => onStatusChange('ready')}
          onError={(err) => {
            onError(err)
            onStatusChange('error')
          }}
          className="h-full"
        />
      )}

      {/* HTML preview mode (no API dependency) */}
      {viewMode === 'preview' && previewDocument && (
        <div className="absolute inset-0 bg-zinc-950">
          <iframe
            srcDoc={previewDocument.html}
            className="w-full h-full border-0"
            title={`${previewDocument.documentType} Preview`}
            sandbox="allow-scripts"
          />
        </div>
      )}

      {/* Preview mode empty state */}
      {viewMode === 'preview' && !previewDocument && status !== 'generating' && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <div className="text-center">
            <EyeIcon className="h-16 w-16 mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-400 mb-4">No preview available</p>
            <button
              onClick={onGeneratePreview}
              className="px-4 py-2 text-sm bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Generate Preview
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {(status === 'loading' || status === 'generating') && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
            <p className="text-zinc-400">{status === 'generating' ? 'Generating document...' : 'Loading document...'}</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/20">
              <ExclamationCircleIcon className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-red-400 mb-4">{error || 'Failed to load document'}</p>
            <button
              onClick={onResetError}
              className="px-4 py-2 text-sm bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors ring-1 ring-white/10"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* WebWord iframe (view/edit modes) */}
      {(viewMode === 'view' || viewMode === 'edit') && status === 'ready' && webWordUrl && (
        <iframe
          ref={iframeRef}
          src={webWordUrl}
          className="w-full h-full border-0"
          title="HancomDocs WebWord Editor"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      )}

      {/* view/edit mode empty state */}
      {(viewMode === 'view' || viewMode === 'edit') && status !== 'ready' && status !== 'loading' && status !== 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <div className="text-center">
            <DocumentIcon className="h-16 w-16 mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-400 mb-4">No document available</p>
            <button
              onClick={() => onViewModeChange('generate')}
              className="px-4 py-2 text-sm bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Generate Document
            </button>
          </div>
        </div>
      )}
    </>
  )
}
