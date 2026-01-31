'use client'

import { memo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useCrossFunctional } from '../context'
import { DOCUMENT_DETAILS } from '@/constants/document-data'
import type { ProductTab } from '@/types/inbox'
import {
  EnvelopeIcon,
  SettingsIcon,
  DotsVerticalIcon,
  PencilIcon,
  ChevronDownIcon,
  AtSymbolIcon,
  PlusIcon,
  InboxEmptyIcon,
} from '@/components/icons/dashboard'
import { EditorSkeleton } from '../docs/editor-skeleton'

// Dynamic imports for tab-specific content (reduces initial bundle by ~75KB)
const QettaDocEditor = dynamic(
  () => import('../docs/editor').then(mod => mod.QettaDocEditor),
  {
    loading: () => <EditorSkeleton />,
    ssr: false,
  }
)

const QettaApplyContent = dynamic(
  () => import('../apply/content').then(mod => mod.QettaApplyContent),
  {
    loading: () => <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>,
    ssr: false,
  }
)

const QettaVerifyContent = dynamic(
  () => import('../verify/content').then(mod => mod.QettaVerifyContent),
  {
    loading: () => <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>,
    ssr: false,
  }
)

interface QettaRightPanelProps {
  selectedDocument: string | null
  activeTab?: ProductTab
}

type PanelView = 'thread' | 'editor'

export const QettaRightPanel = memo(function QettaRightPanel({
  selectedDocument,
  activeTab = 'DOCS',
}: QettaRightPanelProps) {
  const [replyText, setReplyText] = useState('')
  const [panelView, setPanelView] = useState<PanelView>('thread')
  const { showToast } = useCrossFunctional()

  // Render QettaDocEditor when in editor view
  if (panelView === 'editor') {
    return (
      <QettaDocEditor
        documentId={selectedDocument}
        onClose={() => setPanelView('thread')}
      />
    )
  }

  // APPLY tab: Global tender matching UI
  if (activeTab === 'APPLY') {
    return (
      <main className="flex-1 bg-zinc-950 flex flex-col" role="main" aria-label="Global tender matching">
        <QettaApplyContent selectedTenderId={selectedDocument} />
      </main>
    )
  }

  // VERIFY tab: Hashchain verification UI
  if (activeTab === 'VERIFY') {
    return (
      <main className="flex-1 bg-zinc-950 flex flex-col" role="main" aria-label="Hashchain verification">
        <QettaVerifyContent selectedVerificationId={selectedDocument} />
      </main>
    )
  }

  const handleSendClick = () => {
    if (replyText.trim()) {
      showToast('Reply sending coming soon', 'info')
    } else {
      showToast('Please enter a reply', 'warning')
    }
  }

  const handleAttachmentClick = () => {
    showToast('File upload coming soon', 'info')
  }

  const handleCloseClick = () => {
    showToast('Close document coming soon', 'info')
  }

  const detail = selectedDocument ? DOCUMENT_DETAILS[selectedDocument] : null

  if (!detail) {
    return (
      <main
        className="flex-1 bg-zinc-950 flex items-center justify-center"
        role="main"
        aria-label="Document detail panel"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-500/10 flex items-center justify-center ring-1 ring-white/10">
            <InboxEmptyIcon className="w-8 h-8 text-zinc-400" />
          </div>
          <p className="text-zinc-500">Select a document</p>
        </div>
      </main>
    )
  }

  return (
    <main
      className="flex-1 bg-zinc-950 flex flex-col"
      role="main"
      aria-label="Document detail panel"
      data-testid="right-panel-content"
    >
      {/* Header - Catalyst Dark style */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-white/10 bg-zinc-900">
        <div className="flex items-center gap-3">
          <EnvelopeIcon className="w-5 h-5 text-zinc-500" />
          <h1 className="text-sm font-medium text-white truncate max-w-md">
            Re: {detail.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
            Processing
          </span>
          {/* Editor mode toggle button - Catalyst Dark style */}
          <button
            onClick={() => setPanelView('editor')}
            data-testid="right-panel-editor-toggle"
            className="px-2.5 py-1 text-xs font-medium text-zinc-300 bg-zinc-500/10 hover:bg-zinc-500/20 rounded-md flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Switch to document editor"
          >
            <PencilIcon className="w-3.5 h-3.5" />
            Editor
          </button>
          <button
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="More options"
          >
            <DotsVerticalIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thread Content - Catalyst Dark style */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Original Message */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-500/20 to-zinc-600/20 flex items-center justify-center flex-shrink-0 ring-1 ring-white/10">
              <span className="text-sm font-medium text-zinc-300">
                {detail.from.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-white">{detail.from}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span>From</span>
                <span className="text-zinc-400">{detail.email}</span>
                <span className="text-zinc-600">•</span>
                <span>{detail.date}</span>
              </div>
            </div>
          </div>
          <div className="pl-13 whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed">
            {detail.content}
          </div>
        </div>

        {/* Replies */}
        {detail.replies?.map((reply) => (
          <div key={`${reply.from}-${reply.date}`} className="mb-6 pt-6 border-t border-white/5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-600 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-white">
                  {reply.from.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-white">{reply.from}</span>
                  {reply.from.includes('AI') && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-500/10 text-zinc-300 rounded">AI</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <span>From</span>
                  <span className="text-zinc-400">{reply.email}</span>
                  <span className="text-zinc-600">•</span>
                  <span>{reply.date}</span>
                </div>
              </div>
            </div>
            <div className="pl-13 whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed">
              {reply.content}
            </div>
          </div>
        ))}
      </div>

      {/* Reply Composer - Catalyst Dark style */}
      <div className="border-t border-white/10 bg-zinc-900 p-4">
        <div className="rounded-xl border border-white/10 overflow-hidden bg-zinc-800/50">
          {/* To field */}
          <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 text-sm">
            <AtSymbolIcon className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-400">{detail.email}</span>
            <button className="ml-auto text-zinc-500 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-white/30 rounded">Cc</button>
          </div>

          {/* Textarea */}
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            aria-label="Write reply"
            className="w-full px-4 py-3 text-sm text-white placeholder-zinc-500 bg-transparent resize-none focus:outline-none"
            rows={3}
          />

          {/* Actions */}
          <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={handleAttachmentClick}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Add attachment"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCloseClick}
                className="px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 rounded-lg flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Close
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleSendClick}
                data-testid="right-panel-send-button"
                className="px-4 py-1.5 text-sm font-medium text-white bg-zinc-600 hover:bg-zinc-500 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-zinc-900"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Shortcuts hint */}
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-xs text-zinc-500">
            Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400 border border-white/10">/</kbd> for shortcuts
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400" aria-live="polite">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>QETTA AI is responding...</span>
          </div>
        </div>
      </div>
    </main>
  )
})
