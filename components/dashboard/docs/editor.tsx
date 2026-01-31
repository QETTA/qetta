'use client'

import { useCrossFunctional } from '../context'
import { EditorToolbar } from './editor-toolbar'
import { EditorStatusBar } from './editor-status-bar'
import { EditorGenerateView } from './editor-generate-view'
import { EditorContentArea } from './editor-content-area'
import { useDocEditor } from './use-doc-editor'

/**
 * QettaDocEditor - HancomDocs WebWord-based Document Editor
 * VSCode Simple View style document viewer/editor
 *
 * Features:
 * - Document viewing (view mode)
 * - Document editing (edit mode) - HancomDocs WebWord iframe
 * - Real-time collaborative editing support
 * - Comments feature
 *
 * Component Structure:
 * - editor.tsx (main component, layout)
 * - editor-toolbar.tsx (top toolbar)
 * - editor-status-bar.tsx (bottom status bar)
 * - editor-generate-view.tsx (document generation mode UI)
 * - editor-content-area.tsx (viewer/editor area)
 * - use-doc-editor.ts (state management hook)
 * - editor-types.ts (type definitions)
 */
export function QettaDocEditor({ documentId, onClose }: { documentId: string | null; onClose: () => void }) {
  const { showToast } = useCrossFunctional()

  const {
    // State
    viewMode,
    setViewMode,
    status,
    setStatus,
    error,
    setError,
    webWordUrl,
    hancomdocsUrl,
    generatedFilename,
    isLocalMode,
    previewDocument,
    selectedPreset,
    setSelectedPreset,
    selectedDocType,
    setSelectedDocType,
    selectedFormat,
    setSelectedFormat,
    hashCertificate,
    pipelineStep,
    pipelineError,
    pipelineResult,

    // Refs
    fileInputRef,
    iframeRef,

    // Handlers
    handleGenerateDocument,
    handleGeneratePreview,
    handleDownloadDocument,
    handleDownloadCertificate,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleSave,
    handlePipelineGenerate,
    resetError,
  } = useDocEditor({ documentId, showToast, onClose })

  return (
    <main
      className="flex-1 bg-zinc-950 flex flex-col"
      role="main"
      aria-label="Document Editor"
      data-testid="docs-editor"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Top toolbar */}
      <EditorToolbar
        documentId={documentId}
        generatedFilename={generatedFilename}
        status={status}
        viewMode={viewMode}
        selectedFormat={selectedFormat}
        hashCertificate={hashCertificate}
        onViewModeChange={setViewMode}
        onGeneratePreview={handleGeneratePreview}
        onDownload={handleDownloadDocument}
        onDownloadCertificate={handleDownloadCertificate}
        onSave={handleSave}
        onClose={onClose}
        onFormatChange={setSelectedFormat}
      />

      {/* Editor content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Document generation mode */}
        {viewMode === 'generate' && (
          <EditorGenerateView
            status={status}
            selectedPreset={selectedPreset}
            selectedDocType={selectedDocType}
            pipelineStep={pipelineStep}
            pipelineError={pipelineError}
            pipelineResult={pipelineResult}
            fileInputRef={fileInputRef}
            onPresetChange={setSelectedPreset}
            onDocTypeChange={setSelectedDocType}
            onGenerateDocument={handleGenerateDocument}
            onPipelineGenerate={handlePipelineGenerate}
            onFileSelect={handleFileSelect}
          />
        )}

        {/* All other view modes */}
        <EditorContentArea
          viewMode={viewMode}
          status={status}
          error={error}
          webWordUrl={webWordUrl}
          hancomdocsUrl={hancomdocsUrl}
          generatedFilename={generatedFilename}
          isLocalMode={isLocalMode}
          previewDocument={previewDocument}
          iframeRef={iframeRef}
          onViewModeChange={setViewMode}
          onStatusChange={setStatus}
          onError={setError}
          onGeneratePreview={handleGeneratePreview}
          onResetError={resetError}
        />
      </div>

      {/* Bottom status bar */}
      <EditorStatusBar
        viewMode={viewMode}
        selectedPreset={selectedPreset}
        generatedFilename={generatedFilename}
        isLocalMode={isLocalMode}
        hashCertificate={hashCertificate}
        onDownloadCertificate={handleDownloadCertificate}
      />
    </main>
  )
}
