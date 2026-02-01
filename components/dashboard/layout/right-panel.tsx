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
const QettaDocEditor = dynamic(() => import('../docs/editor').then((mod) => mod.QettaDocEditor), {
  loading: () => <EditorSkeleton />,
  ssr: false,
})

const QettaApplyContent = dynamic(
  () => import('../apply/content').then((mod) => mod.QettaApplyContent),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    ),
    ssr: false,
  }
)

const QettaVerifyContent = dynamic(
  () => import('../verify/content').then((mod) => mod.QettaVerifyContent),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-500" />
      </div>
    ),
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
    return <QettaDocEditor documentId={selectedDocument} onClose={() => setPanelView('thread')} />
  }

  // APPLY tab: Global tender matching UI
  if (activeTab === 'APPLY') {
    return (
      <main
        className="flex flex-1 flex-col bg-zinc-950"
        role="main"
        aria-label="Global tender matching"
      >
        <QettaApplyContent selectedTenderId={selectedDocument} />
      </main>
    )
  }

  // VERIFY tab: Hashchain verification UI
  if (activeTab === 'VERIFY') {
    return (
      <main
        className="flex flex-1 flex-col bg-zinc-950"
        role="main"
        aria-label="Hashchain verification"
      >
        <QettaVerifyContent selectedVerificationId={selectedDocument} />
      </main>
    )
  }

  const handleSendClick = () => {
    if (replyText.trim()) {
      showToast('답장 기능 준비 중입니다', 'info')
    } else {
      showToast('답장 내용을 입력해 주세요', 'warning')
    }
  }

  const handleAttachmentClick = () => {
    showToast('파일 업로드 기능 준비 중입니다', 'info')
  }

  const handleCloseClick = () => {
    showToast('문서 닫기 기능 준비 중입니다', 'info')
  }

  const detail = selectedDocument ? DOCUMENT_DETAILS[selectedDocument] : null

  if (!detail) {
    return (
      <main
        className="flex flex-1 items-center justify-center bg-zinc-950"
        role="main"
        aria-label="Document detail panel"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-500/10 ring-1 ring-white/10">
            <InboxEmptyIcon className="h-8 w-8 text-zinc-400" />
          </div>
          <p className="text-zinc-500">Select a document</p>
        </div>
      </main>
    )
  }

  return (
    <main
      className="flex flex-1 flex-col bg-zinc-950"
      role="main"
      aria-label="Document detail panel"
      data-testid="right-panel-content"
    >
      {/* Header - Catalyst Dark style */}
      <div className="flex h-14 items-center justify-between border-b border-white/10 bg-zinc-900 px-6">
        <div className="flex items-center gap-3">
          <EnvelopeIcon className="h-5 w-5 text-zinc-500" />
          <h1 className="max-w-md truncate text-sm font-medium text-white">Re: {detail.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
            Processing
          </span>
          {/* Editor mode toggle button - Catalyst Dark style */}
          <button
            onClick={() => setPanelView('editor')}
            data-testid="right-panel-editor-toggle"
            className="flex items-center gap-1.5 rounded-md bg-zinc-500/10 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-500/20 focus:ring-2 focus:ring-white/30 focus:outline-none"
            aria-label="Switch to document editor"
          >
            <PencilIcon className="h-3.5 w-3.5" />
            Editor
          </button>
          <button
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 focus:ring-2 focus:ring-white/30 focus:outline-none"
            aria-label="Settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 focus:ring-2 focus:ring-white/30 focus:outline-none"
            aria-label="More options"
          >
            <DotsVerticalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Thread Content - Catalyst Dark style */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Original Message */}
        <div className="mb-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-500/20 to-zinc-600/20 ring-1 ring-white/10">
              <span className="text-sm font-medium text-zinc-300">{detail.from.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <div className="mb-0.5 flex items-center gap-2">
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
          <div className="pl-13 text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
            {detail.content}
          </div>
        </div>

        {/* Replies */}
        {detail.replies?.map((reply) => (
          <div key={`${reply.from}-${reply.date}`} className="mb-6 border-t border-white/5 pt-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-500 to-zinc-600">
                <span className="text-sm font-medium text-white">{reply.from.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="font-semibold text-white">{reply.from}</span>
                  {reply.from.includes('AI') && (
                    <span className="rounded bg-zinc-500/10 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                      AI
                    </span>
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
            <div className="pl-13 text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
              {reply.content}
            </div>
          </div>
        ))}
      </div>

      {/* Reply Composer - Catalyst Dark style */}
      <div className="border-t border-white/10 bg-zinc-900 p-4">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-800/50">
          {/* To field */}
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2 text-sm">
            <AtSymbolIcon className="h-4 w-4 text-zinc-500" />
            <span className="text-zinc-400">{detail.email}</span>
            <button className="ml-auto rounded text-zinc-500 hover:text-zinc-300 focus:ring-2 focus:ring-white/30 focus:outline-none">
              Cc
            </button>
          </div>

          {/* Textarea */}
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            aria-label="Write reply"
            className="w-full resize-none bg-transparent px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none"
            rows={3}
          />

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-2">
            <button
              onClick={handleAttachmentClick}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 focus:ring-2 focus:ring-white/30 focus:outline-none"
              aria-label="Add attachment"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCloseClick}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 focus:ring-2 focus:ring-white/30 focus:outline-none"
              >
                Close
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleSendClick}
                data-testid="right-panel-send-button"
                className="rounded-full bg-zinc-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-500 focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:outline-none"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Shortcuts hint */}
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-xs text-zinc-500">
            Press{' '}
            <kbd className="rounded border border-white/10 bg-zinc-800 px-1 py-0.5 text-zinc-400">
              /
            </kbd>{' '}
            for shortcuts
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400" aria-live="polite">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>QETTA AI is responding...</span>
          </div>
        </div>
      </div>
    </main>
  )
})
